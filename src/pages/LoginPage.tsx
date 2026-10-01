import { LoginForm } from '../features/auth/components/LoginForm'

export function LoginPage() { return <main className="auth-page"><section className="auth-card"><div className="brand auth-brand"><div className="brand-mark">T</div><span>Taskline</span></div><h1>Welcome back</h1><p className="subtle">Sign in to manage your projects and tickets.</p><LoginForm /></section></main> }
