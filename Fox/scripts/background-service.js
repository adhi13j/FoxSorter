// Describe how the background service receives popup commands, sorts tabs, and manages saved sessions.


// Runs the firsti time the extension is installed, setting up default values in local storage.
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason !== "install") return; // don't clobber storage on update/reload

  browser.storage.local.set({
    categories: ["Study", "Entertainment", "Hobbies", "Neutral"],
    categoryOrder: ["Study", "Entertainment", "Hobbies", "Neutral"],
    domainMap: {},
    settings: { autoSort: false, liveSort: false, extensionEnabled: true },
    sessions: []
  });
});

