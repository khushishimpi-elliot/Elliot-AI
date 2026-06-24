const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getToken = () => localStorage.getItem('elliot_jwt')
const getTenantId = () =>
  localStorage.getItem('elliot_tenant_id') ||
  '00000000-0000-0000-0000-000000000001'
const getUserId = () =>
  localStorage.getItem('elliot_user_id') ||
  '00000000-0000-0000-0000-000000000002'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
})

export const api = {

  // ── AUTH ──────────────────────────────────────────

  sendMagicLink: async (email: string) => {
    const r = await fetch(`${API_URL}/auth/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    return r.json()
  },

  auth0Login: async () => {
    const r = await fetch(`${API_URL}/auth/auth0/login`)
    return r.json()
  },

  googleLogin: () => {
    window.location.href = `${API_URL}/auth/google/login`
  },

  entraLogin: () => {
    window.location.href = `${API_URL}/auth/entra/login`
  },

  saveAuth: (jwt: string, user: Record<string, unknown>) => {
    localStorage.setItem('elliot_jwt', jwt)
    localStorage.setItem('elliot_user_id', (user.id as string) || '')
    localStorage.setItem('elliot_tenant_id', (user.tenant_id as string) || '')
    localStorage.setItem('elliot_email', (user.email as string) || '')
  },

  isLoggedIn: () => !!localStorage.getItem('elliot_jwt'),

  logout: () => {
    localStorage.removeItem('elliot_jwt')
    localStorage.removeItem('elliot_user_id')
    localStorage.removeItem('elliot_tenant_id')
    localStorage.removeItem('elliot_email')
  },

  // ── ONBOARDING ────────────────────────────────────

  createOrganisation: async (data: {
    org_name: string
    domain: string
    team_size: string
    data_residency: string
  }) => {
    const r = await fetch(`${API_URL}/onboarding/workspace`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: data.org_name,
        domain: data.domain,
        team_size: data.team_size,
        residency: data.data_residency
      })
    })
    return r.json()
  },

  saveSdlc: async (data: {
    stack: string
    branching_model: string
    test_framework: string
    coverage_gate: number
    ci_cd_platform: string
    review_policy: string
    arch_style: string
  }) => {
    const r = await fetch(`${API_URL}/sdlc`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        tenant_id: getTenantId(), ...data
      })
    })
    return r.json()
  },

  getConnectorAuthUrl: async (provider: string) => {
    const r = await fetch(
      `${API_URL}/connectors/${getTenantId()}` +
      `/${provider}/authorize`,
      { headers: authHeaders() }
    )
    return r.json()
  },

  listConnectors: async () => {
    const r = await fetch(
      `${API_URL}/connectors/${getTenantId()}`,
      { headers: authHeaders() }
    )
    return r.json()
  },

  getIndexStats: async () => {
    const r = await fetch(
      `${API_URL}/index/${getTenantId()}/stats`,
      { headers: authHeaders() }
    )
    return r.json()
  },

  // ── QUERY STREAMING ───────────────────────────────

  // ── LAUNCH SUMMARY ───────────────────────────────

  getLaunchSummary: async () => {
    try {
      const r = await fetch(`${API_URL}/launch`, {
        headers: authHeaders()
      })
      return r.json() as Promise<Record<string, unknown>>
    } catch {
      return null
    }
  },

  // ── QUERY STREAMING ───────────────────────────────

  queryStream: async (
    query: string,
    onToken: (t: string) => void,
    onDone: (d: Record<string, unknown>) => void,
    onError: (e: string) => void
  ) => {
    try {
      const res = await fetch(
        `${API_URL}/query/stream`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          query,
          tenant_id: getTenantId(),
          user_id: getUserId(),
          team_id: '00000000-0000-0000-0000-000000000003'
        })
      })

      if (!res.ok) {
        onError(`Error ${res.status}: ${res.statusText}`)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.token) onToken(data.token)
            if (data.done) onDone(data)
            if (data.error) onError(data.error)
          } catch {}
        }
      }
    } catch {
      onError('Cannot reach backend. Check connection.')
    }
  }
}

// ── BACKWARD COMPATIBILITY ─────────────────────────────────

export interface LaunchSummary {
  org_name: string
  primary_stack: string
  arch_style: string
  compliance: string[]
  connectors: { name: string; status: 'connected' | 'not_connected' }[]
  indexed_chunks: number
}

export async function fetchLaunchSummary(opts: {
  token?: string
  baseUrl?: string
  mock?: boolean
}): Promise<LaunchSummary> {
  const mockData: LaunchSummary = {
    org_name: "Elliot Systems",
    primary_stack: "Python 3.11 + FastAPI + React + Vite",
    arch_style: "Hexagonal",
    compliance: ["SOC 2", "PCI-DSS"],
    connectors: [
      { name: "GitHub", status: "connected" },
      { name: "Jira", status: "connected" },
      { name: "Slack", status: "connected" },
      { name: "Confluence", status: "not_connected" }
    ],
    indexed_chunks: 542_000
  }

  if (opts.mock) return mockData

  const url = `${opts.baseUrl ?? API_URL}/launch`
  const headers: Record<string, string> = { Accept: "application/json" }
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`

  try {
    const resp = await fetch(url, { headers })
    if (!resp.ok) return mockData
    return (await resp.json()) as LaunchSummary
  } catch {
    return mockData
  }
}
