# Journal analytics events

Journal link events use fixed editorial slugs through `data-statkit-event`. Analytics remain optional: every link works through its ordinary `href` without JavaScript or StatsKit.

## Event families

- `Journal Open | <article-slug>` — primary Journal-card article link
- `Journal CTA | <article-slug> | <tool-or-action-slug>` — genuine primary article action
- `Journal Related | <article-slug> | <destination-slug>` — designated related reading
- `Journal Media | <article-slug> | <media-destination>` — intentional external evidence or media
- `Journal Share | <article-slug> | native` — native share-path activation
- `Journal Share | <article-slug> | copy-link` — copy-canonical-link path activation
- `Journal Track | <track-slug>` — Journal index track navigation

Slugs are stable, lowercase, and kebab-case. Use fixed editorial categories, never arbitrary URLs.

## Privacy and exclusions

Event values never contain pasted or selected text, tool input, generated output, document content, email addresses, phone numbers, query strings, user identifiers, or arbitrary destination URLs.

Share events use fixed slugs and share the clean canonical URL without tracking parameters. They do not prove completion, identify a destination application or recipient, or prove referral or conversion.

Do not track breadcrumbs, standard header or footer navigation, legal links, ordinary inline references, every tool-map link, or theme controls with established events. Do not invent a CTA or related-reading relationship to increase coverage.

## Publication checklist

1. Add one Open event to the primary index-card link.
2. Add one CTA event only for a genuine primary action.
3. Instrument designated related articles and meaningful external evidence.
4. Add one reusable Share article control and both fixed Share event variants.
5. Confirm sharing uses the clean canonical.
6. Align visible author and date, structured author and dates, and manifest values.
7. Confirm links and fragments work without analytics.
8. Include the complete event inventory in the implementation report.

Event totals measure recorded activations. They are not automatically unique-user counts, conversion rates, or proof that one person completed a sequence.
