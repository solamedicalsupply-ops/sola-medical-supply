import Image from "next/image";
import Link from "next/link";
import { whatsappUrl } from "@/lib/products";

export function Header() {
  return (
    <header className="site-header">
      <div className="top-strip">
        <span>Worldwide aesthetic wholesale support</span>
        <span>Tracked quotes. Faster WhatsApp handoff.</span>
      </div>
      <nav className="nav">
        <Link className="brand" href="/">
          <Image src="/assets/icons/logoNgang.png" alt="SOLA Medical Supply" width={172} height={46} priority />
        </Link>
        <div className="nav-links">
          <Link href="/products">Catalogue</Link>
          <a href="#quote">Request Quote</a>
          <a href="#workflow">Workflow</a>
        </div>
        <a
          className="icon-button"
          href={whatsappUrl("Hello SOLA Medical Supply, I would like to request a wholesale quotation.")}
        >
          WhatsApp
        </a>
      </nav>
    </header>
  );
}
