const box = document.getElementById("enabled");
chrome.storage.local.get(["monitorEnabled"], (data) => {
  box.checked = data.monitorEnabled !== false;
});
box.addEventListener("change", () => {
  chrome.storage.local.set({ monitorEnabled: box.checked });
});
