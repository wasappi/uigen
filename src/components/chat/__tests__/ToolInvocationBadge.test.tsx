import { render, screen, cleanup } from "@testing-library/react";
import { describe, test, expect, afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
import { ToolInvocationBadge } from "../ToolInvocationBadge";

describe("ToolInvocationBadge", () => {
  test("shows 'Creating' with filename for str_replace_editor create", () => {
    render(
      <ToolInvocationBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/components/Button.tsx" }}
        state="call"
      />
    );
    expect(screen.getByText(/Creating/)).toBeTruthy();
    expect(screen.getByText("Button.tsx")).toBeTruthy();
  });

  test("shows 'Editing' with filename for str_replace command", () => {
    render(
      <ToolInvocationBadge
        toolName="str_replace_editor"
        args={{ command: "str_replace", path: "/App.tsx" }}
        state="call"
      />
    );
    expect(screen.getByText(/Editing/)).toBeTruthy();
    expect(screen.getByText("App.tsx")).toBeTruthy();
  });

  test("shows 'Editing' with filename for insert command", () => {
    render(
      <ToolInvocationBadge
        toolName="str_replace_editor"
        args={{ command: "insert", path: "/lib/utils.ts" }}
        state="call"
      />
    );
    expect(screen.getByText(/Editing/)).toBeTruthy();
    expect(screen.getByText("utils.ts")).toBeTruthy();
  });

  test("shows 'Reading' for view command", () => {
    render(
      <ToolInvocationBadge
        toolName="str_replace_editor"
        args={{ command: "view", path: "/App.tsx" }}
        state="call"
      />
    );
    expect(screen.getByText(/Reading/)).toBeTruthy();
  });

  test("shows green dot when state is result", () => {
    const { container } = render(
      <ToolInvocationBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/App.tsx" }}
        state="result"
      />
    );
    expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  });

  test("shows spinner when state is call", () => {
    const { container } = render(
      <ToolInvocationBadge
        toolName="str_replace_editor"
        args={{ command: "create", path: "/App.tsx" }}
        state="call"
      />
    );
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  test("shows 'Deleting' for file_manager delete", () => {
    render(
      <ToolInvocationBadge
        toolName="file_manager"
        args={{ command: "delete", path: "/old-file.tsx" }}
        state="call"
      />
    );
    expect(screen.getByText(/Deleting/)).toBeTruthy();
    expect(screen.getByText("old-file.tsx")).toBeTruthy();
  });

  test("shows 'Renaming' for file_manager rename", () => {
    render(
      <ToolInvocationBadge
        toolName="file_manager"
        args={{ command: "rename", path: "/foo.tsx" }}
        state="call"
      />
    );
    expect(screen.getByText(/Renaming/)).toBeTruthy();
  });

  test("falls back to tool name for unknown tools", () => {
    render(
      <ToolInvocationBadge
        toolName="some_unknown_tool"
        args={{}}
        state="call"
      />
    );
    expect(screen.getByText("some_unknown_tool")).toBeTruthy();
  });

  test("handles missing path gracefully", () => {
    render(
      <ToolInvocationBadge
        toolName="str_replace_editor"
        args={{ command: "create" }}
        state="call"
      />
    );
    expect(screen.getByText(/Creating/)).toBeTruthy();
  });
});
