# Mind-map and planning patterns for Tangled Mess

Research date: 28 October 2026. Scope: six first-party documentation pages covering MindNode, Obsidian Canvas, and Linear. This is a bounded pattern study, not a comprehensive competitive review or evidence of developer demand.

## Product boundary

Tangled Mess is a desktop companion to the developer's coding harnesses. It helps the developer see concurrent work, reconstruct context, understand dependencies, and navigate to the right source. Codex, Claude, Cursor, OpenCode, ticket systems, and Git hosts remain the places where work is executed and authoritative records are maintained. This is the developer's stated requirement, not a conclusion inferred from competitors.

## Source-backed observations

### MindNode: progressive disclosure and spatial context

MindNode lets users fold and unfold a branch from its parent, displays an indicator when a branch is folded, and supports unfolding one level at a time. Folding is available through both pointer and keyboard/menu interactions. [MindNode: Folding](https://www.mindnode.com/support/guides/folding)

Its Focus Mode highlights the selected branch while fading other branches. Users can select a faded node and refocus on it, keeping other work present but visually subordinate. [MindNode: Focus Mode](https://www.mindnode.com/support/guides/focus-mode)

**Adaptation:** distinguish expansion from focus. Expansion reveals sessions within an objective; focus makes that objective prominent. A clearly labelled collapse affordance should remain attached to the root. Preserve the parent overview's positions and selected workstream when collapsing. A later focus mode could dim other objectives instead of removing all context.

### Obsidian Canvas: grouping, semantic connections, and navigation

Canvas supports groups separately from connections, labels on connections, and nondirectional, unidirectional, or bidirectional edges. It can follow a connection to its far endpoint. It offers pan, zoom, fit-all, and fit-selection controls. Web cards can open their original page externally. Canvases are stored as local files in the open JSON Canvas format. [Obsidian: Canvas](https://obsidian.md/help/plugins/canvas)

**Adaptation:** containment and dependency need different visual languages. A session belongs to a workstream; a workstream may block another. Shared repository membership is neither of those relationships. Use containment branches without dependency arrowheads, labelled directional dependencies, and explicit repository/tool-project metadata. Add fit-selection and a stable overview before free-form dragging. Store map presentation locally, independently of imported source truth. Source links should leave Tangled Mess for the canonical tool.

### Linear: structured links and tool handoff

Linear's coding settings allow developers to configure coding tools, custom URL links, and local scripts. It supports choosing how Git attachments appear, including title plus repository, and choosing the external destination for GitHub pull requests. Terminal tool launching requires the desktop app on a supported platform. [Linear: Coding settings](https://linear.app/docs/code-and-reviews)

Linear's GitLab integration displays associated merge requests in issue details and supports multiple issues linked to an MR. Its documentation distinguishes closing/contributing links from reference-only links, with reference-only links not changing issue status. [Linear: GitLab](https://linear.app/docs/gitlab)

Linear separately identifies related, blocking, and blocked relationships as issue properties. [Linear: Issue properties](https://linear.app/docs/issue-properties-home)

**Adaptation:** show all linked tickets and PRs/MRs as explicit sidebar records with source, ID, title, repository, state, and external-open action. Permit many-to-many links. Treat association as evidence, not automatic completion: a merged PR need not mean the developer's objective is done. Resume should offer a source/tool handoff; it should not evolve into an embedded coding agent or code review product.

## Prioritized recommendations

The priorities below are design judgments drawn from the observations and the product brief, not features validated by this research.

| Priority | Pattern | Tangled Mess behaviour | Boundary |
| --- | --- | --- | --- |
| Now | Linked-work sidebar | Put Tickets and PRs/MRs near the top of the selected workstream detail. Show every linked record, not a concatenated ID string. | Open canonical records externally; do not copy their full editing UI. |
| Now | Expand/collapse from the parent | Root shows session count and a visible collapse action; Escape returns to the overview. | Preserve selection and overview positions. |
| Now | Distinguish containment from dependency | Branches reveal sessions; labelled arrows express blockers between objectives. | A common repo or tool project does not imply a blocker. |
| Now | Source-aware session detail | Show tool, tool project/workspace, repo, branch/worktree, state, freshness, and Open session when available. | If a deep link is unavailable, offer Copy path/ID or Reveal local source instead of a fake launch action. |
| Next | Fit and focus | Fit selection, fit overview, pan/zoom, optional dimming of unrelated work. | Background updates must not rearrange the canvas while reading. |
| Next | Context-preserving handoff | Read a brief, choose source destination, open the coding tool, retain the map location. | Opening a tool is distinct from sending a prompt or starting an agent. |
| Later | Saved local views | Save layout, project filters, and open branches locally. | These are presentation preferences, not changes to tickets or sessions. |

## Sidebar specification

Recommended order: objective and attention signals → linked Tickets and PRs/MRs → brief and what changed → suggested next move → dependency list → sessions grouped by repository or tool project.

Each linked record needs a stable composite identity (provider + host + project/repository + record ID), canonical URL, title, source status, and last-observed timestamp. A ticket can link several PRs; a PR can support several tickets; an objective can have neither. Missing or inaccessible URLs should say so rather than render a misleading link. Deduplicate records across sessions while retaining the evidence for each association.

Synthetic demo links must be labelled as sample data. Do not fabricate live project URLs or imply an imported record exists. Real connectors should preserve the canonical URLs they receive.

## Recommended acceptance scenarios

1. Expand checkout: see five sessions across two repos, including multiple sessions in one repo and a research conversation without a repo. Collapse from the root and recover the overview without losing selection.
2. Select token refresh: find its ticket and GitLab MR in the sidebar, understand each status, and open the source when a real URL exists.
3. Follow a blocking edge: explain its direction and evidence, visit the upstream objective, and return without losing map position.
4. Select a session: see its harness and workspace separately from repository identity; launch the original session only when supported.
5. Encounter a merged PR alongside an open ticket: retain the distinction and surface the mismatch without marking the whole objective done.

## Explicit non-goals

Do not adopt competitors' embedded coding, review/merge, ticket authoring, agent execution, or workflow automation merely because those tools offer them. Tangled Mess should not become a replacement terminal, editor, agent chat client, or project tracker. Initial integrations observe and navigate; any future write action requires a separate product decision.

## Evidence limits

This study supports interaction-pattern choices. It does not establish local session API availability, deep-link support in any coding harness, integration permissions, or whether a given tool project can span multiple repositories. Those details require inspecting the installed tools and their official interfaces. The existing demo's project/repository mappings remain illustrative fixtures.
