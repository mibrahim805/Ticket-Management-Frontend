import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword, updateProfile } from '../features/auth/api/authApi'
import { useAuth } from '../features/auth/hooks/useAuth'
import './profile.css'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [name, setName] = useState<string | null>(null)
  const [profilePassword, setProfilePassword] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  function finishSensitiveChange(message: string) {
    logout()
    navigate('/login', { replace: true, state: { message: `${message} Please sign in again.` } })
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSavingProfile(true)
    try {
      const response = await updateProfile({ name: name ?? user?.username ?? '', password: profilePassword })
      finishSensitiveChange(response.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update your profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    setIsChangingPassword(true)
    try {
      const response = await changePassword({ old_password: oldPassword, new_password: newPassword })
      finishSensitiveChange(response.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to change your password.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return <div className="page-content profile-page">
    <header className="profile-heading"><p className="eyebrow">Account</p><h1>Profile and security</h1><p className="subtle">Manage your account details and password.</p></header>
    {error && <div className="profile-message error-message">{error}</div>}
    <div className="profile-grid">
      <section className="panel"><h2>Profile</h2><p className="section-copy">The backend requires your password when updating your name. This action signs you out.</p><form className="user-form" onSubmit={saveProfile}>
        <label>Name<input value={name ?? user?.username ?? ''} onChange={(event) => setName(event.target.value)} required /></label>
        <label>Email address<input value={user?.email || ''} disabled /></label>
        <label>Confirm with password<input type="password" value={profilePassword} onChange={(event) => setProfilePassword(event.target.value)} minLength={12} required autoComplete="current-password" /></label>
        <button className="primary-button" disabled={isSavingProfile}>{isSavingProfile ? 'Saving...' : 'Save profile'}</button>
      </form></section>
      <section className="panel"><h2>Change password</h2><p className="section-copy">After changing your password, you will need to sign in again.</p><form className="user-form" onSubmit={savePassword}>
        <label>Current password<input type="password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} required autoComplete="current-password" /></label>
        <label>New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} required autoComplete="new-password" /></label>
        <label>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} required autoComplete="new-password" /></label>
        <button className="primary-button" disabled={isChangingPassword}>{isChangingPassword ? 'Changing...' : 'Change password'}</button>
      </form></section>
    </div>
  </div>
}
