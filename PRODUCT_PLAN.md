# Tangled Mess — Product and Prototype Plan

## Product thesis

AI has increased the amount of work a developer can start and move forward, but human attention has not scaled with it. The resulting bottleneck is no longer only writing or reviewing code; it is remembering the state, intent, dependencies, and next action across many concurrent pieces of work.

Tangled Mess is an attention and context layer for software delivery. It gathers records from ticketing, source-control, CI, review, and AI coding tools, groups them into developer-centred Workstreams, and reconstructs a useful mental model whenever the developer needs to decide what to do or resume work.

The product should not be positioned as another project-management dashboard. Its primary promise is:

> Resume any piece of work in under two minutes, without rereading every ticket, pull request, and agent transcript.

## Target user and initial situation

The initial user is an individual developer who:

- works on three or more concurrent changes;
- delegates meaningful work to Claude, Cursor, Codex, or similar agents;
- has multiple pull requests in review or waiting on CI;
- loses time reconstructing context, checking what changed, or deciding what to do next.

Team leads and managers may later benefit from a shared view, but designing for them first would pull the product toward reporting and surveillance instead of personal cognitive support.

## Jobs to be done

1. When I return to a Workstream, remind me what I was trying to achieve, what has happened since I left, and what I should consider doing next.
2. When several items need attention, help me choose the best one to focus on now.
3. When one piece of work depends on another, show the relationship and warn me when its state changes.
4. When an AI agent is working or has stopped, tell me whether it needs input, produced something reviewable, failed, or became stale.
5. When the system's understanding is wrong, let me correct it quickly and retain that correction.

## Product principles

Tangled Mess is a companion to coding harnesses: it tracks objectives, sessions, blockers, and source records across tools. Implementation, agent prompting, review submission, merging, and ticket editing stay in their existing tools. The sidebar must list every linked ticket and PR/MR for the selected Workstream, including provider, identifier, state, and a source URL when available. Several tickets and PRs/MRs may contribute to one Workstream; one source record may be relevant to several Workstreams. Never invent a destination when a source URL is missing.

- **Workstreams, not feeds.** Events matter only insofar as they explain progress toward an objective.
- **Evidence before assertion.** Every generated claim should link back to the ticket, diff, review, build, or agent message that supports it.
- **Attention is separate from workflow status.** A ticket can be “in progress” while the developer is waiting, blocked, or intentionally paused.
- **Suggest, do not silently decide.** The system can propose links, dependencies, and Next Moves, but uncertain inferences need visible confidence and easy correction.
- **Progressive detail.** Start with a compact mental model; reveal source records and raw evidence on demand.
- **Quiet by default.** Notify only when a change alters what the developer should know or do.

## The core experience

### 1. Constellation — default workspace

Constellation is the default home view. It presents the Focus Set as a stable spatial map of Workstreams and Dependencies, with the selected Workstream's Switch Brief in a contextual inspector. Show a small local neighbourhood first; expand source records and distant clusters on request. New activity updates badges and the attention strip without moving nodes while the developer is reading.

Provide a persistent Constellation / Flight Deck view switch. Both views share filters, selection, attention signals, briefs, and Next Moves. Switching view must preserve context; remember the developer's preferred view after their first visit. Switchboard is no longer a separate product mode; its command palette and keyboard navigation apply throughout.

### 2. Flight Deck — alternate Focus view

The alternate Flight Deck presents the same Focus Set as a ranked queue, grouped by attention signals and Attention State:

- **Active** — what the developer is doing now;
- **Needs you** — agent questions, requested reviews, conflicts, or failed checks;
- **Waiting** — review, CI, another person, or an agent is progressing the work;
- **At risk** — stale, blocked, contradictory, or approaching a deadline;
- **Paused** — intentionally set aside, with a remembered resumption point.

Each Workstream card answers four questions: What is it? Where is it? What changed? What is the Next Move?

### 3. Switch Brief

Opening or activating a Workstream produces a Switch Brief:

- objective and user impact;
- current Attention State and why;
- progress since the developer last focused on it;
- decisions already made;
- unresolved questions or risks;
- dependencies and people/systems being waited on;
- one to three suggested Next Moves;
- citations to the supporting Source Records.

The developer can correct the brief, confirm a Next Move, or mark the Workstream active. The correction becomes durable context rather than disappearing into chat history.

### 4. Constellation relationships

A graph view visualizes Workstreams and their Dependencies. Source Records appear only when expanding a Workstream, preventing the graph from becoming a hairball.

Useful relationship types are deliberately constrained:

- blocks / is blocked by;
- enables / is enabled by;
- supersedes / is superseded by;
- shares a change surface with;
- belongs to the same outcome as.

The graph should support a concrete question—“what is blocked if this slips?”—rather than exist as decoration.

### 5. Activity reconstruction

Tangled Mess builds a chronological evidence trail across tools. It distinguishes:

- externally reported state;
- inferred state;
- developer-confirmed state.

This makes an AI-generated mental model inspectable and correctable.

## Prototype scope

The first prototype should test the value of context reconstruction, not the breadth of integrations.

### Include

- Constellation as the default with 5–10 Workstreams and Flight Deck as an alternate view;
- a Workstream detail view;
- generated Switch Briefs with citations;
- manual activation, pause, waiting, blocked, and done controls;
- suggested and user-confirmed Next Moves;
- a simple dependency map between Workstreams;
- import from one ticket source and one code source;
- one AI-session source, or realistic captured session data if direct access is unavailable;
- manual linking/unlinking of incorrectly grouped Source Records;
- a “what changed since I last looked?” marker.

### Defer

- team-wide dashboards and productivity scores;
- autonomous changes to tickets or pull requests;
- broad notification systems;
- every ticketing and coding-agent integration;
- automatic time tracking;
- complex graph editing;
- long-term organisational analytics;
- agent orchestration from inside Tangled Mess.

### Recommended integration wedge

Start with GitHub, one of Shortcut/Jira, and one AI coding environment used by the prototype testers. If agent-session APIs are weak, begin with a local connector that reads exported transcripts or a small set of captured sessions. Manual linking is acceptable for the prototype; poor summaries are not.

## Prototype information architecture

```text
Focus
├── Active
├── Needs you
├── Waiting
├── At risk
└── Paused

Workstream
├── Switch Brief
├── Next Moves
├── Dependencies
├── Timeline
└── Source Records

Map
└── Workstreams and expandable dependencies
```

## Conceptual system design

```text
Source adapters
  → normalized Source Records and Evidence
  → identity/linking engine
  → Workstream model
  → state and dependency inference
  → Context Snapshot generator
  → Focus, Workstream, and Map views
```

The system needs two forms of memory:

- **Observed memory** — immutable imported evidence and timestamps;
- **Curated memory** — developer corrections, confirmed decisions, links, Attention State, and Next Moves.

Generated snapshots are derived views and should be reproducible from those memories. The model should never be the sole store of an important fact.

## Key inference problems

### Workstream grouping

Signals may include ticket IDs in branch names, PR references, repository and file overlap, linked issue fields, agent working directory, commit SHAs, URLs in transcripts, and semantic similarity. Auto-group only at high confidence; otherwise suggest a link.

### Attention State

Derive a recommendation from evidence, but preserve explicit developer choice. For example, an open pull request with green CI may imply “waiting for review,” while an agent asking a question implies “needs you.”

### Context reconstruction

Summaries should use a stable schema rather than a free-form paragraph. Each statement should carry its source and time. Contradictions should be surfaced, not blended away.

### Dependency discovery

Begin with explicit links and developer-created dependencies. Later, suggest dependencies from shared files, stacked branches, mentioned tickets, and sequencing language, with confidence and rationale.

## Important edge cases

- One ticket produces several pull requests or agent sessions.
- One pull request contributes to several tickets.
- A branch or agent session has no ticket.
- A Workstream moves between repositories.
- Two agents work on the same code and produce conflicting results.
- A pull request is merged while the ticket remains open.
- An agent reports completion, but its changes were never committed or reviewed.
- The developer deliberately pauses urgent-looking work.
- A dependency is organisational or human and has no Source Record.
- Imported evidence conflicts with a developer correction.

The developer's explicit correction should win in the presented mental model while the conflicting evidence remains visible.

## Validation plan

Run a one- to two-week concierge prototype with 5–8 developers who regularly use coding agents. Populate their Focus Set from real work, even if some ingestion and linking is manual behind the scenes.

Measure:

- median time from selecting a paused Workstream to taking a meaningful action;
- percentage of Switch Briefs accepted without material correction;
- number and type of missing or incorrect links;
- whether suggested Next Moves are useful, obvious, or misleading;
- self-reported confidence before and after switching context;
- number of forgotten blockers, review requests, or agent questions;
- voluntary use after the novelty period.

Success criteria for the prototype:

- at least 70% of Switch Briefs need no material correction;
- median resumption time is below two minutes;
- at least half of testers use the tool on four or more days in the second week;
- most users report that it replaces checking at least two separate tools during a context switch.

## Riskiest assumptions

1. Developers experience context reconstruction as painful enough to adopt another tool.
2. Cross-tool data can be grouped into Workstreams with acceptable accuracy.
3. A concise generated brief is more useful than opening the underlying tools directly.
4. Developers will correct the model when needed rather than abandon it after one error.
5. Agent-session tools expose enough durable state to support reliable reconstruction.
6. The dependency map helps decisions and does not become visual noise.

Test assumptions 1–4 before investing in a large integration platform.

## Delivery slices

### Slice 1 — Clickable concept

Use realistic seeded data to prototype Constellation, its contextual Switch Brief, and the alternate Flight Deck. Test map comprehension, stable navigation, view switching, and resumption speed. Follow [DESIGN_PLAN.md](./DESIGN_PLAN.md) for the visual direction and flows.

### Slice 2 — Local or synthetic data

Use data from the developer's own machine, generated dummy data, or a mixture of both. No collection from other users is required. Inspect available local session formats before choosing connectors; do not assume every tool exposes equivalent history or live status. Synthetic fixtures should cover agent questions, completed sessions, failed checks, multiple PRs per ticket, conflicting evidence, and blocked dependencies. Generate cited Switch Briefs and record corrections locally to test usefulness before building robust sync infrastructure.

### Slice 3 — Thin live product

Package a desktop app with read-only adapters for the selected ticket system and GitHub or GitLab (pull requests and merge requests respectively); background sync; manual grouping; and durable local corrections. Target local Codex, Claude, and Cursor sessions, plus OpenCode where its available local data supports reliable import. Deliver connectors incrementally after checking local formats and access. GitLab is a supported source-control option, not a requirement to use both hosts.

### Slice 4 — Trusted inference

Introduce confidence-scored grouping, Attention State recommendations, dependency suggestions, and change-triggered brief regeneration.

## Product decisions and remaining questions

Decisions from the current planning discussion:

1. **Desktop application:** target macOS, using either a native application or an Electron wrapper. Choose the implementation after assessing local session access and prototype reuse.
2. **Agent sources:** target Codex, Claude, and Cursor; include OpenCode if local import proves feasible. Start with the developer's existing machine and synthetic fixtures.
3. **Workstream boundaries:** provisionally interpret the developer's confirmation as allowing a Workstream to exist without a ticket and to contain several related tickets. Ticket links are useful grouping evidence, not mandatory identity.
4. **Last focused checkpoint:** remains to be worked out. The design plan's explicit Resume checkpoint is a candidate to test, not a settled requirement.
5. **Local storage and bring-your-own AI:** application records, indexes, corrections, and generated briefs remain on the machine. Gather data through MCP tools, installed CLI tools, and direct file reading. The developer chooses their AI provider and supplies their own API key; that provider parses selected gathered context into structured understanding and developer guidance. Store credentials in the operating system credential store. Tangled Mess does not operate a hosted data or inference backend.

Privacy distinction: all application persistence is local. Selected context is transmitted to the developer's configured AI provider for parsing and guidance when that provider is remote. MCP and CLI connectors may also communicate with their configured services; tool transport does not guarantee on-device execution. Explain these boundaries in provider and connection settings and minimise submitted context. Local model support is optional, not a prerequisite for this architecture.

Still open: native macOS versus Electron; which ticket system comes first; the exact last-focused trigger; which changes qualify as Needs you; and whether an on-device model option is required.

## Recommended next step

Build a clickable prototype around three scenarios before implementing integrations:

1. Resume a paused feature after two days and discover what changed.
2. Notice that an agent is blocked on a question while a pull request is waiting for review.
3. Understand that one Workstream blocks two others and choose the highest-leverage Next Move.

If testers cannot understand or value these scenarios with realistic seeded data, additional integrations will not rescue the concept.
