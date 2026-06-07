import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscription, SUB_STATUS } 
  from '../../context/SubscriptionContext'
import { 
  Package, Tag, MessageCircle, 
  BarChart2, Link, Check, ArrowRight
} from 'lucide-react'
import { StatusBadge } from './StatusBadge'

const FEATURES = [
  { 
    icon: Package, 
    label: 'Unlimited Products' 
  },
  { 
    icon: Tag, 
    label: 'Product Categories' 
  },
  { 
    icon: MessageCircle, 
    label: 'WhatsApp Ordering' 
  },
  { 
    icon: BarChart2, 
    label: 'Analytics' 
  },
  { 
    icon: Link, 
    label: 'Custom Shop Link' 
  }
]

export const SubscriptionCard: React.FC = () => {
  const navigate = useNavigate()
  const { subscription } = useSubscription()
  if (!subscription) return null

  const isExpired = subscription.status === SUB_STATUS.EXPIRED
  const isActive = subscription.status === SUB_STATUS.ACTIVE
  const isTrial = subscription.status === SUB_STATUS.TRIAL

  return (
    <div style={{
      background: '#000000',
      borderRadius: 20,
      overflow: 'hidden',
      position: 'relative',
      marginBottom: 20
    }}>
      {/* Top accent bar */}
      <div style={{
        height: 3,
        background: '#c8ff00',
        width: '100%'
      }} />

      <div style={{ padding: '20px 20px 24px' }}>
        
        {/* Header row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16
        }}>
          <div>
            <p style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '2px',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              margin: '0 0 4px',
              fontStyle: 'normal'
            }}>
              THREADZW
            </p>
            <h3 style={{
              fontSize: 20,
              fontWeight: 900,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.3px',
              fontStyle: 'normal'
            }}>
              Pro Plan
            </h3>
          </div>
          <StatusBadge size="sm" />
        </div>

        {/* Days remaining visual */}
        {isTrial && (
          <div style={{ marginBottom: 20 }}>
            {/* Progress bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6
            }}>
              <span style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                fontStyle: 'normal'
              }}>
                Trial progress
              </span>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#c8ff00',
                fontStyle: 'normal'
              }}>
                {subscription.daysRemaining} of 28 days left
              </span>
            </div>
            <div style={{
              height: 4,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${(subscription.daysRemaining / 28) * 100}%`,
                background: subscription.daysRemaining <= 5
                  ? '#ff4444'
                  : subscription.daysRemaining <= 10
                    ? '#ffaa00'
                    : '#c8ff00',
                borderRadius: 2,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Active subscription expiry */}
        {isActive && (
          <div style={{
            background: 'rgba(0,200,100,0.1)',
            border: '1px solid rgba(0,200,100,0.2)',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.6)',
              fontStyle: 'normal'
            }}>
              Renews in
            </span>
            <span style={{
              fontSize: 14,
              fontWeight: 800,
              color: '#00c864',
              fontStyle: 'normal'
            }}>
              {subscription.daysRemaining} days
            </span>
          </div>
        )}

        {/* Expired state */}
        {isExpired && (
          <div style={{
            background: 'rgba(255,68,68,0.1)',
            border: '1px solid rgba(255,68,68,0.2)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 20
          }}>
            <p style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#ff4444',
              margin: 0,
              fontStyle: 'normal'
            }}>
              Your subscription has expired.
            </p>
            <p style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
              margin: '4px 0 0',
              fontStyle: 'normal'
            }}>
              Renew to keep your store live for customers.
            </p>
          </div>
        )}

        {/* Features list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginBottom: 20
        }}>
          {FEATURES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: 'rgba(200,255,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Check 
                  size={13} 
                  color="#c8ff00"
                  strokeWidth={3}
                />
              </div>
              <span style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.75)',
                fontStyle: 'normal'
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Price display */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
          marginBottom: 16
        }}>
          <span style={{
            fontSize: 36,
            fontWeight: 900,
            color: '#c8ff00',
            letterSpacing: '-1px',
            fontStyle: 'normal'
          }}>
            $7
          </span>
          <span style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.4)',
            fontStyle: 'normal'
          }}>
            /month
          </span>
        </div>

        {/* CTA button */}
        <button
          onClick={() => navigate('/subscription')}
          style={{
            width: '100%',
            padding: '15px',
            background: isExpired ? '#ff4444' : '#c8ff00',
            color: '#000000',
            border: 'none',
            borderRadius: 10,
            fontWeight: 900,
            fontSize: 15,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontStyle: 'normal',
            letterSpacing: '0.3px',
            textTransform: 'uppercase'
          }}
        >
          {isExpired
            ? 'Renew Subscription'
            : isActive
              ? 'Manage Subscription'
              : 'Upgrade Now'
          }
          <ArrowRight size={16} />
        </button>

        {/* Trial continue link */}
        {isTrial && (
          <p style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
            marginTop: 10,
            fontStyle: 'normal'
          }}>
            or{' '}
            <span 
              onClick={() => navigate(-1)}
              style={{
                color: 'rgba(255,255,255,0.5)',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              continue your free trial
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
