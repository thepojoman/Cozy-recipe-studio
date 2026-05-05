import { createId } from "@/lib/id";
import { parseIngredientLine } from "@/lib/parser";
import type { Recipe } from "@/lib/types";

const now = new Date().toISOString();

export const seedRecipes: Recipe[] = [
  {
    id: "recipe_lemon_chicken",
    title: "Lemon Herb Skillet Chicken",
    description: "A bright one-pan dinner with tender chicken, herbs, and a glossy lemon pan sauce.",
    servings: 4,
    estimatedPrepTimeMinutes: 15,
    estimatedCookTimeMinutes: 25,
    estimatedTotalTimeMinutes: 40,
    actualTotalTimeMinutes: 44,
    actualTimeNotes: "Extra browning time was worth it.",
    ingredients: [
      "1 1/2 lb chicken thighs",
      "2 tbsp olive oil",
      "1 cup chicken stock",
      "1 lemon, sliced",
      "2 cloves garlic",
      "1 tbsp butter",
      "1 pinch flaky salt"
    ].map(parseIngredientLine),
    instructions: [
      "Pat chicken dry and season with salt.",
      "Sear chicken in a cast iron skillet for 6 minutes per side.",
      "Add garlic, stock, and lemon, then simmer for 12 minutes.",
      "Rest for 5 minutes before serving."
    ].map((text, index) => ({
      id: createId("instruction"),
      stepNumber: index + 1,
      text,
      hasTimer: /minutes?/.test(text),
      timerSeconds: index === 1 ? 360 : index === 2 ? 720 : index === 3 ? 300 : null
    })),
    equipment: [
      { id: createId("equipment"), name: "cast iron skillet" },
      { id: createId("equipment"), name: "thermometer" },
      { id: createId("equipment"), name: "tongs" }
    ],
    photos: [
      {
        id: createId("photo"),
        photoUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1200&q=80",
        isCoverPhoto: true,
        createdAt: now
      }
    ],
    tags: ["Chicken", "One-Pan", "Cozy Dinner"],
    createdAt: now
  },
  {
    id: "recipe_green_noodles",
    title: "Fresh Green Peanut Noodles",
    description: "Cool noodles tossed with herbs, cucumbers, lime, and a creamy peanut dressing.",
    servings: 2,
    estimatedPrepTimeMinutes: 20,
    estimatedCookTimeMinutes: 8,
    estimatedTotalTimeMinutes: 28,
    actualTotalTimeMinutes: null,
    actualTimeNotes: "",
    ingredients: [
      "8 oz rice noodles",
      "1 cup cucumber",
      "1/2 cup cilantro",
      "3 tbsp peanut butter",
      "1 tbsp soy sauce",
      "1 lime, juiced"
    ].map(parseIngredientLine),
    instructions: [
      "Boil noodles for 8 minutes, then rinse cold.",
      "Whisk peanut butter, soy sauce, and lime.",
      "Toss noodles with herbs, cucumber, and dressing."
    ].map((text, index) => ({
      id: createId("instruction"),
      stepNumber: index + 1,
      text,
      hasTimer: index === 0,
      timerSeconds: index === 0 ? 480 : null
    })),
    equipment: [
      { id: createId("equipment"), name: "mixing bowl" },
      { id: createId("equipment"), name: "whisk" }
    ],
    photos: [
      {
        id: createId("photo"),
        photoUrl: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80",
        isCoverPhoto: true,
        createdAt: now
      }
    ],
    tags: ["Fresh & Healthy", "Quick Meals", "Late Night Cravings"],
    createdAt: now
  },
  {
    id: "recipe_lilac_cake",
    title: "Lilac Vanilla Snack Cake",
    description: "A small soft cake with vanilla crumb, pale lilac glaze, and tiny berry pockets.",
    servings: 8,
    estimatedPrepTimeMinutes: 18,
    estimatedCookTimeMinutes: 32,
    estimatedTotalTimeMinutes: 50,
    actualTotalTimeMinutes: 55,
    actualTimeNotes: "Let glaze set longer next time.",
    ingredients: [
      "1 1/4 cups flour",
      "3/4 cup sugar",
      "1/2 cup butter",
      "2 eggs",
      "1/2 cup milk",
      "1 cup berries"
    ].map(parseIngredientLine),
    instructions: [
      "Cream butter and sugar until fluffy.",
      "Fold in dry ingredients and berries.",
      "Bake for 32 minutes.",
      "Cool for 20 minutes before glazing."
    ].map((text, index) => ({
      id: createId("instruction"),
      stepNumber: index + 1,
      text,
      hasTimer: index >= 2,
      timerSeconds: index === 2 ? 1920 : index === 3 ? 1200 : null
    })),
    equipment: [
      { id: createId("equipment"), name: "stand mixer" },
      { id: createId("equipment"), name: "sheet pan" }
    ],
    photos: [
      {
        id: createId("photo"),
        photoUrl: "https://images.unsplash.com/photo-1464195244916-405fa0a82545?auto=format&fit=crop&w=1200&q=80",
        isCoverPhoto: true,
        createdAt: now
      }
    ],
    tags: ["Desserts", "Comfort Food", "Date Night"],
    createdAt: now
  }
];
