import { LoginForm } from '../features/auth/components/LoginForm'
import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from '../components/ui/ThemeToggle'

export function LoginPage() {
  const location = useLocation()
  const message = (location.state as { message?: string } | null)?.message
  return <main className="auth-page"><ThemeToggle className="auth-theme-toggle" /><section className="auth-card"><div className="brand auth-brand"><div className="brand-mark">T</div><span>Taskline</span></div><div className="auth-heading"><p className="eyebrow">Workspace access</p><h1>Welcome back</h1><p className="subtle">Sign in to manage your projects and tickets.</p></div>{message && <p className="form-success">{message}</p>}<LoginForm /><div className="auth-links"><Link to="/forgot-password">Forgot password?</Link><span>New here? <Link to="/register">Create an account</Link></span></div></section></main>
}
