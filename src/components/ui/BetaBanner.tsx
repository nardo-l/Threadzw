import React from 'react';

export const BetaBanner: React.FC = () => (
  <div style={{
    background: '#f8f8f8',
    borderBottom: '1px solid #eeeeee',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    zIndex: 50
  }}>
    <div style={{
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: '#C6FF00',
      flexShrink: 0
    }} />
    <p style={{
      fontSize: 13,
      color: '#555555',
      margin: 0,
      fontStyle: 'normal',
      textAlign: 'center',
      lineHeight: 1.4,
      fontWeight: 600
    }}>
      ThreadZW Beta — Free for 4 months while we test new features
    </p>
  </div>
);
