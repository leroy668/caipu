import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { demoSnapshot } from "../data/demo";
import { supabase } from "../lib/supabase";
import type {
  AppSnapshot,
  Category,
  FavoriteList,
  Recipe,
  RecipeDraft,
} from "../types";
import { useAuth } from "./AuthContext";

const STORAGE_KEY = "shiji-cookbook-v2";

type DataContextValue = AppSnapshot & {
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  createRecipe: (draft: RecipeDraft) => Promise<Recipe>;
  updateRecipe: (id: string, draft: RecipeDraft) => Promise<Recipe>;
  deleteRecipe: (id: string) => Promise<void>;
  duplicateRecipe: (id: string) => Promise<Recipe>;
  uploadRecipeImage: (file: File) => Promise<string>;
  createCategory: (name: string) => Promise<Category>;
  renameCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (categories: Category[]) => Promise<void>;
  createFavoriteList: (name: string) => Promise<FavoriteList>;
  renameFavoriteList: (id: string, name: string) => Promise<void>;
  deleteFavoriteList: (id: string) => Promise<void>;
  toggleFavoriteMembership: (listId: string, recipeId: string) => Promise<void>;
};

const DataContext = createContext<DataContextValue | null>(null);

const cloneDemo = () => structuredClone(demoSnapshot);

const readLocalSnapshot = (): AppSnapshot => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : cloneDemo();
  } catch {
    return cloneDemo();
  }
};

const randomId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, isDemo } = useAuth();
  const [snapshot, setSnapshot] = useState<AppSnapshot>(() =>
    typeof window === "undefined" ? cloneDemo() : readLocalSnapshot(),
  );
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState("");

  const commitLocal = (updater: (current: AppSnapshot) => AppSnapshot) => {
    setSnapshot((current) => {
      const next = updater(current);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const refresh = useCallback(async () => {
    if (isDemo || !supabase || !user) {
      setSnapshot(readLocalSnapshot());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const [recipesResult, categoriesResult, listsResult, membershipsResult] =
      await Promise.all([
        supabase.from("recipes").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("favorite_lists").select("*").order("created_at"),
        supabase.from("favorite_list_recipes").select("list_id, recipe_id"),
      ]);

    const firstError =
      recipesResult.error ??
      categoriesResult.error ??
      listsResult.error ??
      membershipsResult.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setSnapshot({
      recipes: (recipesResult.data ?? []) as Recipe[],
      categories: (categoriesResult.data ?? []) as Category[],
      favoriteLists: (listsResult.data ?? []) as FavoriteList[],
      memberships: membershipsResult.data ?? [],
    });
    setLoading(false);
  }, [isDemo, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createRecipe = async (draft: RecipeDraft) => {
    const stamp = new Date().toISOString();
    if (isDemo || !supabase || !user) {
      const recipe: Recipe = {
        ...draft,
        id: randomId("recipe"),
        user_id: user?.id ?? "demo-user",
        created_at: stamp,
        updated_at: stamp,
      };
      commitLocal((current) => ({ ...current, recipes: [recipe, ...current.recipes] }));
      return recipe;
    }

    const { data, error: insertError } = await supabase
      .from("recipes")
      .insert({ ...draft, user_id: user.id })
      .select()
      .single();
    if (insertError) throw insertError;
    setSnapshot((current) => ({ ...current, recipes: [data as Recipe, ...current.recipes] }));
    return data as Recipe;
  };

  const updateRecipe = async (id: string, draft: RecipeDraft) => {
    const updated_at = new Date().toISOString();
    if (isDemo || !supabase) {
      let updated: Recipe | undefined;
      commitLocal((current) => ({
        ...current,
        recipes: current.recipes.map((recipe) => {
          if (recipe.id !== id) return recipe;
          updated = { ...recipe, ...draft, updated_at };
          return updated;
        }),
      }));
      if (!updated) throw new Error("菜谱不存在");
      return updated;
    }

    const { data, error: updateError } = await supabase
      .from("recipes")
      .update({ ...draft, updated_at })
      .eq("id", id)
      .select()
      .single();
    if (updateError) throw updateError;
    setSnapshot((current) => ({
      ...current,
      recipes: current.recipes.map((recipe) => (recipe.id === id ? (data as Recipe) : recipe)),
    }));
    return data as Recipe;
  };

  const deleteRecipe = async (id: string) => {
    if (!isDemo && supabase) {
      const { error: deleteError } = await supabase.from("recipes").delete().eq("id", id);
      if (deleteError) throw deleteError;
    }
    const update = (current: AppSnapshot): AppSnapshot => ({
      ...current,
      recipes: current.recipes.filter((recipe) => recipe.id !== id),
      memberships: current.memberships.filter((item) => item.recipe_id !== id),
    });
    if (isDemo) commitLocal(update);
    else setSnapshot(update);
  };

  const duplicateRecipe = async (id: string) => {
    const source = snapshot.recipes.find((recipe) => recipe.id === id);
    if (!source) throw new Error("菜谱不存在");
    return createRecipe({
      title: `${source.title}（副本）`,
      description: source.description,
      category_id: source.category_id,
      image_url: source.image_url,
      prep_time: source.prep_time,
      servings: source.servings,
      main_ingredients: source.main_ingredients.map((item) => ({
        ...item,
        id: randomId("ingredient"),
      })),
      seasonings: source.seasonings.map((item) => ({
        ...item,
        id: randomId("seasoning"),
      })),
      steps: [...source.steps],
    });
  };

  const uploadRecipeImage = async (file: File) => {
    if (isDemo || !supabase || !user) {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("无法读取图片"));
        reader.readAsDataURL(file);
      });
    }
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("recipe-images")
      .upload(filePath, file, { upsert: false });
    if (uploadError) throw uploadError;
    return supabase.storage.from("recipe-images").getPublicUrl(filePath).data.publicUrl;
  };

  const createCategory = async (name: string) => {
    const category: Category = {
      id: randomId("category"),
      user_id: user?.id ?? "demo-user",
      name,
      sort_order: snapshot.categories.length,
      created_at: new Date().toISOString(),
    };
    if (!isDemo && supabase && user) {
      const { data, error: insertError } = await supabase
        .from("categories")
        .insert({ user_id: user.id, name, sort_order: category.sort_order })
        .select()
        .single();
      if (insertError) throw insertError;
      Object.assign(category, data);
    }
    const update = (current: AppSnapshot): AppSnapshot => ({
      ...current,
      categories: [...current.categories, category],
    });
    if (isDemo) commitLocal(update);
    else setSnapshot(update);
    return category;
  };

  const renameCategory = async (id: string, name: string) => {
    if (!isDemo && supabase) {
      const { error: updateError } = await supabase.from("categories").update({ name }).eq("id", id);
      if (updateError) throw updateError;
    }
    const update = (current: AppSnapshot): AppSnapshot => ({
      ...current,
      categories: current.categories.map((item) => (item.id === id ? { ...item, name } : item)),
    });
    if (isDemo) commitLocal(update);
    else setSnapshot(update);
  };

  const deleteCategory = async (id: string) => {
    if (!isDemo && supabase) {
      const { error: deleteError } = await supabase.from("categories").delete().eq("id", id);
      if (deleteError) throw deleteError;
    }
    const update = (current: AppSnapshot): AppSnapshot => ({
      ...current,
      categories: current.categories.filter((item) => item.id !== id),
      recipes: current.recipes.map((recipe) =>
        recipe.category_id === id ? { ...recipe, category_id: null } : recipe,
      ),
    });
    if (isDemo) commitLocal(update);
    else setSnapshot(update);
  };

  const reorderCategories = async (ordered: Category[]) => {
    const reordered = ordered.map((item, index) => ({ ...item, sort_order: index }));
    if (!isDemo && supabase) {
      const { error: reorderError } = await supabase.rpc("reorder_categories", {
        ordered_ids: reordered.map((item) => item.id),
      });
      if (reorderError) throw reorderError;
    }
    const update = (current: AppSnapshot): AppSnapshot => ({
      ...current,
      categories: reordered,
    });
    if (isDemo) commitLocal(update);
    else setSnapshot(update);
  };

  const createFavoriteList = async (name: string) => {
    const favoriteList: FavoriteList = {
      id: randomId("list"),
      user_id: user?.id ?? "demo-user",
      name,
      created_at: new Date().toISOString(),
    };
    if (!isDemo && supabase && user) {
      const { data, error: insertError } = await supabase
        .from("favorite_lists")
        .insert({ user_id: user.id, name })
        .select()
        .single();
      if (insertError) throw insertError;
      Object.assign(favoriteList, data);
    }
    const update = (current: AppSnapshot): AppSnapshot => ({
      ...current,
      favoriteLists: [...current.favoriteLists, favoriteList],
    });
    if (isDemo) commitLocal(update);
    else setSnapshot(update);
    return favoriteList;
  };

  const renameFavoriteList = async (id: string, name: string) => {
    if (!isDemo && supabase) {
      const { error: updateError } = await supabase
        .from("favorite_lists")
        .update({ name })
        .eq("id", id);
      if (updateError) throw updateError;
    }
    const update = (current: AppSnapshot): AppSnapshot => ({
      ...current,
      favoriteLists: current.favoriteLists.map((item) =>
        item.id === id ? { ...item, name } : item,
      ),
    });
    if (isDemo) commitLocal(update);
    else setSnapshot(update);
  };

  const deleteFavoriteList = async (id: string) => {
    if (!isDemo && supabase) {
      const { error: deleteError } = await supabase.from("favorite_lists").delete().eq("id", id);
      if (deleteError) throw deleteError;
    }
    const update = (current: AppSnapshot): AppSnapshot => ({
      ...current,
      favoriteLists: current.favoriteLists.filter((item) => item.id !== id),
      memberships: current.memberships.filter((item) => item.list_id !== id),
    });
    if (isDemo) commitLocal(update);
    else setSnapshot(update);
  };

  const toggleFavoriteMembership = async (listId: string, recipeId: string) => {
    const exists = snapshot.memberships.some(
      (item) => item.list_id === listId && item.recipe_id === recipeId,
    );
    if (!isDemo && supabase) {
      const result = exists
        ? await supabase
            .from("favorite_list_recipes")
            .delete()
            .eq("list_id", listId)
            .eq("recipe_id", recipeId)
        : await supabase
            .from("favorite_list_recipes")
            .insert({ list_id: listId, recipe_id: recipeId });
      if (result.error) throw result.error;
    }
    const update = (current: AppSnapshot): AppSnapshot => ({
      ...current,
      memberships: exists
        ? current.memberships.filter(
            (item) => !(item.list_id === listId && item.recipe_id === recipeId),
          )
        : [...current.memberships, { list_id: listId, recipe_id: recipeId }],
    });
    if (isDemo) commitLocal(update);
    else setSnapshot(update);
  };

  const value: DataContextValue = {
    ...snapshot,
    loading,
    error,
    refresh,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    duplicateRecipe,
    uploadRecipeImage,
    createCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
    createFavoriteList,
    renameFavoriteList,
    deleteFavoriteList,
    toggleFavoriteMembership,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used inside DataProvider");
  return context;
}
