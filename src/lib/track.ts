// umami 事件埋点统一入口。官方 script.js 挂的全局对象只在配了
// UMAMI_URL 的构建里存在;dev/未配置时是 undefined——交互照常,只是不上报。
declare global {
  interface Window {
    umami?: { track: (eventName: string, data?: Record<string, unknown>) => void };
  }
}

/** 上报一个交互事件(进 umami 聚合看板)。静默失败,绝不影响交互本身。 */
export function track(event: string, data?: Record<string, unknown>) {
  try {
    window.umami?.track(event, data);
  } catch {
    /* 统计挂了也不能影响用户 */
  }
}
