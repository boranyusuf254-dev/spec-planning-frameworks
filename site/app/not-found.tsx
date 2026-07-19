import Link from "next/link";

export default function NotFound() {
  return <main id="main-content" className="page-width not-found"><p className="eyebrow">404</p><h1>That artifact is not in this run.</h1><p>Try the framework index or return to the comparison viewer.</p><div className="hero-actions"><Link className="button" href="/frameworks">Frameworks</Link><Link className="button button-secondary" href="/compare">Compare</Link></div></main>;
}
