/** Relays extension alarm ticks into the SyNAPSE web app. */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "SYNAPSE_MONITOR_TICK") {
    window.postMessage({ type: "SYNAPSE_MONITOR_TICK" }, "*");
    window.dispatchEvent(new CustomEvent("synapse-monitor-tick"));
  }
});
