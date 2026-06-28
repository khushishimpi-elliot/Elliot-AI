import fetch from "node-fetch";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

interface SetupOptions {
  token: string;
}

interface OnboardingConfig {
  jwt_token: string;
  tenant_id: string;
  user_id: string;
  email: string;
  org_name: string;
  domain: string;
  backend_url: string;
  onboarding_url: string;
  stack: string;
  arch_style: string;
  test_framework: string;
  coverage_gate: number;
  branching_model: string;
  review_policy: string;
  ci_cd_platform: string;
  connectors: Array<{ provider: string; status: string }>;
  chunk_count: number;
}

function decodeJWT(token: string): { tenant_id?: string; sub?: string; email?: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const decoded = Buffer.from(parts[1], "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    throw new Error("Failed to decode JWT token");
  }
}

export async function setupCommand(options: SetupOptions): Promise<void> {
  if (!options.token) {
    console.error(
      "\n❌ Error: --token is required\n" +
        "Get your token from Step 6 of onboarding:\n" +
        "https://elliot-ai-1.onrender.com\n"
    );
    process.exit(1);
  }

  console.log("Configuring Elliot-AI...\n");

  try {
    // Decode JWT to get tenant_id
    const payload = decodeJWT(options.token);
    const tenantId = payload.tenant_id || "00000000-0000-0000-0000-000000000001";
    const backendUrl = "https://elliot-ai.onrender.com";

    console.log("Fetching configuration from backend...");

    // Fetch full config from backend
    const response = await fetch(
      `${backendUrl}/onboarding/config/${tenantId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${options.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Backend error: ${response.status} - ${error || response.statusText}`
      );
    }

    const config = (await response.json()) as OnboardingConfig;

    // Save to ~/.elliot/config.json
    const configDir = join(homedir(), ".elliot");
    const configPath = join(configDir, "config.json");

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    const fullConfig = {
      ...config,
      configured_at: new Date().toISOString(),
    };

    writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));

    // Print success
    console.log("\n✅ Elliot-AI configured!\n");
    console.log(`   Organisation: ${config.org_name}`);
    console.log(`   Stack: ${config.stack}`);
    console.log(`   Architecture: ${config.arch_style}`);

    const connectedCount =
      config.connectors?.filter((c) => c.status === "connected").length || 0;
    const totalConnectors = config.connectors?.length || 0;

    console.log(
      `   Connectors: ${connectedCount}/${totalConnectors} connected`
    );
    console.log(
      `   Chunks indexed: ${config.chunk_count?.toLocaleString() || 0}`
    );
    console.log("\n   Ready to use: elliot\n");
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Setup failed: ${errorMsg}\n`);
    console.error("Check your token and try again.\n");
    process.exit(1);
  }
}
