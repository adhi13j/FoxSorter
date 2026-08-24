
const CATEGORY_DOT = {
  Study: "dot--study",
  Entertainment: "dot--entertainment",
  Hobbies: "dot--hobbies",
  Neutral: "dot--neutral",
};

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup");

  /* ---------- screen navigation ---------- */
  const screens = Array.from(document.querySelectorAll(".screen"));
  function showScreen(name) {
    screens.forEach((s) => (s.hidden = s.dataset.screen !== name));
  }
  document.querySelectorAll("[data-target]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen(btn.dataset.target));
  });
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen("home"));
  });

  /* ---------- live tab tracking ---------- */
  const statusLine = document.getElementById("statusLine");
  const currentTitle = document.getElementById("currentTitle");
  const currentCategory = document.getElementById("currentCategory");
  const faviconEl = () => document.getElementById("favicon");

  let activeDomain = null; // tracked so the categorize picker knows what to save

  function setCategoryDisplay(category) {
    currentCategory.innerHTML = "";
    const dot = document.createElement("span");
    dot.className = `dot ${CATEGORY_DOT[category] || "dot--neutral"}`;
    currentCategory.appendChild(dot);
    currentCategory.appendChild(
      document.createTextNode(category || "Uncategorized")
    );
  }

  async function refreshTabCount() {
    try {
      const tabs = await browser.tabs.query({ currentWindow: true });
      statusLine.textContent = `Watching ${tabs.length} tab${
        tabs.length === 1 ? "" : "s"
      } · this window`;
    } catch (err) {
      console.error("Fox Sorter: couldn't read tabs", err);
    }
  }

  async function refreshCurrentTab() {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab || !tab.url) return;

      let domain;
      try {
        domain = new URL(tab.url).hostname || tab.url;
      } catch {
        domain = tab.url; // e.g. about:blank, file:// URLs without a hostname
      }
      activeDomain = domain;
      currentTitle.textContent = domain;
      currentTitle.title = tab.title || domain;

      const icon = faviconEl();
      if (tab.favIconUrl) {
        const img = document.createElement("img");
        img.className = "favicon";
        img.id = "favicon";
        img.src = tab.favIconUrl;
        img.alt = "";
        icon.replaceWith(img);
      }

      const { domainCategoryMap = {} } = await browser.storage.local.get(
        "domainCategoryMap"
      );
      const saved = domainCategoryMap[domain];
      setCategoryDisplay(saved ? saved.category : null);

      categoryPicker.querySelectorAll(".chip").forEach((c) => {
        c.classList.toggle("is-active", saved && c.dataset.cat === saved.category);
      });
    } catch (err) {
      console.error("Fox Sorter: couldn't read current tab", err);
    }
  }

  refreshTabCount();
  refreshCurrentTab();

  // keep counts/current-tab fresh while the popup stays open
  browser.tabs.onCreated.addListener(refreshTabCount);
  browser.tabs.onRemoved.addListener(refreshTabCount);
  browser.tabs.onActivated.addListener(refreshCurrentTab);
  browser.tabs.onUpdated.addListener((_id, changeInfo, tab) => {
    if (tab.active && (changeInfo.url || changeInfo.status === "complete")) {
      refreshCurrentTab();
    }
  });

  /* ---------- categorize current tab ---------- */
  const categorizeBtn = document.getElementById("categorizeBtn");
  const categoryPicker = document.getElementById("categoryPicker");

  categorizeBtn.addEventListener("click", () => {
    const open = categoryPicker.hidden;
    categoryPicker.hidden = !open;
    categorizeBtn.setAttribute("aria-expanded", String(open));
  });

  categoryPicker.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", async () => {
      categoryPicker
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.toggle("is-active", c === chip));
      setCategoryDisplay(chip.dataset.cat);
      categoryPicker.hidden = true;
      categorizeBtn.setAttribute("aria-expanded", "false");

      if (!activeDomain) return;
      const { domainCategoryMap = {} } = await browser.storage.local.get(
        "domainCategoryMap"
      );
      domainCategoryMap[activeDomain] = {
        category: chip.dataset.cat,
        source: "manual",
      };
      await browser.storage.local.set({ domainCategoryMap });
    });
  });

  /* ---------- sort now ---------- */
  const sortBtn = document.getElementById("sortBtn");
  const sortBtnLabel = document.getElementById("sortBtnLabel");
  sortBtn.addEventListener("click", async () => {
    sortBtnLabel.textContent = "Sorting…";
    sortBtn.disabled = true;
    try {
      await browser.runtime.sendMessage({ type: "SORT_NOW" });
      sortBtnLabel.textContent = "Sorted";
    } catch (err) {
      console.error("Fox Sorter: sort request failed", err);
      sortBtnLabel.textContent = "Couldn't sort";
    } finally {
      setTimeout(() => {
        sortBtnLabel.textContent = "Sort tabs now";
        sortBtn.disabled = false;
      }, 1100);
    }
  });

  /* ---------- auto / live sort toggles (persisted) ---------- */
  const autoSort = document.getElementById("autoSort");
  const liveSort = document.getElementById("liveSort");

  browser.storage.local.get(["autoSort", "liveSort"]).then((saved) => {
    autoSort.checked = Boolean(saved.autoSort);
    liveSort.checked = Boolean(saved.liveSort);
  });

  autoSort.addEventListener("change", () => {
    browser.storage.local.set({ autoSort: autoSort.checked });
  });
  liveSort.addEventListener("change", () => {
    browser.storage.local.set({ liveSort: liveSort.checked });
  });

  /* ---------- saved sessions (home quick-open) ---------- */
  const openSessionBtn = document.getElementById("openSessionBtn");
  const sessionSelect = document.getElementById("sessionSelect");
  openSessionBtn.addEventListener("click", async () => {
    openSessionBtn.textContent = "Opening…";
    try {
      await browser.runtime.sendMessage({
        type: "OPEN_SESSION",
        id: sessionSelect.value,
      });
    } catch (err) {
      console.error("Fox Sorter: couldn't open session", err);
    } finally {
      setTimeout(() => (openSessionBtn.textContent = "Open"), 900);
    }
  });

  /* ---------- sorting order: reorder ---------- */
  const orderList = document.getElementById("orderList");

  browser.storage.local.get("categoryOrder").then((saved) => {
    if (!saved.categoryOrder) return;
    const items = Array.from(orderList.children);
    saved.categoryOrder.forEach((cat) => {
      const item = items.find((el) => el.dataset.cat === cat);
      if (item) orderList.appendChild(item);
    });
  });

  function persistOrder() {
    const order = Array.from(orderList.children).map((el) => el.dataset.cat);
    browser.storage.local.set({ categoryOrder: order });
  }

  orderList.addEventListener("click", (e) => {
    const btn = e.target.closest(".arrow-btn");
    if (!btn) return;
    const item = btn.closest(".order-item");
    if (btn.dataset.dir === "up" && item.previousElementSibling) {
      orderList.insertBefore(item, item.previousElementSibling);
    } else if (btn.dataset.dir === "down" && item.nextElementSibling) {
      orderList.insertBefore(item.nextElementSibling, item);
    }
    persistOrder();
  });

  /* ---------- master disable (persisted) ---------- */
  const disableToggle = document.getElementById("disableToggle");
  const disableLabel = document.getElementById("disableLabel");

  function applyDisabledState(disabled) {
    disableToggle.setAttribute("aria-pressed", String(disabled));
    popup.classList.toggle("is-disabled", disabled);
    disableLabel.textContent = disabled ? "Disabled" : "Enabled";
  }

  browser.storage.local.get("enabled").then((saved) => {
    // default to enabled if never set
    applyDisabledState(saved.enabled === false);
  });

  disableToggle.addEventListener("click", async () => {
    const nowDisabled = disableToggle.getAttribute("aria-pressed") !== "true";
    applyDisabledState(nowDisabled);
    await browser.storage.local.set({ enabled: !nowDisabled });
  });
});