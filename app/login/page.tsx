import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin sign in — CRITICS ARCHIVE",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 font-sans text-gray-900 antialiased">
      <LoginForm />
    </div>
  );
}