const LANE_COLORS = {
  core: "#d97757",
  lightweight: "#6b9e78",
  security: "#7a7ec9",
  orchestration: "#c9963a",
  adjacent: "#5a9bb5",
  longtail: "#9b8a7b"
};

const state = {
  filter: "all",
  search: "",
  selected: null,
  expandedLanes: new Set(),
  drawerOpen: false
};

const $ = (id) => document.getElementById(id);

const laneContainer = $("laneContainer");
const laneNav = $("laneNav");
const searchInput = $("searchInput");
const updatedLine = $("updatedLine");
const drawerEl = $("detailDrawer");
const drawerBackdrop = $("drawerBackdrop");
const drawerContent = $("drawerContent");
const drawerClose = $("drawerClose");

let DATA = null;
let laneMap = {};

async function loadData() {
  const [summary, lanes, projects] = await Promise.all([
    fetch("./data/summary.json").then((res) => res.json()),
    fetch("./data/lanes.json").then((res) => res.json()),
    fetch("./data/projects.json").then((res) => res.json())
  ]);

  DATA = { summary, lanes, projects };
  laneMap = Object.fromEntries(lanes.map((lane) => [lane.id, lane]));

  // Start with all lanes expanded
  lanes.forEach((lane) => state.expandedLanes.add(lane.id));
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

function renderUpdatedLine() {
  updatedLine.textContent = `Updated ${DATA.summary.updatedAt}`;
}

function renderLaneNav() {
  const projectsByLane = {};
  DATA.projects.forEach((p) => {
    projectsByLane[p.lane] = (projectsByLane[p.lane] || 0) + 1;
  });

  laneNav.innerHTML = DATA.lanes
    .map(
      (lane) => `
        <button class="lane-pill" data-lane-nav="${lane.id}">
          <span class="lane-dot" style="background: ${LANE_COLORS[lane.id] || LANE_COLORS.longtail}"></span>
          ${lane.name}
          <span class="lane-pill-count">${projectsByLane[lane.id] || 0}</span>
        </button>
      `
    )
    .join("");

  laneNav.querySelectorAll("[data-lane-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const laneId = btn.dataset.laneNav;
      state.filter = state.filter === laneId ? "all" : laneId;
      if (state.filter !== "all") state.expandedLanes.add(laneId);
      renderAtlas();
      updateLaneNavActive();
      document.getElementById("atlas").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function updateLaneNavActive() {
  laneNav.querySelectorAll("[data-lane-nav]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.laneNav === state.filter);
  });
}

function renderAtlas() {
  const visibleProjects = filteredProjects();
  const q = state.search.trim().toLowerCase();

  // Auto-expand lanes that have search matches
  if (q) {
    state.expandedLanes.clear();
    const matchedLanes = new Set(visibleProjects.map((p) => p.lane));
    matchedLanes.forEach((id) => state.expandedLanes.add(id));
  }

  laneContainer.innerHTML = DATA.lanes
    .map((lane) => {
      const projects = visibleProjects.filter((project) => project.lane === lane.id);
      if (!projects.length) return "";

      const isExpanded = state.expandedLanes.has(lane.id);
      const color = LANE_COLORS[lane.id] || LANE_COLORS.longtail;

      return `
        <section class="lane-card" data-lane="${lane.id}">
          <button class="lane-head" data-lane-toggle="${lane.id}" aria-expanded="${isExpanded}">
            <div>
              <h3 class="lane-title">${lane.name}</h3>
              <p class="lane-thesis">${lane.thesis}</p>
            </div>
            <div class="lane-head-right">
              <span class="badge">${projects.length}</span>
              <span class="lane-chevron ${isExpanded ? "is-open" : ""}">&#9662;</span>
            </div>
          </button>
          <div class="lane-body ${isExpanded ? "" : "is-collapsed"}">
            <div class="project-list">
              ${projects
                .map(
                  (project) => `
                    <button class="project-row" data-project="${project.id}">
                      <span class="project-dot" style="background: ${color}"></span>
                      <span class="project-row-name">${project.name}</span>
                      <span class="badge">${project.tier}</span>
                    </button>
                  `
                )
                .join("")}
            </div>
          </div>
        </section>
      `;
    })
    .join("");

  // Lane toggle listeners
  laneContainer.querySelectorAll("[data-lane-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const laneId = btn.dataset.laneToggle;
      if (state.expandedLanes.has(laneId)) {
        state.expandedLanes.delete(laneId);
      } else {
        state.expandedLanes.add(laneId);
      }
      renderAtlas();
    });
  });

  // Project row listeners
  laneContainer.querySelectorAll("[data-project]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDrawer(btn.dataset.project);
    });
  });
}

function getLaneProjects(laneId) {
  return DATA.projects.filter((p) => p.lane === laneId);
}

function renderDetail() {
  const project = DATA.projects.find((item) => item.id === state.selected) || DATA.projects[0];
  if (!project) return;
  const lane = laneMap[project.lane];
  const laneProjects = getLaneProjects(project.lane);
  const currentIndex = laneProjects.findIndex((p) => p.id === project.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < laneProjects.length - 1;

  drawerContent.innerHTML = `
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

    <div class="drawer-nav">
      <button class="drawer-nav-btn" data-drawer-prev ${hasPrev ? "" : "disabled"}>&#8592; Prev</button>
      <span class="drawer-nav-pos">${currentIndex + 1} / ${laneProjects.length}</span>
      <button class="drawer-nav-btn" data-drawer-next ${hasNext ? "" : "disabled"}>Next &#8594;</button>
    </div>
  `;

  // Prev/next listeners
  const prevBtn = drawerContent.querySelector("[data-drawer-prev]");
  const nextBtn = drawerContent.querySelector("[data-drawer-next]");

  if (prevBtn && hasPrev) {
    prevBtn.addEventListener("click", () => {
      state.selected = laneProjects[currentIndex - 1].id;
      renderDetail();
    });
  }
  if (nextBtn && hasNext) {
    nextBtn.addEventListener("click", () => {
      state.selected = laneProjects[currentIndex + 1].id;
      renderDetail();
    });
  }
}

function openDrawer(projectId) {
  state.selected = projectId;
  state.drawerOpen = true;
  drawerEl.classList.add("is-open");
  drawerEl.setAttribute("aria-hidden", "false");
  drawerBackdrop.classList.add("is-open");
  document.body.style.overflow = "hidden";
  renderDetail();
}

function closeDrawer() {
  state.drawerOpen = false;
  drawerEl.classList.remove("is-open");
  drawerEl.setAttribute("aria-hidden", "true");
  drawerBackdrop.classList.remove("is-open");
  document.body.style.overflow = "";
}

async function main() {
  try {
    await loadData();
    renderLaneNav();
    renderUpdatedLine();
    renderAtlas();
  } catch (error) {
    console.error(error);
    laneContainer.innerHTML = `<p style="padding:2rem;color:var(--text-secondary)">Failed to load ecosystem dataset. Check that the exported JSON bundle exists under <code>/data</code>.</p>`;
    updatedLine.textContent = "Dataset unavailable";
  }
}

// Event listeners
searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  if (DATA) renderAtlas();
});

drawerBackdrop.addEventListener("click", closeDrawer);
drawerClose.addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.drawerOpen) closeDrawer();
});

main();
