/**
 * Prado Museum scavenger hunt — multi-player checklist (WTF tab).
 * Shared state via Netlify Blobs (/api/prado-state).
 */
(function () {
  const STORAGE_KEY = "prado-challenge-v3";
  const PREFS_VIEW = "prado-view-mode";
  const PREFS_PLAYER = "prado-active-player";
  const API_URL = "/api/prado-state";
  const BONUS_POINTS = 5;
  const POLL_MS = 25000;
  const SAVE_DEBOUNCE_MS = 800;

  const HIGHLIGHTS_TOP_FIVE = [
    "Las Meninas",
    "The Surrender of Breda",
    "The Third of May 1808",
    "Saturn Devouring His Son",
    "The Garden of Earthly Delights",
  ];

  const HIGHLIGHTS_ROUTE = [
    { n: 1, room: "Room 12", title: "Las Meninas", artist: "Velázquez", why: "Often considered the greatest painting in Western art. Velázquez turns the viewer into part of the scene. The king and queen appear only in a mirror, the artist paints himself into the work, and no one agrees exactly what moment is being depicted. Art historians have debated it for over 350 years." },
    { n: 2, room: "Room 9A", title: "The Surrender of Breda", artist: "Velázquez", why: "One of history's most famous military paintings. Instead of celebrating victory, Velázquez focuses on dignity and respect between enemies. The winning commander prevents the defeated commander from kneeling, making it unusually humane for a war painting." },
    { n: 3, room: "Room 16B", title: "The Spinners", artist: "Velázquez", why: "What looks like an ordinary weaving workshop slowly reveals itself to be a mythological story hidden within the scene. The more you look, the more layers emerge." },
    { n: 4, room: "Room 16B", title: "The Triumph of Bacchus", artist: "Velázquez", why: "A Roman god appears among ordinary workers and drinkers. Velázquez blends mythology and everyday life in a way that was revolutionary for its time." },
    { n: 5, room: "Room 32", title: "The Family of Charles IV", artist: "Goya", why: "One of the most debated royal portraits ever painted. Some see a magnificent royal family. Others believe Goya subtly exposed their vanity and weakness while painting them exactly as they appeared." },
    { n: 6, room: "Room 64", title: "The Second of May 1808", artist: "Goya", why: "Captures the chaos of a popular uprising against Napoleon's occupation of Spain. The painting feels more like a modern photograph from a riot than a traditional historical scene." },
    { n: 7, room: "Room 64", title: "The Third of May 1808", artist: "Goya", why: "Widely considered one of the greatest anti-war paintings ever created. Rather than glorifying battle, it focuses on fear, sacrifice, and the human cost of conflict." },
    { n: 8, room: "Room 67", title: "Saturn Devouring His Son", artist: "Goya", why: "Painted directly on the walls of Goya's home late in life. It reflects his fears, pessimism, and disillusionment. Few paintings in the museum create such an immediate emotional reaction." },
    { n: 9, room: "Room 67", title: "The Dog", artist: "Goya", why: "Remarkably modern despite being painted in the early 1800s. With almost nothing in the frame except a small dog's head and a vast empty space, it evokes loneliness and uncertainty in a way that still feels contemporary." },
    { n: 10, room: "Room 67", title: "Witches' Sabbath", artist: "Goya", why: "Part of Goya's haunting Black Paintings. It explores superstition, fear, and the darker side of human imagination." },
    { n: 11, room: "Room 56A", title: "The Garden of Earthly Delights", artist: "Bosch", why: "The Prado's most endlessly fascinating painting. Paradise, temptation, pleasure, punishment, monsters, strange creatures, and hundreds of tiny stories unfold across the panels. You can spend twenty minutes here and still notice new details." },
    { n: 12, room: "Room 56A", title: "The Haywain Triptych", artist: "Bosch", why: "Bosch uses a giant wagon of hay as a symbol of human greed. Nearly everyone in the painting is chasing something temporary and ultimately meaningless." },
    { n: 13, room: "Room 55A", title: "The Triumph of Death", artist: "Bruegel", why: "A vast vision of the apocalypse where death comes for everyone regardless of wealth, status, or power. The painting is packed with remarkable details and dark humor." },
    { n: 14, room: "Room 58", title: "The Descent from the Cross", artist: "Rogier van der Weyden", why: "A masterpiece of emotion and technical skill. The expressions, tears, and drapery are so detailed that it is hard to believe it was painted nearly 600 years ago." },
    { n: 15, room: "Room 56B", title: "The Annunciation", artist: "Fra Angelico", why: "One of the jewels of the early Renaissance. Its elegance, balance, and use of light helped shape European painting for generations." },
    { n: 16, room: "Room 29", title: "The Three Graces", artist: "Rubens", why: "A celebration of beauty, movement, and human form. It represents the height of the Baroque style and remains one of Rubens' most famous works." },
    { n: 17, room: "Room 10A", title: "The Nobleman with His Hand on His Chest", artist: "El Greco", why: "One of Spain's most recognizable portraits. The identity of the sitter remains uncertain, which only adds to its mystery." },
    { n: 18, room: "Room 11", title: "The Adoration of the Shepherds", artist: "El Greco", why: "Created near the end of El Greco's life, it showcases his dramatic lighting, elongated figures, and highly personal artistic style." },
    { n: 19, room: "Room 27", title: "Charles V at Mühlberg", artist: "Titian", why: "One of the most influential ruler portraits ever painted. It established the visual blueprint for how powerful leaders would be portrayed for centuries." },
    { n: 20, room: "Room 29", title: "The Judgement of Paris", artist: "Rubens", why: "Based on the mythological decision that eventually sparked the Trojan War. It combines beauty, politics, vanity, and mythology into a single scene." },
  ];

  const RULES = [
    "No Googling.",
    "When you find one, show the group and take a photo (your pick counts for you).",
    "At the end we compare answers — same painting is fine, different picks are more fun.",
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
  let viewMode = "solo";
  let syncLabel = "";
  let saveTimer = null;
  let pollTimer = null;
  let syncing = false;

  function getSitePassword() {
    if (typeof window !== "undefined" && window.sitePassword) return window.sitePassword;
    if (typeof correctPassword !== "undefined") return correctPassword;
    return "";
  }

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
    return { version: 3, updatedAt: 0, activePlayerId: null, sharedCustom: [], players: [] };
  }

  function normalizeBlobState(parsed) {
    if (!parsed?.players?.length) return null;
    return {
      version: 3,
      updatedAt: Number(parsed.updatedAt) || Date.now(),
      activePlayerId: null,
      sharedCustom: Array.isArray(parsed.sharedCustom) ? parsed.sharedCustom : [],
      players: parsed.players.map((p) => ({
        id: p.id,
        name: p.name || "Guest",
        checked: p.checked && typeof p.checked === "object" ? p.checked : {},
        createdAt: p.createdAt || Date.now(),
      })),
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = normalizeBlobState(parsed);
      if (!base) return defaultState();
      base.activePlayerId = parsed.activePlayerId || parsed.players[0]?.id || null;
      return base;
    } catch {
      return defaultState();
    }
  }

  function persistLocal() {
    const payload = {
      version: 3,
      updatedAt: state.updatedAt,
      activePlayerId: state.activePlayerId,
      sharedCustom: state.sharedCustom,
      players: state.players,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (state.activePlayerId) {
      sessionStorage.setItem(PREFS_PLAYER, state.activePlayerId);
    }
    sessionStorage.setItem(PREFS_VIEW, viewMode);
  }

  function touchState() {
    state.updatedAt = Date.now();
    persistLocal();
    scheduleRemoteSave();
  }

  function scheduleRemoteSave() {
    clearTimeout(saveTimer);
    syncLabel = "Saving…";
    updateSyncBadge();
    saveTimer = setTimeout(() => pushToServer(), SAVE_DEBOUNCE_MS);
  }

  function updateSyncBadge() {
    const el = rootEl?.querySelector("#prado-sync-status");
    if (el) el.textContent = syncLabel;
  }

  async function fetchRemoteState() {
    const password = getSitePassword();
    if (!password) return null;
    const res = await fetch(`${API_URL}?password=${encodeURIComponent(password)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.state ? normalizeBlobState(data.state) : null;
  }

  async function pushToServer() {
    if (syncing || !state.players.length) return;
    const password = getSitePassword();
    if (!password) {
      syncLabel = "Log in to sync";
      updateSyncBadge();
      return;
    }
    syncing = true;
    try {
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          state: {
            version: 3,
            updatedAt: state.updatedAt,
            players: state.players,
            sharedCustom: state.sharedCustom,
          },
        }),
      });
      if (res.status === 401) {
        syncLabel = "Sync unauthorized";
        return;
      }
      if (!res.ok) {
        syncLabel = "Sync failed";
        return;
      }
      const data = await res.json();
      if (data.conflict && data.state) {
        applyRemoteState(normalizeBlobState(data.state), true);
        syncLabel = "Updated from group";
      } else {
        syncLabel = "Synced for everyone";
      }
    } catch {
      syncLabel = "Offline — saved here";
    } finally {
      syncing = false;
      updateSyncBadge();
    }
  }

  function applyRemoteState(remote, keepActivePlayer) {
    if (!remote) return;
    const activeId = keepActivePlayer ? state.activePlayerId : remote.players[0]?.id;
    state = {
      ...remote,
      activePlayerId:
        activeId && remote.players.some((p) => p.id === activeId) ? activeId : remote.players[0]?.id,
    };
    persistLocal();
    render();
  }

  async function syncFromServer() {
    syncLabel = "Loading group…";
    updateSyncBadge();
    try {
      const remote = await fetchRemoteState();
      if (!remote) {
        syncLabel = state.players.length ? "Saved on this device" : "";
        if (state.players.length) scheduleRemoteSave();
        return;
      }
      const localTs = state.updatedAt || 0;
      const remoteTs = remote.updatedAt || 0;
      if (!state.players.length || remoteTs > localTs) {
        applyRemoteState(remote, true);
        syncLabel = "Loaded group checklist";
      } else if (localTs > remoteTs) {
        await pushToServer();
      } else {
        syncLabel = "Synced for everyone";
      }
    } catch {
      syncLabel = "Offline — saved here";
    }
    updateSyncBadge();
  }

  function startPolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      if (document.hidden || !state?.players?.length) return;
      const remote = await fetchRemoteState();
      if (!remote) return;
      if ((remote.updatedAt || 0) > (state.updatedAt || 0)) {
        applyRemoteState(remote, true);
        syncLabel = "Updated from another phone";
        updateSyncBadge();
      }
    }, POLL_MS);
  }

  function activePlayer() {
    if (!state.players.length) return null;
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

  function renderViewToggle() {
    return `
      <div class="prado-view-toggle" role="group" aria-label="Checklist view">
        <button type="button" class="prado-view-btn ${viewMode === "solo" ? "active" : ""}" data-view="solo">One player</button>
        <button type="button" class="prado-view-btn ${viewMode === "all" ? "active" : ""}" data-view="all">All players</button>
      </div>`;
  }

  function renderPlayerBar() {
    const soloOnly = viewMode === "solo";
    return `
      <div class="prado-player-bar">
        ${soloOnly ? `
          <label class="sr-only" for="prado-player-select">Active player</label>
          <select id="prado-player-select" class="prado-select">
            ${state.players.map((p) => `<option value="${p.id}" ${p.id === state.activePlayerId ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("")}
          </select>
        ` : `<p class="prado-all-hint">Full checklist for each person — check off finds under their name.</p>`}
        <button type="button" class="prado-btn prado-btn-gold" id="prado-add-person">+ Person</button>
        ${soloOnly ? `<button type="button" class="prado-btn prado-btn-outline" id="prado-rename-person" title="Rename selected">Rename</button>` : ""}
      </div>
      <div id="prado-add-form" class="prado-add-form" hidden>
        <input type="text" id="prado-new-name" placeholder="Name" maxlength="40" class="prado-input" />
        <button type="button" class="prado-btn" id="prado-save-person">Add</button>
      </div>`;
  }


  function renderHighlightsRoute() {
  return `
      <section class="prado-card prado-route-card">
        <h3 class="prado-section-title">Prado Highlights Route</h3>
        <p class="prado-route-intro">Twenty stops in museum order — tap any painting for why it matters.</p>
        <div class="prado-top-five">
          <h4 class="prado-subsection">If you only remember five</h4>
          <ol class="prado-top-five-list">
            ${HIGHLIGHTS_TOP_FIVE.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
          </ol>
          <p class="prado-top-five-note">Those five alone explain why the Prado is considered one of the greatest art museums in the world.</p>
        </div>
        <ol class="prado-route-list">
          ${HIGHLIGHTS_ROUTE.map((h) => `
            <li class="prado-route-stop">
              <details>
                <summary class="prado-route-summary">
                  <span class="prado-route-heading"><strong>${h.n}.</strong> ${escapeHtml(h.room)} — ${escapeHtml(h.title)} — ${escapeHtml(h.artist)}</span>
                </summary>
                <p class="prado-route-why"><span class="prado-route-why-label">Why it's special:</span> ${escapeHtml(h.why)}</p>
              </details>
            </li>`).join("")}
        </ol>
      </section>`;
  }

  function renderSharedSections() {
    return `
      ${renderHighlightsRoute()}
      <section class="prado-card prado-rules">
        <h3 class="prado-section-title">Rules</h3>
        <ul>${RULES.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
        <p class="prado-prize">📸 End of visit: compare picks and scroll through photo evidence together.</p>
      </section>`;
  }

  function renderLeaderboard() {
    const leaderboard = [...state.players]
      .map((p) => ({ p, s: playerStats(p) }))
      .sort((a, b) => a.p.name.localeCompare(b.p.name));
    return `
      <section class="prado-card">
        <h3 class="prado-section-title">Progress overview</h3>
        <ul class="prado-leaderboard">
          ${leaderboard
            .map(
              ({ p, s }, i) => `
            <li class="prado-lb-row ${viewMode === "solo" && p.id === state.activePlayerId ? "active" : ""}">
              <span class="prado-lb-rank">${i + 1}.</span>
              <div class="prado-lb-body">
                <div class="prado-lb-top">
                  <span>${escapeHtml(p.name)}</span>
                  <span>${s.done}/${s.total}${s.bonusPoints ? ` <span class="prado-pts">+${s.bonusPoints}pt</span>` : ""}</span>
                </div>
                <div class="prado-bar prado-bar-sm"><div class="prado-bar-fill" style="width:${s.pct}%"></div></div>
              </div>
            </li>`
            )
            .join("")}
        </ul>
      </section>`;
  }

  function renderChallengeList(list, player) {
    if (!list.length) return '<li class="prado-empty">No items yet.</li>';
    return list
      .map((c) => {
        const checked = !!player.checked[c.id];
        const inputId = `prado-cb-${player.id}-${c.id}`;
        return `
        <li class="prado-challenge ${checked ? "done" : ""}">
          <input type="checkbox" id="${inputId}" data-id="${c.id}" data-player="${player.id}" ${checked ? "checked" : ""} />
          <label for="${inputId}">
            ${c.bonus ? "🔥 " : ""}${c.custom ? '<span class="prado-tag">Custom</span> ' : ""}
            <span class="prado-challenge-text">${escapeHtml(c.text)}</span>
            ${c.hint ? `<span class="prado-hint">Hint: ${escapeHtml(c.hint)}</span>` : ""}
          </label>
          ${c.custom && viewMode === "solo" ? `<button type="button" class="prado-del" data-delete="${c.id}" aria-label="Remove">×</button>` : ""}
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

  function renderAllPlayersChecklists(mainList, bonusList) {
    const sorted = [...state.players].sort((a, b) => a.name.localeCompare(b.name));
    return sorted
      .map((player) => {
        const stats = playerStats(player);
        return `
        <section class="prado-card prado-player-block">
          <div class="prado-player-block-head">
            <h3 class="prado-section-title">${escapeHtml(player.name)}</h3>
            <span class="prado-player-block-stats">${stats.done}/${stats.total}${stats.bonusPoints ? ` · +${stats.bonusPoints} bonus` : ""}</span>
          </div>
          <div class="prado-bar prado-bar-sm"><div class="prado-bar-fill" style="width:${stats.pct}%"></div></div>
          <h4 class="prado-subsection">Challenges</h4>
          <ul class="prado-challenges">${renderChallengeList(mainList, player)}</ul>
          <h4 class="prado-subsection">Bonus</h4>
          <ul class="prado-challenges">${renderChallengeList(bonusList, player)}</ul>
        </section>`;
      })
      .join("");
  }

  function render() {
    if (!rootEl) return;
    if (!state.players.length) {
      rootEl.innerHTML = `
        <div class="prado-header">
          <h2 class="prado-title">🏛️ Prado Challenge</h2>
          <p class="prado-sub">Add everyone in your group. Checklists sync across phones once you're logged in.</p>
          <p id="prado-sync-status" class="prado-sync">${escapeHtml(syncLabel)}</p>
        </div>
        <section class="prado-card">
          <h3 class="prado-section-title">Who is playing?</h3>
          <form id="prado-first-person" class="prado-add-challenge">
            <input type="text" id="prado-new-name" placeholder="First name" maxlength="40" class="prado-input" required />
            <button type="submit" class="prado-btn prado-btn-primary">Add person</button>
          </form>
        </section>
      `;
      bindEmptyStateEvents();
      return;
    }

    const active = activePlayer();
    const stats = playerStats(active);
    const challenges = allChallenges();
    const mainList = challenges.filter((c) => !c.bonus);
    const bonusList = challenges.filter((c) => c.bonus);

    rootEl.innerHTML = `
      <div class="prado-header">
        <h2 class="prado-title">🏛️ Prado Challenge</h2>
        <p class="prado-sub">Each person checks off their own finds. We compare stories and photos at the end — not a race.</p>
        <p id="prado-sync-status" class="prado-sync">${escapeHtml(syncLabel)}</p>
        ${renderViewToggle()}
        ${renderPlayerBar()}
        ${viewMode === "solo" ? `
        <div class="prado-progress">
          <div class="prado-progress-row">
            <span>${escapeHtml(active.name)}'s progress</span>
            <strong>${stats.done}/${stats.total} found${stats.bonusPoints ? ` · +${stats.bonusPoints} bonus pts` : ""}</strong>
          </div>
          <div class="prado-bar"><div class="prado-bar-fill" style="width:${stats.pct}%"></div></div>
        </div>` : ""}
      </div>

      ${viewMode === "solo" ? renderLeaderboard() : ""}
      ${viewMode === "all" ? renderAllPlayersChecklists(mainList, bonusList) : ""}
      ${renderSharedSections()}

      ${viewMode === "solo" ? `
      <section class="prado-card">
        <h3 class="prado-section-title">Challenges — ${escapeHtml(active.name)}</h3>
        <ul class="prado-challenges" id="prado-main-list">${renderChallengeList(mainList, active)}</ul>
        ${renderAddForm(false)}
      </section>
      <section class="prado-card">
        <h3 class="prado-section-title">Bonus round <span class="prado-muted">(5 pts each)</span> — ${escapeHtml(active.name)}</h3>
        <ul class="prado-challenges" id="prado-bonus-list">${renderChallengeList(bonusList, active)}</ul>
        ${renderAddForm(true)}
      </section>
      <div class="prado-footer-actions">
        <button type="button" class="prado-btn prado-btn-outline" id="prado-reset-player">Reset ${escapeHtml(active.name)}</button>
        ${state.players.length > 1 ? `<button type="button" class="prado-btn prado-btn-text" id="prado-remove-player">Remove ${escapeHtml(active.name)}</button>` : ""}
      </div>` : `
      <section class="prado-card">
        <h3 class="prado-section-title">Group challenges</h3>
        ${renderAddForm(false)}
        ${renderAddForm(true)}
        ${state.players.length > 1 ? `<p class="prado-tip">To remove a player, switch to One player view.</p>` : ""}
      </section>`}
    `;

    bindEvents();
  }

  function bindEmptyStateEvents() {
    rootEl.querySelector("#prado-first-person")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = rootEl.querySelector("#prado-new-name");
      const name = input?.value?.trim();
      if (!name) return;
      const player = createPlayer(name);
      state.players = [player];
      state.activePlayerId = player.id;
      touchState();
      render();
      pushToServer();
    });
  }

  function bindEvents() {
    rootEl.querySelectorAll(".prado-view-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        viewMode = btn.dataset.view;
        sessionStorage.setItem(PREFS_VIEW, viewMode);
        render();
      });
    });

    rootEl.querySelector("#prado-player-select")?.addEventListener("change", (e) => {
      state.activePlayerId = e.target.value;
      persistLocal();
      render();
    });

    rootEl.querySelector("#prado-rename-person")?.addEventListener("click", () => {
      const p = activePlayer();
      if (!p) return;
      const name = prompt("Rename player", p.name);
      if (!name?.trim()) return;
      p.name = name.trim();
      touchState();
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
      touchState();
      render();
    });

    rootEl.querySelectorAll('.prado-challenges input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener("change", () => {
        const playerId = cb.dataset.player || state.activePlayerId;
        const p = state.players.find((x) => x.id === playerId);
        if (!p) return;
        p.checked[cb.dataset.id] = cb.checked;
        touchState();
        if (viewMode === "all") {
          const row = cb.closest(".prado-player-block");
          const head = row?.querySelector(".prado-player-block-stats");
          if (head) {
            const s = playerStats(p);
            head.textContent = `${s.done}/${s.total}${s.bonusPoints ? ` · +${s.bonusPoints} bonus` : ""}`;
            const bar = row?.querySelector(".prado-bar-fill");
            if (bar) bar.style.width = `${s.pct}%`;
          }
        } else {
          render();
        }
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
        touchState();
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
        touchState();
        render();
      });
    });

    rootEl.querySelector("#prado-reset-player")?.addEventListener("click", () => {
      const p = activePlayer();
      if (!confirm(`Uncheck all items for ${p.name}?`)) return;
      p.checked = {};
      touchState();
      render();
    });

    rootEl.querySelector("#prado-remove-player")?.addEventListener("click", () => {
      const p = activePlayer();
      if (!confirm(`Remove ${p.name} and their checkmarks?`)) return;
      state.players = state.players.filter((x) => x.id !== p.id);
      state.activePlayerId = state.players[0]?.id || null;
      touchState();
      render();
    });
  }

  window.initPradoTab = async function () {
    const panel = document.querySelector("#panel-prado .panel-content");
    if (!panel) return;
    rootEl = panel.querySelector("#prado-root");
    if (!rootEl) return;
    if (!initialized) {
      viewMode = sessionStorage.getItem(PREFS_VIEW) || "solo";
      state = loadState();
      const savedPlayer = sessionStorage.getItem(PREFS_PLAYER);
      if (savedPlayer && state.players.some((p) => p.id === savedPlayer)) {
        state.activePlayerId = savedPlayer;
      }
      initialized = true;
      await syncFromServer();
      startPolling();
    }
    render();
  };

  window.buildPradoPanelShell = function () {
    return '<div id="prado-root" class="prado-root"></div>';
  };
})();
