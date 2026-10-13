# Linux.Do AutoScroll

linux.do 后台自动滚动扩展(Chrome / Edge 通用,Manifest V3)。

## 特性

- 触发:在 linux.do 页面按 **Ctrl+鼠标左键**(避开链接/按钮)或 **Alt+Shift+S**,开始/停止
- **后台/最小化照常滚动**:滚动指令由扩展后台 Service Worker 驱动,免疫浏览器对后台标签页的节流
- 模拟人工节奏(防机械检测):快刷档每 0.8~2s 滚 600~1100px + 15% 瞬跳 + 5% 短停顿;**只往下不回头**;触底自动回顶循环刷
- 面板可调间隔/步长/循环;图标角标显示运行状态(ON / NO)

## 安装

1. 解压本目录到任意文件夹
2. Edge: `edge://extensions` → 打开**开发人员模式** → **加载解压缩的扩展** → 选择文件夹
   (Chrome 同理:`chrome://extensions`)
3. 打开 linux.do 页面,**Ctrl+鼠标左键** 空白处(或 `Alt+Shift+S`)开始/停止
4. 改快捷键:扩展管理 → 详情 → 键盘快捷键

## 技术要点

- 滚动通过 `chrome.scripting.executeScript` 注入 `window.scrollTo` 执行——滚动是布局操作,不依赖 `requestAnimationFrame`,后台标签页照样执行
- Service Worker 内 `setTimeout` 链 + 每次回调的扩展 API 调用会重置空闲计时器,SW 不会休眠
- 只注入 `https://linux.do/*` 标签页,无其他站点权限

## 文件

| 文件 | 说明 |
|---|---|
| `manifest.json` | MV3 配置,声明快捷键 |
| `background.js` | 后台驱动核心:定时器 + 滚动注入 + 状态管理 |
| `content.js` | 页面监听:Ctrl+左键 → 通知后台切换 |
| `popup.html` / `popup.js` | 控制面板:状态/参数设置 |
| `linuxdo-autoscroll.zip` | 打包好的安装包 |

## 隐私

- 无任何数据收集、无远程请求、无埋点
- 权限仅:storage(本地设置)、scripting(注入滚动)、tabs + linux.do 站点权限