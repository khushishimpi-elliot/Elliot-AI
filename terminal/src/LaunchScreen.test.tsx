import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as api from "./api";
import LaunchScreen from "./LaunchScreen";

const SAMPLE: api.LaunchSummary = {
  org_name: "Elliot Systems",
  primary_stack: "Python 3.11 + FastAPI",
  arch_style: "Hexagonal",
  compliance: ["SOC 2", "PCI-DSS"],
  connectors: [
    { name: "GitHub", status: "connected" },
    { name: "Confluence", status: "not_connected" },
  ],
  indexed_chunks: 542_000,
};

afterEach(() => vi.restoreAllMocks());

describe("LaunchScreen", () => {
  it("shows a loading state then renders the summary", async () => {
    vi.spyOn(api, "fetchLaunchSummary").mockResolvedValue(SAMPLE);

    render(<LaunchScreen onLaunch={() => {}} useMock />);

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(await screen.findByText("Elliot Systems")).toBeInTheDocument();
    expect(screen.getByText("Python 3.11 + FastAPI")).toBeInTheDocument();
    expect(screen.getByText("Hexagonal")).toBeInTheDocument();
    expect(screen.getByText(/SOC 2/)).toBeInTheDocument();
    // Locale-tolerant: any separators between the digits 5-4-2-0-0-0 are accepted.
    expect(
      screen.getByText((_content, el) =>
        /^5[,.\s]*4[,.\s]*2[,.\s]*0[,.\s]*0[,.\s]*0$/.test(el?.textContent ?? "")
      ),
    ).toBeInTheDocument();
  });

  it("renders each connector with its status", async () => {
    vi.spyOn(api, "fetchLaunchSummary").mockResolvedValue(SAMPLE);
    render(<LaunchScreen onLaunch={() => {}} useMock />);

    await screen.findByText("Elliot Systems");

    const github = screen.getByText("GitHub").closest("li")!;
    const confluence = screen.getByText("Confluence").closest("li")!;
    expect(github).toHaveClass("connected");
    expect(confluence).toHaveClass("not_connected");
  });

  it("calls onLaunch when the Launch button is clicked", async () => {
    vi.spyOn(api, "fetchLaunchSummary").mockResolvedValue(SAMPLE);
    const onLaunch = vi.fn();
    const user = userEvent.setup();

    render(<LaunchScreen onLaunch={onLaunch} useMock />);
    const btn = await screen.findByRole("button", { name: /launch elliot terminal/i });
    await user.click(btn);

    expect(onLaunch).toHaveBeenCalledTimes(1);
  });

  it("renders an error message when the fetch fails", async () => {
    vi.spyOn(api, "fetchLaunchSummary").mockRejectedValue(new Error("boom"));

    render(<LaunchScreen onLaunch={() => {}} useMock />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/could not load/i);
    });
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it("passes the token to fetchLaunchSummary", async () => {
    const spy = vi
      .spyOn(api, "fetchLaunchSummary")
      .mockResolvedValue(SAMPLE);

    render(<LaunchScreen onLaunch={() => {}} token="jwt-abc" />);

    await screen.findByText("Elliot Systems");
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ token: "jwt-abc" }),
    );
  });
});
