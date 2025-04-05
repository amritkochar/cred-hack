"use client";

import React, { useEffect, useState } from "react";

interface WaveAnimationProps {
  isListening: boolean;
  audioLevel?: number;
}

const WaveAnimation: React.FC<WaveAnimationProps> = ({ 
  isListening, 
  audioLevel = 0
}) => {
  const [waveElements, setWaveElements] = useState<number[]>([]);
  
  useEffect(() => {
    // Create array of wave elements (40 is arbitrary, can be adjusted)
    setWaveElements(Array.from({ length: 40 }, () => 0));
  }, []);

  useEffect(() => {
    if (!isListening) return;
    
    // Animate the wave elements
    const interval = setInterval(() => {
      setWaveElements(prev => 
        prev.map(() => {
          // If we have real audio level, use it to make the wave more dynamic
          const baseHeight = audioLevel > 0 
            ? Math.max(10, audioLevel * 100) 
            : Math.random() * 60 + 15;
            
          return isListening ? baseHeight : 0;
        })
      );
    }, 100);
    
    return () => clearInterval(interval);
  }, [isListening, audioLevel]);

  return (
    <div className="flex items-center justify-center w-full h-24 gap-1 px-4 mt-6 absolute" style={{ pointerEvents: 'none' }}>
      {waveElements.map((height, index) => (
        <div
          key={index}
          className="wave-element animate-wave"
          style={{ 
            height: `${height}px`,
            animationDelay: `${index * 0.05}s`,
            opacity: isListening ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
};

export default WaveAnimation;
