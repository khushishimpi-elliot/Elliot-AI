export default function ConnectorCallbackPage() {
  const params = new URLSearchParams(window.location.search);
  const provider = params.get("provider") ?? "";
  const status   = params.get("status")   ?? "";
  const error    = params.get("error")    ?? "";

  // Tell the opener (Step4Sources popup listener) what happened
  if (window.opener) {
    window.opener.postMessage(
      { type: "connector_callback", provider, status, error },
      "*"
    );
    window.close();
  }

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0D1117", color: "#E2E8F0",
      fontFamily: "'Segoe UI Variable','Segoe UI',system-ui,sans-serif",
      gap: 16,
    }}>
      {status === "success" ? (
        <>
          <div style={{ fontSize: 40 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#00C9A7" }}>
            {provider} connected
          </div>
          <div style={{ fontSize: 13, color: "#8B949E" }}>
            You can close this window.
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 40 }}>✗</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#FF7B72" }}>
            Connection failed
          </div>
          <div style={{ fontSize: 13, color: "#8B949E" }}>
            {error || "Something went wrong. Close this window and try again."}
          </div>
        </>
      )}
    </div>
  );
}
