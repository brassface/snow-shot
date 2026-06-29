<div align="center">

<a name="readme-top"></a>

<img height="83" src="/docs/imgs/app-icon.png">

<h1>Snow Shot Mini</h1>

<h3>轻量版截图工具<img src="/docs/imgs/snowflake.png" height="24px" /></h3>

基于 [Snow Shot](https://github.com/mg-chao/snow-shot) 精简 fork，专注核心截图体验

> **声明：本项目为社区 fork 的衍生版本，并非 [Snow Shot 官方](https://snowshot.top/) 项目，与原作者无隶属关系。**

</div>

## 项目介绍

Snow Shot Mini 在保留 Snow Shot 核心截图能力的前提下，移除了视频录制、AI 对话、翻译等扩展功能，使安装包更小、界面更简洁、上手更直接。

适合只需要**截图 + 标注 + OCR 文字识别**的用户日常使用。

### 保留的核心能力

- **多种截图模式** — 区域截图、全屏截图、窗口截图、滚动截图、焦点窗口截图等
- **丰富的标注工具** — 矩形、圆形、箭头、文字、马赛克、序号等
- **OCR 文字识别** — 通过 RapidOCR 插件识别截图中的文字（需安装插件）
- **固定到屏幕** — 将截图或 OCR 结果固定显示在桌面上
- **截图历史** — 查看与管理历史截图记录
- **快捷键与托盘** — 支持全局快捷键唤醒截图、系统托盘快捷操作
- **个性化设置** — 外观主题、插件管理、输出格式、云保存等

## 相对原版的修改说明

本项目基于上游 [mg-chao/snow-shot](https://github.com/mg-chao/snow-shot) 进行修改。以下为与原版的主要差异，便于了解 Mini 版的定位。

### 已移除的功能模块

| 模块 | 原版 | Mini 版 |
| --- | --- | --- |
| 视频录制 | 支持屏幕录制，依赖 FFmpeg 插件 | **已移除**（页面、命令、路由、快捷键） |
| AI 对话 | 支持选词对话、工作流等 | **已移除**（聊天页面、服务接口、系统设置） |
| 翻译工具 | 独立翻译页、划词翻译、截图 OCR 翻译 | **已移除**（翻译器组件、配置页、相关快捷键） |
| 翻译插件 | `translate` 插件 | **已移除** |
| FFmpeg 插件 | `ffmpeg` 插件 | **已移除** |
| AI Chat 插件 | `ai_chat` 插件 | **已移除** |

### 插件系统精简

原版通过插件扩展视频录制、OCR、翻译、AI 对话等能力。Mini 版仅保留 **RapidOCR**（`rapid_ocr`）插件，插件管理页也只展示 OCR 相关条目。

### 全局快捷键精简

原版首页可配置十余项功能快捷键（延迟截图、OCR 截图、截图翻译、录制、对话、翻译等）。Mini 版首页仅保留 **截图（默认 F1）** 一项可配置快捷键，其余功能入口已移除。

托盘菜单同样做了精简，保留截图、打开保存目录、截图历史等常用操作。

### 设置页精简

- **功能设置**：移除翻译 API 配置、AI 对话测试等与已删除功能相关的表单项
- **系统设置**：移除 AI 对话（Chat）相关配置区块
- **快捷键设置**：仅保留与截图、OCR 插件相关的快捷键项

### OCR 相关调整

- 截图标注工具栏中的 **OCR 识别** 功能保留（需安装 RapidOCR 插件）
- **OCR 翻译**、划词翻译联动、翻译器悬浮窗等能力已移除
- 固定内容（Fixed Content）中的 OCR 结果展示已简化，不再包含翻译相关 UI

### 界面与路由

移除以下页面及对应路由：

- `/tools/chat` — AI 对话
- `/tools/translation` — 翻译工具
- `/videoRecord` — 视频录制
- `/videoRecordToolbar` — 录制工具栏

侧边栏菜单不再展示上述入口，整体导航更聚焦于截图工作流。

### 后端与构建

- ONNX Runtime 运行库以动态库形式打包（`src-tauri/bin/onnxruntime*.dll`），便于本地构建
- 其余 Rust 后端截图、OCR 核心逻辑基本沿用上游，未做大规模重写

## 与上游的关系

```
Snow Shot（上游）          Snow Shot Mini（本项目）
├── 截图 + 标注      →     ├── 截图 + 标注（保留）
├── OCR 插件         →     ├── OCR 插件（保留）
├── 视频录制         →     ├── （移除）
├── AI 对话          →     ├── （移除）
└── 翻译             →     └── （移除）
```

- **上游仓库**：[mg-chao/snow-shot](https://github.com/mg-chao/snow-shot)
- **上游官网**：[snowshot.top](https://snowshot.top/)
- **本仓库**：[brassface/snow-shot](https://github.com/brassface/snow-shot)（Snow Shot Mini）

如需完整功能（视频录制、翻译、AI 对话等），请使用官方版本。

## 下载与安装

Release 安装包发布于本仓库的 [Releases](https://github.com/brassface/snow-shot/releases) 页面（构建后可用）。

本地自行打包请参考下方「开发与构建」。

## 开发与构建

环境要求与步骤详见 [开发文档](/docs/development.md)，简要流程如下：

1. 在同级目录准备 [@mg-chao/excalidraw](https://github.com/mg-chao/excalidraw)（`custom/master` 分支），执行 `yarn i` 后回到本项目运行 `pnpm update:excalidraw`
2. 下载 [ONNX Runtime 静态库](https://github.com/supertone-inc/onnxruntime-build/releases) 中的 `onnxruntime.lib`，放入 `src-tauri/lib`
3. `pnpm i` 安装依赖
4. `pnpm tauri dev` 本地调试，或 `pnpm build && pnpm tauri build` 打包

> Mini 版不需要 FFmpeg，可跳过开发文档中的「视频录制环境」步骤。

### Windows 打包（安装包 + 绿色版）

```bash
# 一键构建：前端 + Tauri + 安装包 + 绿色版 zip
pnpm build:windows

# 若已完成 tauri build，仅重新打包产物
pnpm package:windows
```

产物输出到 `packages/windows/`：

| 文件 | 说明 |
| --- | --- |
| `Snow Shot Mini_x.x.x_x64-setup.exe` | NSIS 安装包 |
| `Snow-Shot-Mini_x.x.x_x64-portable.zip` | 绿色版压缩包，解压后运行 `snowshot.exe` |
| `Snow-Shot-Mini_x.x.x_x64-portable/` | 绿色版文件夹（含 `__portable` 标记，配置保存在同目录） |

绿色版使用说明：解压 zip 后，直接双击 `snowshot.exe` 即可运行，无需安装。需系统已安装 [WebView2 运行时](https://developer.microsoft.com/microsoft-edge/webview2/)。

打包前请关闭正在运行的 `snowshot.exe`，否则可能因 DLL 被占用导致构建失败。

## 许可证与版权声明

### 上游版权

Snow Shot 的原始代码版权归 [mg-chao](https://github.com/mg-chao) 及其贡献者所有。

### 本项目的许可

本项目作为 Snow Shot 的**衍生作品（Derivative Work）**进行分发，遵循上游所采用的 [**GNU General Public License v3.0（GPL-3.0）**](LICENSE-Commercial) 许可条款。

依据 GPL-3.0，你在使用、修改或再分发本软件时须遵守以下要求：

1. **保留版权声明** — 分发时需保留上游及本项目的版权与许可声明
2. **开源修改** — 若你修改本软件并对外分发，须以 GPL-3.0 公开你的修改后的完整源代码
3. **注明来源** — 须在显著位置说明本软件基于 Snow Shot 修改，并附上上游仓库链接
4. **相同许可** — 不得将本项目（或其修改版）以专有闭源许可对外发布
5. **无官方背书** — 不得暗示本 fork 版本由 Snow Shot 官方开发或背书

完整许可文本见仓库中的 [LICENSE-Commercial](LICENSE-Commercial)（GPL-3.0）与 [LICENSE-NonCommercial](LICENSE-NonCommercial)（Apache 2.0，适用于部分组件）。

### 商标说明

「Snow Shot」名称及相关品牌标识归上游项目所有。本项目使用「Snow Shot Mini」仅为表明与上游的技术渊源，**不代表官方授权或认可**。

## 反馈与交流

- 本 fork 相关问题：请在本仓库提交 [Issue](https://github.com/brassface/snow-shot/issues)
- 上游 Snow Shot 功能建议或 bug：请前往 [mg-chao/snow-shot Issues](https://github.com/mg-chao/snow-shot/issues)

## 致谢

感谢 [Snow Shot](https://github.com/mg-chao/snow-shot) 作者 [mg-chao](https://github.com/mg-chao) 及所有贡献者开源了如此优秀的截图工具，本项目才得以在此基础上精简衍生。
