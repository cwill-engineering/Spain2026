/**
 * Prado Museum scavenger hunt — multi-player checklist (WTF tab).
 */
(function () {
  const STORAGE_KEY = "prado-challenge-v2";
  const BONUS_POINTS = 5;

  const SUGGESTED_PAINTINGS = [
    { title: "Las Meninas", artist: "Velázquez" },
    { title: "The Garden of Earthly Delights", artist: "Bosch" },
    { title: "The Third of May 1808", artist: "Goya" },
    { title: "Saturn Devouring His Son", artist: "Goya" },
    { title: "The Nobleman with His Hand on His Chest", artist: "El Greco" },
    { title: "The Descent from the Cross", artist: "Rogier van der Weyden" },
    { title: "The Triumph of Death", artist: "Bruegel the Elder" },
    { title: "The Family of Charles IV", artist: "Goya" },
    { title: "The Annunciation", artist: "Fra Angelico" },
    { title: "The Three Graces", artist: "Rubens" },
  ];

  const RULES = [
    "No Googling.",
    "You must show the rest of the group when you find it.",
  ];

  const CHALLENGES = [
    { id: "rated-r", text: "Find the painting that would most likely get a movie rated R." },
    { id: "creepiest", text: "Find the creepiest painting in the museum.", hint: "Most people vote for the same one." },
    { id: "album-cover", text: "Find a painting that looks like it could be an album cover." },
    { id: "worst-day", text: "Find a painting where someone is definitely having the worst day of their life." },
    { id: "powerful", text: "Find the most powerful-looking person in the museum." },
    { id: "self-portrait", text: "Find a painting where the artist secretly included himself." },
    { id: "crowd", text: "Find a painting with over 100 different people or creatures." },
    { id: "modern-old", text: "Find something painted more than 500 years ago that still looks surprisingly modern." },
    { id: "weird-animal", text: "Find an animal doing something weird." },
    { id: "game-level", text: "Find a painting that would make a great video game level." },
    { id: "details", text: "Find a painting where you're still discovering new details after 2 minutes." },
    { id: "realistic-face", text: "Find the most realistic face in the museum." },
    { id: "alien", text: "Find a painting that would be impossible to explain to someone from another planet." },
    { id: "viral", text: "Find a painting that would absolutely go viral if it appeared on social media today." },
    { id: "skill", text: "Find the painting that took the most skill to create." },
  ];

  const BONUS_CHALLENGES = [
    { id: "wall-painter", text: "Find the artist who painted directly on the walls of his house.", bonus: true },
    { id: "las-meninas", text: "Find the painting where the king and queen are in the room but barely visible.", bonus: true },
    { id: "confused", text: "Find the painting that has confused art historians for hundreds of years.", bonus: true },
    { id: "garden-weird", text: "Find the weirdest thing inside The Garden of Earthly Delights.", bonus: true },
    { id: "convince", text: "Convince the group that your favorite painting is the best one in the museum.", bonus: true },
  ];

  let state = null;
  let rootEl = null;
  let initialized = false;

  function slugId(prefix) {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  function createPlayer(name) {
    return {
      id: slugId("player"),
      name: (name || "").trim() || "Guest",
      checked: {},
      createdAt: Date.now(),
    };
  }

  function defaultState() {
    const first = createPlayer("You");
    return { version: 2, activePlayerId: first.id, sharedCustom: [], players: [first] };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!parsed?.players?.length) return defaultState();
      return {
        version: 2,
        activePlayerId: parsed.activePlayerId || parsed.players[0].id,
        sharedCustom: Array.isArray(parsed.sharedCustom) ? parsed.sharedCustom : [],
        players: parsed.players.map((p) => ({
          id: p.id,
          name: p.name || "Guest",
          checked: p.checked && typeof p.checked === "object" ? p.checked : {},
          createdAt: p.createdAt || Date.now(),
        })),
      };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function activePlayer() {
    return state.players.find((p) => p.id === state.activePlayerId) || state.players[0];
  }

  function allChallenges() {
    const custom = (state.sharedCustom || []).map((c) => ({
      ...c,
      custom: true,
      bonus: !!c.bonus,
    }));
    return [...CHALLENGES, ...BONUS_CHALLENGES, ...custom];
  }

  function playerStats(player) {
    const items = allChallenges();
    const main = items.filter((c) => !c.bonus);
    const bonus = items.filter((c) => c.bonus);
    const doneMain = main.filter((c) => player.checked[c.id]).length;
    const doneBonus = bonus.filter((c) => player.checked[c.id]).length;
    const total = items.length;
    const done = doneMain + doneBonus;
    return {
      doneMain,
      doneBonus,
      done,
      total,
      mainTotal: main.length,
      bonusPoints: doneBonus * BONUS_POINTS,
      pct: total ? Math.round((done / total) * 100) : 0,
    };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render() {
    if (!rootEl) return;
    const active = activePlayer();
    const stats = playerStats(active);
    const challenges = allChallenges();
    const mainList = challenges.filter((c) => !c.bonus);
    const bonusList = challenges.filter((c) => c.bonus);

    const leaderboard = [...state.players]
      .map((p) => ({ p, s: playerStats(p) }))
      .sort((a, b) => b.s.pct - a.s.pct);

    rootEl.innerHTML = `
      <div class="prado-header">
        <h2 class="prado-title">🏛️ Prado Challenge</h2>
        <p class="prado-sub">Museo del Prado scavenger hunt — each person tracks their own finds.</p>
        <div class="prado-player-bar">
          <label class="sr-only" for="prado-player-select">Active player</label>
          <select id="prado-player-select" class="prado-select">
            ${state.players.map((p) => `<option value="${p.id}" ${p.id === state.activePlayerId ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("")}
          </select>
          <button type="button" class="prado-btn prado-btn-gold" id="prado-add-person">+ Person</button>
        </div>
        <div id="prado-add-form" class="prado-add-form" hidden>
          <input type="text" id="prado-new-name" placeholder="Name" maxlength="40" class="prado-input" />
          <button type="button" class="prado-btn" id="prado-save-person">Add</button>
        </div>
        <div class="prado-progress">
          <div class="prado-progress-row">
            <span>${escapeHtml(active.name)}'s progress</span>
            <strong>${stats.doneMain}/${stats.mainTotal}${stats.bonusPoints ? ` · +${stats.bonusPoints} bonus pts` : ""}</strong>
          </div>
          <div class="prado-bar"><div class="prado-bar-fill" style="width:${stats.pct}%"></div></div>
        </div>
      </div>

      <section class="prado-card">
        <h3 class="prado-section-title">Group progress</h3>
        <ul class="prado-leaderboard">
          ${leaderboard
            .map(
              ({ p, s }, i) => `
            <li class="prado-lb-row ${p.id === state.activePlayerId ? "active" : ""}">
              <span class="prado-lb-rank">${i === 0 && s.pct > 0 ? "👑" : i + 1 + "."}</span>
              <div class="prado-lb-body">
                <div class="prado-lb-top">
                  <span>${escapeHtml(p.name)}${p.id === state.activePlayerId ? ' <em>(you)</em>' : ""}</span>
                  <span>${s.done}/${s.total}${s.bonusPoints ? ` <span class="prado-pts">+${s.bonusPoints}pt</span>` : ""}</span>
                </div>
                <div class="prado-bar prado-bar-sm"><div class="prado-bar-fill" style="width:${s.pct}%"></div></div>
              </div>
            </li>`
            )
            .join("")}
        </ul>
      </section>

      <section class="prado-card">
        <h3 class="prado-section-title">Suggested paintings</h3>
        <ul class="prado-paintings">
          ${SUGGESTED_PAINTINGS.map(
            (p) =>
              `<li><span>${escapeHtml(p.title)}</span><span class="prado-artist">${escapeHtml(p.artist)}</span></li>`
          ).join("")}
        </ul>
      </section>

      <section class="prado-card prado-rules">
        <h3 class="prado-section-title">Rules</h3>
        <ul>${RULES.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
        <p class="prado-prize">🏆 Winner picks dessert tonight.</p>
      </section>

      <section class="prado-card">
        <h3 class="prado-section-title">Challenges</h3>
        <ul class="prado-challenges" id="prado-main-list">
          ${renderChallengeList(mainList, active)}
        </ul>
        ${renderAddForm(false)}
      </section>

      <section class="prado-card">
        <h3 class="prado-section-title">Bonus round <span class="prado-muted">(5 pts each)</span></h3>
        <ul class="prado-challenges" id="prado-bonus-list">
          ${renderChallengeList(bonusList, active)}
        </ul>
        ${renderAddForm(true)}
      </section>

      <div class="prado-footer-actions">
        <button type="button" class="prado-btn prado-btn-outline" id="prado-reset-player">Reset ${escapeHtml(active.name)}</button>
        ${state.players.length > 1 ? `<button type="button" class="prado-btn prado-btn-text" id="prado-remove-player">Remove ${escapeHtml(active.name)}</button>` : ""}
      </div>
    `;

    bindEvents();
  }

  function renderChallengeList(list, active) {
    if (!list.length) return '<li class="prado-empty">No items yet.</li>';
    return list
      .map((c) => {
        const checked = !!active.checked[c.id];
        const inputId = `prado-cb-${c.id}`;
        return `
        <li class="prado-challenge ${checked ? "done" : ""}">
          <input type="checkbox" id="${inputId}" data-id="${c.id}" ${checked ? "checked" : ""} />
          <label for="${inputId}">
            ${c.bonus ? "🔥 " : ""}${c.custom ? '<span class="prado-tag">Custom</span> ' : ""}
            <span class="prado-challenge-text">${escapeHtml(c.text)}</span>
            ${c.hint ? `<span class="prado-hint">Hint: ${escapeHtml(c.hint)}</span>` : ""}
          </label>
          ${c.custom ? `<button type="button" class="prado-del" data-delete="${c.id}" aria-label="Remove">×</button>` : ""}
        </li>`;
      })
      .join("");
  }

  function renderAddForm(bonus) {
    return `
      <form class="prado-add-challenge" data-bonus="${bonus}">
        <p class="prado-add-label">Add ${bonus ? "bonus " : ""}challenge for the group</p>
        <input type="text" name="text" placeholder="Challenge text…" maxlength="280" class="prado-input" required />
        <input type="text" name="hint" placeholder="Optional hint" maxlength="120" class="prado-input" />
        <button type="submit" class="prado-btn prado-btn-primary">Add to group list</button>
      </form>`;
  }

  function bindEvents() {
    rootEl.querySelector("#prado-player-select")?.addEventListener("change", (e) => {
      state.activePlayerId = e.target.value;
      saveState();
      render();
    });

    rootEl.querySelector("#prado-add-person")?.addEventListener("click", () => {
      const form = rootEl.querySelector("#prado-add-form");
      form.hidden = !form.hidden;
      if (!form.hidden) rootEl.querySelector("#prado-new-name")?.focus();
    });

    rootEl.querySelector("#prado-save-person")?.addEventListener("click", () => {
      const input = rootEl.querySelector("#prado-new-name");
      const name = input?.value?.trim();
      if (!name) return;
      const player = createPlayer(name);
      state.players.push(player);
      state.activePlayerId = player.id;
      saveState();
      render();
    });

    rootEl.querySelectorAll('.prado-challenges input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => {
        const p = activePlayer();
        p.checked[cb.dataset.id] = cb.checked;
        saveState();
        render();
      });
    });

    rootEl.querySelectorAll(".prado-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Remove this custom challenge for everyone?")) return;
        const id = btn.dataset.delete;
        state.sharedCustom = state.sharedCustom.filter((c) => c.id !== id);
        state.players.forEach((p) => {
          delete p.checked[id];
        });
        saveState();
        render();
      });
    });

    rootEl.querySelectorAll(".prado-add-challenge").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const bonus = form.dataset.bonus === "true";
        const text = form.querySelector('[name="text"]').value.trim();
        const hint = form.querySelector('[name="hint"]').value.trim();
        if (!text) return;
        state.sharedCustom.push({
          id: slugId("custom"),
          text,
          hint: hint || undefined,
          bonus,
          createdAt: Date.now(),
        });
        saveState();
        render();
      });
    });

    rootEl.querySelector("#prado-reset-player")?.addEventListener("click", () => {
      const p = activePlayer();
      if (!confirm(`Uncheck all items for ${p.name}?`)) return;
      p.checked = {};
      saveState();
      render();
    });

    rootEl.querySelector("#prado-remove-player")?.addEventListener("click", () => {
      const p = activePlayer();
      if (state.players.length <= 1) return;
      if (!confirm(`Remove ${p.name} and their progress?`)) return;
      state.players = state.players.filter((x) => x.id !== p.id);
      state.activePlayerId = state.players[0].id;
      saveState();
      render();
    });
  }

  window.initPradoTab = function () {
    const panel = document.querySelector("#panel-prado .panel-content");
    if (!panel) return;
    rootEl = panel.querySelector("#prado-root");
    if (!rootEl) return;
    if (!initialized) {
      state = loadState();
      initialized = true;
    }
    render();
  };

  window.buildPradoPanelShell = function () {
    return '<div id="prado-root" class="prado-root"></div>';
  };
})();
