# Inactive analytics event dispatcher

## Status and boundary

The dispatcher in `js/analytics-event-dispatcher.js` is a standalone browser-compatible candidate. It is not loaded by any HTML page, does not emit events automatically and has no network transport, endpoint, retry, queue or production activation mechanism.

Tool-handler instrumentation is present through an inactive operation adapter. Live collection and deployment remain separate milestones.

## Authority and mirrored contract

The authoritative event contract remains `src/public-ingestion-validation.js` in the private PasteLint analytics repository. The public dispatcher mirrors its 27 canonical page paths, four event types and 36 allowed event/page pairs. The backend contract outranks this mirror.

After either contract changes, run the explicit synchronization check from the public repository:

```powershell
node scripts/analytics-contract-sync.mjs C:\dev\pastelint-analytics
```

This check lives outside `tests/` so ordinary public test discovery does not require the private repository. It is a development-time comparison only. The public site has no runtime dependency on the private repository.

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

## Operation instrumentation

The operation adapter remains disconnected from public HTML. Core handlers call the exception-safe bridge in `utils.js`; tests inject the frozen adapter, while the browser fallback remains inert when it is absent. This preserves testable operation boundaries without adding a second public preference-control owner.

| Tool | Explicit handler | Start boundary | Completion boundary |
| --- | --- | --- | --- |
| PasteLint Clean | `handleClean()` | Nonempty input accepted | Usable cleanup output fully rendered |
| PasteLint Clean | `copyOutput()` | Not applicable | Successful clipboard write records `output_copy` |
| SecondDraft | `handleSecondDraftRevise()` | Nonempty input accepted | Trustworthy usable revision rendered, including unchanged output |
| SecondDraft | `handleBuildAnalysisBrief()` | Nonempty input accepted | Nonempty brief rendered |
| SecondDraft | `copySecondDraftOutput()` | Not applicable | Successful clipboard write records `output_copy` |
| SSML Builder | `cleanOnly()` | Cleanable text or footer accepted | Nonempty cleaned text returned |
| SSML Builder | `generateSsmlOnly()` | Nonempty available source accepted | Changed or unchanged SSML returned |
| SSML Builder | `generateSsmlFromCleanedText()` | Nonempty cleaned text accepted | Changed or unchanged SSML returned |
| SSML Builder | `cleanAndGenerate()` | Cleanable input accepted | Final SSML or redirected chunks produced |
| SSML Builder | `generateChunks()` | Cleanable input accepted | At least one chunk produced |
| SSML Builder | `copyText()` | Not applicable | Successful cleaned-text, SSML, chunk-text or chunk-SSML clipboard write records `output_copy` |

Each explicit valid action owns one operation token. A token can complete at most once. SSML internal workers do not create tokens: combined Clean & Generate calls the clean worker directly, and oversized combined input calls the chunk worker directly. This prevents nested starts and completions without suppressing later explicit actions.

Blocked input emits nothing. A valid attempt emits one `tool_start`; exceptions, trustworthiness rejection, empty results, failed generation and empty chunking do not emit `tool_complete`. Analytics adapter absence, denial or exceptions cannot change tool output or clipboard feedback. No handler passes input, output, clipboard content, lengths, URLs, identifiers or metadata into the adapter.

## Deferred browser lifecycle ownership

`analytics-loader.js` remains the sole public owner of analytics URL preference controls. It evaluates every `analytics` value, gives exclusion precedence, accepts only one exact `include`, persists exclusion for malformed or ambiguous controls and verifies storage changes before cleaning the URL. The operation adapter and enabled dispatcher are not loaded by public HTML, so neither can independently consume those controls.

A later browser lifecycle milestone must use one bootstrap to process controls once, initialize the dispatcher once and supply that dispatcher to operation instrumentation. It must not run a second parser over the same raw controls. Exclusion behavior is not claimed as fully integrated until that single-owner flow has browser acceptance coverage.

## Privacy and limitations

Payload construction does not inspect or accept tool input, output, clipboard data, selected text, text length, document content, query strings, arbitrary URLs, identifiers or session state. The only payload values come from fixed event names and the canonical pathname allowlist.

The injected sink exists for deterministic tests and future separately reviewed integration. This milestone does not define delivery, consent disclosure, provider behavior, deduplication across documents, visitor identity or production collection.
