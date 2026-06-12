import axios from 'axios'
import { env } from './env'
import { supabase } from './supabase'

export const apiClient = axios.create({
  baseURL: `${env.apiUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(async (config) => {
  if (!supabase) {
    return config
  }

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
