import { appConfig } from '../app/config'
import { storage } from './storage'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = storage.getToken()
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${appConfig.apiUrl}${path}`, { ...options, headers })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = typeof body?.detail === 'string' ? body.detail : 'The request could not be completed.'
    throw new ApiError(response.status, detail)
  }
  return body as T
}
