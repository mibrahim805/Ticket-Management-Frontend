import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function Topbar() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = search.trim()
    navigate(query ? `/tickets?search=${encodeURIComponent(query)}` : '/tickets')
  }

  return <header className="topbar"><div className="topbar-left"><button className="menu-button" aria-label="Toggle navigation">☰</button><div className="topbar-brand"><span className="topbar-brand-mark">T</span><strong>Taskline</strong></div><nav className="topbar-nav" aria-label="Main navigation"><Link to="/projects">Projects</Link><Link to="/tickets">Tickets</Link><Link to="/analytics">Reports</Link></nav></div><div className="topbar-actions"><form className="search-box" onSubmit={submitSearch}><span>⌕</span><input aria-label="Search" placeholder="Search tickets" value={search} onChange={(event) => setSearch(event.target.value)} /></form><button className="icon-button" aria-label="Notifications">♢</button><div className="topbar-avatar">SU</div></div></header>
}
