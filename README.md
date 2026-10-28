<p align="center">
  <img src="desktop/assets/tangled-mess-logo.png" width="120" alt="Tangled Mess — intertwined cables with connector plugs" />
</p>

# Tangled Mess

### More work in flight. Less context in your head.

Your coding agents can work across several tickets, branches, and repositories at once. Remembering what each one is doing—and what needs you next—still falls on you.

Tangled Mess is a desktop companion that brings those moving pieces into one visual workspace. See the objective behind each session, follow the blockers, and pick up where you left off with a concise context brief. Keep coding in the tools you already use.

![Tangled Mess desktop app showing the Constellation dependency map and selected workstream brief](docs/images/constellation.png)

*The current Electron prototype running on macOS, with synthetic workstreams and sessions.*

## Untangle your work

- **See the whole picture.** Constellation maps workstreams and their dependencies. Expand an objective to reveal its agent sessions across repositories.
- **Know what needs you.** Attention states and pulsing borders highlight work waiting for your input.
- **Return with context.** Switch Briefs show the objective, recent changes, and a suggested next move.
- **Keep the sources close.** Tickets, pull requests, and merge requests sit alongside session details and source links.
- **Choose your view.** Switch to Flight Deck for a session-rich list, resize the sidebars, and choose an IDE-inspired theme—or Retrowave.

Tangled Mess supports the way you work across coding harnesses. Editing code, prompting agents, reviewing changes, and merging stay in their original tools.

## Where it stands

This is an interactive prototype, not yet a live work tracker. It includes six synthetic workstreams, 12 sessions, five repositories, and seven illustrative tool projects. Sample source links open example.com. Workstream changes reset on reload; theme and sidebar widths are saved locally.

The planned product will gather context through local files, CLI tools, and MCP, targeting Codex, Claude, Cursor, and potentially OpenCode, with GitHub/GitLab and ticket-system sources. Those integrations are **not implemented yet**.

Application data will be stored locally, with a developer-selected AI provider and API key for parsing and guidance. A remote AI provider receives the selected context sent for processing; local storage does not mean on-device inference. The current prototype makes no AI requests and scans no local session files.

## Run

Install Node.js, then run `npm install` followed by `npm start`.

For a browser preview, run `npm run preview` and open http://localhost:4174/desktop/.

Try selecting **Checkout reliability**, expanding its sessions, and returning to the overview from its root. Use **Fit selection** and **Fit overview** to frame the map, or switch to **Flight Deck** to compare sessions. Resume records a provisional focus checkpoint without opening a real coding session.

Plans: [product](PRODUCT_PLAN.md), [design](DESIGN_PLAN.md), [glossary](CONTEXT.md).
