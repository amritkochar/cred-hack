"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranscript } from "@/contexts/TranscriptContext";
import TranscriptItem from "./TranscriptItem";
import MicButton from "./MicButton";
import RecordedAudios from "./RecordedAudios";

const ConversationView: React.FC = () => {
  const { transcriptItems } = useTranscript();
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationEndRef.current && !isScrolling) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcriptItems, isScrolling]);

  // Handle manual scrolling to prevent auto-scroll interruption
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    setIsScrolling(!isAtBottom);
  };

  // Reset scrolling state when user scrolls to bottom manually
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 xs:p-5 md:p-6 glass rounded-xl xs:rounded-2xl shadow-lg h-full"
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        <div className="flex flex-col space-y-4 xs:space-y-5 min-h-full pb-16">
          {transcriptItems.map((item) => (
            <TranscriptItem key={item.itemId} item={item} />
          ))}
          <div ref={conversationEndRef} className="h-4" />
        </div>
      </div>
      
      {/* Recorded audio files */}
      <div className="mt-4">
        <RecordedAudios className="p-4 glass rounded-xl xs:rounded-2xl shadow-lg" />
      </div>
      
      {/* Floating mic button at the bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <MicButton size="md" />
      </div>
      
      {/* Scroll indicator that appears when not at bottom */}
      {isScrolling && (
        <button 
          onClick={() => {
            conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setIsScrolling(false);
          }}
          className="fixed bottom-20 right-4 z-10 bg-purple-600 rounded-full p-2 shadow-lg animate-bounce"
          aria-label="Scroll to bottom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ConversationView;
