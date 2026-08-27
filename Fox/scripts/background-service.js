// Describe how the background service receives popup commands, sorts tabs, and manages saved sessions.



/*
SCHEMA

{
    // default values for the extension's settings, category order, and saved sessions
  settings: { extensionEnabled: true, autoSort: false, liveSort: false },
  domainMap: {},          // "docs.python.org" -> "Study"  — single source of truth, seeded once from history, updated incrementally
  excludedDomains: [],    // user opt-out list, checked before scan AND before live-cache writes
  sessions: []            // [{ id, name, createdAt, tabs: [{url, title}] }]
}
  */

 
 
 const DEFAULT_CATEGORIES = ["Study", "Entertainment", "Hobbies", "Neutral"];
 
 
 async function categorizeDomain(domain) {
     return "Neutral";
    }
    
async function seedDomainMap() {
    const { excludedDomains = [] } = await browser.storage.local.get("excludedDomains");
        
        
    const historyItems = await browser.history.search({
        text: "",          // empty string matches everything
        startTime: 0,
        maxResults: 10000
    });
        
    const domainMap = {};
        
    for (const item of historyItems) {
        let domain;
        try { domain = new URL(item.url).hostname; }
        catch { continue; } // skips about:, moz-extension:, etc. — not real URLs
            
        if (!domain || excludedDomains.includes(domain)) continue;
        if (domainMap[domain]) continue; // one categorization per domain, not per URL
            
        domainMap[domain] = await categorizeDomain(domain);
    }
        
    await browser.storage.local.set({ domainMap });
        
}

//runs everytime new window is opened or new tab is created
const windowTabs = new Map(); // windowId -> Tab[]

async function hydrateWindowTabs() {
  const windows = await browser.windows.getAll({ populate: true });
  windowTabs.clear();
  for (const win of windows) windowTabs.set(win.id, win.tabs);
}

hydrateWindowTabs();

// we wait till the user stops rapidly changing tabs before we update the domainMap, to avoid excessive writes to storage
const pendingDomainUpdates = {};
let debounceTimer = null;


function scheduleDomainMapFlush() {
    clearTimeout(debounceTimer);
    
    // need to check if firefox unloads the extension while the timer is still running, which would cause an error when it tries to flush the domain map
  debounceTimer = setTimeout(flushDomainMapUpdates, 2000);
}

async function flushDomainMapUpdates() {
  if (Object.keys(pendingDomainUpdates).length === 0) return;
  const { domainMap = {} } = await browser.storage.local.get("domainMap");
  Object.assign(domainMap, pendingDomainUpdates);
  await browser.storage.local.set({ domainMap });
  for (const key in pendingDomainUpdates) delete pendingDomainUpdates[key];
}

// update the windowTabs map whenever a window is created
if (!windowTabs.has(tab.windowId)) windowTabs.set(tab.windowId, []);
windowTabs.get(tab.windowId).push(tab);

let domain;
try { domain = new URL(tab.url).hostname; } catch { return; }
if (!domain) return;

const { excludedDomains = [] } = await browser.storage.local.get("excludedDomains");
if (excludedDomains.includes(domain)) return;

const { domainMap = {} } = await browser.storage.local.get("domainMap");
if (domainMap[domain] || pendingDomainUpdates[domain]) return;

pendingDomainUpdates[domain] = await categorizeDomain(domain);
scheduleDomainMapFlush();

// Runs the first time the extension is installed, setting up default values in local storage.
browser.runtime.onInstalled.addListener(async (details) => {
      if (details.reason !== "install") return; // skip on reload/update, don't wipe data
    
      await browser.storage.local.set({
        categories: DEFAULT_CATEGORIES,
        categoryOrder: DEFAULT_CATEGORIES,
        excludedDomains: [],
        settings: { extensionEnabled: true, autoSort: false, liveSort: false },
        sessions: []
      });
    
      await seedDomainMap();
});
    
browser.tabs.onCreated.addListener(trackTab);
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;
  trackTab(tab);
});
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  const list = windowTabs.get(removeInfo.windowId);
  if (!list) return;
  windowTabs.set(removeInfo.windowId, list.filter(t => t.id !== tabId));
});