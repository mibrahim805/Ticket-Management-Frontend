import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const storedWidth = Number(window.localStorage.getItem('taskline-sidebar-width'))
    return Number.isFinite(storedWidth) && storedWidth >= 220 && storedWidth <= 420 ? storedWidth : 320
  })
  const [isSidebarHidden, setIsSidebarHidden] = useState(false)
  const resizing = useRef(false)

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (!resizing.current) return
      setSidebarWidth(Math.min(420, Math.max(220, event.clientX)))
    }
    function stopResizing() {
      resizing.current = false
      document.body.classList.remove('resizing-sidebar')
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResizing)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopResizing)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('taskline-sidebar-width', String(sidebarWidth))
  }, [sidebarWidth])

  return <div className="app-frame" style={{ '--sidebar-width': `${sidebarWidth}px` } as CSSProperties}>
    <Topbar />
    <div className="app-shell">
      {!isSidebarHidden && <Sidebar onHide={() => setIsSidebarHidden(true)} onResizeStart={() => {
        resizing.current = true
        document.body.classList.add('resizing-sidebar')
      }} />}
      {isSidebarHidden && <button className="sidebar-show-button" type="button" onClick={() => setIsSidebarHidden(false)} aria-label="Show sidebar">›</button>}
      <main className="content"><Outlet /></main>
    </div>
  </div>
}
