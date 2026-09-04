"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeading,
  Select,
  TextArea,
} from "@/components/admin/ui";
import {
  uploadProductImage,
  validateImageFile,
  type UploadedImage,
} from "@/components/admin/upload-image";
import type { AdminDrop, AdminProduct } from "@/lib/admin/data";

const SIZE_CHART_OPTIONS = [
  { value: "tee", label: "Tee (S–XXL)" },
  { value: "short", label: "Shorts (L–XXL)" },
  { value: "hoodie", label: "Hoodie (S–XX)" },
  { value: "sweatpants", label: "Sweatpants (S–XXL)" },
  { value: "scarf", label: "Scarf — one size (OS)" },
];

export default function ProductEditor({
  mode,
  initial,
  drops,
}: {
  mode: "create" | "edit";
  initial?: AdminProduct;
  drops: AdminDrop[];
}) {
  const router = useRouter();
  const productId = initial?.id;

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [currency, setCurrency] = useState(initial?.currency ?? "NGN");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [stock, setStock] = useState(initial ? String(initial.stock) : "");
  const [season, setSeason] = useState(initial?.season ?? "");
  const [dropId, setDropId] = useState(initial?.drop_id ?? "");
  const [sizeChart, setSizeChart] = useState(initial?.size_chart ?? "tee");
  const [isNew, setIsNew] = useState(initial?.is_new ?? true);
  const [isPublished, setIsPublished] = useState(initial?.is_published ?? false);
  const [images, setImages] = useState<UploadedImage[]>(
    (initial?.images ?? []).map((img) => ({ url: img.url, alt: img.alt }))
  );

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [savedNote, setSavedNote] = useState("");

  const existingSizes = initial?.sizes.map((s) => s.size).join(", ");
  const chartLabel = SIZE_CHART_OPTIONS.find(
    (o) => o.value === initial?.size_chart
  )?.label;

  function payload(): Record<string, unknown> {
    return {
      name: name.trim(),
      slug: slug.trim(),
      price: Number(price),
      currency: currency.trim() || "NGN",
      description: description.trim(),
      stock: Number(stock),
      season: season.trim(),
      drop_id: dropId || null,
      is_new: isNew,
      is_published: isPublished,
      images,
      ...(mode === "create" ? { size_chart: sizeChart } : {}),
    };
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSavedNote("");
    try {
      const url =
        mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const result = (await response.json()) as { id?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not save the product.");
      setSavedNote("Saved.");
      if (mode === "create" && result.id) {
        router.push(`/admin/products/${result.id}`);
      } else {
        router.refresh();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the product.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleArchived() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !initial?.archived_at }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not update the product.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update the product.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File) {
    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setUploading(true);
    setError("");
    try {
      const image = await uploadProductImage(file, name);
      setImages((prev) => [...prev, image]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <PageHeading
        title={mode === "create" ? "New product" : initial?.name ?? "Edit product"}
        subtitle={
          mode === "create"
            ? "Sizes come from the fixed chart you pick — they don’t change later."
            : `Size chart: ${chartLabel ?? "—"} · Sizes on file: ${existingSizes ?? "—"}`
        }
      />

      {initial?.archived_at && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          This product is archived and hidden from the storefront.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={save} className="space-y-6">
          <Card title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={160} />
              </Field>
              <Field label="Slug" hint="Lowercase letters, numbers and dashes. Part of the URL.">
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} required maxLength={120} />
              </Field>
              <Field label="Price">
                <Input type="number" min={0} step={100} value={price} onChange={(e) => setPrice(e.target.value)} required />
              </Field>
              <Field label="Currency">
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="NGN">NGN</option>
                  <option value="GBP">GBP</option>
                </Select>
              </Field>
              <Field label="Season">
                <Input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="e.g. SS26" maxLength={40} />
              </Field>
              <Field label="Drop">
                <Select value={dropId} onChange={(e) => setDropId(e.target.value)}>
                  <option value="">No drop</option>
                  {drops.map((drop) => (
                    <option key={drop.id} value={drop.id}>
                      {drop.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Description">
                <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={10000} />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
                Published (visible on shop)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
                “New” badge
              </label>
            </div>
          </Card>

          <Card title="Stock">
            <p className="mb-4 text-xs text-gray-500">
              One pool per product, shared across all sizes. Sold out on the storefront is derived
              automatically from 0.
            </p>
            <Field label="Quantity available">
              <Input type="number" min={0} step={1} value={stock} onChange={(e) => setStock(e.target.value)} required />
            </Field>
          </Card>

          {mode === "create" && (
            <Card title="Size chart">
              <p className="mb-4 text-xs text-gray-500">
                Fixed per product type — the client confirmed charts never change, so this is set once
                at creation.
              </p>
              <Field label="Chart">
                <Select value={sizeChart} onChange={(e) => setSizeChart(e.target.value)}>
                  {SIZE_CHART_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </Card>
          )}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {savedNote && (
            <p className="text-sm text-green-700" role="status">
              {savedNote}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" busy={busy}>
              {mode === "create" ? "Create product" : "Save changes"}
            </Button>
            {mode === "edit" && (
              <Button
                type="button"
                variant={initial?.archived_at ? "secondary" : "danger"}
                onClick={toggleArchived}
                disabled={busy}
              >
                {initial?.archived_at ? "Restore product" : "Archive product"}
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-6">
          <Card title={`Images (${images.length})`}>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Add image</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadFile(file);
                  e.target.value = "";
                }}
                className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-gray-800"
              />
            </label>
            {uploading && <p className="mt-2 text-sm text-gray-500">Uploading…</p>}
            <p className="mt-2 text-xs text-gray-400">JPG, PNG or WEBP, max 8 MB.</p>

            <ul className="mt-4 space-y-3">
              {images.length === 0 && (
                <li className="text-sm text-gray-400">No images yet — the first image is the card image.</li>
              )}
              {images.map((image, index) => (
                <li key={`${image.url}-${index}`} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt || name}
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded border border-gray-200 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-gray-500">
                      {index === 0 ? "Card image · " : ""}
                      {image.url}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}