import type { Metadata } from "next";
import ComingSoonGate from "@/components/ComingSoonGate";

export const metadata: Metadata = {
  title: "Coming soon — CRITICS ARCHIVE",
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return <ComingSoonGate />;
}
