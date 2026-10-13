// popup 控制面板
const $ = (id) => document.getElementById(id);

const ui = {
  status: $("status"),
  toggle: $("toggle"),
  iv: $("iv"),
  sp: $("sp"),
  loop: $("loop"),
  save: $("save")
};

const DEFAULTS = {
  enabled: false,
  minInterval: 3000,
  maxInterval: 8000,
  minStep: 300,
  maxStep: 700,
  loop: false
};

function fmt(v) {
  return v >= 1000 ? (v / 1000) + "s" : v + "ms";
}

function render(cfg) {
  ui.status.textContent = cfg.enabled
    ? "状态: 滚动中 · Ctrl+左键停止"
    : "状态: 停止 · Ctrl+左键开始";
  ui.status.className = "status " + (cfg.enabled ? "on" : "off");
  ui.toggle.textContent = cfg.enabled ? "停止滚动" : "开始滚动";
  ui.iv.textContent = fmt(cfg.minInterval) + " ~ " + fmt(cfg.maxInterval);
  ui.sp.textContent = cfg.minStep + " ~ " + cfg.maxStep + " px";
  ui.loop.checked = !!cfg.loop;
}

chrome.storage.local.get(null).then((v) => {
  const cfg = { ...DEFAULTS, ...v };
  render(cfg);

  ui.toggle.onclick = () => {
    chrome.storage.local.set({ enabled: !cfg.enabled });
  };

  ui.save.onclick = () => {
    const minI = parseInt(prompt("最小间隔(ms):", cfg.minInterval), 10) || cfg.minInterval;
    const maxI = parseInt(prompt("最大间隔(ms):", cfg.maxInterval), 10) || cfg.maxInterval;
    const minS = parseInt(prompt("最小步长(px):", cfg.minStep), 10) || cfg.minStep;
    const maxS = parseInt(prompt("最大步长(px):", cfg.maxStep), 10) || cfg.maxStep;
    chrome.storage.local.set({
      minInterval: Math.min(minI, maxI),
      maxInterval: Math.max(minI, maxI),
      minStep: Math.min(minS, maxS),
      maxStep: Math.max(minS, maxS),
      loop: ui.loop.checked
    });
  };
});

// 其他入口(快捷键/别的 popup 实例)改状态时同步刷新
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  chrome.storage.local.get(null).then((v) => render({ ...DEFAULTS, ...v }));
});