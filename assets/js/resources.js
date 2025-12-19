function loadTable(jsonPath, tableBodyId, searchInputId, renderRow) {
  fetch(jsonPath)
    .then(r => r.json())
    .then(data => {
      const tbody = document.querySelector(`#${tableBodyId} tbody`);
      const search = document.getElementById(searchInputId);

      function render(filter = "") {
        tbody.innerHTML = "";
        data
          .filter(item =>
            JSON.stringify(item).toLowerCase().includes(filter.toLowerCase())
          )
          .forEach(item => tbody.appendChild(renderRow(item)));
      }

      search.addEventListener("input", e => render(e.target.value));
      render();
    })
    .catch(err => console.error(`Failed to load ${jsonPath}`, err));
}

/* Repositories */
loadTable(
  "/data/repositories.json",
  "repositories-table",
  "repo-search",
  repo => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="${repo.url}" target="_blank">${repo.name}</a></td>
      <td>${repo.description}</td>
      <td>${repo.language}</td>
      <td>${repo.status}</td>
    `;
    return tr;
  }
);

/* Software */
loadTable(
  "/data/software.json",
  "software-table",
  "software-search",
  sw => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="${sw.url}" target="_blank">${sw.name}</a></td>
      <td>${sw.description}</td>
      <td>${sw.open ? "Yes" : "No"}</td>
      <td>${sw.programmable ? "Yes" : "No"}</td>
    `;
    return tr;
  }
);