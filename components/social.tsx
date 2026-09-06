export type SocialIconName = "instagram" | "tiktok" | "x";

export const SOCIAL_LINKS: { href: string; label: string; icon: SocialIconName }[] = [
  { href: "https://www.instagram.com/critics_archive", label: "Instagram", icon: "instagram" },
  { href: "https://www.tiktok.com/@critics_archive", label: "TikTok", icon: "tiktok" },
  { href: "https://x.com/criticsarchive", label: "X / Twitter", icon: "x" },
];

export const SUPPORT_EMAIL = "support@criticsarchive.com";

export function SocialIcon({ name }: { name: SocialIconName }) {
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
