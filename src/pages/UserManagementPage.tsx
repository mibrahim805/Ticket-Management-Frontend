import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { changeUserRole, createManagedUser, listUsers, registerAdmin, toggleUserActive } from '../features/auth/api/authApi'
import type { ManagedRole, ManagedUser } from '../features/auth/types/auth.types'
import './user-management.css'

function roleLabel(role: ManagedRole) {
  if (role === 'super_admin') return 'Super admin'
  if (role === 'admin') return 'Admin'
  return 'User'
}

export function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | ''>('')
  const [isCreating, setIsCreating] = useState(false)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await listUsers()
      setUsers(response.users)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load users.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadUsers() }, [loadUsers])

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)
    setError('')
    setSuccess('')
    try {
      if (role === 'admin') await registerAdmin({ name, email, password, is_active: true })
      else await createManagedUser({ name, email, password, role: null, is_active: true })
      setName('')
      setEmail('')
      setPassword('')
      setRole('')
      setSuccess('User created successfully.')
      await loadUsers()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create user.')
    } finally {
      setIsCreating(false)
    }
  }

  async function updateRole(user: ManagedUser, nextRole: 'admin' | '') {
    setError('')
    setSuccess('')
    try {
      await changeUserRole(user.id, nextRole || null)
      setSuccess(`${user.name}'s role was updated.`)
      await loadUsers()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update role.')
    }
  }

  async function toggleStatus(user: ManagedUser) {
    setError('')
    setSuccess('')
    try {
      await toggleUserActive(user.id)
      setSuccess(`${user.name} is now ${user.is_active ? 'inactive' : 'active'}.`)
      await loadUsers()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update account status.')
    }
  }

  return <div className="page-content user-management-page">
    <header className="user-management-heading"><div><p className="eyebrow">Administration</p><h1>User management</h1><p className="subtle">Create workspace accounts and manage their global roles and access.</p></div><span className="user-count">{users.length} users</span></header>
    {error && <div className="user-management-message error-message">{error}</div>}
    {success && <div className="user-management-message success-message">{success}</div>}
    <div className="user-management-layout">
      <section className="panel create-user-panel"><div className="user-panel-heading"><div><h2>Create a user</h2><p>Passwords must contain at least 12 characters.</p></div></div><form className="user-form" onSubmit={createUser}><label>Name<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Temporary password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required /></label><label>Global role<select value={role} onChange={(event) => setRole(event.target.value as 'admin' | '')}><option value="">User</option><option value="admin">Admin</option></select></label><button className="primary-button" type="submit" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create user'}</button></form></section>
      <section className="panel users-list-panel"><div className="user-panel-heading"><div><h2>Workspace users</h2><p>Manage each account's global access.</p></div><button className="secondary-button" type="button" onClick={() => void loadUsers()}>Refresh</button></div>{isLoading ? <div className="users-empty">Loading users...</div> : users.length === 0 ? <div className="users-empty">No users found.</div> : <div className="users-table-wrap"><table className="users-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><small>{user.email}</small></td><td>{user.role === 'super_admin' ? <span className="role-badge super-admin-role">{roleLabel(user.role)}</span> : <select className="role-select" value={user.role || ''} onChange={(event) => void updateRole(user, event.target.value as 'admin' | '')} aria-label={`Role for ${user.name}`}><option value="">User</option><option value="admin">Admin</option></select>}</td><td><span className={`status-badge ${user.is_active ? 'active-status' : 'inactive-status'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td><td>{user.role === 'super_admin' ? <span className="protected-label">Protected</span> : <button className="table-action" type="button" onClick={() => void toggleStatus(user)}>{user.is_active ? 'Deactivate' : 'Activate'}</button>}</td></tr>)}</tbody></table></div>}</section>
    </div>
  </div>
}
