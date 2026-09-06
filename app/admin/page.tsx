import Link from "next/link";
import {
  Card,
  PageHeading,
  ButtonLink,
} from "@/components/admin/ui";
import DropManager from "@/components/admin/DropManager";
import SiteGateSettings from "@/components/admin/SiteGateSettings";
import { requireAdmin } from "@/lib/admin/guard";
import { getAdminOverview, listAdminDrops } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [overview, drops] = await Promise.all([getAdminOverview(), listAdminDrops()]);
  const { orderCounts } = overview;

  const statCards = [
    {
      label: "Products",
      value: String(overview.productCount),
      note: `${overview.publishedProductCount} published`,
      href: "/admin/products",
    },
    {
      label: "Pending orders",
      value: String(orderCounts.pending),
      note: "awaiting payment",
      href: "/admin/orders?status=pending",
    },
    {
      label: "Paid & unfulfilled",
      value: String(orderCounts.paid),
      note: "ready to ship",
      href: "/admin/orders?status=paid",
    },
    {
      label: "Fulfilled",
      value: String(orderCounts.fulfilled),
      note: "shipped to customers",
      href: "/admin/orders?status=fulfilled",
    },
  ];

  return (
    <>
      <PageHeading
        title="Dashboard"
        subtitle={
          overview.activeDropName
            ? `Live drop on the homepage: ${overview.activeDropName}`
            : "No drop is live on the homepage yet."
        }
        actions={
          <ButtonLink href="/admin/products/new">New product</ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{card.value}</p>
              <p className="mt-1 text-xs text-gray-500">{card.note}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <SiteGateSettings />
      </div>

      <div className="mt-8">
        <DropManager drops={drops} />
      </div>
    </>
  );
}