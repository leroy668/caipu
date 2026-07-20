import { Link } from "react-router-dom";
import type { Recipe } from "../types";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card">
      <h3>{recipe.title}</h3>
    </Link>
  );
}
