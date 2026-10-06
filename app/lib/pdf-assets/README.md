# Blank certificate templates (server-only)

Official Uber / Lyft / Turo inspection form PDFs, read by the render engine
(`app/lib/pdf/engine.ts`) via `fs`. **Never** place these under `public/` — the
official blank forms must not be publicly downloadable. (Generated certificates
ARE served from the public CDN by design; these blanks are not.)

Naming convention: `<company>_<country>_<state>.pdf`, lowercased. Current set:

| File | Covers |
| --- | --- |
| `lyft_usa_ca.pdf` | California |
| `lyft_usa_al.pdf` | Alabama |
| `lyft_usa_nv.pdf` | Nevada |
| `lyft_usa_sc.pdf` | South Carolina |
| `lyft_usa_il_chicago.pdf` | Chicago, IL (city-specific form) |
| `uber_usa_ca.pdf` | California |
| `uber_usa_nc_sc.pdf` | North + South Carolina (shared form) |
| `turo_usa_all.pdf` | All US states |

Each file must match a `TemplateMapper` registered in
`app/lib/pdf/resolver.ts`. The multi-state / city-specific / all-state cases
need an explicit state → template coverage map in the resolver (pending user
confirmation — see `.opencode/spec/006-4-pdf-generation/spec.md` §9).
