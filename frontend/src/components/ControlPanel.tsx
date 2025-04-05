"use client";

import React from "react";
import { useConnection } from "@/contexts/ConnectionContext";

interface ControlPanelProps {
  isMobile?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ isMobile = false }) => {
  const { 
    sessionStatus, 
    connect, 
    disconnect,
  } = useConnection();

  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  const handleConnectionToggle = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className={`glass rounded-2xl shadow-lg p-4 xs:p-5 md:p-6 lg:p-8 ${isMobile ? 'sticky top-3 z-10' : ''}`}>
      <div className="flex flex-col items-center space-y-4 md:space-y-6">
        {/* Connection Button - Smaller on mobile */}
        <button
          onClick={handleConnectionToggle}
          disabled={isConnecting}
          className={`
            w-full py-3 xs:py-4 px-4 xs:px-6 rounded-full text-white font-medium text-base xs:text-lg
            transition-all duration-300 shadow-lg 
            ${isConnected 
              ? "btn-danger" 
              : isConnecting 
                ? "bg-slate-600 cursor-wait opacity-70" 
                : "btn-primary"}
          `}
        >
          {isConnected ? "Disconnect" : isConnecting ? "Connecting..." : "Connect"}
        </button>
        
        {/* Mobile indicator - only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xxs text-slate-500 mt-1">
            {isMobile ? 'Mobile View' : 'Desktop View'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
