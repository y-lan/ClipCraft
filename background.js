chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  // Send a message to the content script instead of injecting it
  chrome.tabs.sendMessage(tab.id, { action: "start_selection" });
}); 