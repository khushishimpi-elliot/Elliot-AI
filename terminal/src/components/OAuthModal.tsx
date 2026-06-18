import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface OAuthModalProps {
  isOpen: boolean;
  serviceName: string;
  serviceIcon: string;
  category: string;
  scopes: string[];
  onAuthorize: () => void;
  onCancel: () => void;
}

export default function OAuthModal({
  isOpen,
  serviceName,
  serviceIcon,
  category,
  scopes,
  onAuthorize,
  onCancel,
}: OAuthModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          width: "420px",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          animation: "modal-appear 0.2s ease-out",
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          // Loading State
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent-blue)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <div
              style={{
                fontSize: "13px",
                fontWeight: "400",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-sans)",
              }}
            >
              Establishing secure connection to {serviceName} …
            </div>
          </div>
        ) : (
          // Ready State
          <>
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    background: "#2a2d3a",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "white",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {serviceIcon}
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>↔</span>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    background: "#2a2d3a",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "white",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  [·]
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "500",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  OAUTH 2.0
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "400",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-sans)",
                    marginTop: "2px",
                  }}
                >
                  secure handshake
                </div>
              </div>
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "var(--text-primary)",
                marginBottom: "6px",
                fontFamily: "var(--font-mono)",
              }}
            >
              Authorize Elliot-AI for {serviceName}
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: "13px",
                fontWeight: "400",
                color: "var(--text-secondary)",
                marginBottom: "16px",
                fontFamily: "var(--font-sans)",
              }}
            >
              Elliot-AI is requesting the following scopes on {category}:
            </p>

            {/* Scopes */}
            <div style={{ marginBottom: "20px" }}>
              {scopes.map((scope) => (
                <div
                  key={scope}
                  style={{
                    fontSize: "13px",
                    fontWeight: "400",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    padding: "4px 0",
                  }}
                >
                  <span style={{ color: "var(--accent-blue)" }}>›</span> {scope}
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <button
                onClick={onAuthorize}
                style={{
                  flex: 1,
                  height: "40px",
                  background: "var(--accent-blue)",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                }}
              >
                Authorize
              </button>
              <button
                onClick={onCancel}
                style={{
                  flex: 1,
                  height: "40px",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-blue)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }}
              >
                Cancel
              </button>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                fontWeight: "400",
                color: "var(--text-muted)",
                borderTop: "1px solid var(--border)",
                paddingTop: "14px",
                fontFamily: "var(--font-sans)",
              }}
            >
              <span style={{ color: "var(--accent-green)", fontSize: "6px" }}>●</span>
              Read-only by default · revocable anytime · no source code leaves your tenancy
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
