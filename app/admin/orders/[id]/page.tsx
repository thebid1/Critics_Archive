import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Badge,
  Card,
  EmptyState,
  PageHeading,
  statusBadgeTone,
} from "@/components/admin/ui";
import OrderActions from "@/components/admin/OrderActions";
import { requireAdmin } from "@/lib/admin/guard";
import { getAdminOrder } from "@/lib/admin/data";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const address = [order.address_line1, order.address_line2, order.city, order.state, order.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeading
        title={order.reference}
        subtitle={`Placed ${new Date(order.created_at).toLocaleString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}`}
        actions={
          <Link href="/admin/orders" className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-900">
            ← All orders
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title={`Items (${order.items.length})`}>
            {order.items.length === 0 ? (
              <EmptyState title="No line items" body="This order has no recorded items." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded border border-dashed border-gray-200" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.size ? `Size ${item.size} · ` : ""}
                        Qty {item.qty} · {formatPrice(order.currency, item.price)} each
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(order.currency, item.price * item.qty)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-col items-end gap-1 border-t border-gray-100 pt-4 text-sm">
              <p className="flex w-full max-w-xs justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.currency, order.subtotal)}</span>
              </p>
              <p className="flex w-full max-w-xs justify-between text-gray-600">
                <span>Delivery</span>
                <span>{formatPrice(order.currency, order.shipping_total)}</span>
              </p>
              <p className="flex w-full max-w-xs justify-between text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(order.currency, order.total)}</span>
              </p>
            </div>
          </Card>
<Card title="Payment">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Status</dt>
                <dd className="mt-1">
                  <Badge tone={statusBadgeTone(order.status)}>{order.status}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Reference</dt>
                <dd className="mt-1 font-mono text-xs text-gray-700">{order.reference}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Provider</dt>
                <dd className="mt-1 text-gray-700">Paystack</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Paid at</dt>
                <dd className="mt-1 text-gray-700">
                  {order.paid_at
                    ? new Date(order.paid_at).toLocaleString()
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Confirmation email</dt>
                <dd className="mt-1 text-gray-700">
                  {order.confirmation_email_sent_at
                    ? new Date(order.confirmation_email_sent_at).toLocaleString()
                    : "Not sent"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Shipped email</dt>
                <dd className="mt-1 text-gray-700">
                  {order.shipped_email_sent_at
                    ? new Date(order.shipped_email_sent_at).toLocaleString()
                    : "Not sent"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Tracking number</dt>
                <dd className="mt-1 text-gray-700">{order.tracking_number || "—"}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Customer">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Name</dt>
                <dd className="mt-0.5 text-gray-900">{order.customer_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Email</dt>
                <dd className="mt-0.5 text-gray-900">{order.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Phone</dt>
                <dd className="mt-0.5 text-gray-900">{order.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Ship to</dt>
                <dd className="mt-0.5 text-gray-700">{address || "—"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Actions">
            <OrderActions
              orderId={order.id}
              status={order.status}
              trackingNumber={order.tracking_number}
            />
          </Card>
        </aside>
      </div>
    </>
  );
}