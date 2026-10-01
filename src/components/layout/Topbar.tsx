import { Link } from 'react-router-dom'

export function Topbar() {
  return <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> Overview</div><div className="topbar-actions"><label className="search-box"><span>⌕</span><input aria-label="Search" placeholder="Search anything" /></label><button className="icon-button" aria-label="Notifications">♢</button><Link className="primary-button" to="/tickets/new">＋ Create ticket</Link></div></header>
}
