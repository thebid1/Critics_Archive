import Link from "next/link";

const SHOP_LINKS = [
  { href: "/shop", label: "All pieces" },
  { href: "/shop#drop-001", label: "Drop 001" },
];

const INFO_LINKS = [
  { href: "/about", label: "About" },
  { href: "/sizing", label: "Sizing" },
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns" },
  { href: "/contact", label: "Contact" },
];

const SOCIAL_LINKS = [
  { href: "https://instagram.com/criticsarchive", label: "Instagram" },
  { href: "https://tiktok.com/@criticsarchive", label: "TikTok" },
  { href: "https://x.com/criticsarchive", label: "X / Twitter" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
];

export default function Footer() {
  return (
    <footer className="py-16 sm:py-20">
      <div className="container-page grid grid-cols-2 gap-10 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <p className="font-script text-2xl text-bone">Critics Archive</p>
          <p className="mt-4 font-label text-xs uppercase tracking-wide text-bone-dim">
            Swag is art.
            <br />
            Drop 001 — SS26
          </p>
        </div>

        <FooterColumn title="Shop" links={SHOP_LINKS} />
        <FooterColumn title="Info" links={INFO_LINKS} />
        <FooterColumn title="Social" links={SOCIAL_LINKS} external />
      </div>

      <div className="container-page mt-16 flex flex-col-reverse items-start justify-between gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center">
        <p className="font-label text-[11px] uppercase tracking-wide text-bone-dim">
          © {new Date().getFullYear()} Critics Archive. All rights reserved.
        </p>
        <div className="flex gap-6">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-label text-[11px] uppercase tracking-wide text-bone-dim transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  external = false,
}: {
  title: string;
  links: { href: string; label: string }[];
  external?: boolean;
}) {
  return (
    <div>
      <p className="eyebrow mb-4">{title}</p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="font-label text-xs uppercase tracking-wide text-bone-dim transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
