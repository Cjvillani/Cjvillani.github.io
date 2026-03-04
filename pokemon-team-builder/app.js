// Pokemon Team Builder (no frameworks)
// Uses caching to minimize API calls: in-memory + localStorage.

const API_BASE = "https://pokeapi.co/api/v2/pokemon/";
const TEAM_KEY = "ptb_team_v1";
const CACHE_KEY = "ptb_pokemon_cache_v1"; // localStorage cache of pokemon JSON by id/name

const el = (id) => document.getElementById(id);

const ui = {
  query: el("query"),
  findBtn: el("findBtn"),
  status: el("status"),
  img: el("pokeImg"),
  audio: el("pokeAudio"),
  move1: el("move1"),
  move2: el("move2"),
  move3: el("move3"),
  move4: el("move4"),
  addBtn: el("addBtn"),
  teamBody: el("teamBody"),
};

let currentPokemon = null; // { id, name, spriteUrl, cryUrl, moves: [name...] }
let team = loadTeam();
let memCache = loadPokemonCache(); // object keyed by query string -> raw pokemon JSON

renderTeam();

ui.findBtn.addEventListener("click", () => {
  findPokemon();
});

ui.query.addEventListener("keydown", (e) => {
  if (e.key === "Enter") findPokemon();
});

ui.addBtn.addEventListener("click", () => {
  addCurrentToTeam();
});

function setStatus(msg) {
  ui.status.textContent = msg;
}

function normalizeQuery(q) {
  return String(q || "").trim().toLowerCase();
}

async function findPokemon() {
  const q = normalizeQuery(ui.query.value);
  if (!q) {
    setStatus("Type a Pokemon name or ID.");
    return;
  }

  ui.addBtn.disabled = true;
  currentPokemon = null;
  setStatus("Loading...");

  try {
    // Cache check first (minimizes calls)
    const raw = await getPokemonRaw(q);

    const parsed = parsePokemon(raw);
    currentPokemon = parsed;

    // Update UI
    loadImage(parsed.spriteUrl, parsed.name);
    loadAudio(parsed.cryUrl);
    loadMoves(parsed.moves);

    ui.addBtn.disabled = false;
    setStatus(`Loaded ${capitalize(parsed.name)} (#${parsed.id}). Pick 4 moves and click Add to Team.`);
  } catch (err) {
    console.error(err);
    setStatus("Not found. Try a different name/ID (example: 1..151 or 'pikachu').");
    clearPokemonUI();
  }
}

async function getPokemonRaw(q) {
  // In-memory/localStorage cached JSON
  if (memCache[q]) return memCache[q];

  const resp = await fetch(API_BASE + encodeURIComponent(q));
  if (!resp.ok) throw new Error("Fetch failed");
  const json = await resp.json();

  // Store under both query + canonical keys to boost cache hits
  const nameKey = normalizeQuery(json.name);
  const idKey = String(json.id);

  memCache[q] = json;
  memCache[nameKey] = json;
  memCache[idKey] = json;

  savePokemonCache(memCache);
  return json;
}

function parsePokemon(raw) {
  const id = raw.id;
  const name = raw.name;

  // Image: prefer official artwork, fallback to front_default
  const spriteUrl =
    raw?.sprites?.other?.["official-artwork"]?.front_default ||
    raw?.sprites?.front_default ||
    "";

  // Audio: PokeAPI cries (may be null for some)
  const cryUrl =
    raw?.cries?.latest ||
    raw?.cries?.legacy ||
    "";

  // Moves list: simple names (no extra API calls needed)
  const moves = (raw.moves || [])
    .map(m => m?.move?.name)
    .filter(Boolean);

  return { id, name, spriteUrl, cryUrl, moves };
}

function loadImage(url, name) {
  if (!url) {
    ui.img.style.display = "none";
    ui.img.src = "";
    ui.img.alt = "";
    return;
  }
  ui.img.style.display = "block";
  ui.img.src = url;
  ui.img.alt = name;
}

function loadAudio(url) {
  if (!url) {
    ui.audio.style.display = "none";
    ui.audio.src = "";
    ui.audio.load();
    return;
  }
  ui.audio.style.display = "block";
  ui.audio.src = url;
  ui.audio.load();
}

function loadMoves(moves) {
  // If a Pokemon has less than 4 moves (rare), handle gracefully
  const list = moves.length ? moves : ["(no moves found)"];

  fillSelect(ui.move1, list);
  fillSelect(ui.move2, list);
  fillSelect(ui.move3, list);
  fillSelect(ui.move4, list);
}

function fillSelect(selectEl, items) {
  selectEl.innerHTML = "";
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    selectEl.appendChild(opt);
  }
}

function clearPokemonUI() {
  loadImage("", "");
  loadAudio("");
  fillSelect(ui.move1, [""]);
  fillSelect(ui.move2, [""]);
  fillSelect(ui.move3, [""]);
  fillSelect(ui.move4, [""]);
  ui.addBtn.disabled = true;
}

function addCurrentToTeam() {
  if (!currentPokemon) return;

  const moves = [
    ui.move1.value,
    ui.move2.value,
    ui.move3.value,
    ui.move4.value,
  ].map(normalizeQuery).filter(Boolean);

  const member = {
    id: currentPokemon.id,
    name: currentPokemon.name,
    spriteUrl: currentPokemon.spriteUrl,
    moves,
    addedAt: Date.now(),
  };

  team.push(member);
  saveTeam(team);
  renderTeam();
  setStatus(`Added ${capitalize(member.name)} to your team.`);
}

function renderTeam() {
  ui.teamBody.innerHTML = "";

  if (!team.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "No Pokemon in team yet.";
    tr.appendChild(td);
    ui.teamBody.appendChild(tr);
    return;
  }

  team.forEach((m, idx) => {
    const tr = document.createElement("tr");

    const tdPoke = document.createElement("td");
    tdPoke.style.textAlign = "center";
    const img = document.createElement("img");
    img.src = m.spriteUrl || "";
    img.alt = m.name;
    img.style.width = "72px";
    img.style.height = "72px";
    img.style.objectFit = "contain";
    const nameDiv = document.createElement("div");
    nameDiv.textContent = capitalize(m.name);
    tdPoke.appendChild(img);
    tdPoke.appendChild(nameDiv);

    const tdMoves = document.createElement("td");
    const ul = document.createElement("ul");
    ul.style.margin = "0";
    ul.style.paddingLeft = "18px";
    (m.moves || []).forEach(move => {
      const li = document.createElement("li");
      li.textContent = move;
      ul.appendChild(li);
    });
    tdMoves.appendChild(ul);

    const tdAction = document.createElement("td");
    tdAction.style.textAlign = "center";
    const delBtn = document.createElement("button");
    delBtn.textContent = "Remove";
    delBtn.addEventListener("click", () => {
      team.splice(idx, 1);
      saveTeam(team);
      renderTeam();
      setStatus("Removed from team.");
    });
    tdAction.appendChild(delBtn);

    tr.appendChild(tdPoke);
    tr.appendChild(tdMoves);
    tr.appendChild(tdAction);
    ui.teamBody.appendChild(tr);
  });
}

function loadTeam() {
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTeam(t) {
  localStorage.setItem(TEAM_KEY, JSON.stringify(t));
}

function loadPokemonCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePokemonCache(cacheObj) {
  // Keep cache from growing forever: store up to ~60 entries
  const keys = Object.keys(cacheObj);
  if (keys.length > 60) {
    // Drop oldest by naive strategy: remove first N keys
    // (Good enough for this assignment; still reduces calls.)
    const toRemove = keys.length - 60;
    for (let i = 0; i < toRemove; i++) delete cacheObj[keys[i]];
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
}

function capitalize(s) {
  s = String(s || "");
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
