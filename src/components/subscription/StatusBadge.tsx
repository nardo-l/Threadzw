import React from 'react'
import { useSubscription, SUB_STATUS } 
  from '../../context/SubscriptionContext'

const STATUS_CONFIG = {
  [SUB_STATUS.TRIAL]: {
    label: (days: number) => 
      days > 1 
        ? `${days} days remaining`
        : 'Last day of trial',
    background: 'rgba(200,255,0,0.12)',
    border: 'rgba(200,255,0,0.3)',
    color: '#000000',
    dot: '#c8ff00'
  },
  [SUB_STATUS.ACTIVE]: {
    label: () => 'Subscription active',
    background: 'rgba(0,200,100,0.1)',
    border: 'rgba(0,200,100,0.25)',
    color: '#00843d',
    dot: '#00c864'
  },
  [SUB_STATUS.PENDING]: {
    label: () => 'Awaiting confirmation',
    background: 'rgba(255,170,0,0.1)',
    border: 'rgba(255,170,0,0.25)',
    color: '#8a5e00',
    dot: '#ffaa00'
  } as const,
  [SUB_STATUS.EXPIRED]: {
    label: () => 'Subscription expired',
    background: 'rgba(255,68,68,0.08)',
    border: 'rgba(255,68,68,0.2)',
    color: '#cc0000',
    dot: '#ff4444'
  }
} as const

interface StatusBadgeProps {
  size?: 'sm' | 'md' | 'lg'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ size = 'md' }) => {
  const { subscription } = useSubscription()
  if (!subscription) return null

  const config = STATUS_CONFIG[subscription.status]
  const label = config.label(subscription.daysRemaining)

  const sizes = {
    sm: { 
      fontSize: 11, 
      padding: '4px 10px',
      dotSize: 6,
      gap: 6 
    },
    md: { 
      fontSize: 13, 
      padding: '6px 14px',
      dotSize: 7,
      gap: 8 
    },
    lg: { 
      fontSize: 15, 
      padding: '8px 18px',
      dotSize: 8,
      gap: 10 
    }
  } as const

  const s = sizes[size]

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: s.gap,
      background: config.background,
      border: `1px solid ${config.border}`,
      borderRadius: 8,
      padding: s.padding
    }}>
      <div style={{
        width: s.dotSize,
        height: s.dotSize,
        borderRadius: '50%',
        background: config.dot,
        flexShrink: 0
      }} />
      <span style={{
        fontSize: s.fontSize,
        fontWeight: 700,
        color: config.color,
        fontStyle: 'normal',
        whiteSpace: 'nowrap'
      }}>
        {label}
      </span>
    </div>
  )
}
