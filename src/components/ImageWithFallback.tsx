import React, { useState } from 'react';

interface ImageWithFallbackProps {
  src?: string;
  fallbackGradient?: string;
  className?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  fallbackGradient = 'linear-gradient(45deg, #1a1a1a, #2a2a2a)',
  className 
}) => {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <div 
        className={className}
        style={{ 
          background: fallbackGradient 
        }} 
      />
    );
  }
  
  return (
    <img
      src={src}
      className={className}
      onError={() => setError(true)}
      alt=""
      referrerPolicy="no-referrer"
    />
  );
};
