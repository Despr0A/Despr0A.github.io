# Despr0A.github.io
这里是Desperation_Prof的个人博客，建设中！！！

## 网站与部署

- 网站：https://despr0a.github.io/
- 仓库：https://github.com/Despr0A/Despr0A.github.io
- 主分支：`main`
- 自动部署：`.github/workflows/deploy.yml`
- GitHub Pages 发布来源：**GitHub Actions**
- 构建环境：Node.js 24；根据 `package-lock.json` 安装依赖。

这是用户主页仓库，Astro 的 `site` 设置为 `https://despr0a.github.io/`，无需设置 `base`。

修改文章或页面后，在项目目录执行：

```powershell
npm run build
git add .
git commit -m "Update website"
git -c http.proxy=http://127.0.0.1:7890 push
```

推送到 `main` 后会自动构建和部署，可以在仓库的 Actions 页面查看结果。
也可以手动运行 **Deploy to GitHub Pages** 工作流。

## 原始模板说明
### Astro Starter Kit: Blog

```sh
npm create astro@latest -- --template blog
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and Open Graph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
