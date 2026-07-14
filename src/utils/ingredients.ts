import type { Ingredient, Recipe } from "../types";

const unitAliases: Record<string, string> = {
  克: "g",
  公克: "g",
  g: "g",
  kg: "kg",
  千克: "kg",
  公斤: "kg",
  两: "两",
  个: "个",
  颗: "个",
  只: "只",
  根: "根",
  把: "把",
  勺: "勺",
  汤匙: "勺",
};

const conversionToGram: Record<string, number> = {
  g: 1,
  kg: 1000,
  两: 50,
};

export const normalizeUnit = (unit: string) => unitAliases[unit.trim()] ?? unit.trim();

export const formatAmount = (ingredient: Ingredient) => {
  if (ingredient.amount === null) return ingredient.unit || "适量";
  const value = Number.isInteger(ingredient.amount)
    ? ingredient.amount
    : Number(ingredient.amount.toFixed(1));
  return `${value}${ingredient.unit}`;
};

export type AggregatedMain = {
  key: string;
  name: string;
  amount: number | null;
  unit: string;
};

export const aggregateMainIngredients = (recipes: Recipe[]): AggregatedMain[] => {
  const groups = new Map<string, AggregatedMain>();

  recipes.flatMap((recipe) => recipe.main_ingredients).forEach((ingredient) => {
    const unit = normalizeUnit(ingredient.unit);
    const canConvert = ingredient.amount !== null && Boolean(conversionToGram[unit]);
    const canonicalUnit = canConvert ? "g" : unit;
    const key = `${ingredient.name.trim().toLowerCase()}::${canonicalUnit}`;
    const convertedAmount =
      ingredient.amount === null
        ? null
        : canConvert
          ? ingredient.amount * conversionToGram[unit]
          : ingredient.amount;
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        key,
        name: ingredient.name.trim(),
        amount: convertedAmount,
        unit: canonicalUnit,
      });
      return;
    }

    if (existing.amount !== null && convertedAmount !== null) {
      existing.amount += convertedAmount;
    } else {
      existing.amount = null;
    }
  });

  return [...groups.values()].map((item) => {
    if (item.unit === "g" && item.amount !== null && item.amount >= 1000) {
      return { ...item, amount: item.amount / 1000, unit: "kg" };
    }
    return item;
  });
};

export type AggregatedSeasoning = {
  key: string;
  name: string;
  count: number;
};

export const aggregateSeasonings = (recipes: Recipe[]): AggregatedSeasoning[] => {
  const counts = new Map<string, AggregatedSeasoning>();
  recipes.flatMap((recipe) => recipe.seasonings).forEach((ingredient) => {
    const key = ingredient.name.trim().toLowerCase();
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { key, name: ingredient.name.trim(), count: 1 });
    }
  });
  return [...counts.values()].sort((a, b) => b.count - a.count);
};

export const ingredientLabel = (ingredient: Ingredient) =>
  `${ingredient.name} ${formatAmount(ingredient)}`.trim();
