"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/admin/ui";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (response.ok) router.push("/login");
      else router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="ghost" onClick={signOut} busy={busy}>
      Sign out
    </Button>
  );
}