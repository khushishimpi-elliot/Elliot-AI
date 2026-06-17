import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchLaunchSummary } from "./api";

afterEach(() => vi.restoreAllMocks());

describe("fetchLaunchSummary", () => {
  it("returns the placeholder payload when mock=true and never hits the network", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await fetchLaunchSummary({ mock: true });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.org_name).toBeTruthy();
    expect(result.connectors.length).toBeGreaterThan(0);
  });

  it("calls /launch with the bearer token when one is provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ org_name: "X", primary_stack: "py", arch_style: "h", compliance: [], connectors: [], indexed_chunks: 0 }), { status: 200 }),
    );

    await fetchLaunchSummary({ token: "jwt-abc", baseUrl: "https://api.elliot.test" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.elliot.test/launch",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer jwt-abc" }),
      }),
    );
  });

  it("throws when the server responds with a non-2xx status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 401 }));

    await expect(fetchLaunchSummary({ token: "x" })).rejects.toThrow(/401/);
  });
});
