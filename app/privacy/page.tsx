import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy — CRITICS ARCHIVE",
  description:
    "How CRITICS ARCHIVE collects, uses, and protects your information. SWAG IS ART.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 sm:py-24">
          <p className="eyebrow mb-4">Legal</p>
          <h1 className="max-w-3xl font-display text-5xl uppercase leading-[0.92] text-bone sm:text-6xl">
            Privacy policy
          </h1>
          <p className="mt-6 font-label text-xs uppercase tracking-wide text-bone-dim">
            Last updated: September 2026
          </p>

          <div className="mt-12 max-w-2xl space-y-10">
            <Section title="Who we are">
              <p>
                CRITICS ARCHIVE (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a small, curated
                streetwear catalogue. This policy explains what we collect, why, and the
                choices you have. Questions? Contact{" "}
                <a
                  href="mailto:support@criticsarchive.com"
                  className="text-bone underline underline-offset-4 transition-colors hover:text-accent"
                >
                  support@criticsarchive.com
                </a>
                .
              </p>
            </Section>

            <Section title="Information we collect">
              <p>We collect only what we need to run the store:</p>
              <ul className="mt-4 list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-bone">Order details</strong> — your name, email,
                  phone number, and delivery address (street, city, state, country). These
                  are required to fulfil and deliver your order.
                </li>
                <li>
                  <strong className="text-bone">Newsletter email</strong> — only if you
                  subscribe in the community section.
                </li>
                <li>
                  <strong className="text-bone">Technical data</strong> — basic usage and
                  device information collected automatically when you browse (such as IP
                  address and browser type).
                </li>
              </ul>
            </Section>

            <Section title="Payments">
              <p>
                We never see or store your card number. Payments are processed by{" "}
                <strong className="text-bone">Paystack</strong>. When you pay, Paystack
                handles the card details and returns only a transaction reference and
                status to us. Your card information is subject to Paystack&apos;s own
                privacy and security policies.
              </p>
            </Section>

            <Section title="How we use your information">
              <ul className="list-disc space-y-2 pl-5">
                <li>To process, deliver, and keep you updated on your order.</li>
                <li>To send order receipts and shipping notifications.</li>
                <li>
                  To send the newsletter and drop announcements — only if you subscribed.
                  Every email includes an unsubscribe link.
                </li>
                <li>To respond to customer support requests.</li>
                <li>To meet legal and accounting obligations.</li>
              </ul>
              <p className="mt-4">
                We do not sell your personal information, and we do not use it for
                third-party advertising.
              </p>
            </Section>

            <Section title="Service providers">
              <p>We rely on the following trusted processors to operate:</p>
              <ul className="mt-4 list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-bone">Paystack</strong> — payment processing.
                </li>
                <li>
                  <strong className="text-bone">Supabase</strong> — database and
                  authentication hosting.
                </li>
                <li>
                  <strong className="text-bone">Resend</strong> — transactional and
                  marketing email delivery.
                </li>
                <li>
                  <strong className="text-bone">Cloudinary</strong> — product image
                  hosting and delivery.
                </li>
              </ul>
              <p className="mt-4">
                Each processes data only as needed to provide its service to us, under its
                own security and privacy terms.
              </p>
            </Section>

            <Section title="Cookies and local storage">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Your <strong className="text-bone">cart</strong> is stored in your
                  browser&apos;s local storage, not on our servers, so your bag persists
                  between visits.
                </li>
                <li>
                  We do not use third-party advertising or cross-site tracking cookies.
                </li>
              </ul>
            </Section>

            <Section title="How long we keep data">
              <ul className="list-disc space-y-2 pl-5">
                <li>Order records are retained for accounting and legal purposes.</li>
                <li>
                  Newsletter addresses are kept until you unsubscribe, at which point we
                  stop sending and mark the subscription inactive.
                </li>
              </ul>
            </Section>

            <Section title="Your rights">
              <p>You may, at any time:</p>
              <ul className="mt-4 list-disc space-y-2 pl-5">
                <li>Request access to the personal information we hold about you.</li>
                <li>Ask us to correct or delete your information.</li>
                <li>Unsubscribe from marketing emails.</li>
                <li>Ask questions about how your data is handled.</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, email{" "}
                <a
                  href="mailto:support@criticsarchive.com"
                  className="text-bone underline underline-offset-4 transition-colors hover:text-accent"
                >
                  support@criticsarchive.com
                </a>
                .
              </p>
            </Section>

            <Section title="Security">
              <p>
                We use reasonable technical and organisational measures to protect your
                information, including encrypted connections (HTTPS), restricted access to
                stored data, and trusted, vetted service providers. No method of
                transmission or storage is completely secure, but we work to keep your
                data safe.
              </p>
            </Section>

            <Section title="Children">
              <p>
                Our store is not directed at children under 13, and we do not knowingly
                collect personal information from them. If you believe a child has
                provided us with information, contact us and we will delete it.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                We may update this policy from time to time. Changes will be posted on
                this page with an updated date. Continued use of the store after changes
                means you accept the revised policy.
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
