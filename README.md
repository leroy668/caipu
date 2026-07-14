# 食记 · 网页版菜谱工具

一套面向手机与电脑浏览器的私人菜谱工具。支持菜谱增删改查、图片上传、多收藏夹、智能采购清单、分类排序，以及 Supabase 云端同步。

## 本地运行

```bash
npm install
npm run dev
```

未配置环境变量时，应用会进入演示模式。所有操作保存在当前浏览器的 `localStorage`，可直接体验全部页面和交互。

## 接入 Supabase

1. 在 Supabase 新建项目。
2. 打开 SQL Editor，执行 `supabase/migrations/001_initial_schema.sql`。
3. 将 `.env.example` 复制为 `.env.local`，填写项目 URL 与 anon key：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. 在 Supabase Authentication 中按需要配置邮箱验证和 Site URL。
5. 重新启动开发服务器。

SQL 脚本会创建：

- `recipes`：菜谱及 JSONB 主料、辅料、步骤
- `categories`：可排序分类
- `favorite_lists`：自定义收藏夹
- `favorite_list_recipes`：收藏夹与菜谱关系
- `reorder_categories`：分类批量排序 RPC
- 完整 RLS 策略
- `recipe-images` 公共读取存储桶及用户目录写入策略
- 旧版 `is_favorite=true` 到“默认收藏夹”的安全迁移

## 部署到 GitHub Pages

1. 将仓库默认分支命名为 `main` 并推送到 GitHub。
2. 在仓库 `Settings > Secrets and variables > Actions` 添加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 在 `Settings > Pages` 将 Source 设为 `GitHub Actions`。
4. 推送代码，`.github/workflows/deploy-pages.yml` 会自动构建和发布。

应用使用 `HashRouter`，可直接部署到任意 GitHub Pages 子路径，无需额外 404 重写。

## 常用命令

```bash
npm run dev
npm run build
npm run lint
npm run preview
```
