# Tangled Mess — Design Plan

## Direction and reference

Constellation is the default workspace; Flight Deck is a persistent alternate view. Both are presentations of the same work and selection. Keyboard commands apply to both.

[mkdir.directory](https://mkdir.directory/) is a curated index of design galleries and section libraries, with compact numbered entries, voting, and dark/light controls. It is an inspiration source rather than an application-flow specification. The following visual and interaction choices are our interpretation for Tangled Mess, not claims that mkdir prescribes them.

Use its emphasis on curation and direct navigation as a starting point: few clear controls, explicit labels, disciplined hierarchy, and a small set of relevant items. During detailed design, collect annotated references through its linked Minimal Gallery, Dark Mode Design, Navbar Gallery, and Design Details directories. Evaluate references against the flows below before adopting a pattern.

## Visual language

Aim for a calm engineering instrument with character. The map supplies visual richness; its surrounding controls stay restrained.

- Default palette: graphite canvas (#151A1B), slightly raised panels (#202728), warm text (#EFECE2), muted text (#A8B1AE), teal selection (#76B8BA), coral intervention (#F28A73), amber risk (#E1B66B), sage completion (#A1BA98). Validate contrast on actual surfaces before implementation.
- Offer a warm light theme with equivalent semantic states; remember the preference and initially respect the system theme.
- Typography: Manrope for interface text, DM Mono for IDs and timestamps, Newsreader sparingly for workstream titles and brief headings. Body text should normally be 14–16px, metadata at least 12px; the initial concept's tiny labels need enlarging.
- Use an 8px spacing rhythm, fine borders, restrained corner radii, and shadows only to distinguish overlays. Avoid glow as the sole selection indicator.
- Pair state colour with text and a glyph. Selection gets a clear outline; keyboard focus gets a separate high-contrast ring.
- Motion explains a focus change or expansion, usually within 150–250ms. Preserve spatial continuity and support reduced motion. Background updates never continuously pulse or shuffle the map.

## Application shell

Deliver the experience as a macOS desktop application, either native or Electron. Include desktop settings for local source discovery (Codex, Claude, Cursor, and potentially OpenCode), GitHub/GitLab connections, and the developer's AI provider and API key. Onboarding offers synthetic sample data or selected local folders/session histories; it does not require gathering data from other users. Explain discovered locations and let the developer choose what to import.

Keep application data on the machine. Gather source data through MCP tools, installed CLI tools, and file reading. Connection settings identify the tool, source locations, and any remote service involved. The developer selects an AI provider and supplies their API key for parsing gathered context into guidance. Provider settings explain that remote AI requests transmit selected context to that provider. Store API keys in the OS credential store and exclude them from briefs and logs. Present an on-device provider option only if implemented and verified. No Tangled Mess hosted backend is required.

The top bar contains workspace, search, the Constellation / Flight Deck switch, sync state, and account controls. A narrow navigation rail contains project filters and saved views. An attention strip shows actionable changes without stealing focus.

The main region holds the map or queue. Selecting a Workstream opens the same right inspector in either view. Inspector sections are Overview, Changes, Dependencies, and Sources; Overview starts with the Switch Brief and Next Move. Deep links identify the selected Workstream and active view.

## Constellation behaviour

Show 5–10 Workstreams initially, with approximately 12 visible before clustering. Use labelled node cards large enough for a readable title and attention label. The circular concept can remain an accent around the focused Workstream; readability takes priority over a shape vocabulary.

Show confirmed directional dependencies with arrowheads and verb labels. Inferred links use a dashed line and an explicit “Suggested” label. Hover or keyboard selection exposes rationale and evidence. Expand one Workstream's source records at a time. Keep nodes stable during updates and retain map position between visits.

Provide zoom, fit selection, recenter, search, and a list equivalent. Never require dragging to select work, inspect a dependency, or correct a link. Group unrelated work by project with labelled cluster boundaries; explain hidden items with a count and reveal action.

## Primary flows

### First useful view

Choose a sample workspace or connect sources → select projects/repositories → review proposed Workstream groupings → confirm or correct → open Constellation with a short explanation of nodes, dependencies, and the inspector. Reveal partially imported data as it arrives with explicit freshness labels. Offer a useful empty state when no in-flight work is found.

### Resume work

Candidate flow, pending a decision on the last-focused trigger: select a node → read what changed since last focus → inspect the outstanding decision and Next Move → choose Resume → record the focus checkpoint and open the relevant source or coding tool. Test whether an explicit Resume action matches actual desktop use before settling checkpoint behaviour.

### Understand a blocker

Select a dependency or choose “Show blockers” → highlight its immediate chain → read direction, reason, evidence, and freshness → select the upstream Workstream → inspect its Next Move. Return restores the original selection and map position.

### Respond to an agent signal

Open the attention-strip item → show the question with enough transcript context and linked Workstream → choose Open session or Keep current focus. For the initial read-only product, responses happen in the source tool. Reconcile state after the next sync and show when the signal was last checked.

### Change presentation

Choose Flight Deck → retain selected Workstream, filters, inspector, and last-focus checkpoint → present the corresponding queue item → return to Constellation at the saved map position. Remember the chosen view for subsequent visits. First-time users start in Constellation.

### Correct the mental model

Choose Edit grouping or Edit relationship → review affected records or endpoints → confirm the change → update both views and show Undo. Distinguish developer-confirmed relationships from suggestions. Correcting a generated statement retains its evidence and records the correction as curated memory.

## State and trust design

Keep Attention State (active, paused, waiting, blocked, done) separate from signals such as Needs you or At risk. A waiting Workstream may also need a decision. Display both without forcing them into one status.

Every generated factual claim has an accessible source link. Show missing evidence and uncertainty plainly. A stale or disconnected source displays its last successful sync; an old brief is labelled with its generation time. Never present missing data as completed work.

Design loading, no results, no dependencies, disconnected source, partial import, summary failure, contradictory evidence, and deleted/inaccessible source states. Keep observed records usable when brief generation fails.

## Responsive and accessible use

At wide widths, use rail, canvas, and inspector together. At narrower desktop widths, collapse the rail and let the inspector overlay the canvas. On small screens, use a compact neighbourhood list and a full-screen detail sheet, with an optional map. Avoid a fixed minimum page width and horizontal clipping seen in the first concept gallery.

All essential map actions must have keyboard and list equivalents. Support visible focus, labelled controls, screen-reader relationship descriptions, non-colour state cues, reduced motion, and WCAG AA contrast. Ensure zoom and pan do not trap keyboard or touch users.

## Design deliverables and validation

1. Annotated reference board: selected examples, exact pattern to borrow, and the user need it serves.
2. Design tokens and components: node, dependency, cluster, attention signal, queue row, Switch Brief, evidence link, view switch, command palette, and connection state.
3. Wireframes for the six primary flows, including failure and empty states.
4. Polished Constellation and Flight Deck screens using identical seeded data, with working selection, dependency inspection, view switching, and Resume checkpoints.
5. Moderated tests with developers: find a blocked item, explain dependency direction, resume a paused item, inspect a claim, correct a grouping, and change views without losing context.

Provisional acceptance targets: users identify the next actionable item within 30 seconds, explain a selected dependency correctly without prompting, resume work within two minutes, and retain context when switching views. Measure map comprehension separately from brief accuracy so a good summary cannot hide a confusing map.
