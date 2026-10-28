import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CreateTicketPage } from '../pages/CreateTicketPage'
import type { CreatedTicket } from '../types/ticket.types'
import { CreateTicketDrawerContext, type OpenTicketOptions } from './createTicketDrawerContext'

function TicketDrawer({ projectId, onClose }: { projectId?: string; onClose: () => void }) {
  const [isClosing, setIsClosing] = useState(false)
  const closeTimer = useRef<number | null>(null)

  const requestClose = useCallback(() => {
    if (closeTimer.current !== null) return
    setIsClosing(true)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    closeTimer.current = window.setTimeout(onClose, 280)
  }, [onClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') requestClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    }
  }, [requestClose])

  function handleCreated(ticket: CreatedTicket) {
    window.dispatchEvent(new CustomEvent('ticket-created', { detail: ticket }))
    requestClose()
  }

  return <div className={`creation-drawer-backdrop ${isClosing ? 'is-closing' : ''}`} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && requestClose()}>
    <aside className="creation-drawer ticket-creation-drawer" role="dialog" aria-modal="true" aria-labelledby="create-ticket-drawer-title">
      <CreateTicketPage presentation="drawer" initialProjectId={projectId} onClose={requestClose} onCreated={handleCreated} />
    </aside>
  </div>
}

export function CreateTicketDrawerProvider({ children }: { children: ReactNode }) {
  const [drawerOptions, setDrawerOptions] = useState<OpenTicketOptions | null>(null)

  const closeCreateTicket = useCallback(() => setDrawerOptions(null), [])
  const openCreateTicket = useCallback((options: OpenTicketOptions = {}) => setDrawerOptions(options), [])

  return <CreateTicketDrawerContext.Provider value={{ openCreateTicket, closeCreateTicket }}>
    {children}
    {drawerOptions && <TicketDrawer projectId={drawerOptions.projectId} onClose={closeCreateTicket} />}
  </CreateTicketDrawerContext.Provider>
}
