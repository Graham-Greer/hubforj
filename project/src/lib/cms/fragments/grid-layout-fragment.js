import { normalizeText } from "./shared.js";

const ALLOWED_LAYOUTS = new Set(["grid", "lead"]);
const ALLOWED_COLUMNS = new Set(["2", "3", "4"]);
const ALLOWED_ALIGN = new Set(["left", "center"]);
const ALLOWED_DENSITY = new Set(["comfortable", "compact"]);

export function normalizeGridLayoutFragment(input = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const layout = normalizeText(source.layout);
  const columns = normalizeText(source.columns);
  const align = normalizeText(source.align);
  const density = normalizeText(source.density);

  return {
    layout: ALLOWED_LAYOUTS.has(layout) ? layout : "grid",
    columns: ALLOWED_COLUMNS.has(columns) ? columns : "3",
    align: ALLOWED_ALIGN.has(align) ? align : "left",
    density: ALLOWED_DENSITY.has(density) ? density : "comfortable",
  };
}

