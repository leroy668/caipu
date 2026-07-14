import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { useAuth } from "./context/AuthContext";
import { CategoriesPage } from "./pages/CategoriesPage";
import { DetailPage } from "./pages/DetailPage";
import { EditorPage } from "./pages/EditorPage";
import { FavoriteListsPage } from "./pages/FavoriteListsPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader" aria-live="polite">
        <span className="loader-mark">食</span>
        <p>正在整理厨房...</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/recipe/new" element={<EditorPage />} />
        <Route path="/recipe/:id" element={<DetailPage />} />
        <Route path="/recipe/:id/edit" element={<EditorPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/favorites/:listId" element={<FavoritesPage />} />
        <Route path="/favorite-lists" element={<FavoriteListsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
