# Blank certificate templates (server-only)

Official Uber / Lyft / Turo inspection form PDFs, read by the render engine
(`app/lib/pdf/engine.ts`) via `fs`. **Never** place these under `public/` — the
official forms must not be publicly downloadable.

Naming convention: `<company>_<country>_<state>.pdf`, lowercased
(e.g. `lyft_usa_ca.pdf`). Each file must match a `TemplateMapper` registered in
`app/lib/pdf/resolver.ts`.