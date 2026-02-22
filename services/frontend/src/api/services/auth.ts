import { supabase } from '../../lib/supabase'

export const AuthService = {

  async login(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  },

  async signUp(email: string, password: string) {
    return await supabase.auth.signUp({
      email,
      password,
    })
  },

  async logout() {
    await supabase.auth.signOut()
  },

  async getAccessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  },

  /*
    Check if user is currently authenticated
   */
  async isLoggedIn(): Promise<boolean> {
    const { data } = await supabase.auth.getSession()
    return !!data.session
  }
}
