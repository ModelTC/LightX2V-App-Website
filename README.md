# LightX2V App Website

LightX2V 独立桌面应用官网，包含 Mac / Windows 下载、功能介绍和安装问答。

- 仓库： https://github.com/ModelTC/LightX2V-App-Website
- Pages： https://modeltc.github.io/LightX2V-App-Website/
- 技术：原生 HTML / CSS / JavaScript，无构建依赖，无外部字体或运行时 API 请求。

## 本地预览

```sh
npm run dev
```

打开 http://127.0.0.1:4173 。需要 Node.js 和 Python 3。

```sh
npm run check
```

检查脚本语法、资源、锚点、下载配置与无 JavaScript 回退链接。

## GitHub Pages 部署

在仓库 Settings → Pages → Build and deployment 中选择 GitHub Actions。
推送 main 后，`.github/workflows/pages.yml` 校验并发布官网静态文件。
公开仓库可使用免费的 GitHub Pages。所有资源使用相对路径，支持仓库子路径部署。

## 更新下载信息

`app.js` 的 `releases` 集中维护 Mac Stable 和 Windows 的版本与 URL。
同时更新 `index.html` 中对应 `data-download` 元素的 href，以及 Windows 版本文本，供禁用 JavaScript 的浏览器使用。`npm run check` 会检查 URL 一致性。
不要将 Windows 的预览版链接替换为 `/releases/latest`：GitHub 的 latest 不包含预发布。

Mac 默认 Stable；Windows 当前 v0.3.12 Preview。安装包托管在各自应用的 GitHub Releases，不放入官网仓库。

## 设计与内容

深色背景、暖白文字、橙色光轨，中文为主要语言。所有插画为本仓库 SVG，不依赖第三方图片服务。
首页应用窗口为标注清楚的「创作流程示意」，不是应用实际截图，沙丘为视觉插画，不作为模型效果或性能证据。
产品功能和硬件说明依据两个应用的 README；不承诺未经验证的性能、最低内存或平台一致性。

参考结构：
- https://chatgpt.com/zh-Hans-CN/download/
- https://linear.app/download
- https://www.raycast.com/

网页黑白图标按 Mac 应用 scripts/make-icon.swift 的几何形状和灰度配色转换为 SVG，与应用图标保持一致。
