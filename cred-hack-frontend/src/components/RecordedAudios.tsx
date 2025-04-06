"use client";

import React from "react";
import { useConnection } from "@/contexts/ConnectionContext";

interface RecordedAudiosProps {
  className?: string;
}

const RecordedAudios: React.FC<RecordedAudiosProps> = ({ className = "" }) => {
  const { recordedAudios, downloadRecordedAudio } = useConnection();

  if (recordedAudios.length === 0) {
    return null;
  }

  return (
    <div className={`recorded-audios ${className}`}>
      <h3 className="text-lg font-medium mb-2">Recorded Conversations</h3>
      <div className="space-y-2">
        {recordedAudios.map((audio, index) => (
          <div key={`${audio.interactionId}-${audio.timestamp}`} className="flex items-center p-2 bg-gray-100 rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium">
                Conversation {index + 1}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(audio.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <audio 
                src={audio.url} 
                controls 
                className="h-8"
              />
              <button
                onClick={() => downloadRecordedAudio(index)}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecordedAudios;
