interface Step {
  number: number;
  name: string;
  subtitle: string;
  status: "completed" | "current" | "future";
}

const STEPS: Step[] = [
  { number: 1, name: "Sign in", subtitle: "SSO / identity", status: "completed" },
  { number: 2, name: "Workspace", subtitle: "Org & client", status: "completed" },
  { number: 3, name: "SDLC profile", subtitle: "Engineering standards", status: "completed" },
  { number: 4, name: "Connect sources", subtitle: "Repos · tickets · docs", status: "completed" },
  { number: 5, name: "Index knowledge", subtitle: "Build the RAG", status: "completed" },
  { number: 6, name: "Launch", subtitle: "Open the terminal", status: "current" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-init">$ elliot init</div>
      <ul className="steps-list">
        {STEPS.map((step) => (
          <li key={step.number} className="step-item">
            <div className={`step-circle ${step.status}`}>
              {step.status === "completed" ? "✓" : step.number}
            </div>
            <div className="step-content">
              <div className="step-name">{step.name}</div>
              <div className="step-subtitle">{step.subtitle}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <span className="sidebar-footer-dot">●</span>
        Secure setup · SOC 2 · encrypted at rest
      </div>
    </aside>
  );
}
