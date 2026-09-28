/** SyNAPSE background monitor — fires every 6 minutes while extension is enabled. */
const ALARM_NAME = "synapse-emotion-monitor";
const INTERVAL_MINUTES = 6;

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: INTERVAL_MINUTES });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  chrome.tabs.query({ url: ["http://localhost:5173/*", "https://*.vercel.app/*"] }, (tabs) => {
    for (const tab of tabs) {
      if (tab.id != null) {
        chrome.tabs.sendMessage(tab.id, { type: "SYNAPSE_MONITOR_TICK" }).catch(() => {});
      }
    }
  });

  chrome.storage.local.get(["monitorEnabled"], (data) => {
    if (data.monitorEnabled === false) return;
    chrome.notifications.create(`synapse-tick-${Date.now()}`, {
      title: "SyNAPSE",
      message: "Background emotion check — keep the student session open with camera enabled.",
      priority: 0,
    });
  });
});
