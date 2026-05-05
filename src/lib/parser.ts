import { equipmentSuggestions, suggestedTags } from "@/lib/constants";
import { createId } from "@/lib/id";
import { parseQuantity } from "@/lib/scaling";
import type { Equipment, Ingredient, Instruction, RecipeDraft } from "@/lib/types";

const units = [
  "cup",
  "cups",
  "tbsp",
  "tablespoon",
  "tablespoons",
  "tsp",
  "teaspoon",
  "teaspoons",
  "oz",
  "ounce",
  "ounces",
  "lb",
  "lbs",
  "pound",
  "pounds",
  "g",
  "gram",
  "grams",
  "kg",
  "ml",
  "l",
  "pinch",
  "clove",
  "cloves",
  "slice",
  "slices",
  "can",
  "cans"
];

const timerVerbs = [
  "bake",
  "cook",
  "simmer",
  "boil",
  "roast",
  "rest",
  "chill",
  "freeze",
  "marinate",
  "saute",
  "steam",
  "broil"
];

export function detectTimerSeconds(text: string): number | null {
  const timerRegex = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)/i;
  const hasTimerVerb = timerVerbs.some((verb) => text.toLowerCase().includes(verb));
  const match = text.match(timerRegex);

  if (!match || !hasTimerVerb) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit.startsWith("hour") || unit.startsWith("hr")) {
    return amount * 3600;
  }

  if (unit.startsWith("second") || unit.startsWith("sec")) {
    return amount;
  }

  return amount * 60;
}

export function parseIngredientLine(line: string): Ingredient {
  const cleaned = line.replace(/^[-*•]\s*/, "").trim();
  const parts = cleaned.split(/\s+/);
  const maybeMixed = parts.length > 1 ? `${parts[0]} ${parts[1]}` : parts[0] ?? "";
  let quantity = parseQuantity(maybeMixed);
  let index = quantity !== null ? 2 : 0;

  if (quantity === null) {
    quantity = parseQuantity(parts[0] ?? "");
    index = quantity !== null ? 1 : 0;
  }

  let unit = "";
  if (parts[index] && units.includes(parts[index].toLowerCase())) {
    unit = parts[index];
    index += 1;
  }

  const name = parts.slice(index).join(" ").replace(/,+$/, "") || cleaned;

  return {
    id: createId("ingredient"),
    name,
    quantity,
    unit,
    originalText: cleaned,
    scalable: quantity !== null
  };
}

function splitSections(rawText: string) {
  const lines = rawText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const ingredientIndex = lines.findIndex((line) => /ingredients?/i.test(line));
  const instructionIndex = lines.findIndex((line) => /(instructions?|directions?|method)/i.test(line));

  const headingLines = lines.slice(0, ingredientIndex > 0 ? ingredientIndex : Math.min(4, lines.length));
  const ingredientLines =
    ingredientIndex >= 0
      ? lines.slice(ingredientIndex + 1, instructionIndex > ingredientIndex ? instructionIndex : undefined)
      : lines.filter((line) => /^[-*•]?\s*(\d|[¼½¾⅓⅔⅛⅜⅝⅞])/.test(line)).slice(0, 12);
  const instructionLines =
    instructionIndex >= 0
      ? lines.slice(instructionIndex + 1)
      : lines.filter((line) => /^(\d+[\).]|step\s+\d+)/i.test(line));

  return { lines, headingLines, ingredientLines, instructionLines };
}

function parseMinutes(text: string, label: "prep" | "cook" | "total") {
  const regex = new RegExp(`${label}\\s*time\\s*:?\\s*(\\d+)\\s*(hours?|hrs?|minutes?|mins?)`, "i");
  const match = text.match(regex);

  if (!match) {
    return 0;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  return unit.startsWith("hour") || unit.startsWith("hr") ? value * 60 : value;
}

function inferTags(text: string) {
  const lower = text.toLowerCase();
  const tags = new Set<string>();

  if (/chicken|thigh|breast/.test(lower)) tags.add("Chicken");
  if (/salad|fresh|green|vegetable|yogurt/.test(lower)) tags.add("Fresh & Healthy");
  if (/cookie|cake|brownie|chocolate|sweet/.test(lower)) tags.add("Desserts");
  if (/sheet pan|one pan|skillet/.test(lower)) tags.add("One-Pan");
  if (/quick|15 minute|20 minute|weeknight/.test(lower)) tags.add("Quick Meals");
  if (/cozy|soup|stew|braise|dinner/.test(lower)) tags.add("Cozy Dinner");
  if (/midnight|late night|snack/.test(lower)) tags.add("Late Night Cravings");
  if (/date|wine|romantic/.test(lower)) tags.add("Date Night");
  if (/comfort|mac|cheese|potato|butter/.test(lower)) tags.add("Comfort Food");

  if (tags.size === 0) {
    tags.add(suggestedTags[Math.floor(Math.random() * suggestedTags.length)]);
  }

  return [...tags];
}

function inferEquipment(text: string): Equipment[] {
  const lower = text.toLowerCase();
  const matches = equipmentSuggestions.filter((item) => lower.includes(item.toLowerCase()));

  if (/bake|roast|sheet pan/i.test(text) && !matches.includes("sheet pan")) {
    matches.push("sheet pan");
  }

  if (/stir|whisk|combine/i.test(text) && !matches.includes("mixing bowl")) {
    matches.push("mixing bowl");
  }

  return matches.slice(0, 6).map((name) => ({
    id: createId("equipment"),
    name,
    notes: ""
  }));
}

function parseInstructions(lines: string[]) {
  const fallback = [
    "Prep ingredients and gather equipment.",
    "Cook according to the recipe notes until done.",
    "Taste, adjust seasoning, and serve warm."
  ];

  const usableLines = lines.length > 0 ? lines : fallback;

  return usableLines.map<Instruction>((line, index) => {
    const text = line.replace(/^(\d+[\).]|step\s+\d+[:.)]?)\s*/i, "").trim();
    const timerSeconds = detectTimerSeconds(text);

    return {
      id: createId("instruction"),
      stepNumber: index + 1,
      text,
      hasTimer: timerSeconds !== null,
      timerSeconds
    };
  });
}

export function parseRecipeText(rawText: string): RecipeDraft {
  const { lines, headingLines, ingredientLines, instructionLines } = splitSections(rawText);
  const combined = lines.join("\n");
  const titleCandidate = headingLines.find((line) => !/(prep|cook|total|servings?)/i.test(line));
  const title = titleCandidate || "Untitled Recipe";
  const description =
    headingLines.find((line) => line !== title && line.length > 24) ||
    "A saved recipe ready for organizing, cooking, and tweaking.";
  const servingsMatch = combined.match(/servings?\s*:?\s*(\d+)/i) ?? combined.match(/serves\s*(\d+)/i);
  const servings = servingsMatch ? Number(servingsMatch[1]) : 4;
  const prep = parseMinutes(combined, "prep") || 10;
  const cook = parseMinutes(combined, "cook") || 25;
  const total = parseMinutes(combined, "total") || prep + cook;
  const ingredients = ingredientLines
    .filter((line) => !/(instructions?|directions?|method)/i.test(line))
    .map(parseIngredientLine)
    .slice(0, 24);

  return {
    title,
    description,
    servings,
    estimatedPrepTimeMinutes: prep,
    estimatedCookTimeMinutes: cook,
    estimatedTotalTimeMinutes: total,
    actualTotalTimeMinutes: null,
    actualTimeNotes: "",
    ingredients: ingredients.length > 0 ? ingredients : ["1 tbsp olive oil", "2 cloves garlic", "1 pinch salt"].map(parseIngredientLine),
    instructions: parseInstructions(instructionLines),
    equipment: inferEquipment(combined),
    photos: [],
    tags: inferTags(combined)
  };
}

export async function mockOcrRecipe(file: File): Promise<RecipeDraft> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const recipeName = file.name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return parseRecipeText(`${recipeName || "Cozy Screenshot Supper"}
Servings: 4
Prep time: 15 minutes
Cook time: 30 minutes

Ingredients
1 1/2 cups jasmine rice
1 lb chicken thighs
2 tbsp olive oil
1 cup chopped herbs
1 lemon, juiced
1 tsp salt

Instructions
1. Season chicken and rest for 10 minutes.
2. Sear in a cast iron skillet for 6 minutes per side.
3. Steam rice for 18 minutes.
4. Finish with herbs and lemon before serving.`);
}
