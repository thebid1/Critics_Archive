import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Returns — CRITICS ARCHIVE",
  description:
    "Returns and exchanges policy for CRITICS ARCHIVE. SWAG IS ART.",
};

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 sm:py-24">
          <p className="eyebrow mb-4">Info</p>
          <h1 className="max-w-3xl font-display text-5xl uppercase leading-[0.92] text-bone sm:text-6xl">
            Returns
          </h1>

          <div className="mt-12 max-w-2xl space-y-10">
            <Section title="Return window">
              <p>
                You have 7 days from the date your order is delivered to request a return.
              </p>
            </Section>

            <Section title="Eligibility">
              <p>Items must be returned:</p>
              <ul className="mt-4 list-disc space-y-2 pl-5">
                <li>Unworn and unwashed</li>
                <li>In their original packaging</li>
                <li>With any tags still attached</li>
              </ul>
              <p className="mt-4">
                Items that have been worn, washed, or damaged will not be accepted.
              </p>
            </Section>

            <Section title="How to start a return">
              <p>
                Email{" "}
                <a
                  href="mailto:support@criticsarchive.com"
                  className="text-bone underline underline-offset-4 transition-colors hover:text-accent"
                >
                  support@criticsarchive.com
                </a>{" "}
                with your order reference and the reason for the return. We&apos;ll reply
                with the next steps.
              </p>
            </Section>

            <Section title="Refunds">
              <p>
                Once your return is received and inspected, we&apos;ll process the refund
                to your original payment method. Refunds can take a few business days to
                appear, depending on your bank.
              </p>
            </Section>

            <Section title="Exchanges">
              <p>
                If you need a different size, email us with your order reference and
                preferred size. Exchanges are subject to availability.
              </p>
            </Section>

            <Section title="Questions">
              <p>
                Anything else? Email{" "}
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
