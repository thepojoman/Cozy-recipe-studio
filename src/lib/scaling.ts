import type { Ingredient } from "@/lib/types";

const fractionGlyphs: Record<string, number> = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875
};

export function parseQuantity(raw: string): number | null {
  const normalized = raw.trim();

  if (!normalized) {
    return null;
  }

  if (fractionGlyphs[normalized] !== undefined) {
    return fractionGlyphs[normalized];
  }

  const mixedGlyph = normalized.match(/^(\d+)\s*([¼½¾⅓⅔⅛⅜⅝⅞])$/);
  if (mixedGlyph) {
    return Number(mixedGlyph[1]) + fractionGlyphs[mixedGlyph[2]];
  }

  const mixed = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  }

  const fraction = normalized.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    return Number(fraction[1]) / Number(fraction[2]);
  }

  const decimal = Number(normalized);
  return Number.isFinite(decimal) ? decimal : null;
}

export function formatQuantity(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "";
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  const whole = Math.floor(value);
  const remainder = value - whole;
  const denominators = [2, 3, 4, 8, 16];

  for (const denominator of denominators) {
    const numerator = Math.round(remainder * denominator);
    const delta = Math.abs(remainder - numerator / denominator);

    if (numerator > 0 && delta < 0.025) {
      const fraction = `${numerator}/${denominator}`;
      return whole > 0 ? `${whole} ${fraction}` : fraction;
    }
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function scaleIngredient(ingredient: Ingredient, scale: number): Ingredient {
  if (!ingredient.scalable || ingredient.quantity === null) {
    return ingredient;
  }

  return {
    ...ingredient,
    quantity: Number((ingredient.quantity * scale).toFixed(3))
  };
}

export function displayIngredient(ingredient: Ingredient) {
  const quantity = formatQuantity(ingredient.quantity);
  return [quantity, ingredient.unit, ingredient.name].filter(Boolean).join(" ");
}
