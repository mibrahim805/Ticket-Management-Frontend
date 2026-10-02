import { Link } from 'react-router-dom'

export function Topbar() {
  return <header className="topbar"><div className="topbar-left"><button className="menu-button" aria-label="Toggle navigation">☰</button><div className="topbar-brand"><span className="topbar-brand-mark">T</span><strong>Taskline</strong></div><nav className="topbar-nav" aria-label="Main navigation"><Link to="/projects">Projects</Link><Link to="/tickets">Tickets</Link><Link to="/analytics">Reports</Link></nav></div><div className="topbar-actions"><label className="search-box"><span>⌕</span><input aria-label="Search" placeholder="Search" /></label><button className="icon-button" aria-label="Notifications">♢</button><Link className="primary-button" to="/tickets/new">＋ Create</Link><div className="topbar-avatar">SU</div></div></header>
}
