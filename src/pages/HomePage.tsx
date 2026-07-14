import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { RecipeCard } from "../components/RecipeCard";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export function HomePage() {
  const { recipes, categories, loading, error } = useData();
  const { isDemo } = useAuth();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  const filteredRecipes = useMemo(
    () =>
      recipes.filter((recipe) => {
        const matchesQuery = recipe.title.toLowerCase().includes(query.trim().toLowerCase());
        const matchesCategory = categoryId === "all" || recipe.category_id === categoryId;
        return matchesQuery && matchesCategory;
      }),
    [recipes, query, categoryId],
  );

  return (
    <div className="content-page">
      <PageHeader
        eyebrow={isDemo ? "演示模式 · 数据保存在当前浏览器" : "云端已同步"}
        title="今天做什么？"
        description={`共收录 ${recipes.length} 道菜谱`}
        actions={
          <Link to="/recipe/new" className="primary-button desktop-only">
            <Plus size={18} />
            新建菜谱
          </Link>
        }
      />

      <section className="filter-bar" aria-label="筛选菜谱">
        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索菜名"
          />
        </label>
        <div className="category-tabs">
          <SlidersHorizontal size={17} className="category-filter-icon" />
          <button className={categoryId === "all" ? "active" : ""} onClick={() => setCategoryId("all")}>
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={categoryId === category.id ? "active" : ""}
              onClick={() => setCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="recipe-grid skeleton-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="recipe-card skeleton" key={index} />
          ))}
        </div>
      ) : filteredRecipes.length ? (
        <section className="recipe-grid" aria-label="菜谱列表">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </section>
      ) : (
        <EmptyState
          title={recipes.length ? "没有匹配的菜谱" : "还没有菜谱"}
          description={recipes.length ? "换个关键词或分类试试。" : "从一道常做的家常菜开始记录。"}
          action={
            !recipes.length ? (
              <Link to="/recipe/new" className="primary-button">
                <Plus size={18} />
                新建菜谱
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
