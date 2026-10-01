import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try { await login({ email, password }) } catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in.') } finally { setIsSubmitting(false) }
  }

  return <form className="login-form" onSubmit={handleSubmit}>
    <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
    <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
    {error && <p className="form-error">{error}</p>}
    <button className="primary-button login-button" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
  </form>
}
