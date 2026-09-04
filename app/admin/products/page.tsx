import Link from "next/link";
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  PageHeading,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/guard";
import { listAdminProducts } from "@/lib/admin/data";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; archived?: string };
}) {
  await requireAdmin();
  const q = searchParams.q?.slice(0, 120) ?? "";
  const includeArchived = searchParams.archived === "1";
  const products = await listAdminProducts({ q, includeArchived });

  return (
    <>
      <PageHeading
        title="Products"
        subtitle={`${products.length} product${products.length === 1 ? "" : "s"}`}
        actions={<ButtonLink href="/admin/products/new">New product</ButtonLink>}
      />

      <form method="get" className="mb-4 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or slug…"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="mb-3 text-right">
        <Link
          href={includeArchived ? "/admin/products" : "/admin/products?archived=1"}
          className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-900"
        >
          {includeArchived ? "Hide archived" : "Show archived products"}
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title={q ? "No products match your search" : "No products yet"}
          body={q ? "Try a different keyword." : "Create your first product to get started."}
        />
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <ul className="space-y-3 md:hidden">
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded border border-dashed border-gray-200" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{product.name}</p>
                      <p className="truncate text-xs text-gray-400">{product.slug}</p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-medium ${
                        product.stock === 0 ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {formatPrice(product.currency, product.price)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-500">
                      Stock:{" "}
                      <span className={product.stock === 0 ? "font-medium text-red-600" : "text-gray-700"}>
                        {product.stock}
                      </span>
                    </span>
                    <span className="text-gray-500">Drop: {product.drop_name ?? "—"}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {product.is_published ? <Badge tone="green">Published</Badge> : <Badge tone="gray">Hidden</Badge>}
                    {product.archived_at && <Badge tone="red">Archived</Badge>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Piece</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Drop</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded border border-gray-200 object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded border border-dashed border-gray-200" />
                        )}
                        <div>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-medium text-gray-900 hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-gray-400">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatPrice(product.currency, product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={product.stock === 0 ? "font-medium text-red-600" : "text-gray-700"}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{product.drop_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap items-center gap-1.5">
                        {product.is_published ? <Badge tone="green">Published</Badge> : <Badge tone="gray">Hidden</Badge>}
                        {product.archived_at && <Badge tone="red">Archived</Badge>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}