import Link from "next/link";
import Image from "next/image";
import { SOCIAL_LINKS, SocialIcon } from "@/components/social";

const LOGO_IMAGE =
  "https://res.cloudinary.com/dicxujpqy/image/upload/v1787873855/criticsslogo_skdyqj.png";

const SHOP_LINKS = [
  { href: "/shop", label: "All pieces" },
  { href: "/shop#drop-001", label: "Drop 001" },
];

const INFO_LINKS = [
  { href: "/sizing", label: "Sizing" },
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns" },
  { href: "/contact", label: "Contact" },
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
          <div className="flex items-center gap-3">
            <span className="relative block h-10 w-10 shrink-0">
              <Image src={LOGO_IMAGE} alt="" fill sizes="40px" className="object-contain" />
            </span>
            <p className="font-display text-base uppercase tracking-widest text-bone">
              Critics Archive
            </p>
          </div>
          <p className="mt-4 font-label text-xs uppercase tracking-wide text-bone-dim">
            Swag is art.
            <br />
            Drop 001 — SS26
          </p>
        </div>

        <FooterColumn title="Shop" links={SHOP_LINKS} />
        <FooterColumn title="Info" links={INFO_LINKS} />

        {/* Social — icon links */}
        <div>
          <p className="eyebrow mb-4">Social</p>
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.label}
                className="text-bone-dim transition-colors hover:text-accent"
              >
                <SocialIcon name={link.icon} />
              </a>
            ))}
          </div>
        </div>
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
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="eyebrow mb-4">{title}</p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
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
