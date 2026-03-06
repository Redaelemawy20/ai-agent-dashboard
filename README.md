**Author:** Reda Ahmed Kotb

# [AI SDK Computer Use Demo](https://ai-agent-dashboard-coral.vercel.app)



**[Submission Details](#submission-details)** · **[Data Flow](#data-flow)** · **[Feature Summary](#feature-summary)** · **[Design Decisions](#design-decisions)** · **[How It Works](#how-it-works)** · **[Deploy Your Own](#deploy-your-own)** · **[Running Locally](#running-locally)** · **[Environment Variables](#environment-variables)**

  


## Submission Details

### Features and What Was Done

#### 1. Two-panel layout

The interface was reorganized from the original (VNC left, chat right) into a left/right split. The **left panel** holds the session sidebar, chat with streaming messages, inline tool call cards, and a collapsible debug panel at the bottom. The **right panel** shows the VNC viewer and expanded tool details when a tool call is selected. Panels use `ResizablePanelGroup` for horizontal resizing, with left panel default 35%, right 65%, min sizes 25% / 40%, and support desktop and tablet viewports.

#### 2. Tool call visualization

Each tool call is rendered as an interactive card in the chat. Cards show **type** (computer action or bash), **status** (pending/complete/error with colored indicators), and **duration**. Screenshots appear as thumbnails in the card; bash shows the command and output; computer actions show the action type and target. Cards are clickable—selecting one opens its full details (args, result, full-size image) in the right panel.

#### 3. Event pipeline and state management

A structured event system captures all agent activity. The event store uses discriminated unions (`ComputerEvent`, `BashEvent`, `UnknownToolEvent`) with `toolCallId`, `timestamp`, `toolName`, `args`, `status`, and `duration`. Derived state includes a chronological event list, per-action counts (screenshot, click, type, bash), and agent status (idle/thinking/executing). A collapsible debug panel shows event counts and a timeline; clicking an event selects it for the expanded detail view.

#### 4. React performance

The VNC component is wrapped in `memo()` so it does not re-render when chat messages update. Chat and VNC live in separate panels with stable props (`streamUrl`, `isInitializing`, `onRefreshDesktop`). SessionSidebar, DebugPanel, ExpandedToolDetail, and tool parts are memoized where it helps.

#### 5. TypeScript standards

The codebase avoids `any`. Event types use discriminated unions. Props, state, and API responses are properly typed, with type guards such as `isComputerEvent` and `getActionKey`.

#### 6. Streaming and API integration

Existing AI SDK streaming is preserved. Messages and tool invocations are handled with proper typing. `syncToolEvents` derives status from `state` and `result` (pending/complete/error). The tool lifecycle is handled: initiated → executing → completed/failed. API errors surface via toast notifications.

#### 7. Chat history and multiple sessions

Users can create, switch, and delete chat sessions. The session list appears in the sidebar. Sessions and active session ID persist in localStorage via Zustand. Messages are stored per session ID (including `_timing` for tool call durations). Switching sessions loads that session's messages; the tool store resets automatically when `sessionId` changes in `syncFromMessages`. **Reconnect after sandbox timeout** — Polling checks sandbox status; when the ephemeral sandbox expires, the app auto-refreshes the desktop and shows a toast.

#### 8. Mobile support (bonus)

The layout is responsive: at the `xl` breakpoint it switches to a mobile layout with a header toggle to switch between Chat and VNC views. Expanded tool details appear in a modal instead of the right panel. The session sidebar becomes an overlay with a close action.

### Frontend Flow Diagrams

#### Page layout (desktop xl+)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ResizablePanelGroup (horizontal)                                    │
├──────────────────────────────┬──────────────────────────────────────┤
│  LEFT PANEL (35% default)    │  RIGHT PANEL (65% default)            │
│ ┌────────┬─────────────────┐ │ ┌──────────────────────────────────┐ │
│ │Session │ Header          │ │ │ VncPanel (VNC iframe)             │ │
│ │Sidebar │─────────────────│ │ │                                  │ │
│ │        │ Chat            │ │ └──────────────────────────────────┘ │
│ │        │ (messages +     │ │ ┌──────────────────────────────────┐ │
│ │        │  tool parts)    │ │ │ ExpandedToolDetail (when selected)│ │
│ │        │─────────────────│ │ └──────────────────────────────────┘ │
│ │        │ DebugPanel      │ │                                      │
│ └────────┴─────────────────┘ │                                      │
└──────────────────────────────┴──────────────────────────────────────┘
```

### Feature Summary


| #     | Requirement                                                      | Status | Notes                                      |
| ----- | ---------------------------------------------------------------- | ------ | ------------------------------------------ |
| **1** | **Two-panel layout**                                             |        |                                            |
| 1.1   | Left: Chat with streaming messages                               | ✓      |                                            |
| 1.2   | Left: Inline tool call visualizations                            | ✓      |                                            |
| 1.3   | Left: Collapsible debug/event panel at bottom                    | ✓      |                                            |
| 1.4   | Right: VNC viewer (existing, must remain working)                | ✓      |                                            |
| 1.5   | Right: Expanded tool call details when clicked                   | ✓      |                                            |
| 1.6   | Panels horizontally resizable                                    | ✓      | ResizablePanelGroup                        |
| 1.7   | Desktop and tablet viewports                                     | ✓      |                                            |
| 1.8   | Visual hierarchy and usability                                   | ✓      |                                            |
| **2** | **Tool call visualization**                                      |        |                                            |
| 2.1   | Display: type, status, duration per tool call                    | ✓      |                                            |
| 2.2   | Screenshots: thumbnail in chat, click → full-size in right panel | ✓      |                                            |
| 2.3   | Bash: show command and output                                    | ✓      |                                            |
| 2.4   | Browser actions: action type and target element                  | ✓      |                                            |
| 2.5   | Visual states: pending, complete, error                          | ✓      |                                            |
| 2.6   | Clickable → expanded details in right panel                      | ✓      |                                            |
| **3** | **Event pipeline & state management**                            |        |                                            |
| 3.1   | Event store: capture every tool call and VM action               | ✓      |                                            |
| 3.2   | Each event: id, timestamp, type, payload, status, duration       | ✓      |                                            |
| 3.3   | TypeScript discriminated unions for event types                  | ✓      | ComputerEvent, BashEvent, UnknownToolEvent |
| 3.4   | Derived: ordered list of events (chronological)                  | ✓      |                                            |
| 3.5   | Derived: counts per action type                                  | ✓      |                                            |
| 3.6   | Derived: agent status (idle, thinking, executing)                | ✓      |                                            |
| 3.7   | Debug panel: collapsible, shows event store                      | ✓      |                                            |
| 3.8   | Debug panel: event counts and timeline                           | ✓      |                                            |
| **4** | **React performance**                                            |        |                                            |
| 4.1   | VNC must NOT re-render when chat messages update                 | ✓      | memo(VncPanelInner)                        |
| 4.2   | Memoization strategies                                           | ✓      |                                            |
| 4.3   | Clean component boundaries                                       | ✓      |                                            |
| **5** | **TypeScript standards**                                         |        |                                            |
| 5.1   | No `any` types                                                   | ✓      |                                            |
| 5.2   | Discriminated unions for event types                             | ✓      |                                            |
| 5.3   | Proper typing for props, state, API responses                    | ✓      |                                            |
| **6** | **Streaming & API integration**                                  |        |                                            |
| 6.1   | Maintain existing streaming functionality                        | ✓      |                                            |
| 6.2   | Handle AI SDK message and tool invocation types                  | ✓      |                                            |
| 6.3   | Graceful error handling for API failures                         | ✓      | Toast on error                             |
| 6.4   | Tool call lifecycle: initiated → executing → completed/failed    | ✓      |                                            |
| **7** | **Chat history & multiple sessions**                             |        |                                            |
| 7.1   | Create, switch between, and delete chat sessions                 | ✓      |                                            |
| 7.2   | Persist chat history to localStorage                             | ✓      | Via session-helpers                        |
| 7.3   | Display session list in UI (sidebar or similar)                  | ✓      | SessionSidebar                             |
| 7.4   | Each session maintains own message and event history             | ✓      |                                            |
| 7.5   | Reconnect after sandbox timeout (auto-refresh desktop)           | ✓      | Polling + `/api/sandbox-status` + toast    |
| **8** | **Mobile support (bonus)**                                       |        |                                            |
| 8.1   | Responsive layout for phone viewports                            | ✓      |                                            |
| 8.2   | VNC on small screens (modal/tab/toggle)                          | ✓      | Chat/VNC header toggle                     |
| 8.3   | Touch-friendly interactions                                      | ✓      |                                            |


---

## Data Flow

This section documents how data flows through the app from startup through user interactions.

### 1. App Startup & Hydration

1. **Session store hydration** — Zustand `persist` loads `computer-use-sessions` from `localStorage`. It restores `sessions` and `activeSessionId`. `onRehydrateStorage` runs: if `sessions` is empty it creates a new session; if `activeSessionId` is orphaned it fixes it. `setHasHydrated(true)` is called.
2. **Page render** — `ChatPage` renders. It reads `activeSessionId` from the session store and renders `SessionSidebar`, `Chat` (only if `activeSessionId` exists), `DebugPanel`, `VncPanel`, `ExpandedToolDetail`.
3. **Sandbox lifecycle** — `useSandboxLifecycle` creates a single E2B desktop when `activeSessionId` is set and no sandbox exists. The same desktop is shared across sessions; switching or creating sessions does *not* create a new sandbox. Returns `streamUrl`, `sandboxId`, `isInitializing`. Polling checks sandbox status periodically; when the sandbox expires (ephemeral timeout), it auto-refreshes. `VncPanel` uses `streamUrl` to display the remote desktop.

### 2. Session Flow

**Creating a session** — User clicks "New chat" → `addSession(session)` → session store updates. `Chat` remounts with `key={activeSessionId}`. No new desktop is created; the existing shared desktop continues in use.

**Switching sessions** — User selects another session → `setActiveSession(id)` → `activeSessionId` changes → `Chat` remounts. `useChatToolSync` receives new `sessionId` → `syncFromMessages(messages, sessionId)` runs. Tool store detects `sessionId !== prevSessionId` → clears timings, updates state, re-syncs tool events. The VNC desktop is *not* recreated on switch.

**Deleting a session** — `deleteSession(id)` → `clearMessages(id)` removes messages from localStorage → session removed from list. If it was active, another session becomes active.

### 3. Chat Flow (Single Session)

**Chat mount & load** — `loadMessages(sessionId)` reads `chat-messages-{sessionId}` from localStorage. `useChat` is initialized with `initialMessages`, `body: { sandboxId }`. `useChatToolSync` runs `syncFromMessages(messages, sessionId)` — `syncToolEvents` processes messages, seeds timings from `_timing` (if present after refresh) or records `firstSeen`/`completedAt`. Tool store updates `toolCalls`, `actionCounts`. Agent status derives from chat `status`. `useChatSessionSync` saves messages with `pruneMessagesForStorage(messages, getTimingsSnapshot())` — embeds `_timing` and redacts large images. Also updates `setActiveSessionHasMessages`, extracts title from first user message.

### 4. User Sends a Message

User submits → `handleSubmit` → `/api/chat` with message history and `sandboxId`. Chat status: `submitted` → `streaming`. `useChatToolSync` sets agent status. API streams assistant messages + tool calls. `useChat` appends to `messages`. On each update: `syncFromMessages` updates tool store; `useChatSessionSync` saves pruned messages with `_timing` to localStorage. `PreviewMessage` renders messages and tool invocations.

### 5. Tool Call Visualization & Selection

**Display** — `syncToolEvents` produces `ToolEvent[]`. `DebugPanel` shows counts + timeline. `PreviewMessage` → `ToolInvocationCard` for each invocation. Duration shown in inline cards, debug timeline, and expanded detail.

**Selection** — User clicks tool card → `selectToolCall(toolCallId)` → tool store updates `selectedToolCallId`. `ExpandedToolDetail` finds the event and shows full details (inline on desktop, modal on mobile).

**Timing persistence** — Timings recorded during streaming. On save, `pruneMessagesForStorage` embeds `_timing` into each tool invocation. Saved messages include it. On load/refresh, `syncToolEvents` reads `_timing` to restore durations.

### 6. Data Stores Overview


| Store      | Persistence                                  | Contents                                                                      |
| ---------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| Session    | `localStorage` (`computer-use-sessions`)     | `sessions`, `activeSessionId`                                                 |
| Messages   | `localStorage` (`chat-messages-{sessionId}`) | `UIMessage[]` with embedded `_timing`                                         |
| Tool store | In-memory (derived from messages)            | `toolCalls`, `actionCounts`, `selectedToolCallId`, `agentStatus`, timings Map |


### 7. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APP STARTUP                                    │
└─────────────────────────────────────────────────────────────────────────────┘
  localStorage (computer-use-sessions)
       │
       ▼
  Session Store (Zustand persist) ──► sessions, activeSessionId
       │
       ├──────────────────────────────────────────────────────────────────────►
       │                                                                       │
       ▼                                                                       │
  ChatPage                                                                     │
       │                                                                       │
       ├── activeSessionId ──► useSandboxLifecycle ──► getDesktopURL() (once)   │
       │       │                     │                         │               │
       │       │                     │  (shared desktop; no create on switch)   │
       │       │                     ▼                         ▼               │
       │       │              streamUrl, sandboxId ──► VncPanel                 │
       │       │                                                               │
       │       └── activeSessionId ──► Chat (key=sessionId) ◄──────────────────┘
       │                                    │
       │                                    ├── loadMessages(sessionId) ◄── localStorage
       │                                    │         │
       │                                    ▼         ▼
       │                               useChat(initialMessages, body: sandboxId)
       │                                    │
       │                    ┌───────────────┼───────────────┐
       │                    ▼               ▼               ▼
       │              useChatToolSync  useChatSessionSync  PreviewMessage
       │                    │               │                    │
       │                    ▼               ▼                    │
       │              tool-store ◄── getTimingsSnapshot          │
       │                    │               │                    │
       │              syncFromMessages     pruneMessagesForStorage│
       │              (messages,sessionId)  (messages, timings)   │
       │                    │               │                    │
       │                    ▼               ▼                    │
       │              DebugPanel    saveMessages(sessionId) ──► localStorage    │
       │              ExpandedTool       (with _timing)                         │
       │                    ▲                                                   │
       │                    │                                                   │
       │                    └── selectToolCall(id) ◄── user clicks tool card   │
       │                                                                       │
       └── SessionSidebar ◄── addSession, setActiveSession, deleteSession      │
```

---

## Design Decisions

### Shared desktop across sessions

The E2B desktop sandbox is ephemeral (timeout, crashes). Instead of creating a new desktop on every session switch or new session:

- **One desktop is shared** — A single sandbox is created when the app first needs it and is reused across all sessions. Switching sessions or creating a new chat does *not* kill and recreate the desktop.
- **Rationale** — Fewer VM creations, faster session switches, simpler lifecycle. Since desktops are ephemeral, tying one desktop per session would add churn without lasting benefit.
- **Recovery** — When the sandbox expires (timeout or failure), polling detects `status !== "running"` via `/api/sandbox-status`, calls `refreshDesktop()`, and shows a toast. The user continues in the same session with a fresh desktop.

---

## Features

- Streaming text responses powered by the [AI SDK](https://sdk.vercel.ai/docs).
- Anthropic Claude Sonnet 4.5 with [computer use](https://sdk.vercel.ai/docs/guides/computer-use) and bash tool capabilities.
- Remote desktop environment running in a [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox) with Chrome, a window manager, and VNC streaming.
- **Auto-reconnect after sandbox timeout** — When the ephemeral sandbox expires, polling detects it via `/api/sandbox-status`, refreshes the desktop, and notifies the user with a toast.
- [shadcn/ui](https://ui.shadcn.com/) components for a modern, responsive UI powered by [Tailwind CSS](https://tailwindcss.com).
- Built with the latest [Next.js](https://nextjs.org) App Router.

## How It Works

The app spins up a Vercel Sandbox from a pre-built snapshot that includes:

- **Xvnc** — a virtual X11 display server
- **openbox** — a lightweight window manager
- **noVNC + websockify** — streams the desktop to the browser via WebSocket
- **Google Chrome** — auto-launched so the AI agent has a browser ready
- **xdotool + ImageMagick** — for mouse/keyboard control and screenshots

When a user sends a message, Claude uses the `computer` tool (screenshot, click, type, scroll) and the `bash` tool (run shell commands) to interact with the sandbox desktop. The noVNC stream is displayed in a resizable iframe alongside the chat.

### Architecture

```
User ↔ Next.js Chat UI ↔ AI SDK ↔ Claude Sonnet 4.5
                                        ↓
                                  Vercel Sandbox
                              ┌─────────────────────┐
                              │  Xvnc (:99)         │
                              │  openbox             │
                              │  Chrome              │
                              │  websockify → noVNC  │
                              └─────────────────────┘
                                        ↓
                              noVNC iframe in browser
```

## Deploy Your Own

You can deploy your own version to Vercel by clicking the button below:

[Deploy with Vercel](https://vercel.com/new/clone?project-name=AI+SDK+Computer+Use+Demo&repository-name=ai-sdk-computer-use&repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fai-sdk-computer-use&demo-title=AI+SDK+Computer+Use+Demo&demo-url=https%3A%2F%2Fai-agent-dashboard-coral.vercel.app%2F&demo-description=A+chatbot+application+built+with+Next.js+demonstrating+Anthropic+Claude+Sonnet+4.5+computer+use+capabilities+with+Vercel+Sandboxes&env=ANTHROPIC_API_KEY,SANDBOX_SNAPSHOT_ID)

---

## Running Locally

### Prerequisites

- Node.js 18+
- A [Vercel](https://vercel.com) account (for Sandbox access)
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up Vercel credentials

Install the [Vercel CLI](https://vercel.com/docs/cli) and link your project:

```bash
pnpm install -g vercel
vercel link
vercel env pull
```

This creates a `.env.local` file with `VERCEL_OIDC_TOKEN` for Sandbox authentication.

Alternatively, set `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, and `VERCEL_PROJECT_ID` manually in your `.env.local`.

### 3. Create a sandbox snapshot

The snapshot pre-installs the desktop environment (Xvnc, Chrome, openbox, noVNC, xdotool, ImageMagick) so sandboxes boot in seconds.

```bash
npx tsx lib/sandbox/create-snapshot.ts
```

This takes ~10 minutes. When done, it outputs a snapshot ID. Add it to your `.env.local`:

```
SANDBOX_SNAPSHOT_ID=snap_xxxxxxxxxxxxx
```

### 4. Add your Anthropic API key

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to use the computer use agent.

## Environment Variables


| Variable              | Required | Description                                          |
| --------------------- | -------- | ---------------------------------------------------- |
| `ANTHROPIC_API_KEY`   | Yes      | Anthropic API key for Claude                         |
| `SANDBOX_SNAPSHOT_ID` | Yes      | Vercel Sandbox snapshot with the desktop environment |
| `VERCEL_OIDC_TOKEN`   | Yes      | Auto-set by `vercel env pull` for Sandbox auth       |
| `VERCEL_TOKEN`        | Alt      | Alternative to OIDC — a Vercel personal access token |
| `VERCEL_TEAM_ID`      | Alt      | Required with `VERCEL_TOKEN`                         |
| `VERCEL_PROJECT_ID`   | Alt      | Required with `VERCEL_TOKEN`                         |


 Either `VERCEL_OIDC_TOKEN` (via `vercel env pull`) or the `VERCEL_TOKEN` + team/project IDs are required for Sandbox authentication.