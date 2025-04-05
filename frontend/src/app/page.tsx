"use client";

import React, { useState, useEffect } from "react";
import { useConnection } from "@/contexts/ConnectionContext";
import { useTranscript } from "@/contexts/TranscriptContext";
import MicButton from "@/components/MicButton";
import WaveAnimation from "@/components/WaveAnimation";

export default function Home() {
  // State to track viewport size for mobile optimizations
  const [isMobile, setIsMobile] = useState(false);
  const { sessionStatus } = useConnection();
  const { transcriptItems } = useTranscript();
  
  const isListening = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  // Effect to detect mobile viewport on client side
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 xs:p-6 md:p-8">
      <div className="w-[320px] mx-auto glass rounded-[28px] p-8 md:p-10 flex flex-col items-center justify-between min-h-[320px] animate-fade-in shadow-lg hover:shadow-xl transition-all">
        <h1 className="text-4xl xs:text-5xl md:text-6xl font-bold text-white tracking-tight mt-8 md:mt-10">
          CA Uncle
        </h1>
        
        <div className="relative w-full" style={{ height: '96px' }}>
          {isListening && (
            <WaveAnimation isListening={isListening} />
          )}
        </div>
        
        <div className="flex-grow flex items-center justify-center py-4 mb-2">
          <MicButton size="lg" />
        </div>
        
        <p className="text-gray-400 text-sm md:text-base text-center font-light mb-8 md:mb-10">
          {isListening 
        ? "Listening..." 
        : isConnecting 
          ? "Connecting..." 
          : "Tap to start conversation"}
        </p>
      </div>
    </main>
  );
}
