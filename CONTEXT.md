# Tangled Mess

Tangled Mess helps a developer reconstruct and manage the state of concurrent work spread across planning, coding, review, and AI-agent tools.

## Language

**Workstream**:
A developer objective and the related records, activity, dependencies, and decisions that together describe its progress.
_Avoid_: Project, task, thread

**Agent Session**:
A conversation or execution run in a coding tool that contributes evidence to a Workstream. Several sessions may contribute to the same objective in the same or different repositories.

**Repository**:
A source-code repository associated with work; it is independent of a tool's project grouping and may participate in several Workstreams.

**Tool Project**:
A named grouping or workspace inside Codex, Claude, Cursor, or another tool. It may reference zero, one, or several repositories and is not itself a Workstream.

**Source Record**:
An item imported from another system, such as a ticket, pull request, branch, review, build, or agent session.
_Avoid_: Item, object, integration data

**Evidence**:
Activity or content from a Source Record that supports an understanding of a Workstream's state.
_Avoid_: Update, event

**Context Snapshot**:
A time-stamped explanation of a Workstream's objective, current state, important decisions, open questions, and likely next moves.
_Avoid_: Summary, recap

**Next Move**:
A concrete action that could materially advance a Workstream. A Next Move may be suggested by Tangled Mess or confirmed by the developer.
_Avoid_: To-do, task

**Dependency**:
A directional relationship in which one Workstream or Source Record is waiting on, blocks, enables, or supersedes another.
_Avoid_: Link, connection

**Attention State**:
The developer's relationship to a Workstream: active, paused, waiting, blocked, or done. This is distinct from statuses reported by source systems.
_Avoid_: Status

**Focus Set**:
The small collection of Workstreams currently competing for a developer's attention.
_Avoid_: Dashboard, backlog

**Switch Brief**:
A Context Snapshot tailored to help a developer resume a Workstream after focusing elsewhere.
_Avoid_: Notification, digest

