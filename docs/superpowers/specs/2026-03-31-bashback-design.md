# Bashback — Design Spec

**Date:** 2026-03-31
**Status:** In progress
**Superpower:** Bashback
**Issue:** #23

## Value proposition

Claude Code runs hundreds of bash commands per session. Most users approve them blindly and learn nothing. That's a missed opportunity — every command Claude runs is a free bash lesson.

Bashback captures and annotates every command so you learn by osmosis during pair coding:
- **Augmented bash history** — every command Claude runs, captured, timestamped, grouped by session/workspace
- **Flag decomposition** — automatic `--help` / man page parsing, not a hardcoded map. See what `-xvf` actually means.
- **Quiz mode** — hide the command, show the effect, guess the syntax. Spaced repetition optional.
- **Exercises** — generated drills based on commands you've never used or flags you've never seen

## Prior art

Bashback v1 (`~/code/bashback/`) — standalone React + Node + WebSocket app, Docker-deployed, GHCR CI/CD. Fully working:
- Hook interception via `bashback-hook.sh` + jq -> `/tmp/bashback.log` -> fs.watch -> WebSocket -> React UI
- Syntax highlighting with operator tooltips (`&&`, `||`, `|`, `>`, `>>`)
- Flag decomposition via `--help` parsing + bundled dictionary (30+ commands)
- Privacy mode (masks IPs, credentials, tokens, home paths)
- SSH transparency, heredoc collapse, inline code detection
- Workspace detection by git root

The standalone app works but nobody opens a separate browser tab. Inside the extension it gets used.

## Phases

### Phase 1: Command list (done)

Quickwin — display bash commands from existing JSONL session data.

- Extract `BashCommand` objects during `parseSession()` (piggybacks on existing loop)
- Scrollable list sorted by timestamp, capped at 500
- Basic syntax coloring: command (yellow), flags (blue), strings (orange), operators (gray)
- Error/success indicator per command
- Project grouping, keyboard shortcut `4`
- No hooks, no external deps

### Phase 2: Flag decomposition (in progress)

Annotate flags with explanations parsed from `--help` output.

- Tokenize command into binary + flags + arguments
- Look up flag explanations from a bundled dictionary (top 30 commands)
- Fallback: parse `--help` output at runtime (cached)
- Display as expandable tooltips or inline annotations below the command
- Long form mapping (e.g. `-r` -> `--recursive`)

### Phase 3: Hooks integration

Real-time command capture via Claude Code hooks instead of JSONL polling.

- `PostToolUse` hook on Bash tool (same pattern as bashback-hook.sh)
- Live feed: new commands appear without waiting for 30s refresh
- Workspace detection via git root
- Prerequisite: decide on hook installation UX

### Phase 4: Privacy mode

Redact sensitive information from displayed commands.

- Pattern-based redaction: IPs, credentials, tokens, home paths, hostnames
- Sensitive flag masking (`--token`, `--password`, `-u` next arg)
- Toggle in settings, on by default
- Port redaction logic from `~/code/bashback/client/src/lib/redact.ts`

### Phase 5: Quiz mode

Interactive learning from your command history.

- Hide the command, show the description/effect, guess the syntax
- Spaced repetition optional
- Score tracking per command family
- Generated drills based on commands you've never used or flags you've never seen

### Phase 6: Exercises

Generated drills beyond your history.

- Based on command families you use (git, docker, npm, etc.)
- Progressive difficulty
- Flag discovery: introduce flags you've never seen for commands you use often

## Data model

```typescript
interface BashCommand {
  command: string;
  description?: string;
  timestamp?: string;
  sessionId: string;
  isError?: boolean;
  output?: string;        // truncated to 500 chars
}
```

## Decisions needed

Silence = agreement. If you have opinions on any of these, flag it — otherwise I'll go with the default.

**Data capture**
- -> Claude Code `PostToolUse` hook on Bash (same pattern as bashback-hook.sh, proven)
- or: parse JSONL session files after the fact (no hook dependency, but no real-time)
- or: both — hook for live view, JSONL for historical analysis

**Flag decomposition source**
- -> bundled dictionary for top 30 commands (fast, no runtime dep) + `--help` as fallback with caching
- or: `--help` output parsing only (accurate, but slow on first encounter)
- or: LLM-generated explanations via extension API (rich, but adds latency and cost)

**Display location**
- -> dedicated bashback tab in the webview panel (done)
- or: inline in the session conversation view (commands annotated in-place)
- or: both — tab for browsing/quizzing, inline for passive learning

**Hook installation**
- -> auto-install hook when bashback tab is first opened
- or: manual — user copies hook script themselves
- or: settings toggle "Enable live Bashback" that installs/removes the hook

**Privacy default**
- -> on by default, toggleable (proven in bashback v1)
- or: off by default, opt-in
- or: auto-detect sensitive content, warn before displaying

**Quiz/exercise engine**
- -> ship without it, add later as a separate PR
- or: include from day one as a core differentiator
- or: quiz only (lightweight), exercises later (needs content generation)

**Quiz data persistence**
- -> vscode globalState (per-machine, survives extension updates)
- or: JSON file in ~/.claude/ (portable across machines)
- or: both — sync via settings sync
