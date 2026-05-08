import React, { useState } from 'react';

import { useTheme } from '../App';

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
  const t = useTheme();
  const [error, setError] = useState(false);
  
  const resolvedRingColor = ringColor || t.accent;
  
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
          : `2px solid ${t.border_secondary}`,
        boxShadow: ring 
          ? `0 0 0 2px ${t.accent_bg}`
          : 'none',
        background: t.gradient,
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
          background: t.gradient
        }} />
      )}
    </div>
  );
};
