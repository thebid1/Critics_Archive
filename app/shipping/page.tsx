import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Shipping — CRITICS ARCHIVE",
  description:
    "Delivery information for CRITICS ARCHIVE — nationwide across Nigeria. SWAG IS ART.",
};

export default function ShippingPage() {
  return (
    <>
      <Header />
      <main>
        <section className="container-page py-16 sm:py-24">
          <p className="eyebrow mb-4">Info</p>
          <h1 className="max-w-3xl font-display text-5xl uppercase leading-[0.92] text-bone sm:text-6xl">
            Shipping
          </h1>

          <div className="mt-12 max-w-2xl space-y-10">
            <Section title="Where we deliver">
              <p>
                We deliver nationwide across Nigeria — all 36 states and the Federal
                Capital Territory.
              </p>
            </Section>

            <Section title="Delivery fee">
              <p>
                A flat delivery fee is applied to every order and shown at checkout before
                you pay.
              </p>
            </Section>

            <Section title="Processing time">
              <p>
                Orders are processed within 1–2 business days after payment is confirmed.
                You&apos;ll receive an order confirmation email once your payment goes
                through.
              </p>
            </Section>

            <Section title="Delivery times">
              <p>
                Delivery typically takes 3–7 business days depending on your location.
                Times are estimates and may vary during busy periods or for remote areas.
              </p>
            </Section>

            <Section title="Tracking">
              <p>
                Once your order ships, you&apos;ll receive a shipping notification email
                with your tracking number.
              </p>
            </Section>

            <Section title="Address accuracy">
              <p>
                Please make sure your delivery address and state are correct at checkout.
                We are not responsible for orders sent to an incorrect or incomplete
                address.
              </p>
            </Section>

            <Section title="Questions">
              <p>
                Need help with a delivery? Email{" "}
                <a
                  href="mailto:support@criticsarchive.com"
                  className="text-bone underline underline-offset-4 transition-colors hover:text-accent"
                >
                  support@criticsarchive.com
                </a>{" "}
                with your order reference.
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
