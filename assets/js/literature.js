//////// Definitions
const GROUP_ID = "5384098";
const BASE_URL = `https://api.zotero.org/groups/${GROUP_ID}/items`;
let items = [];
let filteredItems = [];
let collectionMap = {};


//////// FETCH LITERATURE
async function fetchLiterature() {
  showLoading(true);
  const response = await fetch(`${BASE_URL}?limit=100&format=json`);
  items = await response.json();
  items = items.filter(i => i.data.itemType !== "attachment");
  filteredItems = items;
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
    console.log(authors)
    const authorText =
        authors.length > 3
            ? `${authors[0]} et al.`
            : authors.map(a => a).join(", ");

  return {
    author: authorText,
    title: data.title || "",
    year: data.date ? data.date.substring(0, 4) : "",
    url: data.url || "",
    tags: (data.tags || []).map(t => t.tag),
    collections: item.data.collections || []
  };
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
    populateTypeFilter(items);
    populateCategoryFilters(items);
    renderTable();
    return true;
  }
  return false;
}
