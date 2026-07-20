import {
  ArrowLeft,
  Check,
  Copy,
  Heart,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { useData } from "../context/DataContext";
import { formatAmount } from "../utils/ingredients";

export function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    recipes,
    favoriteLists,
    memberships,
    duplicateRecipe,
    deleteRecipe,
    toggleFavoriteMembership,
    createFavoriteList,
  } = useData();
  const recipe = recipes.find((item) => item.id === id);
  const [favoriteOpen, setFavoriteOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [working, setWorking] = useState(false);

  if (!recipe) {
    return (
      <div className="content-page">
        <EmptyState
          title="没有找到这道菜"
          description="它可能已经被删除。"
          action={
            <Link className="secondary-button" to="/">
              <ArrowLeft size={18} />
              返回主页
            </Link>
          }
        />
      </div>
    );
  }

  const listCount = favoriteLists.filter((list) =>
    memberships.some((item) => item.list_id === list.id && item.recipe_id === recipe.id),
  ).length;

  const handleDuplicate = async () => {
    setWorking(true);
    try {
      const duplicate = await duplicateRecipe(recipe.id);
      navigate(`/recipe/${duplicate.id}/edit`);
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`确定删除“${recipe.title}”吗？此操作无法撤销。`)) return;
    await deleteRecipe(recipe.id);
    navigate("/");
  };

  const addList = async () => {
    const name = newListName.trim();
    if (!name) return;
    const list = await createFavoriteList(name);
    await toggleFavoriteMembership(list.id, recipe.id);
    setNewListName("");
  };

  return (
    <article className="detail-page">
      <div className="detail-hero">
        <div className="detail-topbar">
          <button className="glass-button" onClick={() => navigate(-1)}>
            <ArrowLeft size={19} />
            返回
          </button>
          <div className="detail-hero-actions">
            <button className="glass-button icon-only-mobile" onClick={() => setFavoriteOpen(true)}>
              <Heart size={19} fill={listCount ? "currentColor" : "none"} />
              <span>{listCount ? `已存入 ${listCount} 个收藏夹` : "收藏"}</span>
            </button>
            <Link className="glass-button" to={`/recipe/${recipe.id}/edit`}>
              <Pencil size={18} />
              <span>编辑</span>
            </Link>
          </div>
        </div>
        <div className="detail-heading">
          <h1>{recipe.title}</h1>
        </div>
      </div>

      <div className="detail-content">
        <section className="ingredient-section">
          <div className="section-heading">
            <span className="section-index">01</span>
            <div>
              <h2>备料</h2>
              <p>主料与辅料分开，一眼看清</p>
            </div>
          </div>
          <div className="ingredient-group">
            <h3>主料</h3>
            <div className="ingredient-flow">
              {recipe.main_ingredients.map((ingredient) => {
                const amount = formatAmount(ingredient);
                return (
                  <span className="ingredient-chip main" key={ingredient.id}>
                    <strong>{ingredient.name}</strong>
                    {amount && <em>{amount}</em>}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="ingredient-group">
            <h3>辅料</h3>
            <div className="ingredient-flow">
              {recipe.seasonings.map((ingredient) => {
                const amount = formatAmount(ingredient);
                return (
                  <span className="ingredient-chip" key={ingredient.id}>
                    <strong>{ingredient.name}</strong>
                    {amount && <em>{amount}</em>}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        <section className="steps-section">
          <div className="section-heading">
            <span className="section-index">02</span>
            <div>
              <h2>制作</h2>
              <p>按顺序完成每一个阶段</p>
            </div>
          </div>
          <ol className="steps-list">
            {recipe.steps.map((step, index) => (
              <li key={`${recipe.id}-step-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="danger-actions">
          <button className="secondary-button" onClick={() => void handleDuplicate()} disabled={working}>
            <Copy size={17} />
            {working ? "复制中..." : "复制菜谱"}
          </button>
          <button className="text-danger-button" onClick={() => void handleDelete()}>
            <Trash2 size={17} />
            删除菜谱
          </button>
        </div>
      </div>

      <Modal
        open={favoriteOpen}
        onClose={() => setFavoriteOpen(false)}
        title="选择收藏夹"
        sheet
      >
        <div className="favorite-picker">
          {favoriteLists.length ? (
            favoriteLists.map((list) => {
              const checked = memberships.some(
                (item) => item.list_id === list.id && item.recipe_id === recipe.id,
              );
              const count = memberships.filter((item) => item.list_id === list.id).length;
              return (
                <button
                  key={list.id}
                  className={checked ? "checked" : ""}
                  onClick={() => void toggleFavoriteMembership(list.id, recipe.id)}
                >
                  <span>
                    <strong>{list.name}</strong>
                    <small>{count} 道菜</small>
                  </span>
                  <span className="check-indicator">{checked && <Check size={16} />}</span>
                </button>
              );
            })
          ) : (
            <p className="muted-copy">还没有收藏夹，请先在下方创建一个。</p>
          )}
          <form
            className="inline-create"
            onSubmit={(event) => {
              event.preventDefault();
              void addList();
            }}
          >
            <input
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="新收藏夹名称"
            />
            <button className="secondary-button" disabled={!newListName.trim()}>
              新建并收藏
            </button>
          </form>
        </div>
      </Modal>
    </article>
  );
}
