import ProductEditor from "@/components/admin/ProductEditor";
import { requireAdmin } from "@/lib/admin/guard";
import { listAdminDrops } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  const drops = await listAdminDrops();

  return <ProductEditor mode="create" drops={drops} />;
}