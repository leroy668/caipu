import {
  ArrowLeft,
  Camera,
  GripVertical,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import type { Ingredient, RecipeDraft } from "../types";

const newIngredient = (): Ingredient => ({
  id: crypto.randomUUID(),
  name: "",
  amount: null,
  unit: "",
});

const emptyDraft = (): RecipeDraft => ({
  title: "",
  description: "",
  category_id: null,
  image_url: "",
  prep_time: 20,
  servings: 2,
  main_ingredients: [newIngredient()],
  seasonings: [newIngredient()],
  steps: [""],
});

export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { recipes, categories, createRecipe, updateRecipe, uploadRecipeImage } = useData();
  const existing = recipes.find((recipe) => recipe.id === id);
  const initialDraft = useMemo<RecipeDraft>(
    () =>
      existing
        ? {
            title: existing.title,
            description: existing.description,
            category_id: existing.category_id,
            image_url: existing.image_url,
            prep_time: existing.prep_time,
            servings: existing.servings,
            main_ingredients: structuredClone(existing.main_ingredients),
            seasonings: structuredClone(existing.seasonings),
            steps: [...existing.steps],
          }
        : emptyDraft(),
    [existing],
  );
  const [draft, setDraft] = useState(initialDraft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const updateIngredient = (
    field: "main_ingredients" | "seasonings",
    index: number,
    key: keyof Ingredient,
    value: string | number | null,
  ) => {
    setDraft((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const addIngredient = (field: "main_ingredients" | "seasonings") => {
    setDraft((current) => ({ ...current, [field]: [...current[field], newIngredient()] }));
  };

  const removeIngredient = (field: "main_ingredients" | "seasonings", index: number) => {
    setDraft((current) => ({
      ...current,
      [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const image_url = await uploadRecipeImage(file);
      setDraft((current) => ({ ...current, image_url }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "图片上传失败");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!draft.title.trim()) {
      setError("请填写菜名");
      return;
    }

    const cleaned: RecipeDraft = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      main_ingredients: draft.main_ingredients.filter((item) => item.name.trim()),
      seasonings: draft.seasonings.filter((item) => item.name.trim()),
      steps: draft.steps.map((step) => step.trim()).filter(Boolean),
    };

    setSaving(true);
    try {
      const saved = existing
        ? await updateRecipe(existing.id, cleaned)
        : await createRecipe(cleaned);
      navigate(`/recipe/${saved.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="editor-page" onSubmit={submit}>
      <header className="editor-header">
        <button type="button" className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          返回
        </button>
        <div>
          <span className="eyebrow">{existing ? "编辑菜谱" : "记录新味道"}</span>
          <h1>{existing ? existing.title : "新建菜谱"}</h1>
        </div>
        <button className="primary-button desktop-save" disabled={saving || uploading}>
          <Save size={18} />
          {saving ? "保存中..." : "保存菜谱"}
        </button>
      </header>

      <div className="editor-grid">
        <section className="editor-main">
          <div className="form-section">
            <div className="form-section-heading">
              <span>01</span>
              <div>
                <h2>基本信息</h2>
                <p>先给这道菜一个容易找到的名字</p>
              </div>
            </div>
            <div className="form-grid two-columns">
              <label className="field full-field">
                <span>菜名 *</span>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="例如：番茄炒蛋"
                  required
                />
              </label>
              <label className="field">
                <span>分类</span>
                <select
                  value={draft.category_id ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      category_id: event.target.value || null,
                    }))
                  }
                >
                  <option value="">未分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>用时（分钟）</span>
                <input
                  type="number"
                  min={1}
                  value={draft.prep_time}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      prep_time: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>份量（人）</span>
                <input
                  type="number"
                  min={1}
                  value={draft.servings}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      servings: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label className="field full-field">
                <span>简介</span>
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="口味、适合场景或这道菜的小诀窍"
                />
              </label>
            </div>
          </div>

          <IngredientEditor
            index="02"
            title="主料"
            description="会在采购清单中按单位自动合并"
            items={draft.main_ingredients}
            onChange={(itemIndex, key, value) =>
              updateIngredient("main_ingredients", itemIndex, key, value)
            }
            onAdd={() => addIngredient("main_ingredients")}
            onRemove={(itemIndex) => removeIngredient("main_ingredients", itemIndex)}
          />

          <IngredientEditor
            index="03"
            title="辅料"
            description="会在采购清单中统计出现次数"
            items={draft.seasonings}
            onChange={(itemIndex, key, value) =>
              updateIngredient("seasonings", itemIndex, key, value)
            }
            onAdd={() => addIngredient("seasonings")}
            onRemove={(itemIndex) => removeIngredient("seasonings", itemIndex)}
          />

          <section className="form-section steps-editor-section">
            <div className="form-section-heading">
              <span>04</span>
              <div>
                <h2>制作阶段</h2>
                <p>每个阶段写一个清晰动作</p>
              </div>
            </div>
            <div className="steps-editor">
              {draft.steps.map((step, index) => (
                <div className="step-input-row" key={`step-${index}`}>
                  <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
                  <GripVertical size={17} className="drag-handle" />
                  <textarea
                    rows={2}
                    value={step}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        steps: current.steps.map((item, itemIndex) =>
                          itemIndex === index ? event.target.value : item,
                        ),
                      }))
                    }
                    placeholder="写下这个阶段要做什么"
                  />
                  <button
                    type="button"
                    className="icon-button danger-icon"
                    title="删除步骤"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        steps: current.steps.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="add-row-button"
              onClick={() =>
                setDraft((current) => ({ ...current, steps: [...current.steps, ""] }))
              }
            >
              <Plus size={17} />
              添加制作阶段
            </button>
          </section>
        </section>

        <aside className="image-uploader">
          <div className="image-uploader-heading">
            <Camera size={19} />
            <div>
              <h2>成品图片</h2>
              <p>建议使用横向照片</p>
            </div>
          </div>
          <div className="image-preview">
            {draft.image_url ? (
              <>
                <img src={draft.image_url} alt="菜品预览" />
                <button
                  type="button"
                  className="remove-image-button"
                  onClick={() => setDraft((current) => ({ ...current, image_url: "" }))}
                  title="移除图片"
                >
                  <X size={18} />
                </button>
              </>
            ) : (
              <div className="image-placeholder">
                <ImagePlus size={36} strokeWidth={1.4} />
                <p>加入一道让人有食欲的照片</p>
              </div>
            )}
          </div>
          <label className="secondary-button upload-button">
            <ImagePlus size={17} />
            {uploading ? "上传中..." : draft.image_url ? "更换图片" : "选择图片"}
            <input type="file" accept="image/*" onChange={handleImage} disabled={uploading} />
          </label>
        </aside>
      </div>

      {error && <div className="editor-error">{error}</div>}
      <div className="mobile-save-bar">
        <button className="primary-button" disabled={saving || uploading}>
          <Save size={18} />
          {saving ? "保存中..." : "保存菜谱"}
        </button>
      </div>
    </form>
  );
}

type IngredientEditorProps = {
  index: string;
  title: string;
  description: string;
  items: Ingredient[];
  onChange: (
    index: number,
    key: keyof Ingredient,
    value: string | number | null,
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

function IngredientEditor({
  index,
  title,
  description,
  items,
  onChange,
  onAdd,
  onRemove,
}: IngredientEditorProps) {
  return (
    <section className="form-section">
      <div className="form-section-heading">
        <span>{index}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="ingredient-editor">
        <div className="ingredient-editor-labels">
          <span>材料名称</span>
          <span>数量</span>
          <span>单位</span>
        </div>
        {items.map((item, itemIndex) => (
          <div className="ingredient-input-row" key={item.id}>
            <input
              value={item.name}
              onChange={(event) => onChange(itemIndex, "name", event.target.value)}
              placeholder={title === "主料" ? "例如：番茄" : "例如：盐"}
              aria-label={`${title}名称`}
            />
            <input
              type="number"
              min={0}
              step="any"
              value={item.amount ?? ""}
              onChange={(event) =>
                onChange(
                  itemIndex,
                  "amount",
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
              placeholder="适量"
              aria-label={`${title}数量`}
            />
            <input
              value={item.unit}
              onChange={(event) => onChange(itemIndex, "unit", event.target.value)}
              placeholder="g / 个"
              aria-label={`${title}单位`}
            />
            <button
              type="button"
              className="icon-button danger-icon"
              title={`删除${title}`}
              onClick={() => onRemove(itemIndex)}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="add-row-button" onClick={onAdd}>
        <Plus size={17} />
        添加{title}
      </button>
    </section>
  );
}
