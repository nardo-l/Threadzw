import React, { useState } from 'react';

interface AvatarProps {
  url?: string | null;
  size?: number;
  ring?: boolean;
  ringColor?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  url, 
  size = 52,
  ring = false,
  ringColor = '#FF2D78',
  className = ''
}) => {
  const [error, setError] = useState(false);
  
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
          ? `2px solid ${ringColor}` 
          : '2px solid #222',
        boxShadow: ring 
          ? `0 0 0 2px rgba(255,45,120,0.2)`
          : 'none',
        background: 'linear-gradient(135deg, #9B27AF, #FF2D78)'
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
          background: 'linear-gradient(135deg, #9B27AF, #FF2D78)'
        }} />
      )}
    </div>
  );
};
