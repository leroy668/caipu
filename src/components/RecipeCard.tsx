import { Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { Recipe } from "../types";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card">
      <div className="recipe-card-image">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt="" loading="lazy" />
        ) : (
          <span>{recipe.title.slice(0, 1)}</span>
        )}
      </div>
      <div className="recipe-card-body">
        <h3>{recipe.title}</h3>
        <div className="recipe-card-meta">
          <span>
            <Clock size={14} /> {recipe.prep_time} 分钟
          </span>
          <span>
            <Users size={14} /> {recipe.servings} 人
          </span>
        </div>
      </div>
    </Link>
  );
}
