# @joeytisaly/dsh-client-ui-wallpaper

English | [中文](README.zh.md)

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 界面提供壁纸功能的插件：在界面背后铺一张照片，从**通用设置 → 壁纸**随时更换。Host 半面拥有 `/wallpaper` 路由（GET 提供已存照片、POST 原子化存储不超过 15 MB 的上传、DELETE 删除），文件存放在 `$DSH_HOME/wallpaper`，并通过 Host 设置文档持久化 `ui-wallpaper.enabled` 开关；同时注入一段渲染前引导脚本，让首屏直接带上照片。浏览器半面通过设置作用域读取开关，把服务地址写到 `document.body` 的 background-image 上（本功能唯一的 DOM 写入），并在通用设置区注册"壁纸"行；它还会注入一张样式表，把 `--dsw-alias-*` 表面变成半透明，让照片透出来——主题注册表与 token 样式表完全不触碰，叠加在主题插件解析出的任意配色之上。

路由在同一个 `/wallpaper` 路径上按方法分发：GET 以嗅探出的内容类型应答（`Cache-Control: no-store`），无文件时 404；POST 仅接受 JPEG/PNG/GIF/WebP 魔数（超限 413，非法 415），原子写入（临时文件 + 重命名）；DELETE 恒答 204。客户端上传若收到 SPA 外壳（缺失路由由兜底以 200 HTML 应答），会被判定为失败，开关永远不会在没有照片的情况下被持久化。

已针对 npm 上已发布的 `0.1.0-rc.6` 依赖代际完成构建与验证（`tsc` 零错误，干净环境安装 + host 面测试全绿）。

## Model Experience

无——本插件管理的是浏览器偏好，不触及任何模型请求。

#### KV Cache 影响

无；本包既不组装也不发送任何 provider 请求。

## 安装

### 从 npm

```sh
npm i @joeytisaly/dsh-client-ui-wallpaper
```

在 dsh web 部署中，把浏览器 roster 行加进你的 web-app 组合（放在 `ui-theme` 旁边）：

```yaml
# 浏览器 roster（如 packages/bundle/web-app/cordis.patch.yml）
- id: ui-wallpaper
  name: '@joeytisaly/dsh-client-ui-wallpaper'
```

重建客户端 bundle、重启 `dsh web`、强制刷新页面。本包 `package.json` 中的 `dsh.client` 清单是插件管理器与 roster 扫描识别它为浏览器插件的依据。

### 从源码

克隆本仓库，将其作为 workspace 包加入（如放在 `packages/client/` 下），加上上面的 roster 行，然后 `tsc -b` + `tsdown` 并重启。

## 使用

**设置 → 通用 → 壁纸**：「选择照片」上传任意图片（≤ 15 MB，JPEG/PNG/WebP/GIF）并立即生效；「移除」恢复纯色半透明主题。开关持久化在 `$DSH_HOME/settings.yaml` 的 `ui-wallpaper.enabled`，照片在 `$DSH_HOME/wallpaper`，二者重启后都保留。深色照片配深色配色效果最佳。

## 兼容性警告

设置行的可写性取决于宿主的 api-proxy 是否暴露 `ui-wallpaper` 设置命名空间（其 `WEB_SETTINGS_NAMESPACES` 白名单）。**壁纸本身**（`/wallpaper` 路由、上传/移除、`enabled` 开关的持久化读取）在任何宿主上都可用；**设置行**在 `dsh-host-apiproxy` 尚未把 `ui-wallpaper` 加入白名单的宿主上会保持禁用。在含白名单改动的新版发布前，可直接改 `$DSH_HOME/settings.yaml`（如 `ui-wallpaper: { enabled: true }`）。

## 已知限制与待办

- **照片可读性依赖配色**——深色照片配深色配色（浅色文字 + 深色表面）效果最佳，插件注入的半透明表面按该搭配调校；浅色模式的可读性方案（毛玻璃、分区遮罩）待做。
- **表面样式固定**——半透明数值写死在注入的样式里，暂不支持按用户调整。
- **15 MB 上传上限**——更大的照片会收到等价 413 的客户端错误；调大上限需修改 `WALLPAPER_MAX_BYTES`。
- **仅整页背景**——不支持按列/按表面放置图片；`background-position` 居中（`cover`）。
