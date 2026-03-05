**Author:** Reda Ahmed Kotb

<a href="https://ai-sdk-computer-use.vercel.app">
  <h1 align="center">AI SDK Computer Use Demo</h1>
</a>

<p align="center">
  An open-source AI chatbot demonstrating computer use capabilities with Anthropic Claude Sonnet 4.5, Vercel Sandboxes, and the AI SDK by Vercel.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#how-it-works"><strong>How It Works</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running Locally</strong></a>
</p>
<br/>

## Features

- Streaming text responses powered by the [AI SDK](https://sdk.vercel.ai/docs).
- Anthropic Claude Sonnet 4.5 with [computer use](https://sdk.vercel.ai/docs/guides/computer-use) and bash tool capabilities.
- Remote desktop environment running in a [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox) with Chrome, a window manager, and VNC streaming.
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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?project-name=AI+SDK+Computer+Use+Demo&repository-name=ai-sdk-computer-use&repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fai-sdk-computer-use&demo-title=AI+SDK+Computer+Use+Demo&demo-url=https%3A%2F%2Fai-sdk-computer-use.vercel.app%2F&demo-description=A+chatbot+application+built+with+Next.js+demonstrating+Anthropic+Claude+Sonnet+4.5+computer+use+capabilities+with+Vercel+Sandboxes&env=ANTHROPIC_API_KEY,SANDBOX_SNAPSHOT_ID)

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
| `VERCEL_OIDC_TOKEN`   | Yes\*    | Auto-set by `vercel env pull` for Sandbox auth       |
| `VERCEL_TOKEN`        | Alt\*    | Alternative to OIDC — a Vercel personal access token |
| `VERCEL_TEAM_ID`      | Alt\*    | Required with `VERCEL_TOKEN`                         |
| `VERCEL_PROJECT_ID`   | Alt\*    | Required with `VERCEL_TOKEN`                         |

\* Either `VERCEL_OIDC_TOKEN` (via `vercel env pull`) or the `VERCEL_TOKEN` + team/project IDs are required for Sandbox authentication.

---

## Submission Details

Implementation for the [Senior Frontend Engineer AI Agent Dashboard](.agents/skills/docs.md) task.

### Features and What Was Done

#### 1. Two-panel layout

The interface was reorganized from the original (VNC left, chat right) into a left/right split. The **left panel** holds the session sidebar, chat with streaming messages, inline tool call cards, and a collapsible debug panel at the bottom. The **right panel** shows the VNC viewer and expanded tool details when a tool call is selected. Panels use `ResizablePanelGroup` for horizontal resizing, with min sizes 25% / 40%, and support desktop and tablet viewports.

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

Users can create, switch, and delete chat sessions. The session list appears in the sidebar. Sessions and active session ID persist in localStorage via Zustand. Messages are stored per session ID; switching sessions loads that session’s messages and resets the tool store.

#### 8. Mobile support (bonus)

The layout is responsive: at the `xl` breakpoint it switches to a mobile layout with a header toggle to switch between Chat and VNC views. Expanded tool details appear in a modal instead of the right panel. The session sidebar becomes an overlay with a close action.

### Frontend Flow Diagrams

#### Page layout (desktop xl+)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ResizablePanelGroup (horizontal)                                    │
├──────────────────────────────┬──────────────────────────────────────┤
│  LEFT PANEL (30% default)    │  RIGHT PANEL (70% default)            │
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

#### Message → tool store → UI flow

```
useChat (messages, status)
       │
       ▼
useChatToolSync ──► syncToolEvents(messages) ──► tool-store
       │                                                    │
       │                                                    ├──► toolCalls[]
       │                                                    ├──► actionCounts
       │                                                    ├──► agentStatus
       │                                                    └──► selectedToolCallId
       │                                                              │
       │                    ┌─────────────────────────────────────────┘
       ▼                    ▼
PreviewMessage         DebugPanel (event timeline)
  └─► tool parts           ExpandedToolDetail
      (ComputerToolPart,
       BashToolPart)
      click ──────────────────► selectToolCall(id)
```

#### Session flow

```
SessionSidebar                    session-store (Zustand + persist)
     │                                    │
     ├─ New chat ──────────────────────► addSession()
     ├─ Click session ─────────────────► setActiveSession(id)
     └─ Delete ────────────────────────► deleteSession(id)
                                                 │
                                                 ▼
Chat (sessionId) ◄── activeSessionId     session-helpers
     │                                         │
     └─ loadMessages(sessionId) ◄──────────────┘
     └─ saveMessages(sessionId) ──────────────► localStorage
```

#### Tool call click → expanded detail flow

```
ToolInvocationCard (in chat)
     │
     │  onClick
     ▼
selectToolCall(toolCallId) ──► tool-store.selectedToolCallId
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
              DebugPanel                            ExpandedToolDetail
         (highlights selected)                    (args, result, image)
```

### Feature Summary

| Requirement                          | Status | Notes                                                                          |
| ------------------------------------ | ------ | ------------------------------------------------------------------------------ |
| 1. Two-panel layout                  | ✓      | Left: sidebar, chat, debug panel. Right: VNC, expanded tool detail. Resizable. |
| 2. Tool call visualization           | ✓      | Interactive cards, type/status/duration, thumbnails, click → right panel.      |
| 3. Event pipeline & state management | ✓      | Event store, discriminated unions, derived state, collapsible debug panel.     |
| 4. React performance                 | ✓      | VNC memoized, no re-renders from chat.                                         |
| 5. TypeScript standards              | ✓      | No `any`, discriminated unions, full typing.                                   |
| 6. Streaming & API integration       | ✓      | Streaming preserved, tool lifecycle, error handling.                           |
| 7. Chat history & multiple sessions  | ✓      | Create/switch/delete, localStorage, session sidebar.                           |
| 8. Mobile support (bonus)            | ✓      | Responsive, Chat/VNC toggle, tool detail modal, sidebar overlay.               |
