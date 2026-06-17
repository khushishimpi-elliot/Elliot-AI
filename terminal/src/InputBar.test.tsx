import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import InputBar from "./InputBar";

function setup(history: string[] = []) {
  const onSubmit = vi.fn();
  render(<InputBar history={history} onSubmit={onSubmit} />);
  const input = screen.getByLabelText("terminal input") as HTMLInputElement;
  return { input, onSubmit };
}

describe("InputBar", () => {
  it("renders an input with the prompt", () => {
    setup();
    expect(screen.getByLabelText("terminal input")).toBeInTheDocument();
  });

  it("submits typed text on Enter and clears the input", async () => {
    const user = userEvent.setup();
    const { input, onSubmit } = setup();

    await user.type(input, "how does auth work?");
    await user.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("how does auth work?");
    expect(input.value).toBe("");
  });

  it("does not submit empty or whitespace-only input", async () => {
    const user = userEvent.setup();
    const { input, onSubmit } = setup();

    await user.type(input, "   ");
    await user.keyboard("{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toBeInTheDocument();
  });

  it("Up arrow recalls the most recent history entry", () => {
    const { input } = setup(["older query", "newer query"]);

    fireEvent.keyDown(input, { key: "ArrowUp" });

    expect(input.value).toBe("newer query");
  });

  it("Up arrow walks back through older entries", () => {
    const { input } = setup(["oldest", "middle", "newest"]);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("newest");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("middle");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("oldest");
    // bottom of history — further Ups clamp
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("oldest");
  });

  it("Down arrow returns toward the newest, then restores draft", async () => {
    const user = userEvent.setup();
    const { input } = setup(["older", "newer"]);

    // Type a partial draft, then navigate history, then come back.
    await user.type(input, "draft-in-progress");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("newer");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("older");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.value).toBe("newer");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.value).toBe("draft-in-progress");
  });

  it("Down arrow with no history navigation does nothing", () => {
    const { input } = setup(["older"]);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.value).toBe("");
  });

  it("Up arrow with empty history does nothing", () => {
    const { input } = setup([]);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("");
  });

  it("Escape cancels history navigation and restores draft", async () => {
    const user = userEvent.setup();
    const { input } = setup(["older"]);

    await user.type(input, "my draft");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("older");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input.value).toBe("my draft");
  });

  it("editing a recalled entry exits history navigation", async () => {
    const user = userEvent.setup();
    const { input } = setup(["recalled query"]);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("recalled query");

    await user.type(input, " edited");
    // Now Down should NOT restore an empty draft; it should be a no-op.
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.value).toBe("recalled query edited");
  });

  it("submitting resets history offset so next Up shows newest again", async () => {
    const user = userEvent.setup();
    const { input, onSubmit } = setup(["a", "b"]);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("a");

    // Edit + submit
    await user.clear(input);
    await user.type(input, "new entry");
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("new entry");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("b"); // newest is "b" since parent updates history
  });
});
