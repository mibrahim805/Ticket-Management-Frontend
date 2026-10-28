import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'activity' | 'arrow-down' | 'arrow-right' | 'arrow-up' | 'bell' | 'bug'
  | 'calendar' | 'check' | 'chevron-down' | 'dashboard' | 'edit'
  | 'help' | 'layers' | 'menu' | 'plus' | 'pin' | 'profile' | 'projects'
  | 'reports' | 'search' | 'settings' | 'sprints' | 'star' | 'task'
  | 'tickets' | 'users' | 'work' | 'moon' | 'sun'

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  let paths: ReactNode

  switch (name) {
    case 'search': paths = <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>; break
    case 'plus': paths = <><path d="M12 5v14M5 12h14" /></>; break
    case 'bell': paths = <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>; break
    case 'help': paths = <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.2 1-1.2 1.7M12 17h.01" /></>; break
    case 'chevron-down': paths = <path d="m8 10 4 4 4-4" />; break
    case 'dashboard': paths = <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>; break
    case 'work': paths = <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 5V3h8v2M4 11h16M10 11v2h4v-2" /></>; break
    case 'projects': paths = <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 5V3h5l2 2" /></>; break
    case 'tickets': paths = <><path d="M5 4h14v4a2 2 0 0 0 0 4v8H5v-8a2 2 0 0 0 0-4Z" /><path d="M9 8h6M9 12h6M9 16h4" /></>; break
    case 'sprints': paths = <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>; break
    case 'reports': paths = <><path d="M4 19h16" /><path d="M7 16v-5M12 16V6M17 16V9" /></>; break
    case 'users': paths = <><path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="3" /><path d="M16 4.4a3 3 0 0 1 0 5.8M21 20v-2a4 4 0 0 0-3-3.6" /></>; break
    case 'profile': paths = <><circle cx="12" cy="8" r="3" /><path d="M5 20a7 7 0 0 1 14 0" /></>; break
    case 'settings': paths = <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>; break
    case 'star': paths = <path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.8-5.4 2.8 1.1-6-4.4-4.2 6-.9Z" />; break
    case 'pin': paths = <><path d="m14 4 6 6-3 1-4 4-1 4-2-2-3 3-1-1 3-3-2-2 4-1 4-4Z" /></>; break
    case 'menu': paths = <><path d="M4 7h16M4 12h16M4 17h16" /></>; break
    case 'activity': paths = <path d="M3 12h4l2.5-7 5 14 2.5-7h4" />; break
    case 'arrow-up': paths = <><path d="m7 11 5-5 5 5M12 6v12" /></>; break
    case 'arrow-down': paths = <><path d="m7 13 5 5 5-5M12 18V6" /></>; break
    case 'arrow-right': paths = <><path d="M5 12h14M14 7l5 5-5 5" /></>; break
    case 'calendar': paths = <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>; break
    case 'check': paths = <path d="m5 12 4 4L19 6" />; break
    case 'layers': paths = <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>; break
    case 'bug': paths = <><path d="M8 9h8v7a4 4 0 0 1-8 0V9ZM9 5l2 2M15 5l-2 2M5 12h3M16 12h3M5 16h3M16 16h3" /></>; break
    case 'task': paths = <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m8 9 1.5 1.5L12 8M14 10h3M8 15h9" /></>; break
    case 'edit': paths = <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>; break
    case 'moon': paths = <path d="M20.5 14.2A8 8 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />; break
    case 'sun': paths = <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>; break
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true" {...common} {...props}>{paths}</svg>
}
