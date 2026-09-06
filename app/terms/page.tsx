import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms — CRITICS ARCHIVE",
  description:
    "Terms and conditions for shopping at CRITICS ARCHIVE. SWAG IS ART.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 sm:py-24">
          <p className="eyebrow mb-4">Legal</p>
          <h1 className="max-w-3xl font-display text-5xl uppercase leading-[0.92] text-bone sm:text-6xl">
            Terms &amp; conditions
          </h1>
          <p className="mt-6 font-label text-xs uppercase tracking-wide text-bone-dim">
            Last updated: September 2026
          </p>

          <div className="mt-12 max-w-2xl space-y-10">
            <Section title="Acceptance of terms">
              <p>
                By browsing or purchasing from CRITICS ARCHIVE (&ldquo;we&rdquo;,
                &ldquo;us&rdquo;), you agree to these terms. If you do not agree, please
                do not use the store.
              </p>
            </Section>

            <Section title="Products and availability">
              <p>
                Our pieces are released in limited, curated drops. Items are subject to
                availability and may sell out. We make reasonable efforts to display
                colours and measurements accurately, but minor variations may occur.
              </p>
            </Section>

            <Section title="Orders and payment">
              <p>
                When you place an order, we create a pending order and reserve your items.
                Payment is processed securely by <strong className="text-bone">Paystack</strong>;
                we never see or store your card number. Your order is only confirmed once
                payment succeeds. If payment fails, the order is cancelled and the items
                are released.
              </p>
            </Section>

            <Section title="Pricing and currency">
              <p>
                All prices are in Nigerian Naira (NGN) and include a delivery fee shown at
                checkout. We may change prices at any time, but the price you pay is the
                price shown at the time you complete checkout.
              </p>
            </Section>

            <Section title="Delivery">
              <p>
                We currently deliver within Nigeria. Delivery times are estimates only,
                and we are not liable for delays caused by couriers or events beyond our
                reasonable control. Please ensure the delivery address and state you
                provide are accurate — we are not responsible for orders sent to an
                incorrect address.
              </p>
            </Section>

            <Section title="Sizing">
              <p>
                Our size charts are provided as a guide. If you need a size we do not
                stock, email{" "}
                <a
                  href="mailto:support@criticsarchive.com"
                  className="text-bone underline underline-offset-4 transition-colors hover:text-accent"
                >
                  support@criticsarchive.com
                </a>{" "}
                with your order reference and preferred size.
              </p>
            </Section>

            <Section title="Returns and exchanges">
              <p>
                Please review our returns information before ordering. For anything
                return-related, contact{" "}
                <a
                  href="mailto:support@criticsarchive.com"
                  className="text-bone underline underline-offset-4 transition-colors hover:text-accent"
                >
                  support@criticsarchive.com
                </a>{" "}
                with your order reference.
              </p>
            </Section>

            <Section title="Intellectual property">
              <p>
                All content on this store — including the CRITICS ARCHIVE name, logos,
                designs, and imagery — is our property (or used with permission) and may
                not be reproduced without our written consent.
              </p>
            </Section>

            <Section title="Limitation of liability">
              <p>
                To the fullest extent permitted by law, CRITICS ARCHIVE is not liable for
                any indirect, incidental, or consequential loss arising from your use of
                the store, except where such liability cannot be excluded by law.
              </p>
            </Section>

            <Section title="Governing law">
              <p>
                These terms are governed by the laws of the Federal Republic of Nigeria.
              </p>
            </Section>

            <Section title="Changes to these terms">
              <p>
                We may update these terms from time to time. Changes take effect when
                posted on this page. Continued use of the store means you accept the
                revised terms.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                Questions about these terms? Email{" "}
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
