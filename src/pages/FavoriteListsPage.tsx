import { FolderHeart, Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/PageHeader";
import { useData } from "../context/DataContext";
import type { FavoriteList } from "../types";

export function FavoriteListsPage() {
  const {
    favoriteLists,
    memberships,
    createFavoriteList,
    renameFavoriteList,
    deleteFavoriteList,
  } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FavoriteList | null>(null);
  const [name, setName] = useState("");

  const openCreate = () => {
    setEditing(null);
    setName("");
    setModalOpen(true);
  };

  const openEdit = (list: FavoriteList) => {
    setEditing(list);
    setName(list.name);
    setModalOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    if (editing) await renameFavoriteList(editing.id, cleanName);
    else await createFavoriteList(cleanName);
    setModalOpen(false);
  };

  const remove = async (list: FavoriteList) => {
    if (!window.confirm(`删除收藏夹“${list.name}”？菜谱本身不会被删除。`)) return;
    await deleteFavoriteList(list.id);
  };

  return (
    <div className="content-page management-page">
      <PageHeader
        back
        eyebrow="多收藏夹"
        title="管理收藏夹"
        description="按一周计划、场景或口味整理菜谱"
        actions={
          <button className="primary-button" onClick={openCreate}>
            <Plus size={18} />
            新建收藏夹
          </button>
        }
      />

      {favoriteLists.length ? (
        <section className="management-list" aria-label="收藏夹列表">
          {favoriteLists.map((list, index) => {
            const count = memberships.filter((item) => item.list_id === list.id).length;
            return (
              <div className="management-row" key={list.id}>
                <span className="management-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="management-icon favorite">
                  <FolderHeart size={20} />
                </span>
                <div className="management-copy">
                  <Link to={`/favorites/${list.id}`}>{list.name}</Link>
                  <span>{count} 道菜谱</span>
                </div>
                <div className="management-actions">
                  <button className="icon-button" title="重命名" onClick={() => openEdit(list)}>
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button danger-icon"
                    title="删除收藏夹"
                    onClick={() => void remove(list)}
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
          title="还没有收藏夹"
          description="创建一个收藏夹，开始规划下一顿饭。"
          action={
            <button className="primary-button" onClick={openCreate}>
              <Plus size={18} />
              新建收藏夹
            </button>
          }
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "重命名收藏夹" : "新建收藏夹"}
        footer={
          <>
            <button className="secondary-button" onClick={() => setModalOpen(false)}>
              取消
            </button>
            <button className="primary-button" onClick={() => document.getElementById("list-form-submit")?.click()}>
              {editing ? "保存名称" : "创建收藏夹"}
            </button>
          </>
        }
      >
        <form className="modal-form" onSubmit={submit}>
          <label className="field">
            <span>收藏夹名称</span>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：本周晚餐"
              maxLength={24}
            />
          </label>
          <button id="list-form-submit" className="visually-hidden" />
        </form>
      </Modal>
    </div>
  );
}
