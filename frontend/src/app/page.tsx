"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConnection } from "@/contexts/ConnectionContext";
import { useTranscript } from "@/contexts/TranscriptContext";
import { useAuth } from "@/contexts/AuthContext";
import MicButton from "@/components/MicButton";
import WaveAnimation from "@/components/WaveAnimation";

export default function Home() {
  // State to track viewport size for mobile optimizations
  const [isMobile, setIsMobile] = useState(false);
  const { sessionStatus } = useConnection();
  const { transcriptItems } = useTranscript();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  
  const isListening = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";
  
  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

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

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 xs:p-6 md:p-8">
        <div className="w-[320px] mx-auto glass rounded-[28px] p-6 md:p-8 flex flex-col items-center justify-center min-h-[320px] animate-fade-in shadow-lg hover:shadow-xl transition-all">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-400 border-t-transparent"></div>
          <p className="text-gray-400 mt-4 font-medium">Loading...</p>
        </div>
      </main>
    );
  }

  // Don't render the main content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Logout button positioned at the top left corner of the viewport */}
      <button 
        onClick={logout}
        className="w-[100px] btn-primary py-2.5 mt-8 flex items-center justify-center rounded-lg text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-gray-700/50 mt-4"
        aria-label="Logout"
      >
        Logout
      </button>
      
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
    </>
  );
}
