import type { AppSnapshot, Category, FavoriteList, Recipe } from "../types";

const now = "2026-07-14T04:00:00.000Z";
const demoUser = "demo-user";

const categories: Category[] = [
  { id: "cat-1", user_id: demoUser, name: "快手家常", sort_order: 0, created_at: now },
  { id: "cat-2", user_id: demoUser, name: "一锅料理", sort_order: 1, created_at: now },
  { id: "cat-3", user_id: demoUser, name: "清爽时蔬", sort_order: 2, created_at: now },
  { id: "cat-4", user_id: demoUser, name: "主食面点", sort_order: 3, created_at: now },
];

const recipes: Recipe[] = [
  {
    id: "recipe-1",
    user_id: demoUser,
    title: "番茄炒蛋",
    description: "酸甜开胃的十分钟家常菜，鸡蛋蓬松，番茄保留一点鲜亮汤汁。",
    category_id: "cat-1",
    image_url: "./images/tomato-eggs.jpg",
    prep_time: 12,
    servings: 2,
    main_ingredients: [
      { id: "m-1", name: "番茄", amount: 400, unit: "g" },
      { id: "m-2", name: "鸡蛋", amount: 3, unit: "个" },
    ],
    seasonings: [
      { id: "s-1", name: "盐", amount: null, unit: "适量" },
      { id: "s-2", name: "白糖", amount: 1, unit: "勺" },
      { id: "s-3", name: "葱花", amount: null, unit: "适量" },
    ],
    steps: ["番茄切块，鸡蛋加少许盐打散。", "热锅下油，将鸡蛋炒至蓬松后盛出。", "番茄炒出汁，加糖和盐，再倒回鸡蛋快速翻匀。"],
    created_at: now,
    updated_at: now,
  },
  {
    id: "recipe-2",
    user_id: demoUser,
    title: "番茄炖牛腩",
    description: "慢炖后的牛腩软而不散，汤汁浓郁，适合配米饭或面条。",
    category_id: "cat-2",
    image_url: "./images/beef-stew.jpg",
    prep_time: 90,
    servings: 4,
    main_ingredients: [
      { id: "m-3", name: "番茄", amount: 500, unit: "g" },
      { id: "m-4", name: "牛腩", amount: 700, unit: "g" },
      { id: "m-5", name: "土豆", amount: 2, unit: "个" },
    ],
    seasonings: [
      { id: "s-4", name: "盐", amount: null, unit: "适量" },
      { id: "s-5", name: "生抽", amount: 2, unit: "勺" },
      { id: "s-6", name: "大蒜", amount: 4, unit: "瓣" },
    ],
    steps: ["牛腩冷水下锅焯净浮沫，番茄和土豆切块。", "牛腩与一半番茄炒香，加生抽和热水炖 60 分钟。", "加入剩余番茄和土豆，再炖 25 分钟并调味。"],
    created_at: now,
    updated_at: now,
  },
  {
    id: "recipe-3",
    user_id: demoUser,
    title: "蒜香清炒西兰花",
    description: "保留脆嫩口感和清新颜色，工作日晚餐也能快速完成。",
    category_id: "cat-3",
    image_url: "./images/garlic-broccoli.jpg",
    prep_time: 10,
    servings: 2,
    main_ingredients: [{ id: "m-6", name: "西兰花", amount: 350, unit: "g" }],
    seasonings: [
      { id: "s-7", name: "盐", amount: null, unit: "适量" },
      { id: "s-8", name: "大蒜", amount: 3, unit: "瓣" },
      { id: "s-9", name: "蚝油", amount: 1, unit: "勺" },
    ],
    steps: ["西兰花切小朵，用盐水浸泡后沥干。", "沸水中焯 45 秒，捞出过凉水。", "蒜末爆香，加入西兰花和蚝油，大火翻炒调味。"],
    created_at: now,
    updated_at: now,
  },
  {
    id: "recipe-4",
    user_id: demoUser,
    title: "葱油拌面",
    description: "焦香葱油裹住每根面条，简单却让人惦记。",
    category_id: "cat-4",
    image_url: "./images/scallion-noodles.jpg",
    prep_time: 20,
    servings: 2,
    main_ingredients: [
      { id: "m-7", name: "细面", amount: 250, unit: "g" },
      { id: "m-8", name: "小葱", amount: 1, unit: "把" },
    ],
    seasonings: [
      { id: "s-10", name: "生抽", amount: 3, unit: "勺" },
      { id: "s-11", name: "老抽", amount: 1, unit: "勺" },
      { id: "s-12", name: "白糖", amount: 1, unit: "勺" },
    ],
    steps: ["小葱切段，葱白和葱绿分开。", "冷油下葱段，小火炸至焦黄，加入调味汁煮沸。", "面条煮熟沥干，淋上葱油拌匀。"],
    created_at: now,
    updated_at: now,
  },
];

const favoriteLists: FavoriteList[] = [
  { id: "list-1", user_id: demoUser, name: "本周晚餐", created_at: now },
  { id: "list-2", user_id: demoUser, name: "周末慢炖", created_at: now },
];

export const demoSnapshot: AppSnapshot = {
  recipes,
  categories,
  favoriteLists,
  memberships: [
    { list_id: "list-1", recipe_id: "recipe-1" },
    { list_id: "list-1", recipe_id: "recipe-2" },
    { list_id: "list-1", recipe_id: "recipe-3" },
    { list_id: "list-2", recipe_id: "recipe-2" },
  ],
};
