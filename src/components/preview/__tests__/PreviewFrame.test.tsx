import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import * as jsxTransformer from "@/lib/transform/jsx-transformer";

vi.mock("@/lib/contexts/file-system-context");

vi.mock("@/lib/transform/jsx-transformer", () => ({
  createImportMap: vi.fn(() => ({ importMap: {}, styles: "", errors: [] })),
  createPreviewHTML: vi.fn(() => "<html><body>preview</body></html>"),
}));

vi.mock("lucide-react", () => ({
  AlertCircle: () => <div>AlertCircle</div>,
}));

const mockUseFileSystem = useFileSystem as ReturnType<typeof vi.fn>;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(() => new Map()),
    refreshTrigger: 0,
  });
});

test("shows welcome screen on first load with no files", () => {
  render(<PreviewFrame />);

  expect(screen.getByText("Welcome to UI Generator")).toBeDefined();
});

test("shows iframe when files are present", () => {
  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(
      () =>
        new Map([["/App.jsx", "export default function App() { return <div /> }"]])
    ),
    refreshTrigger: 0,
  });

  render(<PreviewFrame />);

  const iframe = document.querySelector("iframe");
  expect(iframe).toBeTruthy();
});

test("shows error when no JSX entry point found", () => {
  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(() => new Map([["/styles.css", "body { color: red; }"]])),
    refreshTrigger: 0,
  });

  render(<PreviewFrame />);

  expect(
    screen.getByText(
      "No React component found. Create an App.jsx or index.jsx file to get started."
    )
  ).toBeDefined();
});

test("does not show welcome screen after first load when files are removed", () => {
  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(
      () =>
        new Map([["/App.jsx", "export default function App() { return <div /> }"]])
    ),
    refreshTrigger: 0,
  });

  const { rerender } = render(<PreviewFrame />);

  // Now remove files — after having seen files, it should show "No files to preview" not the welcome screen
  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(() => new Map()),
    refreshTrigger: 1,
  });

  rerender(<PreviewFrame />);

  expect(screen.queryByText("Welcome to UI Generator")).toBeNull();
  expect(screen.getByText("No files to preview")).toBeDefined();
});

test("createPreviewHTML is called only once on initial render with files", () => {
  const createPreviewHTMLMock = vi.spyOn(jsxTransformer, "createPreviewHTML");

  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(
      () =>
        new Map([["/App.jsx", "export default function App() { return <div /> }"]])
    ),
    refreshTrigger: 0,
  });

  render(<PreviewFrame />);

  expect(createPreviewHTMLMock).toHaveBeenCalledTimes(1);
});

test("preview updates when refreshTrigger changes", () => {
  const createPreviewHTMLMock = vi.spyOn(jsxTransformer, "createPreviewHTML");

  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(
      () =>
        new Map([["/App.jsx", "export default function App() { return <div /> }"]])
    ),
    refreshTrigger: 0,
  });

  const { rerender } = render(<PreviewFrame />);
  const callsAfterFirstRender = createPreviewHTMLMock.mock.calls.length;

  mockUseFileSystem.mockReturnValue({
    getAllFiles: vi.fn(
      () =>
        new Map([["/App.jsx", "export default function App() { return <span /> }"]])
    ),
    refreshTrigger: 1,
  });

  rerender(<PreviewFrame />);

  expect(createPreviewHTMLMock.mock.calls.length).toBeGreaterThan(
    callsAfterFirstRender
  );
});
