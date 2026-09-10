//////// Definitions
const GROUP_ID = "5384098";
const BASE_URL = `https://api.zotero.org/groups/${GROUP_ID}/items`;
let items = [];
let filteredItems = [];
let collectionMap = {};

// NEW: sort state
let sortColumn = null;      // "author" | "title" | "year"
let sortDirection = 1;      // 1 = ascending, -1 = descending

// NEW: which parsed field each sortable column should sort on
const SORT_KEYS = {
  author: "authorSort",
  title: "titleSort",
  year: "yearSort",
};

//////// FETCH LITERATURE
async function fetchLiterature() {
  showLoading(true);
  const response = await fetch(`${BASE_URL}?limit=100&format=json`);
  items = await response.json();
  items = items.filter(i => i.data.itemType !== "attachment");
  filteredItems = items;
  applySort(filteredItems); // NEW: keep any active sort applied to the fresh data
  populateCategoryFilters(items);
  renderTable();
  showLoading(false);
}

//////// FETCH COLLECTIONS
async function fetchCollections() {
  const res = await fetch(
    `https://api.zotero.org/groups/${GROUP_ID}/collections`
  );
  const collections = await res.json();

  collections.forEach(c => {
    collectionMap[c.key] = c.data.name;
  });
}

//////// PARSE TABLE ITEMS
function parseItem(item) {
  const data = item.data;

  const authors = (data.creators || [])
    .map(c => c.lastName);

  const authorText =
    authors.length > 3
      ? `${authors[0]} et al.`
      : authors.map(a => a).join(", ");

  const year = data.date ? data.date.substring(0, 4) : "";

  return {
    author: authorText,
    // NEW: sortable keys, independent of how the cell is displayed
    authorSort: (authors[0] || "").toLowerCase(),
    titleSort: (data.title || "").toLowerCase(),
    yearSort: year ? parseInt(year, 10) || 0 : 0,

    title: data.title || "",
    year: year,
    url: data.url || "",
    tags: (data.tags || []).map(t => t.tag),
    collections: item.data.collections || []
  };
}

// NEW: sort a list of raw Zotero items in place, according to current sortColumn/sortDirection
function applySort(list) {
  if (!sortColumn) return list;
  const key = SORT_KEYS[sortColumn];

  return list.sort((a, b) => {
    const va = parseItem(a)[key];
    const vb = parseItem(b)[key];
    if (va < vb) return -1 * sortDirection;
    if (va > vb) return 1 * sortDirection;
    return 0;
  });
}

// NEW: called when a sortable header is clicked
function sortItems(column) {
  if (sortColumn === column) {
    sortDirection *= -1; // clicking the same column again flips direction
  } else {
    sortColumn = column;
    sortDirection = 1;
  }

  applySort(filteredItems);
  renderTable();
  updateSortIndicators();
}

// NEW: adds a ▲ / ▼ marker to whichever header is currently active
function updateSortIndicators() {
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.classList.remove("sort-asc", "sort-desc");
    const label = th.dataset.sortLabel || th.textContent.replace(/[▲▼]\s*$/, "").trim();
    th.dataset.sortLabel = label; // remember the clean label so arrows don't stack up
    if (th.dataset.sort === sortColumn) {
      th.classList.add(sortDirection === 1 ? "sort-asc" : "sort-desc");
      th.textContent = `${label} ${sortDirection === 1 ? "▲" : "▼"}`;
    } else {
      th.textContent = label;
    }
  });
}

// NEW: wire up click handlers on any <th data-sort="..."> header
function initSortableHeaders() {
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => sortItems(th.dataset.sort));
  });
}

//////// RENDER TABLE
function renderTable() {
  const tbody = document.getElementById("literatureBody");
  tbody.innerHTML = "";

  const limit = document.getElementById("entriesPerPage").value;
  const rows = filteredItems.slice(0, limit === "all" ? undefined : limit);

  rows.forEach(item => {
    const parsed = parseItem(item);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${parsed.author}</td>
      <td>${parsed.title}</td>
      <td>${parsed.year}</td>
      <td>${parsed.url ? `<a href="${parsed.url}" target="_blank">Link</a>` : ""}</td>
      <td>${parsed.tags.join(", ")}</td>
    `;
    tbody.appendChild(tr);
  });
}

//////// POPULATE CATEGORY FILTERS
function populateCategoryFilters(items) {
  const tagSet = new Set();

  items.forEach(item => {
    (item.data.tags || []).forEach(t => tagSet.add(t.tag));
  });

  const categoryFilter = document.getElementById("categoryFilter");
  [...tagSet].sort().forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    categoryFilter.appendChild(opt);
  });
}

//////// POPULATE TYPE FILTERS
function populateTypeFilter() {
  const select = document.getElementById("typeFilter");
  select.innerHTML = `<option value="all">All types</option>`;

  Object.entries(collectionMap).forEach(([key, name]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = name;
    select.appendChild(opt);
  });
}

// ADD SEARCH FILTER
function applySearchFilter() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();

  filteredItems = items.filter(item => {
    const parsed = parseItem(item);

    // Search in author, title, year, and tags (joined)
    const haystack = [
      parsed.author,
      parsed.title,
      parsed.year,
      parsed.tags.join(" ")
    ].join(" ").toLowerCase();

    return haystack.includes(searchTerm);
  });

  applySort(filteredItems); // NEW: keep the active sort after filtering
  renderTable();
}


//////// APPLY FILTERS
function applyFilters() {
  const category = document.getElementById("categoryFilter").value;
  const type = document.getElementById("typeFilter").value;

  filteredItems = items.filter(item => {

    // Tag filter
    if (category) {
      const hasTag = (item.data.tags || [])
        .some(t => t.tag === category);
      if (!hasTag) return false;
    }

    // Collection (type) filter
    if (type !== "all") {
      if (!item.data.collections?.includes(type)) {
        return false;
      }
    }

    return true;
  });

  applySort(filteredItems); // NEW: keep the active sort after filtering
  renderTable();
}

//////// SHOW LOADING
function showLoading(state) {
  document.getElementById("loading-indicator").style.display =
    state ? "block" : "none";
}

//////// EVENT LISTENERS
document.getElementById("categoryFilter")
  .addEventListener("change", applyFilters);

document.getElementById("typeFilter")
  .addEventListener("change", applyFilters);

document.getElementById("entriesPerPage")
  .addEventListener("change", renderTable);

document.getElementById("searchInput")
  .addEventListener("input", applySearchFilter);

document.addEventListener("DOMContentLoaded", async () => {
  showLoading(true);

  initSortableHeaders(); // NEW

  await fetchCollections();
  populateTypeFilter();

  await fetchLiterature();

  showLoading(false);
});

//////// CACHE
const CACHE_KEY = "zoteroLiterature";

function loadFromCache() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    items = JSON.parse(cached);
    filteredItems = items;
    applySort(filteredItems); // NEW
    populateTypeFilter(items);
    populateCategoryFilters(items);
    renderTable();
    return true;
  }
  return false;
}