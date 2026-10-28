import { createContext, useContext } from 'react'

export type OpenTicketOptions = { projectId?: string }
export type CreateTicketDrawerContextValue = {
  openCreateTicket: (options?: OpenTicketOptions) => void
  closeCreateTicket: () => void
}

export const CreateTicketDrawerContext = createContext<CreateTicketDrawerContextValue | null>(null)

export function useCreateTicketDrawer() {
  const context = useContext(CreateTicketDrawerContext)
  if (!context) throw new Error('useCreateTicketDrawer must be used inside CreateTicketDrawerProvider.')
  return context
}
