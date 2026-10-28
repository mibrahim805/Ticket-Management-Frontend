import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, registerSuperAdmin } from '../features/auth/api/authApi'
import { ThemeToggle } from '../components/ui/ThemeToggle'

export function RegistrationPage({ superAdmin = false }: { superAdmin?: boolean }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const response = superAdmin
        ? await registerSuperAdmin({ name, email, password })
        : await register({ name, email, password, is_active: true })
      navigate('/login', { replace: true, state: { message: response.message } })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create the account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <main className="auth-page"><ThemeToggle className="auth-theme-toggle" /><section className="auth-card">
    <div className="brand auth-brand"><div className="brand-mark">T</div><span>Taskline</span></div>
    <div className="auth-heading"><p className="eyebrow">{superAdmin ? 'Workspace setup' : 'Create account'}</p><h1>{superAdmin ? 'Create the super admin' : 'Join your workspace'}</h1><p className="subtle">{superAdmin ? 'Use this once when initializing a new workspace.' : 'Create an account to start managing work.'}</p></div>
    <form className="login-form" onSubmit={submit}>
      <label>Name<input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></label>
      <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
      <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required autoComplete="new-password" /><small>At least 12 characters.</small></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button login-button" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create account'}</button>
    </form>
    <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
  </section></main>
}
