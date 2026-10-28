# Local session import checkpoint

Validated on this Mac on 28 October 2026 with read-only discovery. No session content was sent to an AI provider during validation.

| Source | Format | Import result |
| --- | --- | --- |
| Codex | `~/.codex/sessions/**/*.jsonl` | 18 transcripts parsed |
| Cursor | `~/.cursor/projects/**/agent-transcripts/**/*.jsonl` | 3 top-level transcripts parsed |
| OpenCode | `~/.local/share/opencode/opencode.db` | 47 root sessions imported, out of 96 total records including child sessions |

Imports are capped at 50 recent root sessions per source. Transcript reads are capped at 3,000 lines per file; unusually large lines are skipped. Codex imports session metadata and bounded user excerpts. Cursor imports bounded user excerpts; its project-directory identifier is used when a cwd is unavailable. OpenCode imports session metadata only through read-only SQLite. No source files or databases are modified. Claude's JSONL reader is available but has not been validated on this machine.

The app groups by working directory provisionally. It does not infer shared objectives, dependencies, live running state, or completion. Browser preview remains a sample-data view; local imports require Electron.

First-run setup selects sources and optionally stores a provider key encrypted with Electron safeStorage, with settings and imports in Electron's local userData directory. Provider choices are OpenAI, Anthropic, or None. The model ID is supplied by the user. A saved key is never returned to the renderer. Generation is an explicit action for the selected folder group (up to 20 sessions and a bounded context). OpenAI requests disable response storage. Provider-side policies still apply. Keys and API calls were not live-tested because no key was supplied in setup.

MCP transport, harness reuse, external ticket collection, identity reconciliation, secret redaction, and incremental synchronization remain outstanding. An API key does not convey another application's MCP OAuth connections. No installed harness is launched or given filesystem/tool execution authority by this checkpoint.

API references: [OpenAI Responses](https://developers.openai.com/api/reference/resources/responses/methods/create), [Claude authentication](https://platform.claude.com/docs/en/manage-claude/authentication).
