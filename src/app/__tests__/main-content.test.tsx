import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock providers
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <>{children}</>,
  useFileSystem: vi.fn(() => ({
    fileSystem: {},
    selectedFile: null,
    setSelectedFile: vi.fn(),
    createFile: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    renameFile: vi.fn(),
    getFileContent: vi.fn(),
    getAllFiles: vi.fn(() => new Map()),
    refreshTrigger: 0,
    handleToolCall: vi.fn(),
    reset: vi.fn(),
  })),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <>{children}</>,
  useChat: vi.fn(() => ({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
    anonymousUsageCount: 0,
  })),
}));

// Mock child components
vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface" />,
}));

// Mock resizable components
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, className }: any) => (
    <div className={className} data-testid="resizable-group">{children}</div>
  ),
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

afterEach(() => {
  cleanup();
});

test("renders Preview tab as selected by default", () => {
  render(<MainContent />);

  const previewTab = screen.getByRole("tab", { name: "Preview" });
  const codeTab = screen.getByRole("tab", { name: "Code" });

  expect(previewTab.getAttribute("aria-selected")).toBe("true");
  expect(codeTab.getAttribute("aria-selected")).toBe("false");
});

test("shows preview content and hides code view by default", () => {
  render(<MainContent />);

  const previewFrame = screen.getByTestId("preview-frame");
  const codeEditor = screen.getByTestId("code-editor");

  // PreviewFrame is visible (parent not hidden)
  expect(previewFrame.closest(".hidden")).toBeNull();
  // Code view is hidden
  expect(codeEditor.closest(".hidden")).not.toBeNull();
});

test("switching to Code tab shows code editor and hides preview", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));

  const previewFrame = screen.getByTestId("preview-frame");
  const codeEditor = screen.getByTestId("code-editor");

  // Code view is now visible
  expect(codeEditor.closest(".hidden")).toBeNull();
  // Preview is now hidden
  expect(previewFrame.closest(".hidden")).not.toBeNull();
});

test("switching back to Preview tab shows preview and hides code", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));
  await user.click(screen.getByRole("tab", { name: "Preview" }));

  const previewFrame = screen.getByTestId("preview-frame");
  const codeEditor = screen.getByTestId("code-editor");

  // Preview is visible again
  expect(previewFrame.closest(".hidden")).toBeNull();
  // Code view is hidden
  expect(codeEditor.closest(".hidden")).not.toBeNull();
});

test("PreviewFrame stays mounted (not destroyed) after toggling to Code", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // PreviewFrame is in the DOM initially
  expect(screen.getByTestId("preview-frame")).toBeTruthy();

  // Switch to Code view
  await user.click(screen.getByRole("tab", { name: "Code" }));

  // PreviewFrame is STILL in the DOM (just hidden) - this is the key fix
  expect(screen.getByTestId("preview-frame")).toBeTruthy();
});

test("Code editor stays mounted (not destroyed) after toggling to Preview", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Switch to Code view so code editor is visible
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeTruthy();

  // Switch back to Preview
  await user.click(screen.getByRole("tab", { name: "Preview" }));

  // Code editor is STILL in the DOM (just hidden)
  expect(screen.getByTestId("code-editor")).toBeTruthy();
});

test("Code tab becomes selected after clicking it", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));

  const codeTab = screen.getByRole("tab", { name: "Code" });
  const previewTab = screen.getByRole("tab", { name: "Preview" });

  expect(codeTab.getAttribute("aria-selected")).toBe("true");
  expect(previewTab.getAttribute("aria-selected")).toBe("false");
});
