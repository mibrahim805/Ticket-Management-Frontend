const TOKEN_KEY = 'ticket-management.access-token'
const DASHBOARD_ACTIVITY_PERIOD_KEY = 'ticket-management.dashboard.activity-period'

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getDashboardActivityPeriod: () => sessionStorage.getItem(DASHBOARD_ACTIVITY_PERIOD_KEY),
  setDashboardActivityPeriod: (period: string) => sessionStorage.setItem(DASHBOARD_ACTIVITY_PERIOD_KEY, period),
  clearSessionPreferences: () => sessionStorage.removeItem(DASHBOARD_ACTIVITY_PERIOD_KEY),
}
