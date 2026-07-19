# Optional static-site release

No site has been published. Production deployment, GitHub Pages, DNS, and analytics remain owner decisions.

The build is host-neutral static HTML:

```sh
cd site
NEXT_PUBLIC_SITE_ORIGIN=https://real-host.example npm ci
NEXT_PUBLIC_SITE_ORIGIN=https://real-host.example npm run build
```

Publish the contents of `site/out/` at the root of that real origin. The output includes all pre-rendered routes, `robots.txt`, `sitemap.xml`, and byte-for-byte raw artifacts.

## GitHub Pages option

GitHub Pages is useful if this repository receives a root origin or custom domain. A later owner-approved release can:

1. choose the real origin and confirm that all routes will be served from `/`;
2. build with `NEXT_PUBLIC_SITE_ORIGIN` set to that origin;
3. upload `site/out/` with GitHub's Pages artifact action;
4. enable Pages and verify the framework, deep-file, comparison, case, raw, sitemap, and 404 routes;
5. only then add the public origin to repository metadata or documentation.

Standard project Pages under `/spec-planning-frameworks/` would need a deliberate base-path pass because the current stable routes are root-relative. Do not publish that shape by merely copying `out/`; it would break navigation. No Pages workflow is included until the owner chooses the final origin.
