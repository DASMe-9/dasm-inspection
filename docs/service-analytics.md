# Service analytics

The production root layout mounts one local Google Analytics integration for
`G-0W5317TLNM` (property `538913082`). `dasm_service` is `inspection`.
There is no second Tag Manager loader and no new dependency.

Only explicit production hostnames and route labels in `service-analytics.ts`
are accepted. Detail identifiers are replaced by route templates. Query strings,
fragments, page contents, form values, user identities, money, vehicle details,
and location coordinates are never supplied. Page titles are fixed; referrers
are reduced to their HTTP(S) origin. Unknown, callback, onboarding, and tokenized
report routes disable this measurement ID. This is coarse usage measurement,
not a payment or shipment-completion signal.

The safe page context is queued before loading the Google script. Automatic
config page views are disabled; route transitions emit one manual page_view.
The shared Analytics stream must have enhanced-measurement history page views
and automatic form/search/click measurements disabled before publishing this
change. Coordinate that setting with the Core site release. Check a public page,
a safe dynamic route, excluded routes, and browser back/forward in production;
loading a script alone does not establish that Google accepted an event.
