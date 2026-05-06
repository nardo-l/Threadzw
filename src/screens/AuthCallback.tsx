import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        navigate('/auth?error=callback_failed')
        return
      }

      // Just go to splash, it will handle the logic of where to go next
      navigate('/splash')
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-pacifico text-primary animate-in fade-in slide-in-from-bottom-4 duration-700">thread</h1>
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-mono text-muted uppercase tracking-widest">Signing you in...</p>
      </div>
    </div>
  )
}
