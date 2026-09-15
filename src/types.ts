export type Ingredient = {
  id: string;
  name: string;
  amount: number | null;
  unit: string;
};

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category_id: string | null;
  image_url: string;
  prep_time: number;
  servings: number;
  main_ingredients: Ingredient[];
  seasonings: Ingredient[];
  steps: string[];
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type FavoriteList = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type FavoriteMembership = {
  list_id: string;
  recipe_id: string;
  sort_order?: number;
};

export type AppSnapshot = {
  recipes: Recipe[];
  categories: Category[];
  favoriteLists: FavoriteList[];
  memberships: FavoriteMembership[];
};

export type RecipeDraft = Omit<
  Recipe,
  "id" | "user_id" | "created_at" | "updated_at" | "is_favorite"
>;
