import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Cookies — CRITICS ARCHIVE",
  description:
    "How CRITICS ARCHIVE uses cookies and local storage. SWAG IS ART.",
};

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 sm:py-24">
          <p className="eyebrow mb-4">Legal</p>
          <h1 className="max-w-3xl font-display text-5xl uppercase leading-[0.92] text-bone sm:text-6xl">
            Cookies
          </h1>
          <p className="mt-6 font-label text-xs uppercase tracking-wide text-bone-dim">
            Last updated: September 2026
          </p>

          <div className="mt-12 max-w-2xl space-y-10">
            <Section title="What cookies are">
              <p>
                Cookies are small text files stored on your device when you visit a
                website. They help a site remember you and how you use it. &ldquo;Local
                storage&rdquo; is a similar browser feature we use to remember your bag.
              </p>
            </Section>

            <Section title="How we use them">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-bone">Your bag</strong> — we store your cart in
                  your browser&apos;s local storage so it persists between visits. This is
                  not sent to our servers until you check out.
                </li>
              </ul>
            </Section>

            <Section title="Third-party cookies">
              <p>
                Some services we use may set their own cookies:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-bone">Paystack</strong> — during checkout, to
                  process your payment securely.
                </li>
              </ul>
              <p className="mt-4">
                We do not use advertising or cross-site tracking cookies.
              </p>
            </Section>

            <Section title="Managing cookies">
              <p>
                You can clear or block cookies and local storage at any time through your
                browser settings. Blocking them may affect the shopping experience — for
                example, your bag may not persist between visits, and checkout may not
                work correctly.
              </p>
            </Section>

            <Section title="Questions">
              <p>
                Questions about cookies? Email{" "}
                <a
                  href="mailto:support@criticsarchive.com"
                  className="text-bone underline underline-offset-4 transition-colors hover:text-accent"
                >
                  support@criticsarchive.com
                </a>
                .
              </p>
            </Section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl uppercase text-bone sm:text-2xl">{title}</h2>
      <div className="mt-3 font-body text-sm leading-relaxed text-bone-dim sm:text-base">
        {children}
      </div>
    </section>
  );
}
