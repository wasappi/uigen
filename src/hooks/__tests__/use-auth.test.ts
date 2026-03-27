import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAuth", () => {
  describe("initial state", () => {
    test("returns isLoading as false initially", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("returns signIn and signUp functions", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    test("sets isLoading to true while signing in and false after", async () => {
      let resolveSignIn!: (value: any) => void;
      vi.mocked(signInAction).mockReturnValue(
        new Promise((res) => { resolveSignIn = res; })
      );

      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);

      let signInPromise!: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("user@example.com", "password");
      });

      // setIsLoading(true) is synchronous; after the sync act flush it should be true
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn({ success: false });
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("calls signInAction with the provided credentials", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "mypassword");
      });

      expect(signInAction).toHaveBeenCalledWith("user@example.com", "mypassword");
    });

    test("returns the result from signInAction on failure", async () => {
      const failResult = { success: false, error: "Invalid credentials" };
      vi.mocked(signInAction).mockResolvedValue(failResult);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "wrongpass");
      });

      expect(returnValue).toEqual(failResult);
    });

    test("returns the result from signInAction on success", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({ id: "proj-1" } as any);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "password");
      });

      expect(returnValue).toEqual({ success: true });
    });

    test("does not call handlePostSignIn on failure", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: false, error: "Invalid credentials" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "wrongpass");
      });

      expect(getAnonWorkData).not.toHaveBeenCalled();
      expect(getProjects).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
    });

    test("resets isLoading to false even if signInAction throws", async () => {
      vi.mocked(signInAction).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    test("sets isLoading to true while signing up and false after", async () => {
      let resolveSignUp!: (value: any) => void;
      vi.mocked(signUpAction).mockReturnValue(
        new Promise((res) => { resolveSignUp = res; })
      );

      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);

      let signUpPromise!: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("user@example.com", "password");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp({ success: false });
        await signUpPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("calls signUpAction with the provided credentials", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("newuser@example.com", "securepass");
      });

      expect(signUpAction).toHaveBeenCalledWith("newuser@example.com", "securepass");
    });

    test("returns the result from signUpAction on failure", async () => {
      const failResult = { success: false, error: "Email already registered" };
      vi.mocked(signUpAction).mockResolvedValue(failResult);

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("user@example.com", "password");
      });

      expect(returnValue).toEqual(failResult);
    });

    test("does not call handlePostSignIn on failure", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: false, error: "Email already registered" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("user@example.com", "password");
      });

      expect(getAnonWorkData).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
    });

    test("resets isLoading to false even if signUpAction throws", async () => {
      vi.mocked(signUpAction).mockRejectedValue(new Error("Server error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("user@example.com", "password").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handlePostSignIn — anonymous work exists", () => {
    test("creates a project from anon work and redirects to it", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "Hello" }],
        fileSystemData: { "/App.jsx": "..." },
      };
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(anonWork);
      vi.mocked(createProject).mockResolvedValue({ id: "anon-proj-42" } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
      expect(clearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-proj-42");
    });

    test("does not fetch existing projects when anon work exists", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue({
        messages: [{ role: "user", content: "Hi" }],
        fileSystemData: {},
      });
      vi.mocked(createProject).mockResolvedValue({ id: "proj-99" } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(getProjects).not.toHaveBeenCalled();
    });
  });

  describe("handlePostSignIn — no anonymous work, existing projects", () => {
    test("redirects to the most recent project when anon work has no messages", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue({ messages: [], fileSystemData: {} });
      vi.mocked(getProjects).mockResolvedValue([
        { id: "recent-proj", name: "My Project", createdAt: new Date(), updatedAt: new Date() },
        { id: "older-proj", name: "Old Project", createdAt: new Date(), updatedAt: new Date() },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/recent-proj");
      expect(createProject).not.toHaveBeenCalled();
    });

    test("redirects to the most recent project when no anon work data at all", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([
        { id: "proj-abc", name: "Existing", createdAt: new Date(), updatedAt: new Date() },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-abc");
      expect(createProject).not.toHaveBeenCalled();
    });

    test("works for signUp as well", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([
        { id: "proj-xyz", name: "Existing", createdAt: new Date(), updatedAt: new Date() },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("user@example.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-xyz");
    });
  });

  describe("handlePostSignIn — no anonymous work, no existing projects", () => {
    test("creates a new project and redirects to it", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({ id: "brand-new-proj" } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(createProject).toHaveBeenCalledWith({
        name: expect.stringContaining("New Design #"),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/brand-new-proj");
    });

    test("creates a new project for signUp when no existing projects", async () => {
      vi.mocked(signUpAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({ id: "fresh-proj" } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password");
      });

      expect(mockPush).toHaveBeenCalledWith("/fresh-proj");
    });

    test("clears anon work before redirecting when anon work is migrated", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "test" }],
        fileSystemData: { "/App.jsx": "content" },
      };
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(anonWork);
      vi.mocked(createProject).mockResolvedValue({ id: "proj-migrated" } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(clearAnonWork).toHaveBeenCalledTimes(1);
    });

    test("does not call clearAnonWork when there is no anon work", async () => {
      vi.mocked(signInAction).mockResolvedValue({ success: true });
      vi.mocked(getAnonWorkData).mockReturnValue(null);
      vi.mocked(getProjects).mockResolvedValue([]);
      vi.mocked(createProject).mockResolvedValue({ id: "proj-1" } as any);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password");
      });

      expect(clearAnonWork).not.toHaveBeenCalled();
    });
  });
});
