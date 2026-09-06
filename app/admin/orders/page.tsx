import Link from "next/link";
import {
  Badge,
  Button,
  EmptyState,
  PageHeading,
  statusBadgeTone,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/guard";
import { listAdminOrders } from "@/lib/admin/data";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.slice(0, 120) ?? "";
  const status = sp.status ?? "";
  const orders = await listAdminOrders({ q, status: status || undefined });

  return (
    <>
      <PageHeading
        title="Orders"
        subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"} — paid orders listed first`}
      />

      <form method="get" className="mb-4 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by customer, email or order #…"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none sm:text-sm"
        />
        {status && <input type="hidden" name="status" value={status} />}
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = status === filter.value;
          return (
            <Link
              key={filter.value}
              href={
                filter.value
                  ? `/admin/orders?status=${filter.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`
                  : `/admin/orders${q ? `?q=${encodeURIComponent(q)}` : ""}`
              }
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title={q || status ? "No orders match your filters" : "No orders yet"}
          body={
            q || status
              ? "Try clearing the search or choosing a different status."
              : "Orders will appear here as customers check out."
          }
        />
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <ul className="space-y-3 md:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-mono text-xs font-medium text-gray-900">
                      {order.reference}
                    </span>
                    <Badge tone={statusBadgeTone(order.status)}>{order.status}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-gray-900">{order.customer_name || "—"}</span>
                    <span className="shrink-0 font-medium text-gray-900">
                      {formatPrice(order.currency, order.total)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {order.email ? ` · ${order.email}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs font-medium text-gray-900 hover:underline"
                      >
                        {order.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{order.customer_name || "—"}</p>
                      <p className="text-xs text-gray-400">{order.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatPrice(order.currency, order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusBadgeTone(order.status)}>{order.status}</Badge>
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