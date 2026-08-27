import Link from "next/link";
import Image from "next/image";

const LOGO_IMAGE =
  "https://res.cloudinary.com/dicxujpqy/image/upload/v1787873855/criticsslogo_skdyqj.png";

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

type SocialIcon = "instagram" | "tiktok" | "x";

const SOCIAL_LINKS: { href: string; label: string; icon: SocialIcon }[] = [
  { href: "https://instagram.com/criticsarchive", label: "Instagram", icon: "instagram" },
  { href: "https://tiktok.com/@criticsarchive", label: "TikTok", icon: "tiktok" },
  { href: "https://x.com/criticsarchive", label: "X / Twitter", icon: "x" },
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

function SocialIcon({ name }: { name: SocialIcon }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true,
  } as const;

  switch (name) {
    case "instagram":
      return (
        <svg {...common}>
          <path d="M12 2.2c3.2 0 3.6.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.25.07 1.65.07 4.85s-.01 3.6-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.25.06-1.65.07-4.85.07s-3.6-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.6 2.2 15.2 2.2 12s.01-3.6.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.4 2.21 8.8 2.2 12 2.2Zm0 3.6a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Zm0 2.5a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4Zm6.44-3.62a1.44 1.44 0 1 1 0 2.88 1.44 1.44 0 0 1 0-2.88Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M16.6 2h3.07c.02.35.05.7.1 1.05.13.82.4 1.6.82 2.32a6.2 6.2 0 0 0 3.4 2.5v3.4a9.6 9.6 0 0 1-3.4-.87v4.85c0 1.29-.13 2.56-.5 3.76a8.06 8.06 0 0 1-5.02 5.06 7.6 7.6 0 0 1-3.05.35 8.4 8.4 0 0 1-4.9-2.05 8.18 8.18 0 0 1-2.87-4.69 8 8 0 0 1 .3-3.6 8.2 8.2 0 0 1 5.04-5.19c.66-.25 1.36-.4 2.06-.46.5-.04 1-.04 1.5 0v3.5a4.15 4.15 0 0 0-1.02-.15c-.6 0-1.2.15-1.74.42a3.5 3.5 0 0 0-1.48 1.39 3.39 3.39 0 0 0-.46 1.6 3.5 3.5 0 0 0 .03.4 3.45 3.45 0 0 0 2.66 3.1c.31.08.64.1.95.05a3.59 3.59 0 0 0 2.51-1.7c.25-.38.4-.8.52-1.22.18-.65.26-1.35.26-2.06V2.2l-.05-.03Z" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M17.53 3H20.6l-6.73 7.7L21.85 21h-6.2l-4.86-6.35L5.24 21H2.16l7.2-8.24L1.6 3h6.36l4.39 5.8L17.53 3Zm-1.08 16.16h1.66L6.5 4.71H4.72l11.73 14.45Z" />
        </svg>
      );
  }
}
