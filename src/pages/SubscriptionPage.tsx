import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscription } 
  from '../context/SubscriptionContext'
import { ArrowLeft, Check } from 'lucide-react'
import { StatusBadge } 
  from '../components/subscription/StatusBadge'
import { toast } from 'sonner'

const FEATURES = [
  'Professional Storefront',
  'Unlimited Products',
  'Product Categories',
  'Instagram-style Category Highlights',
  'WhatsApp Ordering',
  'Shop Analytics',
  'Custom Shop Link',
  'Demand Discovery',
  'Priority Support'
]

export const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate()
  const { subscription, isLive } = useSubscription()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    
    try {
      // NARDOPAY INTEGRATION POINT
      // When backend is ready:
      // const { paymentUrl } = 
      //   await api.createPaymentSession({
      //     amount: 7,
      //     currency: 'USD',
      //     returnUrl: '/payment-success',
      //     cancelUrl: '/payment-cancelled'
      //   })
      // window.location.href = paymentUrl
      
      // Mock for now:
      // Simulate redirect delay
      await new Promise(r => 
        setTimeout(r, 1500)
      )
      navigate('/payment-success')
    } catch (err) {
      console.error('Payment error:', err)
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100svh',
      background: '#ffffff',
      maxWidth: 430,
      margin: '0 auto',
      boxShadow: '0 0 20px rgba(0,0,0,0.02)'
    }}>
      
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #eeeeee',
        padding: '0 20px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: '#f5f5f5',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} color="#000" />
        </button>
        <span style={{
          fontSize: 17,
          fontWeight: 800,
          color: '#000000',
          margin: 0,
          fontStyle: 'normal'
        }}>
          ThreadZW Pro
        </span>
        <div style={{ width: 38 }} />
      </div>

      <div style={{ padding: '32px 20px 40px' }}>
        
        {/* Current status */}
        {subscription && (
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 28
          }}>
            <StatusBadge size="lg" />
          </div>
        )}

        {/* Hero text */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: 32
        }}>
          <h2 style={{
            fontSize: 32,
            fontWeight: 900,
            color: '#000000',
            letterSpacing: '-0.8px',
            lineHeight: 1.1,
            margin: '0 0 12px',
            fontStyle: 'normal'
          }}>
            Continue Growing
            <br />
            Your Business
          </h2>
          <p style={{
            fontSize: 16,
            color: '#666666',
            lineHeight: 1.5,
            margin: 0,
            fontStyle: 'normal'
          }}>
            ThreadZW Pro for only{' '}
            <strong style={{ color: '#000' }}>
              $7/month
            </strong>
            . No hidden fees.
          </p>
        </div>

        {/* Pricing card */}
        <div style={{
          background: '#000000',
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 24
        }}>
          {/* Top accent */}
          <div style={{
            height: 4,
            background: '#c8ff00'
          }} />
          
          <div style={{ padding: '24px 24px 28px' }}>
            
            {/* Price */}
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
              marginBottom: 6
            }}>
              <span style={{
                fontSize: 52,
                fontWeight: 900,
                color: '#c8ff00',
                letterSpacing: '-2px',
                fontStyle: 'normal'
              }}>
                $7
              </span>
              <span style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.4)',
                fontStyle: 'normal'
              }}>
                /month
              </span>
            </div>
            
            <p style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.35)',
              margin: '0 0 24px',
              fontStyle: 'normal'
            }}>
              Billed every 28 days via EcoCash
            </p>

            {/* Features */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginBottom: 24
            }}>
              {FEATURES.map(feature => (
                <div
                  key={feature}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#c8ff00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Check 
                      size={12}
                      color="#000000"
                      strokeWidth={3}
                    />
                  </div>
                  <span style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.8)',
                    fontStyle: 'normal'
                  }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Subscribe button */}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading
                  ? 'rgba(200,255,0,0.5)'
                  : '#c8ff00',
                color: '#000000',
                border: 'none',
                borderRadius: 10,
                fontWeight: 900,
                fontSize: 16,
                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontStyle: 'normal',
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '2px solid rgba(0,0,0,0.2)',
                    borderTop: '2px solid #000000',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                  Redirecting to payment...
                </>
              ) : (
                'Subscribe for $7/month'
              )}
            </button>

            {/* Payment note */}
            <p style={{
              textAlign: 'center',
              fontSize: 12,
              color: 'rgba(255,255,255,0.25)',
              margin: '12px 0 0',
              fontStyle: 'normal'
            }}>
              Pay securely via EcoCash or InnBucks
            </p>
          </div>
        </div>

        {/* Continue trial link */}
        {isLive && (
          <button
            onClick={() => navigate(-1)}
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
              fontStyle: 'normal'
            }}
          >
            Continue Free Trial
          </button>
        )}

        {/* Trust note */}
        <p style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#aaaaaa',
          marginTop: 20,
          fontStyle: 'normal',
          lineHeight: 1.5
        }}>
          No automatic charges. Manual payment via EcoCash. You control your subscription.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
export default SubscriptionPage;
