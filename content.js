// 监听 Ctrl+鼠标左键 → 通知后台切换滚动
// 链接/按钮/输入框上不劫持,避免和新开标签等默认行为冲突
document.addEventListener(
  "click",
  (e) => {
    if (!e.ctrlKey || e.button !== 0) return;
    const interactive = e.target.closest('a, button, [role="button"], input, textarea, select, [contenteditable]');
    if (interactive) return;
    chrome.runtime.sendMessage({ type: "toggle-scroll" }).catch(() => {});
  },
  true
);