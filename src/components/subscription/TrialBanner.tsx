import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscription } from 
  '../../context/SubscriptionContext'
import { AlertCircle, Clock, Zap } 
  from 'lucide-react'

export const TrialBanner: React.FC = () => {
  const navigate = useNavigate()
  const { 
    subscription, 
    showTrialBanner,
    isUrgent,
    isCritical
  } = useSubscription()

  if (!showTrialBanner || !subscription) return null

  const days = subscription.daysRemaining

  // Banner config based on urgency
  const getBannerConfig = () => {
    if (isCritical) {
      // 1-2 days left — red
      return {
        background: '#fff0f0',
        border: '#ffcccc',
        iconColor: '#ff4444',
        textColor: '#cc0000',
        Icon: AlertCircle,
        message: days === 1
          ? 'Your trial ends today.'
          : 'Your trial ends tomorrow.',
        subtext: 'Subscribe now to keep your store live.',
        buttonText: 'Subscribe Now',
        buttonBg: '#ff4444',
        buttonColor: '#ffffff'
      }
    }
    
    if (isUrgent) {
      // 3-5 days left — amber
      return {
        background: '#fffbf0',
        border: '#ffe4a0',
        iconColor: '#ffaa00',
        textColor: '#8a5e00',
        Icon: Clock,
        message: `Trial ends in ${days} days.`,
        subtext: 'Upgrade now to avoid any interruption.',
        buttonText: 'Upgrade Now',
        buttonBg: '#c8ff00',
        buttonColor: '#000000'
      }
    }
    
    // 6-28 days — green
    return {
      background: '#f5fff0',
      border: '#c8ff00',
      iconColor: '#5a8a00',
      textColor: '#3d6000',
      Icon: Zap,
      message: `Free trial — ${days} days remaining.`,
      subtext: null,
      buttonText: 'View Plans',
      buttonBg: '#c8ff00',
      buttonColor: '#000000'
    }
  }

  const config = getBannerConfig()
  const { Icon } = config

  return (
    <div style={{
      background: config.background,
      border: `1px solid ${config.border}`,
      borderRadius: 12,
      padding: '12px 16px',
      margin: '0 0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }}>
      {/* Left: icon + text */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        flex: 1,
        minWidth: 0
      }}>
        <Icon 
          size={18} 
          color={config.iconColor}
          style={{ flexShrink: 0, marginTop: 1 }}
        />
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: 13,
            fontWeight: 800,
            color: config.textColor,
            margin: 0,
            fontStyle: 'normal'
          }}>
            {config.message}
          </p>
          {config.subtext && (
            <p style={{
              fontSize: 12,
              color: config.textColor,
              opacity: 0.7,
              margin: '2px 0 0',
              fontStyle: 'normal'
            }}>
              {config.subtext}
            </p>
          )}
        </div>
      </div>

      {/* Right: CTA button */}
      <button
        onClick={() => navigate('/subscription')}
        style={{
          background: config.buttonBg,
          color: config.buttonColor,
          border: 'none',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 800,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          fontStyle: 'normal'
        }}
      >
        {config.buttonText}
      </button>
    </div>
  )
}
