export type ThemeTag =
  | "Late Night Cravings"
  | "Fresh & Healthy"
  | "Chicken"
  | "Cozy Dinner"
  | "Quick Meals"
  | "Desserts"
  | "Date Night"
  | "One-Pan"
  | "Comfort Food";

export type Ingredient = {
  id: string;
  recipeId?: string;
  name: string;
  quantity: number | null;
  unit: string;
  originalText: string;
  scalable: boolean;
};

export type Instruction = {
  id: string;
  recipeId?: string;
  stepNumber: number;
  text: string;
  hasTimer: boolean;
  timerSeconds: number | null;
};

export type Equipment = {
  id: string;
  recipeId?: string;
  name: string;
  notes?: string;
};

export type RecipePhoto = {
  id: string;
  recipeId?: string;
  photoUrl: string;
  isCoverPhoto: boolean;
  createdAt: string;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  servings: number;
  estimatedPrepTimeMinutes: number;
  estimatedCookTimeMinutes: number;
  estimatedTotalTimeMinutes: number;
  actualTotalTimeMinutes: number | null;
  actualTimeNotes: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  equipment: Equipment[];
  photos: RecipePhoto[];
  tags: string[];
  createdAt: string;
};

export type RecipeDraft = Omit<Recipe, "id" | "createdAt"> & {
  id?: string;
};

export type TimerState = {
  id: string;
  label: string;
  initialSeconds: number;
  remainingSeconds: number;
  running: boolean;
  finished: boolean;
};
