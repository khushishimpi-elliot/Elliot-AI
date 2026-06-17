// Global Elliot-AI data structure
export const ELLIOT = {
  PROJECT: {
    project: "Elliot-AI",
    repo: "khushishimpi-elliot/Elliot-AI",
    branch: "main",
    sprint: "Q2.4",
    team: "Platform",
    env: "production",
  },

  AGENTS: [
    { id: "architect", name: "Architect", role: "Plan & design", color: "var(--accent)" },
    { id: "engineer", name: "Engineer", role: "Implementation", color: "var(--ai)" },
    { id: "reviewer", name: "Reviewer", role: "QA & validation", color: "var(--success)" },
    { id: "qa", name: "QA", role: "Testing & verification", color: "var(--cyan)" },
  ],

  ACTIVE_CONTEXT: [
    { label: "Codebase", on: true },
    { label: "Tests", on: true },
    { label: "Docs", on: true },
    { label: "Jira tickets", on: true },
    { label: "Git history", on: true },
    { label: "Architecture", on: false },
    { label: "Performance", on: false },
  ],

  MEMORY: [
    { label: "Team conventions", meta: "TypeScript, Vitest, 90% coverage" },
    { label: "Code patterns", meta: "React hooks, async/await, error boundaries" },
    { label: "Compliance", meta: "SOC 2, GDPR, PCI-DSS" },
  ],

  CONNECTED: [
    { label: "GitHub", status: "synced", meta: "4.2k commits" },
    { label: "GitLab", status: "synced", meta: "892 issues" },
    { label: "Jira", status: "synced", meta: "142 active tickets" },
    { label: "Slack", status: "synced", meta: "#engineering" },
    { label: "PostgreSQL", status: "synced", meta: "8 schemas" },
    { label: "Linear", status: "synced", meta: "56 in flight" },
    { label: "Confluence", status: "synced", meta: "340 docs" },
    { label: "Google Drive", status: "synced", meta: "Design files" },
    { label: "Vector DB", status: "synced", meta: "542k chunks" },
  ],

  COMMANDS: [
    { cmd: "/help", desc: "Show available commands" },
    { cmd: "/project", desc: "Display project context" },
    { cmd: "/knowledge", desc: "List loaded knowledge sources" },
    { cmd: "/agents", desc: "Show multi-agent workforce" },
    { cmd: "/context", desc: "View context window usage" },
    { cmd: "/clear", desc: "Clear terminal history" },
  ],

  RUN: {
    contextMax: 200000,
    contextSources: [
      { label: "Prompt", tokens: 3200, color: "var(--accent)" },
      { label: "Codebase", tokens: 45000, color: "var(--text-dim)" },
      { label: "Tests", tokens: 28000, color: "var(--success)" },
      { label: "Docs", tokens: 18000, color: "var(--cyan)" },
      { label: "Context", tokens: 12000, color: "var(--ai)" },
    ],

    proposed: [
      { label: "Create unit tests for refund service", risk: null },
      { label: "Add integration test suite", risk: null },
      { label: "Deploy to staging", risk: "review" },
      { label: "Merge to main", risk: "review" },
    ],

    steps: [
      {
        agent: "architect",
        label: "Analyze refund service architecture",
        detail: "Understanding payment flow",
        dur: 1800,
        tool: null,
        transcript: null,
      },
      {
        agent: "engineer",
        label: "Generate unit tests",
        detail: "Jest + React Testing Library",
        dur: 2200,
        tool: { name: "file_write", query: "write test file", lines: [
          { k: "file", v: "refund.test.ts" },
          { k: "lines", v: "142" },
          { k: "coverage", v: "94%" },
        ] },
        transcript: null,
      },
      {
        agent: "reviewer",
        label: "Validate test coverage",
        detail: "Line & branch coverage",
        dur: 1400,
        tool: { name: "coverage_check", query: "verify coverage gates", lines: [
          { k: "required", v: "90%" },
          { k: "actual", v: "94%" },
          { k: "status", v: "✓ pass", tone: "success" },
        ] },
        transcript: null,
      },
    ],

    transcripts: {
      intro: [
        { text: "I've analyzed the **refund service** and identified the test gap. Let me write comprehensive unit tests." },
        { text: "Creating tests for payment processing, refund logic, and error handling — **94% coverage**." },
      ],
      summary: [
        { text: "✓ **142 test cases** written across 6 test files" },
        { text: "✓ **94% code coverage** (exceeds 90% gate)" },
        { text: "✓ All integration tests **passing**" },
        { text: "✓ Ready to merge and deploy to staging" },
      ],
    },
  },

  SSO: [
    { id: "okta", name: "Okta", glyph: "O", hint: "SAML / SCIM" },
    { id: "entra", name: "Microsoft Entra", glyph: "E", hint: "Azure AD" },
    { id: "google", name: "Google Workspace", glyph: "G", hint: "OIDC" },
  ],

  SDLC_DEFAULTS: {
    stack: ["TypeScript/Node"],
    branching: "trunk-based",
    testing: "vitest-90",
    cicd: ["GitHub Actions"],
    review: "2-approvals",
    arch: "Hexagonal / ports & adapters",
    compliance: ["SOC 2", "PCI-DSS"],
  },

  CATEGORIES: [
    {
      id: "repos",
      label: "Repositories",
      required: true,
      desc: "Source code Elliot reads, reviews, and writes against.",
      providers: [
        { id: "github", name: "GitHub", glyph: "GH", accent: "var(--accent)", scopes: ["read_repository", "write_repository", "read_api"], account: "core-payments-org" },
        { id: "gitlab", name: "GitLab", glyph: "GL", accent: "var(--ai)", scopes: ["api", "read_repository"] },
        { id: "bitbucket", name: "Bitbucket", glyph: "BB", accent: "var(--cyan)", scopes: ["repo", "pullrequest"] },
        { id: "azure", name: "Azure Repos", glyph: "AZ", accent: "var(--success)", scopes: ["vso.code"] },
      ],
    },
    {
      id: "tickets",
      label: "Issue & ticket tracking",
      required: true,
      desc: "Sprints, tickets and acceptance criteria for context.",
      providers: [
        { id: "jira", name: "Jira", glyph: "JR", accent: "var(--warning)", scopes: ["read:jira-work", "read:jira-user"] },
        { id: "linear", name: "Linear", glyph: "LN", accent: "var(--accent)", scopes: ["issues:read"] },
        { id: "azboards", name: "Azure Boards", glyph: "AB", accent: "var(--success)", scopes: ["wit.read"] },
      ],
    },
    {
      id: "docs",
      label: "Knowledge & documentation",
      required: false,
      desc: "Wikis, specs and decisions ingested into the knowledge base.",
      providers: [
        { id: "confluence", name: "Confluence", glyph: "CF", accent: "var(--text-dim)", scopes: ["read:confluence-content.all"] },
        { id: "notion", name: "Notion", glyph: "ND", accent: "var(--text)", scopes: ["content:read"] },
        { id: "sharepoint", name: "SharePoint", glyph: "SP", accent: "var(--success)", scopes: ["Files.Read.All"] },
        { id: "gdrive", name: "Google Drive", glyph: "GD", accent: "var(--warning)", scopes: ["drive.readonly"] },
      ],
    },
    {
      id: "db",
      label: "Databases & schema",
      required: false,
      desc: "Schema-aware context for queries and migrations.",
      providers: [
        { id: "postgres", name: "PostgreSQL", glyph: "PG", accent: "var(--accent)", scopes: ["read_schema", "read_data"] },
        { id: "mysql", name: "MySQL", glyph: "MY", accent: "var(--accent)", scopes: ["SELECT", "SHOW"] },
        { id: "vectordb", name: "Vector DB", glyph: "VX", accent: "var(--ai)", scopes: ["read_vectors", "read_metadata"] },
      ],
    },
    {
      id: "comms",
      label: "Team communication",
      required: false,
      desc: "Optional — surface decisions made in chat.",
      providers: [
        { id: "slack", name: "Slack", glyph: "SL", accent: "var(--success)", scopes: ["channels:read", "users:read"] },
        { id: "teams", name: "Microsoft Teams", glyph: "HT", accent: "var(--cyan)", scopes: ["Chat.Read", "ChatMessage.Read"] },
      ],
    },
  ],

  STAGES: [
    { id: "1", label: "Sign in", hint: "SSO / identity" },
    { id: "2", label: "Workspace", hint: "Org setup" },
    { id: "3", label: "SDLC Profile", hint: "Engineering standards" },
    { id: "4", label: "Connect Sources", hint: "Integrations" },
    { id: "5", label: "Index Knowledge", hint: "Knowledge base" },
    { id: "6", label: "Launch", hint: "Setup complete" },
  ],
};
