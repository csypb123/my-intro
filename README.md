# 杨鹏博 · 个人主页

纯静态、零依赖的个人主页：**白底 + 蓝紫渐变**、插画铺满整页背景、玻璃拟态，
以及一整套丝滑的滚动动画，附带一个可在线试玩的 2048 小游戏。

**在线地址：<https://csypb123.github.io/my-intro/>**

## 文件结构

| 文件 | 说明 |
| --- | --- |
| `index.html` | 页面结构：首页 / 关于我 / 项目 / 技能 / 兴趣 / 近况 / 关于本站 / 联系 |
| `styles.css` | 全部样式，配色集中在顶部 `:root`（改主题基本只动这里） |
| `script.js` | 背景音乐（预载 / 自动播放）、滚动动画与交互（原生 JS，无第三方库） |
| `2048.html` | 2048 数字合并小游戏（键盘 + 触控，单文件零依赖） |
| `assets/bg-light.jpg` | 整页背景插画（1280×1920，约 280 KB，用 multiply 混合融进白底） |
| `assets/fishinthepool.mp3` | 背景音乐 |
| `assets/favicon.svg` | 站点图标 |
| `assets/landscape.svg` | 首页个人卡片里的「风景窗」插画 |
| `.nojekyll` | 让 GitHub Pages 跳过 Jekyll 处理 |
| `preview-server.cjs` | 本地预览用的零依赖静态服务器 |

## 功能

- **开场加载动画**：进入时短暂显示品牌字标 + 进度条 + 名字扫光，加载完成后首屏按顺序浮现（逐段上浮 + 模糊消散）。它有两条兜底：CSS 动画保证最迟自动让开、内联脚本保证滚动锁一定解除——**不会出现卡在加载页的情况**。系统开启「减少动态效果」时加载层会立刻让开。
- **打开即主页**：加载动画之后直接就是主页内容，没有入口页或需要点击的遮罩。
- **背景音乐**：打开页面先尝试自动播放。浏览器不允许时会先**静音播放**，随后三种方式都能把它放出来：
  - **滚动页面**就会尝试播放（Safari 等浏览器认这个手势）
  - **点击页面任意处**或**按一下键盘**（Chrome / Edge 只认这两类「用户激活」，实测滚动不算）
  - 右上角 BGM 按钮随时开关；用户明确静音过就不会被自动放出整段音乐在页面空闲时**预载**进内存（换成 Blob），所以点播放近乎瞬时响应（实测 1 ms），不会出现「点了等十几秒才有声音」。
  - 右上角 BGM 按钮随时开关；「近况」版块里有一张播放卡，带播放/暂停、静音、重新开始、音量滑块，以及一块 **Canvas 实时频谱**（用 `AnalyserNode` 取频谱画柱状波形；没有音频上下文时自动退化成呼吸波形）。
- **滚动动画**：逐字上浮、打字机、滚动显现、背景视差、时间线进度、技能条填充、卡片 3D 倾斜。
- **背景处理**：插画用 `mix-blend-mode: multiply` 铺在白底上，画面清晰但插画自身的白底不会变成一块灰；再叠一层 `mix-blend-mode: color` 的蓝紫渐变统一色调，白色柔光保证正文对比度。
- **性能取舍**：动画只用 `transform` 与 `opacity`；不用 `background-attachment: fixed`（改为固定定位图层），避免移动端掉帧。

## 小游戏：2048

<https://csypb123.github.io/my-intro/2048.html>

- 方向键 / WASD 移动，手机上直接滑动；`Ctrl+Z` 撤销一步
- 相同数字相遇即合并，拼出 **2048** 后可以继续挑战更大的数字
- 带撤销（保留最近 40 步）、最高分记录（localStorage）、出现与合并动画、无效移动抖动提示
- 纯手写、零依赖，棋盘用 CSS 变量定义几何，方块用 `transform` 定位以获得顺滑动画

## 本地预览

```sh
node preview-server.cjs
```

打开 <http://127.0.0.1:4173>，也可以直接双击 `index.html`。

## 部署

推送到 `main` 分支即自动发布，工作流见 `.github/workflows/deploy.yml`
（GitHub Actions → `actions/deploy-pages`），通常 1–3 分钟生效。

> **注意**：工作流只把 `index.html`、`2048.html`、`styles.css`、`script.js`、`.nojekyll`、
> `assets/`、`README.md` 拷进发布产物。**新增页面时必须同步修改
> `.github/workflows/deploy.yml` 里的 `cp` 那一行**，否则线上会 404。

> 若用 GitHub token 通过 API 修改 `.github/workflows/**`，token 必须带 `workflow` 权限
> （`gh auth refresh -s workflow`），否则 GitHub 会返回 404。

若工作流的发布步骤报错，把仓库 **Settings → Pages → Source** 改成
**Deploy from a branch**（分支 `main`、目录 `/ (root)`）也能直接发布根目录内容。

## 自定义

- **文字**：改 `index.html`
- **配色**：改 `styles.css` 里 `:root` 的 `--bg` / `--violet` / `--blue` / `--pink` / `--text`
- **背景图**：换掉 `assets/bg-light.jpg`；画面对比度在 `.backdrop__wash`（白色柔光），插画混合方式在 `.backdrop__art`
- **背景音乐**：换掉 `assets/fishinthepool.mp3`（`index.html` 里 `<audio id="bgm">` 的 `src`）
- **打字机文案**：改 `script.js` 里的 `lines` 数组
- **头像**：改 `index.html` 中 `.profile__avatar img` 的 `src`
- **动画节奏**：HTML 上的 `data-delay="80"`（毫秒）控制各区块入场先后
- **2048 棋盘大小**：改 `2048.html` 里的 `SIZE` 常量（默认 4）

## 无障碍

已适配 `prefers-reduced-motion`：系统开启「减少动态效果」时，入场动画、视差与光斑动画会关闭。
背景音乐会尽量自动播放；被浏览器策略拦下时，滚动页面会尝试播放，点一下页面任意处或按一下键盘即可出声；
键盘可完整操作 2048（方向键 / WASD / `Ctrl+Z` 撤销）。

## 素材说明

背景插画来自网络，图上带有「無断転載 & AI 学習禁止 / No AI training」标记。
按需求已用于本站；若长期公开运营，建议替换为自有或已获授权的图片。字体、图标、脚本均为手写或系统自带。
