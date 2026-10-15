import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createDefaultWorkflowStatuses, createStatus, deleteStatus, listStatuses, updateStatus } from '../api/statusApi'
import type { WorkflowStatus } from '../types/status.types'
import './statuses.css'

const categories = ['open', 'in_progress', 'on_hold', 'resolved', 'closed']

export function StatusManagementPage() {
  const [statuses, setStatuses] = useState<WorkflowStatus[]>([])
  const [name, setName] = useState('')
  const [order, setOrder] = useState('')
  const [key, setKey] = useState('')
  const [category, setCategory] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadStatuses = useCallback(async () => {
    setIsLoading(true)
    try { setStatuses(await listStatuses()); setError('') }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load statuses.') }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { void loadStatuses() }, [loadStatuses])

  function resetForm() {
    setName('')
    setOrder('')
    setKey('')
    setCategory('')
    setEditingId(null)
  }

  function beginEdit(status: WorkflowStatus) {
    setName(status.name)
    setOrder(String(status.order))
    setKey(status.key || '')
    setCategory(status.category || '')
    setEditingId(status._id)
    setError('')
    setMessage('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy('save')
    setError('')
    setMessage('')
    const input = { name: name.trim(), order: Number(order), ...(key.trim() ? { key: key.trim() } : {}), ...(category ? { category } : {}) }
    try {
      if (editingId) {
        await updateStatus(editingId, input)
        setMessage('Status updated successfully.')
      } else {
        await createStatus(input)
        setMessage('Status created successfully.')
      }
      resetForm()
      await loadStatuses()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save status.')
    } finally { setBusy('') }
  }

  async function createDefaults() {
    setBusy('defaults')
    setError('')
    setMessage('')
    try {
      const response = await createDefaultWorkflowStatuses()
      setStatuses(response.workflow_statuses)
      setMessage(`${response.message}. ${response.created_count} new statuses created.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create default workflow statuses.')
    } finally { setBusy('') }
  }

  async function remove(status: WorkflowStatus) {
    if (!window.confirm(`Delete status “${status.name}”?`)) return
    setBusy(`delete-${status._id}`)
    setError('')
    setMessage('')
    try {
      const response = await deleteStatus(status._id)
      setStatuses((current) => current.filter((item) => item._id !== status._id))
      if (editingId === status._id) resetForm()
      setMessage(response.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete status.')
    } finally { setBusy('') }
  }

  return <div className="page-content status-management-page">
    <header className="status-management-heading"><div><p className="eyebrow">Administration</p><h1>Workflow statuses</h1><p className="subtle">Manage the global statuses that can be assigned to projects.</p></div><button className="secondary-button" type="button" onClick={() => void createDefaults()} disabled={busy === 'defaults'}>{busy === 'defaults' ? 'Creating...' : 'Create default workflow'}</button></header>
    {error && <div className="status-management-message error-message">{error}</div>}
    {message && <div className="status-management-message success-message">{message}</div>}
    <div className="status-management-layout">
      <section className="panel status-form-panel"><h2>{editingId ? 'Edit status' : 'Create status'}</h2><p>Names and order values must be unique.</p><form className="status-form" onSubmit={submit}>
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={50} required /></label>
        <label>Order<input type="number" value={order} onChange={(event) => setOrder(event.target.value)} min={0} required /></label>
        <label>Key <span>Optional</span><input value={key} onChange={(event) => setKey(event.target.value)} placeholder="Automatically generated" /></label>
        <label>Category <span>Optional</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Automatically selected</option>{categories.map((item) => <option value={item} key={item}>{item.replaceAll('_', ' ')}</option>)}</select></label>
        <div className="status-form-actions">{editingId && <button className="secondary-button" type="button" onClick={resetForm}>Cancel</button>}<button className="primary-button" disabled={busy === 'save'}>{busy === 'save' ? 'Saving...' : editingId ? 'Save changes' : 'Create status'}</button></div>
      </form></section>
      <section className="panel status-list-panel"><div className="status-list-heading"><div><h2>Available statuses</h2><p>{statuses.length} statuses ordered across the workflow.</p></div><button className="secondary-button" type="button" onClick={() => void loadStatuses()}>Refresh</button></div>
        {isLoading ? <div className="status-empty">Loading statuses...</div> : statuses.length ? <div className="status-list">{statuses.map((status) => <article className="status-row" key={status._id}><span className="workflow-status-order">{status.order}</span><div><strong>{status.name}</strong><small>{status.key} · {status.category?.replaceAll('_', ' ')}</small></div><div className="status-row-actions"><button type="button" onClick={() => beginEdit(status)}>Edit</button><button className="danger-text" type="button" disabled={busy === `delete-${status._id}`} onClick={() => void remove(status)}>{busy === `delete-${status._id}` ? 'Deleting...' : 'Delete'}</button></div></article>)}</div> : <div className="status-empty">No statuses exist. Create one or initialize the default workflow.</div>}
      </section>
    </div>
  </div>
}
