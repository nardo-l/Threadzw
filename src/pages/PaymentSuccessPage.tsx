import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useSubscription } 
  from '../context/SubscriptionContext'

export const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate()
  const { refresh } = useSubscription()

  useEffect(() => {
    // Refresh subscription status
    // so dashboard reflects new state
    refresh()
  }, [refresh])

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
      
      {/* Animated success icon */}
      <div style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: 'rgba(0,200,100,0.1)',
        border: '2px solid rgba(0,200,100,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        animation: 'checkIn 0.4s ease-out'
      }}>
        <CheckCircle 
          size={48} 
          color="#00c864"
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
        Payment Received
      </h1>
      
      <p style={{
        fontSize: 16,
        color: '#666666',
        lineHeight: 1.6,
        margin: '0 0 8px',
        fontStyle: 'normal'
      }}>
        Your subscription is being activated.
      </p>
      
      <p style={{
        fontSize: 14,
        color: '#aaaaaa',
        margin: '0 0 40px',
        fontStyle: 'normal'
      }}>
        This usually takes a few minutes.
      </p>

      {/* What's included reminder */}
      <div style={{
        background: '#f8f8f8',
        borderRadius: 16,
        padding: '20px',
        width: '100%',
        textAlign: 'left',
        marginBottom: 32
      }}>
        <p style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#aaaaaa',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          margin: '0 0 12px',
          fontStyle: 'normal'
        }}>
          NOW UNLOCKED
        </p>
        {[
          'Unlimited Products',
          'Product Categories',
          'WhatsApp Ordering',
          'Analytics'
        ].map(item => (
          <div
            key={item}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 0'
            }}
          >
            <CheckCircle 
              size={16} 
              color="#00c864" 
            />
            <span style={{
              fontSize: 14,
              color: '#333333',
              fontStyle: 'normal'
            }}>
              {item}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/dashboard')}
        style={{
          width: '100%',
          padding: '16px',
          background: '#000000',
          color: '#ffffff',
          border: 'none',
          borderRadius: 10,
          fontWeight: 900,
          fontSize: 16,
          cursor: 'pointer',
          fontStyle: 'normal',
          textTransform: 'uppercase'
        }}
      >
        Return to Dashboard
      </button>

      <style>{`
        @keyframes checkIn {
          0% { 
            transform: scale(0); 
            opacity: 0; 
          }
          60% { 
            transform: scale(1.15); 
          }
          100% { 
            transform: scale(1); 
            opacity: 1; 
          }
        }
      `}</style>
    </div>
  )
}
export default PaymentSuccessPage;
