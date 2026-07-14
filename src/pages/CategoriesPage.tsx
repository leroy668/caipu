import { ChevronDown, ChevronUp, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { useData } from "../context/DataContext";
import type { Category } from "../types";

export function CategoriesPage() {
  const {
    categories,
    recipes,
    createCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
  } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [moving, setMoving] = useState("");

  const openCreate = () => {
    setEditing(null);
    setName("");
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setModalOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    if (editing) await renameCategory(editing.id, cleanName);
    else await createCategory(cleanName);
    setModalOpen(false);
  };

  const move = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const ordered = [...categories];
    [ordered[index], ordered[targetIndex]] = [ordered[targetIndex], ordered[index]];
    setMoving(categories[index].id);
    try {
      await reorderCategories(ordered);
    } finally {
      setMoving("");
    }
  };

  const remove = async (category: Category) => {
    const count = recipes.filter((recipe) => recipe.category_id === category.id).length;
    const message = count
      ? `删除“${category.name}”后，其中 ${count} 道菜谱会变为未分类。继续吗？`
      : `确定删除分类“${category.name}”吗？`;
    if (!window.confirm(message)) return;
    await deleteCategory(category.id);
  };

  return (
    <div className="content-page management-page">
      <PageHeader
        back
        eyebrow="分类与顺序"
        title="管理分类"
        description="调整顺序后，首页筛选栏会同步更新"
        actions={
          <button className="primary-button" onClick={openCreate}>
            <Plus size={18} />
            新建分类
          </button>
        }
      />

      {categories.length ? (
        <section className="management-list" aria-label="分类列表">
          {categories.map((category, index) => {
            const count = recipes.filter((recipe) => recipe.category_id === category.id).length;
            return (
              <div
                className={`management-row${moving === category.id ? " moving" : ""}`}
                key={category.id}
              >
                <span className="management-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="management-icon category">
                  <Tags size={20} />
                </span>
                <div className="management-copy">
                  <strong>{category.name}</strong>
                  <span>{count} 道菜谱</span>
                </div>
                <div className="reorder-controls">
                  <button
                    className="icon-button"
                    title="上移"
                    disabled={index === 0 || Boolean(moving)}
                    onClick={() => void move(index, -1)}
                  >
                    <ChevronUp size={18} />
                  </button>
                  <button
                    className="icon-button"
                    title="下移"
                    disabled={index === categories.length - 1 || Boolean(moving)}
                    onClick={() => void move(index, 1)}
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
                <div className="management-actions">
                  <button className="icon-button" title="重命名" onClick={() => openEdit(category)}>
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button danger-icon"
                    title="删除分类"
                    onClick={() => void remove(category)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <EmptyState
          title="还没有分类"
          description="用分类快速筛选不同类型的菜谱。"
          action={
            <button className="primary-button" onClick={openCreate}>
              <Plus size={18} />
              新建分类
            </button>
          }
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "重命名分类" : "新建分类"}
        footer={
          <>
            <button className="secondary-button" onClick={() => setModalOpen(false)}>
              取消
            </button>
            <button
              className="primary-button"
              onClick={() => document.getElementById("category-form-submit")?.click()}
            >
              {editing ? "保存名称" : "创建分类"}
            </button>
          </>
        }
      >
        <form className="modal-form" onSubmit={submit}>
          <label className="field">
            <span>分类名称</span>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：快手家常"
              maxLength={20}
            />
          </label>
          <button id="category-form-submit" className="visually-hidden" />
        </form>
      </Modal>
    </div>
  );
}
