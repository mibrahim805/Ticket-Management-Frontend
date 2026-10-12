import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../features/auth/api/authApi'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)
    try {
      const response = await requestPasswordReset(email)
      setMessage(response.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to request a password reset.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <main className="auth-page"><section className="auth-card">
    <div className="brand auth-brand"><div className="brand-mark">T</div><span>Taskline</span></div>
    <div className="auth-heading"><p className="eyebrow">Account recovery</p><h1>Forgot your password?</h1><p className="subtle">Enter your email address to request a reset link.</p></div>
    <form className="login-form" onSubmit={submit}>
      <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}
      <button className="primary-button login-button" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send reset link'}</button>
    </form>
    <p className="auth-footer"><Link to="/login">Back to sign in</Link></p>
  </section></main>
}
