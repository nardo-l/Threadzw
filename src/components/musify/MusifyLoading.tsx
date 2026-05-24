import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface MusifyLoadingProps {
  artistName: string;
}

const MESSAGES = [
  "Searching YouTube...",
  "Finding music videos...",
  "Picking 10 songs...",
  "Shuffling the artwork...",
  "Almost ready..."
];

export const MusifyLoading: React.FC<MusifyLoadingProps> = ({ artistName }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black p-8">
      {/* Visualizer */}
      <div className="flex items-center gap-1.5 h-12">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={`musify-viz-bar-${i}`}
            className="w-1.5 bg-[#FF2D78] rounded-full"
            animate={{ height: [8, 48, 8] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <p className="mt-8 text-[#888] text-[14px]">Finding tracks for</p>
      <h2 className="mt-1 text-white text-2xl font-bold italic tracking-tight">{artistName}</h2>

      <div className="mt-12 overflow-hidden h-6 w-full flex justify-center">
        <motion.p
          key={msgIndex}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          className="text-[#555] text-[13px] font-medium"
        >
          {MESSAGES[msgIndex]}
        </motion.p>
      </div>
    </div>
  );
};
