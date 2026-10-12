import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './providers'
import { router } from './router'
import { NotificationsProvider } from '../features/notifications/NotificationsProvider'

export function App() { return <AppProviders><NotificationsProvider><RouterProvider router={router} /></NotificationsProvider></AppProviders> }
