import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface AuthState { loading: boolean; user?: { id: string; email: string } }

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ loading: true })
  useEffect(() => {
    const set = (u: { id: string; email?: string } | null | undefined) =>
      setState({ loading: false, user: u ? { id: u.id, email: u.email ?? '' } : undefined })
    supabase.auth.getSession().then(({ data }) => set(data.session?.user))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => set(session?.user))
    return () => data.subscription.unsubscribe()
  }, [])
  return state
}

export const sendCode = (email: string) => supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
export const verifyCode = (email: string, token: string) => supabase.auth.verifyOtp({ email, token, type: 'email' })
export const signOut = () => supabase.auth.signOut()
