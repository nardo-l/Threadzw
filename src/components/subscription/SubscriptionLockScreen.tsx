import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscription, SUB_STATUS } 
  from '../../context/SubscriptionContext'
import { Lock } from 'lucide-react'

interface SubscriptionLockScreenProps {
  children: React.ReactNode
}

export const SubscriptionLockScreen: React.FC<SubscriptionLockScreenProps> = ({ 
  children 
}) => {
  const navigate = useNavigate()
  const { subscription } = useSubscription()

  const isExpired = subscription?.status === SUB_STATUS.EXPIRED

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Dashboard content behind */}
      <div style={{
        filter: isExpired
          ? 'blur(3px)'
          : 'none',
        pointerEvents: isExpired
          ? 'none'
          : 'auto',
        userSelect: isExpired
          ? 'none'
          : 'auto',
        transition: 'filter 0.3s ease'
      }}>
        {children}
      </div>

      {/* Lock overlay */}
      {isExpired && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          zIndex: 1000,
          textAlign: 'center'
        }}>
          
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'rgba(255,255,255,0.08)',
            border: '1.5px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24
          }}>
            <Lock 
              size={36} 
              color="rgba(255,255,255,0.6)"
              strokeWidth={1.5}
            />
          </div>

          <h2 style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-0.5px',
            margin: '0 0 12px',
            fontStyle: 'normal'
          }}>
            Your Subscription
            <br />
            Has Expired
          </h2>
          
          <p style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6,
            margin: '0 0 32px',
            maxWidth: 300,
            fontStyle: 'normal'
          }}>
            Renew your subscription to continue receiving customers and managing your storefront.
          </p>

          <button
            onClick={() => navigate('/subscription')}
            style={{
              padding: '16px 40px',
              background: '#c8ff00',
              color: '#000000',
              border: 'none',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 16,
              cursor: 'pointer',
              marginBottom: 16,
              fontStyle: 'normal',
              width: '100%',
              maxWidth: 320,
              textTransform: 'uppercase'
            }}
          >
            Renew Subscription
          </button>

          <p style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.25)',
            fontStyle: 'normal'
          }}>
            $7/month via EcoCash or InnBucks
          </p>
        </div>
      )}
    </div>
  )
}
export default SubscriptionLockScreen;
