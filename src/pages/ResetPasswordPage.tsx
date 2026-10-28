import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../features/auth/api/authApi'
import { ThemeToggle } from '../components/ui/ThemeToggle'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsSubmitting(true)
    try {
      const response = await resetPassword(token, password)
      navigate('/login', { replace: true, state: { message: response.message } })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to reset the password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <main className="auth-page"><ThemeToggle className="auth-theme-toggle" /><section className="auth-card">
    <div className="brand auth-brand"><div className="brand-mark">T</div><span>Taskline</span></div>
    <div className="auth-heading"><p className="eyebrow">Account recovery</p><h1>Set a new password</h1><p className="subtle">Use the token from your reset link and choose a new password.</p></div>
    <form className="login-form" onSubmit={submit}>
      <label>Reset token<input value={token} onChange={(event) => setToken(event.target.value)} required autoComplete="off" /></label>
      <label>New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required autoComplete="new-password" /></label>
      <label>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} required autoComplete="new-password" /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button login-button" disabled={isSubmitting}>{isSubmitting ? 'Resetting...' : 'Reset password'}</button>
    </form>
    <p className="auth-footer"><Link to="/login">Back to sign in</Link></p>
  </section></main>
}
