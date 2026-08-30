/**
 * Client-supplied garment size charts (all measurements in inches).
 * Rendered verbatim — source: product-info screen grab.
 */

export type SizeChart = {
  label: string;
  unit: string; // "in"
  columns: string[];
  rows: { size: string; cells: string[] }[];
};

export const SIZE_CHARTS: Record<string, SizeChart> = {
  tee: {
    label: "Tee",
    unit: "in",
    columns: ["Length", "Width", "Sleeve"],
    rows: [
      { size: "S", cells: ["26", "40", "23"] },
      { size: "M", cells: ["27", "42", "23.5"] },
      { size: "L", cells: ["28", "44", "24"] },
      { size: "XL", cells: ["29", "46", "24.5"] },
      { size: "XXL", cells: ["30", "48", "25"] },
    ],
  },
  short: {
    label: "Short",
    unit: "in",
    columns: ["Length", "Waist"],
    rows: [
      { size: "L", cells: ["25", "32"] },
      { size: "XL", cells: ["27", "32"] },
      { size: "XXL", cells: ["32", "34"] },
    ],
  },
  hoodie: {
    label: "Hoodie",
    unit: "in",
    columns: ["Length", "Chest", "Sleeve"],
    rows: [
      { size: "S", cells: ["25", "40", "8"] },
      { size: "M", cells: ["26", "40", "8"] },
      { size: "L", cells: ["27", "43", "8.5"] },
      { size: "XL", cells: ["28", "44", "8.5"] },
      { size: "XX", cells: ["29", "46", "9"] },
    ],
  },
  sweatpants: {
    label: "Sweatpants",
    unit: "in",
    columns: ["Length", "Waist", "Thigh"],
    rows: [
      { size: "S", cells: ["35", "28", "22"] },
      { size: "M", cells: ["37", "32", "23"] },
      { size: "L", cells: ["39", "36", "25"] },
      { size: "XL", cells: ["40", "42", "26"] },
      { size: "XXL", cells: ["41", "44", "28"] },
    ],
  },
};

/** Product slug → chart name. Omitted = no chart (one-size scarf). */
export const PRODUCT_SIZE_CHART: Record<string, string> = {
  "black-runway-url-tee": "tee",
  "white-runway-url-tee": "tee",
  "crt-domain-expansion-white-tee": "tee",
  "crt-domain-expansion-black-tee": "tee",
  "black-swag-is-art-shorts": "short",
  "sia-hoodie": "hoodie",
  "sia-sweatpants": "sweatpants",
};