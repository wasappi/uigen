// @vitest-environment node
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function signToken(payload: object, expirationTime = "7d"): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expirationTime)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// createSession

test("createSession sets an HTTP-only cookie with a signed JWT", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();

  const [name, _token, options] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
  expect(options.secure).toBe(false); // NODE_ENV is "test", not "production"
  expect(options.expires).toBeInstanceOf(Date);
});

test("createSession token contains userId and email", async () => {
  const { createSession } = await import("@/lib/auth");
  const { jwtVerify } = await import("jose");

  await createSession("user-42", "hello@example.com");

  const token = mockCookieStore.set.mock.calls[0][1];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("hello@example.com");
});

test("createSession sets secure flag in production", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "test@example.com");

  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.secure).toBe(true);
});

// getSession

test("getSession returns null when no cookie is present", async () => {
  mockCookieStore.get.mockReturnValue(undefined);
  const { getSession } = await import("@/lib/auth");

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns parsed payload for a valid token", async () => {
  const token = await signToken({ userId: "user-1", email: "a@b.com", expiresAt: new Date() });
  mockCookieStore.get.mockReturnValue({ value: token });
  const { getSession } = await import("@/lib/auth");

  const session = await getSession();

  expect(session?.userId).toBe("user-1");
  expect(session?.email).toBe("a@b.com");
});

test("getSession returns null for an expired token", async () => {
  const token = await signToken({ userId: "user-1", email: "a@b.com" }, "0s");
  mockCookieStore.get.mockReturnValue({ value: token });
  const { getSession } = await import("@/lib/auth");

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null for a tampered token", async () => {
  mockCookieStore.get.mockReturnValue({ value: "not.a.valid.jwt" });
  const { getSession } = await import("@/lib/auth");

  const session = await getSession();

  expect(session).toBeNull();
});

// deleteSession

test("deleteSession deletes the auth-token cookie", async () => {
  const { deleteSession } = await import("@/lib/auth");

  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
});

// verifySession

test("verifySession returns null when request has no cookie", async () => {
  const { verifySession } = await import("@/lib/auth");
  const request = new NextRequest("http://localhost/");

  const session = await verifySession(request);

  expect(session).toBeNull();
});

test("verifySession returns payload for a valid token in the request", async () => {
  const token = await signToken({ userId: "user-99", email: "x@y.com", expiresAt: new Date() });
  const { verifySession } = await import("@/lib/auth");
  const request = new NextRequest("http://localhost/", {
    headers: { cookie: `auth-token=${token}` },
  });

  const session = await verifySession(request);

  expect(session?.userId).toBe("user-99");
  expect(session?.email).toBe("x@y.com");
});

test("verifySession returns null for an expired token in the request", async () => {
  const token = await signToken({ userId: "user-1", email: "a@b.com" }, "0s");
  const { verifySession } = await import("@/lib/auth");
  const request = new NextRequest("http://localhost/", {
    headers: { cookie: `auth-token=${token}` },
  });

  const session = await verifySession(request);

  expect(session).toBeNull();
});

test("verifySession returns null for a tampered token in the request", async () => {
  const { verifySession } = await import("@/lib/auth");
  const request = new NextRequest("http://localhost/", {
    headers: { cookie: "auth-token=garbage.token.here" },
  });

  const session = await verifySession(request);

  expect(session).toBeNull();
});
