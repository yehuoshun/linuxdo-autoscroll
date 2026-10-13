// Linux.Do AutoScroll - background service worker
// 核心:滚动指令来自扩展后台(受 chrome.alarms/事件驱动,免疫页面节流),
// 通过 chrome.scripting.executeScript 注入窗口滚动 —— 滚动是布局操作,不依赖 rAF,
// 后台/最小化标签页照样执行。

const DEFAULTS = {
  enabled: false,
  minInterval: 800,   // 快刷档:800ms~2s 滚一次
  maxInterval: 2000,
  minStep: 600,       // 每次滚大半屏
  maxStep: 1100,
  loop: true          // 刷帖模式:触底自动回顶继续刷
};

let cfg = { ...DEFAULTS };
let timer = null;

// 加载配置;若上次是开启状态,恢复滚动
chrome.storage.local.get(null).then((v) => {
  cfg = { ...DEFAULTS, ...v };
  if (cfg.enabled) start();
});

// 后台配置变更实时同步
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  for (const key in changes) {
    if (key in cfg) cfg[key] = changes[key].newValue;
  }
});

// 快捷键开关
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-scroll") {
    cfg.enabled ? stop() : start();
  }
});

// Ctrl+左键(content script)开关
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "toggle-scroll") {
    cfg.enabled ? stop() : start();
    sendResponse({ enabled: cfg.enabled });
  }
});

function rand(a, b) {
  return Math.floor(a + Math.random() * (b - a));
}

function updateBadge() {
  if (cfg.enabled) {
    chrome.action.setBadgeBackgroundColor({ color: "#2e7d32" });
    chrome.action.setBadgeText({ text: "ON" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

async function scrollStep() {
  const tabs = await chrome.tabs.query({ url: "https://linux.do/*" });
  // 只挑加载完成且未被冻结的标签页,取第一个
  const target = tabs.find((t) => t.status === "complete" && !t.discarded);
  if (!target) {
    // 没有可滚动的 linux.do 标签:停止并提示
    stop();
    chrome.action.setBadgeBackgroundColor({ color: "#c62828" });
    chrome.action.setBadgeText({ text: "NO" });
    return;
  }
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId: target.id },
      func: (minStep, maxStep, loop) => {
        const maxY = document.documentElement.scrollHeight - window.innerHeight;
        if (maxY <= 0) return { bottom: false, atBottom: true };
        // 回看保留 8%(偶尔回头瞄一眼),快速浏览为主
        if (window.scrollY > 300 && Math.random() < 0.08) {
          const back = 100 + Math.random() * 250;
          window.scrollTo({ top: window.scrollY - back, behavior: "smooth" });
          return { bottom: false, atBottom: false };
        }
        const step = minStep + Math.random() * (maxStep - minStep);
        const next = window.scrollY + step;
        // 15% 概率瞬间跳跃(像人拖滚动条),其余平滑滚
        const behavior = Math.random() < 0.15 ? "auto" : "smooth";
        if (next >= maxY) {
          if (loop) {
            window.scrollTo({ top: 0, behavior });
            return { bottom: false, atBottom: false };
          }
          window.scrollTo({ top: maxY, behavior });
          return { bottom: true, atBottom: true };
        }
        window.scrollTo({ top: next, behavior });
        return { bottom: false, atBottom: false };
      },
      args: [cfg.minStep, cfg.maxStep, cfg.loop]
    });
    const r = res && res[0] && res[0].result;
    if (r && r.bottom) {
      // 触底,非循环模式:自动停
      stop();
    }
  } catch (e) {
    console.warn("[Linux.Do AutoScroll] scroll inject failed:", e);
  }
}

function tick() {
  // setTimeout 链实现随机间隔;回调内调扩展 API 会重置 SW 空闲计时器,
  // 只要间隔 < 30s,Service Worker 就不会被休眠
  scrollStep().then(() => {
    if (cfg.enabled) {
      let wait = rand(cfg.minInterval, cfg.maxInterval);
      // 5% 概率短停顿(停下来看个帖子),其余一直刷
      if (Math.random() < 0.05) {
        wait = wait * (2 + Math.random());
      }
      timer = setTimeout(tick, wait);
    }
  });
}

function start() {
  if (timer) return;
  cfg.enabled = true;
  chrome.storage.local.set({ enabled: true });
  updateBadge();
  tick();
}

function stop() {
  cfg.enabled = false;
  clearTimeout(timer);
  timer = null;
  chrome.storage.local.set({ enabled: false });
  updateBadge();
}