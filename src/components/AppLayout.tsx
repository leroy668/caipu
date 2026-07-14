import {
  BookOpen,
  ChefHat,
  FolderHeart,
  Heart,
  LogOut,
  Plus,
  Tags,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "菜谱", icon: BookOpen, end: true },
  { to: "/favorites", label: "采购", icon: Heart },
  { to: "/favorite-lists", label: "收藏夹", icon: FolderHeart },
  { to: "/categories", label: "分类", icon: Tags },
];

export function AppLayout() {
  const { isDemo, signOut, user } = useAuth();
  const location = useLocation();
  const isEditor = location.pathname.includes("/edit") || location.pathname === "/recipe/new";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="食记首页">
          <span className="brand-mark">
            <ChefHat size={23} strokeWidth={1.8} />
          </span>
          <span>
            <strong>食记</strong>
            <small>私人菜谱</small>
          </span>
        </NavLink>

        <nav className="side-nav" aria-label="主导航">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <NavLink to="/recipe/new" className="primary-button sidebar-create">
            <Plus size={18} />
            新建菜谱
          </NavLink>
          <div className="user-summary">
            <span className="user-avatar">{user?.email?.slice(0, 1).toUpperCase() ?? "食"}</span>
            <span className="user-copy">
              <strong>{isDemo ? "演示厨房" : user?.email}</strong>
              <small>{isDemo ? "数据保存在本机" : "Supabase 已同步"}</small>
            </span>
            {!isDemo && (
              <button className="icon-button" onClick={() => void signOut()} title="退出登录">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {!isEditor && (
        <NavLink className="floating-create" to="/recipe/new" title="新建菜谱">
          <Plus size={24} />
        </NavLink>
      )}

      <nav className="bottom-nav" aria-label="移动端导航">
        {navItems.slice(0, 4).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
