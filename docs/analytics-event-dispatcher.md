# Inactive analytics event dispatcher

## Status and boundary

The dispatcher in `js/analytics-event-dispatcher.js` is a standalone browser-compatible candidate. It is not loaded by any HTML page, does not emit events automatically and has no network transport, endpoint, retry, queue or production activation mechanism.

Tool-handler instrumentation, live collection and deployment remain separate milestones.

## Authority and mirrored contract

The authoritative event contract remains `src/public-ingestion-validation.js` in the private PasteLint analytics repository. The public dispatcher mirrors its 27 canonical page paths, four event types and 36 allowed event/page pairs. The backend contract outranks this mirror.

After either contract changes, run the explicit synchronization check from the public repository:

```powershell
node tests/analytics-contract-sync.test.mjs C:\dev\pastelint-analytics
```

This is a development-time comparison only. The public site has no runtime dependency on the private repository.

## Architecture

`PasteLintAnalyticsDispatcher.initialize(browser, config, sink)` creates or returns one dispatcher per `browser.document`:

- `config.enabled` must be the boolean `true` and `config.allowedOrigin` must be one exact HTTPS origin;
- analytics preference and URL controls are processed with the accepted fail-closed browser-gate semantics;
- eligibility, origin, path, event pairing and stored preference are rechecked immediately before every explicit dispatch;
- `/pastelint/index.html` is the only client alias and normalizes to `/pastelint/`;
- the injected sink is synchronous and receives only a frozen `event_type` / `page_path` payload;
- `page_view` can reach the sink at most once per document, including after repeated initialization;
- operation events remain repeatable because distinct valid user operations must remain countable; and
- sink exceptions are contained and never retried.

The browser API object is frozen and installed as a non-writable global only when the file is explicitly loaded. Configuration is captured inside the document dispatcher; there is no query-string, local-storage or mutable-global activation flag.

## Privacy and limitations

Payload construction does not inspect or accept tool input, output, clipboard data, selected text, text length, document content, query strings, arbitrary URLs, identifiers or session state. The only payload values come from fixed event names and the canonical pathname allowlist.

The injected sink exists for deterministic tests and future separately reviewed integration. This milestone does not define delivery, consent disclosure, provider behavior, deduplication across documents, visitor identity or production collection.
