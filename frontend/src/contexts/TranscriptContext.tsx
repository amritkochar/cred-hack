 "use client";

import React, { createContext, useContext, useState, FC, PropsWithChildren } from "react";
import { v4 as uuidv4 } from "uuid";
import { TranscriptItem } from "@/types";

type TranscriptContextValue = {
  transcriptItems: TranscriptItem[];
  addTranscriptMessage: (itemId: string, role: "user" | "assistant", content: string) => void;
  updateTranscriptMessage: (itemId: string, content: string, isDelta: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addTranscriptEvent: (title: string, data?: Record<string, any>) => void;
  toggleTranscriptItemExpand: (itemId: string) => void;
  updateTranscriptItemStatus: (itemId: string, newStatus: "IN_PROGRESS" | "DONE") => void;
};

const TranscriptContext = createContext<TranscriptContextValue | undefined>(undefined);

export const TranscriptProvider: FC<PropsWithChildren> = ({ children }) => {
  const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);

  function newTimestampPretty(): string {
    return new Date().toLocaleTimeString([], {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  const addTranscriptMessage: TranscriptContextValue["addTranscriptMessage"] = (itemId, role, content = "") => {
    setTranscriptItems((prev) => {
      if (prev.some((item) => item.itemId === itemId && item.type === "MESSAGE")) {
        console.warn(`[addTranscriptMessage] skipping; message already exists for itemId=${itemId}, role=${role}, content=${content}`);
        return prev;
      }

      const newItem: TranscriptItem = {
        itemId,
        type: "MESSAGE",
        role,
        content,
        expanded: false,
        timestamp: newTimestampPretty(),
        createdAtMs: Date.now(),
        status: "IN_PROGRESS",
      };

      return [...prev, newItem];
    });
  };

  const updateTranscriptMessage: TranscriptContextValue["updateTranscriptMessage"] = (itemId, newContent, append = false) => {
    setTranscriptItems((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId && item.type === "MESSAGE") {
          return {
            ...item,
            content: append ? (item.content ?? "") + newContent : newContent,
          };
        }
        return item;
      })
    );
  };

  const addTranscriptEvent: TranscriptContextValue["addTranscriptEvent"] = (title, data) => {
    setTranscriptItems((prev) => [
      ...prev,
      {
        itemId: `event-${uuidv4()}`,
        type: "EVENT",
        content: title,
        data,
        expanded: false,
        timestamp: newTimestampPretty(),
        createdAtMs: Date.now(),
        status: "DONE",
      },
    ]);
  };

  const toggleTranscriptItemExpand: TranscriptContextValue["toggleTranscriptItemExpand"] = (itemId) => {
    setTranscriptItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, expanded: !item.expanded } : item
      )
    );
  };

  const updateTranscriptItemStatus: TranscriptContextValue["updateTranscriptItemStatus"] = (itemId, newStatus) => {
    setTranscriptItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, status: newStatus } : item
      )
    );
  };

  return (
    <TranscriptContext.Provider
      value={{
        transcriptItems,
        addTranscriptMessage,
        updateTranscriptMessage,
        addTranscriptEvent,
        toggleTranscriptItemExpand,
        updateTranscriptItemStatus,
      }}
    >
      {children}
    </TranscriptContext.Provider>
  );
};

export function useTranscript() {
  const context = useContext(TranscriptContext);
  if (!context) {
    throw new Error("useTranscript must be used within a TranscriptProvider");
  }
  return context;
}
