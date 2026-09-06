import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SOCIAL_LINKS, SUPPORT_EMAIL, SocialIcon } from "@/components/social";

export const metadata: Metadata = {
  title: "Contact — CRITICS ARCHIVE",
  description:
    "Questions about an order, a piece, or a size? Email support@criticsarchive.com or reach us on social. SWAG IS ART.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 sm:py-24">
          <p className="eyebrow mb-4">Contact</p>
          <h1 className="max-w-3xl font-display text-5xl uppercase leading-[0.92] text-bone sm:text-6xl">
            Talk to us
          </h1>
          <p className="mt-6 max-w-md font-body text-sm leading-relaxed text-bone-dim sm:text-base">
            Questions about an order, a piece, or a size? We reply within one to two
            business days.
          </p>

          <div className="mt-12 space-y-8">
            <div>
              <p className="font-label text-[11px] uppercase tracking-widest2 text-bone-dim">
                Email
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="mt-2 inline-block font-display text-2xl uppercase text-bone transition-colors hover:text-accent sm:text-3xl"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>

            <div>
              <p className="font-label text-[11px] uppercase tracking-widest2 text-bone-dim">
                Social
              </p>
              <div className="mt-3 flex items-center gap-4">
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
        </section>
      </main>
      <Footer />
    </>
  );
}
