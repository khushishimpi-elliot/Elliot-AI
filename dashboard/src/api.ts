const API_URL = import.meta.env.VITE_API_URL ||
                'http://localhost:8000'
const getTenantId = () =>
  localStorage.getItem('elliot_tenant_id') ||
  '00000000-0000-0000-0000-000000000001'
const getToken = () =>
  localStorage.getItem('elliot_jwt')
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
})

export const dashboardApi = {

  getUsageSummary: async () => {
    try {
      const r = await fetch(
        `${API_URL}/usage/summary/${getTenantId()}`,
        { headers: authHeaders() }
      )
      return r.json()
    } catch {
      return null
    }
  },

  getTenantUsage: async () => {
    try {
      const r = await fetch(
        `${API_URL}/usage/tenant/${getTenantId()}`,
        { headers: authHeaders() }
      )
      return r.json()
    } catch {
      return null
    }
  },

  getTeams: async () => {
    try {
      const r = await fetch(
        `${API_URL}/teams?tenant_id=${getTenantId()}`,
        { headers: authHeaders() }
      )
      return r.json()
    } catch {
      return null
    }
  },

  listConnectors: async () => {
    try {
      const r = await fetch(
        `${API_URL}/connectors/${getTenantId()}`,
        { headers: authHeaders() }
      )
      return r.json()
    } catch {
      return null
    }
  }
}
