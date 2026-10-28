import { useTheme } from '../../features/theme/themeContext'
import { Icon } from './Icon'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const targetTheme = theme === 'dark' ? 'light' : 'dark'

  return <button className={`topbar-icon-button theme-toggle ${className}`.trim()} type="button" aria-label={`Switch to ${targetTheme} theme`} aria-pressed={theme === 'dark'} title={`Switch to ${targetTheme} theme`} onClick={toggleTheme}>
    <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
  </button>
}
