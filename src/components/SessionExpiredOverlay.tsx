import React from 'react'
import { Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export const SessionExpiredOverlay: React.FC = () => {
  const { sessionExpired, signOut } = useAuth()
  const navigate = useNavigate()

  if (!sessionExpired) return null

  const handleSignIn = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-card rounded-3xl p-8 border border-white/5 flex flex-col items-center text-center gap-6 shadow-2xl">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Lock size={40} />
        </div>
        
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-syne font-bold text-white">Session expired</h2>
          <p className="text-sm text-muted">Please sign in again to continue.</p>
        </div>

        <button 
          onClick={handleSignIn}
          className="w-full py-4 bg-primary text-white font-syne font-bold rounded-xl shadow-xl hover:opacity-90 transition-all active:scale-95"
        >
          Sign In →
        </button>
      </div>
    </div>
  )
}
