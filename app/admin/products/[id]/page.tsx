import { notFound } from "next/navigation";
import ProductEditor from "@/components/admin/ProductEditor";
import { requireAdmin } from "@/lib/admin/guard";
import { getAdminProduct, listAdminDrops } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [product, drops] = await Promise.all([
    getAdminProduct(id),
    listAdminDrops(),
  ]);
  if (!product) notFound();

  return <ProductEditor mode="edit" initial={product} drops={drops} />;
}