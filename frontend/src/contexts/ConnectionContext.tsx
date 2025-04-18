"use client";

import React, { createContext, useContext, useState, useRef, FC, PropsWithChildren } from "react";
import { v4 as uuidv4 } from "uuid";
import { SessionStatus, ServerEvent, TranscriptItem } from "@/types";
import { useTranscript } from "./TranscriptContext";
import { useAuth } from "./AuthContext";
import { createRealtimeConnection } from "@/lib/realtimeConnection";
import { baseAgentConfig } from "@/config/agentConfig";
import { getOpenAIEphemeralToken, storeUserPersona } from "@/utils/storage";
import { getAgentConfigWithUserPersona } from "@/utils/agentConfigUtils";
import { fetchUserPersona, sendConversationTranscript } from "@/api/backendApi";

interface ConnectionContextValue {
  sessionStatus: SessionStatus;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const ConnectionContext = createContext<ConnectionContextValue | undefined>(undefined);

export const ConnectionProvider: FC<PropsWithChildren> = ({ children }) => {
  const { transcriptItems, addTranscriptMessage, updateTranscriptMessage, addTranscriptEvent, updateTranscriptItemStatus } = useTranscript();
  const { isAuthenticated } = useAuth();

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("DISCONNECTED");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    if (dcRef.current && dcRef.current.readyState === "open") {
      console.log(`[Client Event] ${eventObj.type} ${eventNameSuffix}`, eventObj);
      dcRef.current.send(JSON.stringify(eventObj));
    } else {
      console.error("Failed to send message - no data channel available", eventObj);
    }
  };

  const handleServerEvent = (serverEvent: ServerEvent) => {
    console.log(`[Server Event] ${serverEvent.type}`, serverEvent);

    switch (serverEvent.type) {
      case "session.created": {
        if (serverEvent.session?.id) {
          setSessionStatus("CONNECTED");
          addTranscriptEvent(`Connected to session: ${serverEvent.session.id}`);
          
          // Send initial greeting message
          sendSimulatedUserMessage("hi");
        }
        break;
      }

      case "conversation.item.created": {
        let text =
          serverEvent.item?.content?.[0]?.text ||
          serverEvent.item?.content?.[0]?.transcript ||
          "";
        const role = serverEvent.item?.role as "user" | "assistant";
        const itemId = serverEvent.item?.id;

        if (itemId && role) {
          if (role === "user" && !text) {
            text = "[Transcribing...]";
          }
          addTranscriptMessage(itemId, role, text);
        }
        break;
      }

      case "conversation.item.input_audio_transcription.completed": {
        const itemId = serverEvent.item_id;
        const finalTranscript =
          !serverEvent.transcript || serverEvent.transcript === "\n"
            ? "[inaudible]"
            : serverEvent.transcript;
        if (itemId) {
          updateTranscriptMessage(itemId, finalTranscript, false);
        }
        break;
      }

      case "response.audio_transcript.delta": {
        const itemId = serverEvent.item_id;
        const deltaText = serverEvent.delta || "";
        if (itemId) {
          updateTranscriptMessage(itemId, deltaText, true);
        }
        break;
      }

      case "response.done": {
        if (serverEvent.response?.output) {
          serverEvent.response.output.forEach((outputItem) => {
            if (
              outputItem.type === "function_call" &&
              outputItem.name &&
              outputItem.arguments
            ) {
              handleFunctionCall({
                name: outputItem.name,
                call_id: outputItem.call_id,
                arguments: outputItem.arguments,
              });
            }
          });
        }
        break;
      }

      case "response.output_item.done": {
        const itemId = serverEvent.item?.id;
        if (itemId) {
          updateTranscriptItemStatus(itemId, "DONE");
        }
        break;
      }

      default:
        break;
    }
  };

  const handleFunctionCall = async (functionCallParams: {
    name: string;
    call_id?: string;
    arguments: string;
  }) => {
    const args = JSON.parse(functionCallParams.arguments);
    
    addTranscriptEvent(`Function call: ${functionCallParams.name}`, args);

    // Get the agent config with user persona injected at the time of function call
    const agentConfig = getAgentConfigWithUserPersona(baseAgentConfig);

    if (agentConfig.toolLogic?.[functionCallParams.name]) {
      try {
        const fn = agentConfig.toolLogic[functionCallParams.name];
        const fnResult = await fn(args, []);
        
        addTranscriptEvent(`Function result: ${functionCallParams.name}`, fnResult);

        sendClientEvent({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: functionCallParams.call_id,
            output: JSON.stringify(fnResult),
          },
        });
        
        sendClientEvent({ type: "response.create" });
      } catch (error) {
        console.error(`Error executing function ${functionCallParams.name}:`, error);
        addTranscriptEvent(`Function error: ${functionCallParams.name}`, { error: String(error) });
      }
    } else {
      console.warn(`No handler found for function: ${functionCallParams.name}`);
      const simulatedResult = { result: true };
      
      addTranscriptEvent(`Function fallback: ${functionCallParams.name}`, simulatedResult);

      sendClientEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: functionCallParams.call_id,
          output: JSON.stringify(simulatedResult),
        },
      });
      
      sendClientEvent({ type: "response.create" });
    }
  };

  const getEphemeralKey = (): string | null => {
    // Get the OpenAI ephemeral token directly from localStorage
    const ephemeralToken = getOpenAIEphemeralToken();
    
    if (!ephemeralToken) {
      console.error("No ephemeral key found in localStorage");
      setSessionStatus("DISCONNECTED");
      return null;
    }
    
    return ephemeralToken;
  };

  // We no longer need to fetch the ephemeral key from the server
  // as we're getting it directly from localStorage

  const connect = async () => {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    try {
      // Check if user is authenticated
      if (!isAuthenticated) {
        addTranscriptEvent("Authentication required. Please log in.");
        setSessionStatus("DISCONNECTED");
        return;
      }

      // Fetch the latest user persona from the backend and update it in local storage
      try {
        addTranscriptEvent("Refreshing user persona data...");
        const userPersona = await fetchUserPersona();
        storeUserPersona(userPersona);
        console.log("User persona refreshed successfully");
      } catch (error) {
        console.error("Failed to refresh user persona:", error);
        // Continue with connection flow even if persona fetch fails
        addTranscriptEvent("Warning: Could not refresh user data. Some personalized features may be limited.");
      }
      
      // Check if we're in a secure context (required for microphone access)
      const isSecure = window.isSecureContext || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        addTranscriptEvent("Security Warning: This application is not running in a secure context (HTTPS). Microphone access may be limited. For full functionality, please use HTTPS.");
      }

      // Get the ephemeral key directly from localStorage
      const EPHEMERAL_KEY = getEphemeralKey();
      if (!EPHEMERAL_KEY) {
        addTranscriptEvent("Error: Could not obtain authentication token from server.");
        setSessionStatus("DISCONNECTED");
        return;
      }

      if (!audioElementRef.current) {
        audioElementRef.current = document.createElement("audio");
      }
      audioElementRef.current.autoplay = true;

      try {
        // Attempt to create the realtime connection
        addTranscriptEvent("Connecting to OpenAI Realtime API...");
        
        const { pc, dc } = await createRealtimeConnection(
          EPHEMERAL_KEY,
          audioElementRef
        );
        pcRef.current = pc;
        dcRef.current = dc;
        
        // Set up event listeners for the data channel
        dc.addEventListener("open", () => {
          console.log("Data channel opened");
          // Once connected, update the session with our agent configuration
          updateSession();
        });
        
        dc.addEventListener("close", () => {
          console.log("Data channel closed");
          addTranscriptEvent("Connection closed");
        });
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dc.addEventListener("error", (err: any) => {
          console.error("Data channel error:", err);
          addTranscriptEvent(`Connection error: ${err.message || "Unknown error"}`);
        });
        
        dc.addEventListener("message", (e: MessageEvent) => {
          handleServerEvent(JSON.parse(e.data));
        });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Error connecting to realtime:", err);
        
        // Show more detailed user-friendly error messages based on the error type
        if (err.message && err.message.includes("secure context")) {
          addTranscriptEvent("Warning: Microphone access requires HTTPS. The application will continue in text-only mode. For voice functionality, please use a secure connection.");
        } else if (err.message && err.message.includes("permission has been denied")) {
          addTranscriptEvent("Warning: Microphone permission denied. To use voice features, please allow microphone access in your browser settings and reconnect.");
        } else if (err.message && err.message.includes("MediaDevices API is not available")) {
          addTranscriptEvent("Warning: Your browser doesn't support microphone access. The application will continue in text-only mode.");
        } else {
          addTranscriptEvent(`Error connecting: ${err.message || "Unknown error"}`);
          setSessionStatus("DISCONNECTED");
          return;
        }
      }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error connecting to realtime:", err);
      addTranscriptEvent(`Connection failed: ${err.message || "Unknown error"}`);
      setSessionStatus("DISCONNECTED");
    }
  };

  const printConversationTranscript = async () => {
    // Filter for message items only
    const messageTranscript = transcriptItems
      .filter((item: TranscriptItem) => item.type === "MESSAGE");
    
    try {
      // Send transcript to backend API
      await sendConversationTranscript(messageTranscript);
    } catch (error) {
      // Log error but don't disrupt the disconnect flow
      console.error("Error sending transcript to backend:", error);
    }
  };

  const disconnect = () => {
    // Print the conversation transcript when user ends the conversation
    printConversationTranscript();
    
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });

      pcRef.current.close();
      pcRef.current = null;
    }
    
    dcRef.current = null;
    setSessionStatus("DISCONNECTED");

    console.log("Disconnected from Realtime API");
  };

  const sendSimulatedUserMessage = (text: string) => {
    const id = uuidv4().slice(0, 32);
    addTranscriptMessage(id, "user", text);

    sendClientEvent(
      {
        type: "conversation.item.create",
        item: {
          id,
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      }
    );
    
    sendClientEvent({ type: "response.create" });
  };

  const updateSession = () => {
    sendClientEvent(
      { type: "input_audio_buffer.clear" },
      "clear audio buffer on session update"
    );

    // Get the agent config with user persona injected at the time of session update
    const agentConfig = getAgentConfigWithUserPersona(baseAgentConfig);

    const turnDetection = {
      type: "server_vad",
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 200,
      create_response: true,
    };

    const sessionUpdateEvent = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: agentConfig.instructions + "here are some of my personality traits for the agent" + agentConfig.personalityAndTone,
        voice: agentConfig.voice,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: { model: "gpt-4o-transcribe", prompt: "expect conversation around money, financial planning, human emotions and psychology around money" },
        input_audio_noise_reduction: { type: "far_field" },
        turn_detection: turnDetection,
        temperature: 0.8,
        tool_choice: "auto",
        tools: agentConfig.tools,
      },
    };

    sendClientEvent(sessionUpdateEvent);
  };

  return (
    <ConnectionContext.Provider
      value={{
        sessionStatus,
        connect,
        disconnect,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
}
