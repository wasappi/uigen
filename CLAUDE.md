# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # One-time setup: install deps + Prisma generate + DB migrations
npm run dev          # Start dev server with Turbopack on http://localhost:3000
npm run dev:daemon   # Run dev server in background (logs to logs.txt)
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run all Vitest tests
npx vitest run src/path/to/file.test.tsx  # Run a single test file
npm run db:reset     # Reset the SQLite database
```

Use comments sparingly — only on complex or non-obvious logic.

Environment: set `ANTHROPIC_API_KEY` in `.env`. Without it, the app falls back to a `MockLanguageModel` that generates static example components.

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe components in chat; Claude generates them in a virtual file system that renders live in a sandboxed iframe.

### Request Flow

1. User sends a chat message → `ChatProvider` (`src/lib/contexts/chat-context.tsx`) forwards it to `/api/chat`
2. `/api/chat/route.ts` streams a response from Claude (Anthropic SDK) with two AI tools:
   - `str_replace_editor` — creates/edits files (view, create, str_replace, insert, undo_edit)
   - `file_manager` — renames/deletes files
3. Tool calls are handled client-side by `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`), which updates the in-memory `VirtualFileSystem`
4. File changes trigger a refresh signal → `PreviewFrame` re-transforms and re-renders
5. On completion, the project (messages + file system) is persisted to SQLite via Prisma

### Virtual File System (`src/lib/file-system.ts`)

All files live in memory — no disk writes. `VirtualFileSystem` supports `createFile`, `updateFile`, `deleteFile`, `rename`, `listDirectory`, `serialize`, and `deserialize`. Serialized JSON is stored in the `Project.data` column.

### Live Preview (`src/lib/transform/jsx-transformer.ts`)

Uses `@babel/standalone` to transform JSX client-side, generates blob URLs per file, and builds an import map that falls back to `esm.sh` for npm packages. The entry point is auto-detected (e.g., `/App.jsx`, `/App.tsx`). Rendered in a sandboxed iframe in `PreviewFrame`.

### AI Model (`src/lib/provider.ts`)

Uses `claude-haiku-4-5` via `@ai-sdk/anthropic`. The system prompt (in `src/lib/prompts/`) instructs Claude to create Tailwind-styled React components under `/` with `/App.jsx` as the entry point, using `@/` import aliases.

### Authentication (`src/lib/auth.ts`)

JWT-based sessions stored in HTTP-only cookies (7-day expiration). Server actions in `src/actions/index.ts` handle sign-up (bcrypt password hash), sign-in, sign-out, and user lookup. Projects can be anonymous (nullable `userId`).

### Database

The schema is the source of truth for all data structures — refer to `prisma/schema.prisma` whenever you need to understand what is stored and how it relates. (`prisma/schema.prisma`)

SQLite with two models: `User` (email + hashed password) and `Project` (name, nullable userId, `messages` as JSON string, `data` as JSON string for the virtual FS). Prisma client is generated into `src/generated/prisma`.

### Key Contexts

- `ChatProvider` — wraps Vercel AI SDK's `useChat`, exposes messages and submission handler, tracks anonymous usage
- `FileSystemProvider` — owns the `VirtualFileSystem` instance, processes AI tool calls, emits refresh signals

### Testing

Tests live in `__tests__/` subdirectories alongside their source. Coverage includes chat components, file tree, virtual FS logic, chat context, and JSX transformer.
