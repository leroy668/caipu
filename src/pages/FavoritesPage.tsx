import {
  Check,
  ChevronDown,
  CircleCheck,
  FolderHeart,
  Settings2,
  ShoppingBasket,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { useData } from "../context/DataContext";
import {
  aggregateMainIngredients,
  aggregateSeasonings,
  formatAmount,
} from "../utils/ingredients";

export function FavoritesPage() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const {
    favoriteLists,
    memberships,
    recipes,
    removeFavoriteMembership,
    clearFavoriteList,
  } = useData();
  const activeList =
    favoriteLists.find((list) => list.id === listId) ?? favoriteLists[0] ?? null;
  const purchaseStorageKey = activeList ? `shiji-purchased-${activeList.id}` : "";
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [removingRecipeId, setRemovingRecipeId] = useState<string | null>(null);
  const [clearingList, setClearingList] = useState(false);
  const [membershipError, setMembershipError] = useState("");

  useEffect(() => {
    if (!activeList) return;
    if (listId !== activeList.id) navigate(`/favorites/${activeList.id}`, { replace: true });
  }, [activeList, listId, navigate]);

  useEffect(() => {
    if (!purchaseStorageKey) {
      setPurchased(new Set());
      return;
    }
    try {
      setPurchased(new Set(JSON.parse(localStorage.getItem(purchaseStorageKey) ?? "[]")));
    } catch {
      setPurchased(new Set());
    }
  }, [purchaseStorageKey]);

  const listRecipes = useMemo(() => {
    if (!activeList) return [];
    const ids = new Set(
      memberships.filter((item) => item.list_id === activeList.id).map((item) => item.recipe_id),
    );
    return recipes.filter((recipe) => ids.has(recipe.id));
  }, [activeList, memberships, recipes]);

  const mainIngredients = useMemo(() => aggregateMainIngredients(listRecipes), [listRecipes]);
  const seasonings = useMemo(() => aggregateSeasonings(listRecipes), [listRecipes]);
  const totalItems = mainIngredients.length + seasonings.length;

  const togglePurchased = (key: string) => {
    setPurchased((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem(purchaseStorageKey, JSON.stringify([...next]));
      return next;
    });
  };

  const removeRecipe = async (recipeId: string, title: string) => {
    if (!activeList || removingRecipeId || clearingList) return;
    if (!window.confirm(`将“${title}”移出采购吗？菜谱本身不会被删除。`)) return;
    setMembershipError("");
    setRemovingRecipeId(recipeId);
    try {
      await removeFavoriteMembership(activeList.id, recipeId);
      const remainingRecipes = listRecipes.filter((recipe) => recipe.id !== recipeId);
      const remainingKeys = new Set([
        ...aggregateMainIngredients(remainingRecipes).map((ingredient) => `main:${ingredient.key}`),
        ...aggregateSeasonings(remainingRecipes).map((ingredient) => `seasoning:${ingredient.key}`),
      ]);
      setPurchased((current) => {
        const next = new Set([...current].filter((key) => remainingKeys.has(key)));
        if (purchaseStorageKey) {
          if (next.size) localStorage.setItem(purchaseStorageKey, JSON.stringify([...next]));
          else localStorage.removeItem(purchaseStorageKey);
        }
        return next;
      });
    } catch (error) {
      setMembershipError(error instanceof Error ? error.message : "移出采购失败，请稍后重试。");
    } finally {
      setRemovingRecipeId(null);
    }
  };

  const clearListRecipes = async () => {
    if (!activeList || !listRecipes.length || clearingList || removingRecipeId) return;
    if (!window.confirm(`清空收藏夹“${activeList.name}”里的全部采购菜谱吗？菜谱本身不会被删除。`)) {
      return;
    }
    setMembershipError("");
    setClearingList(true);
    try {
      await clearFavoriteList(activeList.id);
      setPurchased(new Set());
      if (purchaseStorageKey) localStorage.removeItem(purchaseStorageKey);
    } catch (error) {
      setMembershipError(error instanceof Error ? error.message : "清空采购失败，请稍后重试。");
    } finally {
      setClearingList(false);
    }
  };

  return (
    <div className="content-page favorites-page">
      <PageHeader
        eyebrow="智能采购清单"
        title="收藏与采购"
        description="合并需要购买的主料，记下别忘了带的辅料"
        actions={
          <Link to="/favorite-lists" className="secondary-button desktop-only">
            <Settings2 size={17} />
            管理收藏夹
          </Link>
        }
      />

      {favoriteLists.length ? (
        <>
          <section className="favorite-list-switcher">
            <label>
              <FolderHeart size={18} />
              <select
                value={activeList?.id}
                onChange={(event) => navigate(`/favorites/${event.target.value}`)}
              >
                {favoriteLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={17} />
            </label>
            <div className="list-stat">
              <strong>{listRecipes.length}</strong>
              <span>道菜</span>
              <i />
              <strong>{totalItems}</strong>
              <span>项材料</span>
            </div>
          </section>

          {listRecipes.length ? (
            <div className="favorites-layout">
              <div className="shopping-summary">
                <div className="shopping-summary-heading">
                  <div>
                    <h2>采购清单</h2>
                    <p>点击材料标记已购</p>
                  </div>
                  <button
                    type="button"
                    className="clear-purchase-list-button"
                    onClick={() => void clearListRecipes()}
                    disabled={clearingList || Boolean(removingRecipeId)}
                  >
                    <Trash2 size={16} />
                    {clearingList ? "清空中..." : "一键清空"}
                  </button>
                </div>
                {membershipError && (
                  <p className="shopping-error" role="alert">
                    {membershipError}
                  </p>
                )}
                <section className="shopping-section">
                  <div className="shopping-heading">
                    <div>
                      <span className="shopping-icon main">
                        <ShoppingBasket size={18} />
                      </span>
                      <div>
                        <h2>主料汇总</h2>
                        <p>相同材料已自动累加</p>
                      </div>
                    </div>
                    <span>{mainIngredients.length} 项</span>
                  </div>
                  <div className="shopping-grid">
                    {mainIngredients.map((ingredient) => {
                      const key = `main:${ingredient.key}`;
                      const checked = purchased.has(key);
                      return (
                        <button
                          key={key}
                          className={`shopping-item${checked ? " purchased" : ""}`}
                          onClick={() => togglePurchased(key)}
                        >
                          <span className="shopping-checkbox">{checked && <Check size={14} />}</span>
                          <span>
                            <strong>{ingredient.name}</strong>
                            <em>
                              {formatAmount({
                                id: key,
                                name: ingredient.name,
                                amount: ingredient.amount,
                                unit: ingredient.unit,
                              })}
                            </em>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="shopping-section">
                  <div className="shopping-heading">
                    <div>
                      <span className="shopping-icon seasoning">
                        <CircleCheck size={18} />
                      </span>
                      <div>
                        <h2>辅料频次</h2>
                        <p>按菜谱出现次数统计</p>
                      </div>
                    </div>
                    <span>{seasonings.length} 项</span>
                  </div>
                  <div className="shopping-grid">
                    {seasonings.map((ingredient) => {
                      const key = `seasoning:${ingredient.key}`;
                      const checked = purchased.has(key);
                      return (
                        <button
                          key={key}
                          className={`shopping-item${checked ? " purchased" : ""}`}
                          onClick={() => togglePurchased(key)}
                        >
                          <span className="shopping-checkbox">{checked && <Check size={14} />}</span>
                          <span>
                            <strong>{ingredient.name}</strong>
                            <em>×{ingredient.count}</em>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

              </div>

              <aside className="favorite-recipes">
                <div className="favorite-recipes-heading">
                  <h2>本夹菜谱</h2>
                  <span>{listRecipes.length}</span>
                </div>
                <div className="compact-recipe-list">
                  {listRecipes.map((recipe) => (
                    <div className="compact-recipe-row" key={recipe.id}>
                      <Link to={`/recipe/${recipe.id}`}>
                        <div className="compact-recipe-image">
                          {recipe.image_url ? <img src={recipe.image_url} alt="" /> : recipe.title[0]}
                        </div>
                        <div className="compact-recipe-copy">
                          <strong>{recipe.title}</strong>
                        </div>
                      </Link>
                      <button
                        type="button"
                        className="compact-recipe-remove"
                        title="移出采购"
                        aria-label={`移出采购：${recipe.title}`}
                        disabled={clearingList || Boolean(removingRecipeId)}
                        onClick={() => void removeRecipe(recipe.id, recipe.title)}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          ) : (
            <EmptyState
              title="这个收藏夹还是空的"
              description="打开菜谱详情，点击收藏后选择这个收藏夹。"
              action={
                <Link className="primary-button" to="/">
                  去选菜谱
                </Link>
              }
            />
          )}
        </>
      ) : (
        <EmptyState
          title="还没有收藏夹"
          description="先创建一个收藏夹，再把想做的菜归进来。"
          action={
            <Link className="primary-button" to="/favorite-lists">
              <FolderHeart size={18} />
              创建收藏夹
            </Link>
          }
        />
      )}
    </div>
  );
}
