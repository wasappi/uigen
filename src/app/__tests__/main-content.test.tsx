import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "@/app/main-content";

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useFileSystem: vi.fn(),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useChat: vi.fn(),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface" />,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree" />,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame" />,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ResizablePanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ResizableHandle: () => <div />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test("defaults to preview view", () => {
  render(<MainContent />);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.queryByTestId("file-tree")).toBeNull();
});

test("Preview tab is selected by default", () => {
  render(<MainContent />);

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  const codeTab = screen.getByRole("tab", { name: "Code" });

  expect(previewTab.getAttribute("data-state")).toBe("active");
  expect(codeTab.getAttribute("data-state")).toBe("inactive");
});

test("clicking Code tab switches to code view", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));

  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.getByTestId("file-tree")).toBeDefined();
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("Code tab becomes active after clicking it", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  const codeTab = screen.getByRole("tab", { name: "Code" });

  expect(codeTab.getAttribute("data-state")).toBe("active");
  expect(previewTab.getAttribute("data-state")).toBe("inactive");
});

test("clicking Preview tab switches back to preview view", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));
  await user.click(screen.getByRole("tab", { name: "Preview" }));

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.queryByTestId("file-tree")).toBeNull();
});

test("can toggle between views multiple times", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Preview → Code
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Code → Preview
  await user.click(screen.getByRole("tab", { name: "Preview" }));
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  // Preview → Code again
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeDefined();
});
