# Runtime router

The runtime router exposes `/v1/chat/completions` and `/v1/health`, validates messages, defaults to an internal upstream, and blocks obvious self-routing loops.

The `@frasberg/runtime-router` package also exports a `FrasbergServerRuntime` plus an `InMemoryServerTransport` for local request/reply wiring tests across the six server-side Frasberg channels.
