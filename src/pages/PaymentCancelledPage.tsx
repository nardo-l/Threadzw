import React from 'react'
import { useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'

export const PaymentCancelledPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100svh',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center',
      maxWidth: 430,
      margin: '0 auto',
      boxShadow: '0 0 20px rgba(0,0,0,0.02)'
    }}>

      <div style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: 'rgba(255,68,68,0.08)',
        border: '2px solid rgba(255,68,68,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28
      }}>
        <XCircle 
          size={48} 
          color="#ff4444"
          strokeWidth={1.5}
        />
      </div>

      <h1 style={{
        fontSize: 32,
        fontWeight: 900,
        color: '#000000',
        letterSpacing: '-0.8px',
        margin: '0 0 12px',
        fontStyle: 'normal'
      }}>
        Payment Not Completed
      </h1>
      
      <p style={{
        fontSize: 16,
        color: '#666666',
        lineHeight: 1.6,
        margin: '0 0 40px',
        fontStyle: 'normal'
      }}>
        No charges were made. You can try again whenever you are ready.
      </p>

      <button
        onClick={() => navigate('/subscription')}
        style={{
          width: '100%',
          padding: '16px',
          background: '#c8ff00',
          color: '#000000',
          border: 'none',
          borderRadius: 10,
          fontWeight: 900,
          fontSize: 16,
          cursor: 'pointer',
          marginBottom: 12,
          fontStyle: 'normal',
          textTransform: 'uppercase'
        }}
      >
        Try Again
      </button>

      <button
        onClick={() => navigate('/dashboard')}
        style={{
          width: '100%',
          padding: '14px',
          background: 'transparent',
          color: '#666666',
          border: '1.5px solid #e8e8e8',
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
          fontStyle: 'normal',
          textTransform: 'uppercase'
        }}
      >
        Back to Dashboard
      </button>
    </div>
  )
}
export default PaymentCancelledPage;
