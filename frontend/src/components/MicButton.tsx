"use client";

import React from "react";
import { useConnection } from "@/contexts/ConnectionContext";
import { Mic, MicOff, Square } from "lucide-react";

interface MicButtonProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const MicButton: React.FC<MicButtonProps> = ({ size = "lg", className = "" }) => {
  const { sessionStatus, connect, disconnect } = useConnection();

  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  const handleConnectionToggle = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  // Icon size classes based on the size prop
  const iconSizes = {
    sm: { icon: 18, button: "scale-75" },
    md: { icon: 24, button: "scale-90" },
    lg: { icon: 32, button: "scale-100" },
  };

  // Background color classes based on connection status
  const bgColorClass = isConnected 
    ? "bg-destructive hover:bg-destructive/90" 
    : isConnecting 
      ? "bg-secondary opacity-70" 
      : "";


  return (
    <button
      onClick={handleConnectionToggle}
      disabled={isConnecting}
      className={`
        mic-button
        ${iconSizes[size].button}
        ${bgColorClass}
        ${isConnecting ? "cursor-wait" : ""}
        ${className}
      `}
      aria-label={isConnected ? "Stop listening" : "Start listening"}
    >
      {isConnected ? (
        <Square size={iconSizes[size].icon} className="text-white" />
      ) : (
        <Mic 
          size={iconSizes[size].icon} 
          className={`text-white ${isConnecting ? "animate-pulse" : ""}`} 
        />
      )}
    </button>
  );
};

export default MicButton;
