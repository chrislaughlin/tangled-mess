# Tangled Mess

A macOS desktop prototype for understanding concurrent developer work.

## Run

Install Node.js, then run `npm install` followed by `npm start`.

For a browser preview, run `npm run preview` and open http://localhost:4174/desktop/.

This initial prototype uses six synthetic workstreams. Select nodes or queue entries, inspect dependencies, switch between Constellation and Flight Deck, search/filter, and resume or change attention state. State is in memory and resets when reloaded. Resume records a provisional local focus checkpoint; it does not open a real coding session.

The sample now includes 12 agent sessions, five repositories, and seven tool projects. Checkout reliability spans five sessions, two repositories, multiple tools, and a research conversation without a repository. Expand sessions under “Inside this workstream” in the brief. Search also matches tool projects, repositories, and session titles. Tool-project mappings are illustrative fixtures, not verified connector capabilities.

No connectors, file scanning, API credentials, or AI requests are enabled yet. Next: inspect available local session formats, implement one read-only import, then add local persistence and a developer-configured AI provider.

Plans: [product](PRODUCT_PLAN.md), [design](DESIGN_PLAN.md), [glossary](CONTEXT.md).
