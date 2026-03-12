const state = {
  filter: "all",
  search: "",
  selected: null
};

const thesisList = document.getElementById("thesisList");
const metricsGrid = document.getElementById("metricsGrid");
const filters = document.getElementById("filters");
const laneContainer = document.getElementById("laneContainer");
const detailPanel = document.getElementById("detailPanel");
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
const publishedAt = document.getElementById("publishedAt");
const todayDate = document.getElementById("todayDate");
const todayChanges = document.getElementById("todayChanges");
const todayWhy = document.getElementById("todayWhy");

let DATA = null;
let laneMap = {};

async function loadData() {
  const [summary, lanes, projects, today] = await Promise.all([
    fetch("./data/summary.json").then((res) => res.json()),
    fetch("./data/lanes.json").then((res) => res.json()),
    fetch("./data/projects.json").then((res) => res.json()),
    fetch("./data/today.json").then((res) => res.json())
  ]);

  DATA = { summary, lanes, projects, today };
  laneMap = Object.fromEntries(lanes.map((lane) => [lane.id, lane]));

  if (!state.selected && projects[0]) {
    state.selected = projects[0].id;
  }
}

function filteredProjects() {
  const q = state.search.trim().toLowerCase();
  return DATA.projects.filter((project) => {
    const laneMatch = state.filter === "all" || project.lane === state.filter;
    const searchMatch =
      !q ||
      project.name.toLowerCase().includes(q) ||
      project.short.toLowerCase().includes(q) ||
      project.tags.join(" ").toLowerCase().includes(q) ||
      project.differentiator.toLowerCase().includes(q);
    return laneMatch && searchMatch;
  });
}

function renderThesis() {
  thesisList.innerHTML = DATA.summary.thesis.map((item) => `<li>${item}</li>`).join("");
  publishedAt.textContent = `Published dataset: ${DATA.summary.updatedAt}`;
}

function renderMetrics() {
  const metrics = [
    [DATA.summary.metrics.totalProjects, "Tracked projects"],
    [DATA.summary.metrics.tier1Projects, "Tier 1 names"],
    [DATA.summary.metrics.laneCount, "Strategic lanes"],
    [DATA.summary.metrics.adjacentCount, "Adjacent benchmarks"]
  ];

  metricsGrid.innerHTML = metrics
    .map(
      ([value, label]) => `
        <article class="metric-card">
          <div class="metric-value">${value}</div>
          <div class="metric-label">${label}</div>
        </article>
      `
    )
    .join("");
}

function renderToday() {
  todayDate.textContent = DATA.today.date;
  todayChanges.innerHTML = DATA.today.changes.map((item) => `<li>${item}</li>`).join("");
  todayWhy.innerHTML = DATA.today.whyItMatters.map((item) => `<li>${item}</li>`).join("");
}

function renderFilters() {
  const items = [{ id: "all", name: "All lanes" }, ...DATA.lanes];
  filters.innerHTML = items
    .map(
      (item) => `
        <button class="filter-pill ${state.filter === item.id ? "is-active" : ""}" data-filter="${item.id}">
          ${item.name}
        </button>
      `
    )
    .join("");

  filters.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      renderAtlas();
      renderFilters();
    });
  });
}

function renderAtlas() {
  const visibleProjects = filteredProjects();
  const visibleIds = new Set(visibleProjects.map((project) => project.id));

  if (!visibleIds.has(state.selected) && visibleProjects[0]) {
    state.selected = visibleProjects[0].id;
  }

  laneContainer.innerHTML = DATA.lanes
    .map((lane) => {
      const projects = visibleProjects.filter((project) => project.lane === lane.id);
      if (!projects.length) return "";

      return `
        <section class="lane-card">
          <div class="lane-head">
            <div>
              <h3 class="lane-title">${lane.name}</h3>
              <p class="lane-thesis">${lane.thesis}</p>
            </div>
            <span class="badge">${projects.length}</span>
          </div>
          <div class="project-grid">
            ${projects
              .map(
                (project) => `
                  <button class="project-card ${state.selected === project.id ? "is-active" : ""}" data-project="${project.id}">
                    <div class="project-meta">
                      <div>
                        <h4 class="project-name">${project.name}</h4>
                        <p class="project-kicker">${project.differentiator}</p>
                      </div>
                      <span class="badge">${project.tier}</span>
                    </div>
                    <div class="tag-row">
                      ${project.tags.slice(0, 4).map((tag) => `<span class="tag">${tag}</span>`).join("")}
                    </div>
                  </button>
                `
              )
              .join("")}
          </div>
        </section>
      `;
    })
    .join("");

  laneContainer.querySelectorAll("[data-project]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selected = button.dataset.project;
      renderAtlas();
      renderDetail();
    });
  });

  renderDetail();
}

function renderDetail() {
  const project = DATA.projects.find((item) => item.id === state.selected) || DATA.projects[0];
  const lane = laneMap[project.lane];

  detailPanel.innerHTML = `
    <div class="detail-header">
      <div class="detail-topline">
        <span class="badge">${project.tier}</span>
        <span class="tag">${lane.name}</span>
      </div>
      <div>
        <h3 class="detail-title">${project.name}</h3>
        <p class="detail-copy">${project.short}</p>
      </div>
      <div class="tag-row">
        ${project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
    </div>

    <div class="detail-stack">
      <section class="detail-block">
        <h4>Deployment</h4>
        <p>${project.deployment}</p>
      </section>
      <section class="detail-block">
        <h4>Strategic differentiator</h4>
        <p>${project.differentiator}</p>
      </section>
      <section class="detail-block">
        <h4>Why it matters</h4>
        <p>${project.why}</p>
      </section>
      <section class="detail-block">
        <h4>Links</h4>
        <div class="link-list">
          ${project.links
            .map(([label, url]) => `<a class="link-button" href="${url}" target="_blank" rel="noreferrer">${label}</a>`)
            .join("")}
        </div>
      </section>
    </div>
  `;
}

function renderTable() {
  tableBody.innerHTML = DATA.projects
    .map((project) => {
      const lane = laneMap[project.lane];
      const primaryLink = project.links[0]?.[1] || "#";
      return `
        <tr>
          <td>
            <a class="compare-name" href="${primaryLink}" target="_blank" rel="noreferrer">
              ${project.name} <span class="badge">${project.tier}</span>
            </a>
          </td>
          <td>${lane.name}</td>
          <td>${project.tier}</td>
          <td>${project.deployment}</td>
          <td>${project.differentiator}</td>
          <td>${project.why}</td>
        </tr>
      `;
    })
    .join("");
}

async function main() {
  try {
    await loadData();
    renderThesis();
    renderMetrics();
    renderToday();
    renderFilters();
    renderAtlas();
    renderTable();
  } catch (error) {
    console.error(error);
    thesisList.innerHTML = `<li>Failed to load ecosystem dataset. Check that the exported JSON bundle exists under <code>/data</code>.</li>`;
    publishedAt.textContent = 'Dataset unavailable';
  }
}

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  if (DATA) renderAtlas();
});

main();
