"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { TranscriptItem as TranscriptItemType } from "@/types";
import { useTranscript } from "@/contexts/TranscriptContext";

interface TranscriptItemProps {
  item: TranscriptItemType;
}

const TranscriptItem: React.FC<TranscriptItemProps> = ({ item }) => {
  const { toggleTranscriptItemExpand } = useTranscript();
  const { itemId, type, role, content, data, expanded, timestamp } = item;

  if (type === "MESSAGE") {
    const isUser = role === "user";
    const baseContainer = "flex justify-end flex-col mb-4 xs:mb-5 md:mb-6 animate-fade-in";
    const containerClasses = `${baseContainer} ${isUser ? "items-end" : "items-start"}`;
    
    const isBracketedMessage = content?.startsWith("[") && content?.endsWith("]");
    const messageStyle = isBracketedMessage ? "italic opacity-80" : "";
    const displayContent = isBracketedMessage ? content?.slice(1, -1) : content;

    // Calculate max width for message bubbles based on screen size
    const maxWidthClass = "max-w-[85%] xs:max-w-[80%] sm:max-w-[75%] md:max-w-[70%]";

    return (
      <div key={itemId} className={containerClasses}>
        <div className="flex items-center mb-1 space-x-1 xs:space-x-2">
          {!isUser && (
            <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-zinc-800 flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 xs:w-4 xs:h-4 text-purple-300">
                <path d="M16.5 7.5h-9v9h9v-9z" />
                <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <div className={`text-xxs xs:text-xs ${isUser ? "text-purple-200" : "text-gray-400"} font-mono`}>
            {timestamp}
          </div>
          {isUser && (
            <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 xs:w-4 xs:h-4 text-white">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        <div className={`${isUser ? "message-bubble-user" : "message-bubble-assistant"} ${maxWidthClass}`}>
          <div className={`whitespace-pre-wrap ${messageStyle} prose prose-invert max-w-none prose-p:my-1 prose-headings:mb-2 prose-headings:mt-4 prose-li:my-0 text-sm xs:text-base`}>
            <ReactMarkdown>
              {displayContent || ""}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  } else if (type === "EVENT") {
    return (
      <div
        key={itemId}
        className="flex flex-col justify-start items-center text-gray-400 text-xs xs:text-sm my-2 xs:my-3 animate-fade-in"
      >
        <div
          className={`whitespace-pre-wrap flex items-center font-mono text-xs xs:text-sm ${
            data ? "cursor-pointer hover:text-gray-300 transition-colors" : ""
          }`}
          onClick={() => data && toggleTranscriptItemExpand(itemId)}
        >
          {data && (
            <span
              className={`mr-1 transform transition-transform duration-200 select-none ${
                expanded ? "rotate-90" : "rotate-0"
              }`}
            >
              ▶
            </span>
          )}
          <span className="text-xxs xs:text-xs mr-1 xs:mr-2 opacity-70">{timestamp}</span>
          <span className="bg-zinc-800/50 px-1 xs:px-2 py-0.5 xs:py-1 rounded-md text-xs">{content}</span>
        </div>
        {expanded && data && (
          <div className="text-gray-300 text-left w-full mt-1 xs:mt-2 animate-fade-in">
            <pre className="border-l-2 ml-1 border-zinc-700 whitespace-pre-wrap break-words font-mono text-xxs xs:text-xs mb-1 xs:mb-2 mt-1 xs:mt-2 pl-2 xs:pl-3 max-w-full overflow-x-auto bg-zinc-800/30 p-1 xs:p-2 rounded-md">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default TranscriptItem;
