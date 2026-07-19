# Local comparison site

The site is a static document viewer generated from the repository's `data/`, `examples/`, `evidence/`, and shared case brief. It has no API, database, login, analytics, or runtime content fetch.

## Development

```sh
npm install
npm run dev
```

## Verification and static build

```sh
npm run lint
npm run typecheck
npm test
```

`npm test` runs a production build, checks representative route HTML, and verifies that a published raw file is byte-for-byte equal to its source artifact. `npm run build` writes the static export to `out/`.

The content sync runs before development and production builds. To refresh it directly:

```sh
npm run sync-content
```

Set `NEXT_PUBLIC_SITE_ORIGIN=https://real.example` for a real deployment build. If it is unset, sitemap and structured data use `http://localhost:3000`; the project does not invent an undeployed canonical host.

See [`../docs/STATIC_RELEASE.md`](../docs/STATIC_RELEASE.md) for the optional, owner-gated release path.
