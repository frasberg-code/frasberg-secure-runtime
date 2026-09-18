# Runtime router

The runtime router exposes `/v1/chat/completions` and `/v1/health`, validates messages, defaults to an internal upstream, and blocks obvious self-routing loops.
