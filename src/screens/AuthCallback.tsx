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
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-black">
      <h1 className="text-5xl font-pacifico animate-in fade-in slide-in-from-bottom-4 duration-700 text-[#25D366]">thread</h1>
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-zinc-800 border-t-[#25D366] rounded-full animate-spin" />
        <p className="text-sm font-mono uppercase tracking-widest text-zinc-500">Signing you in...</p>
      </div>
    </div>
  )
}
