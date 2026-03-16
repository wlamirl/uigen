# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # Install deps + Prisma client generation + migrations
npm run dev          # Start dev server with Turbopack on port 3000
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run Vitest tests
npm run db:reset     # Reset SQLite database (destructive)
```

Run a single test file:
```bash
npx vitest run src/lib/__tests__/<filename>.test.ts
```

The dev server requires `NODE_OPTIONS='--require ./node-compat.cjs'` (already included in the npm script) for Node.js compatibility polyfills.

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language; Claude generates and modifies files in a virtual file system that gets compiled and rendered in an iframe.

### Core Data Flow

1. User sends a prompt → `ChatProvider` → `POST /api/chat` (streaming)
2. `/api/chat/route.ts` calls Claude with tool access to the virtual file system
3. Claude uses `str_replace_editor` and `file_manager` tools to create/modify files
4. `FileSystemProvider` handles tool call events and updates in-memory state
5. `PreviewFrame` compiles JSX via Babel Standalone and renders in an iframe
6. On stream finish: project state (messages + file system) saved to Prisma/SQLite

### Key Abstractions

**`VirtualFileSystem` (`src/lib/file-system.ts`):** In-memory Map-based file tree. Serializes to/from JSON for DB persistence. Used both client-side (state) and server-side (Claude context).

**`FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`):** React context managing virtual FS state. Intercepts Claude tool calls and applies them to the VFS. Exposes file operations to child components.

**`ChatProvider` (`src/lib/contexts/chat-context.tsx`):** Manages chat message state, streams from `/api/chat`, coordinates with FileSystemProvider via callbacks.

**Tools (`src/lib/tools/`):** `str-replace.ts` (string replace editor) and `file-manager.ts` (create/delete). These define the Claude tool schemas that control file editing.

**JSX Transformer (`src/lib/transform/jsx-transformer.ts`):** Compiles virtual FS files to an HTML blob for iframe preview using Babel Standalone.

### Auth Flow

- JWT in HTTP-only cookies (7-day expiry) via `jose` library
- `src/actions/index.ts`: server actions for signUp/signIn/signOut
- `src/middleware.ts`: protects routes requiring authentication
- Bcrypt password hashing

### Anonymous vs. Authenticated Users

- Anonymous users can generate components; work tracked in localStorage (`anon-work-tracker.ts`)
- Authenticated users get full project persistence with load/save to DB

### Database Schema

Two models in `prisma/schema.prisma`:
- `User`: id, email, password (hashed), timestamps
- `Project`: id, name, userId (nullable for anon), `messages` (JSON), `data` (JSON serialized VFS), timestamps

### Path Aliases

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

### Environment Variables

Required in `.env`:
- `ANTHROPIC_API_KEY` – Claude API key
- `JWT_SECRET` – JWT signing secret

### UI Components

Radix UI primitives wrapped as shadcn/ui components live in `src/components/ui/`. Tailwind CSS v4 with CSS variables. The main layout is a resizable split-pane (`react-resizable-panels`): chat left, editor + preview right.
