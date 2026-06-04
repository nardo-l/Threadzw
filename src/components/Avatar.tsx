import React, { useState } from 'react';

interface AvatarProps {
  url?: string | null;
  size?: number;
  ring?: boolean;
  ringColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  url, 
  size = 52,
  ring = false,
  ringColor,
  className = '',
  style = {}
}) => {
  const [error, setError] = useState(false);
  
  const resolvedRingColor = ringColor || '#C6FF00';
  
  return (
    <div 
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        border: ring 
          ? `2px solid ${resolvedRingColor}` 
          : `2px solid #222`,
        boxShadow: ring 
          ? `0 0 0 2px rgba(198,255,0,0.1)`
          : 'none',
        background: '#1a1a1a',
        ...style
      }}
    >
      {url && !error ? (
        <img
          src={url}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={() => setError(true)}
          alt=""
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: '#1a1a1a'
        }} />
      )}
    </div>
  );
};
