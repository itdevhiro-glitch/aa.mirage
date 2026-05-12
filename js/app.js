export const DISCORD_INVITE = "https://discord.gg/kVqaRA6aqM";

export const RANK_POWER = { F:1, E:2, D:3, C:4, B:5, A:6, S:7, SS:8, SSS:9 };

export function rankValue(rank = "F") {
  return RANK_POWER[String(rank).toUpperCase().replace("RANK ", "").trim()] || 0;
}

function toNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0;
  return 0;
}

function getSpina(u = {}) {
  return Math.max(
    toNumber(u.spina),
    toNumber(u.gold),
    toNumber(u.coins),
    toNumber(u.balance),
    toNumber(u.money),
    0
  );
}

function getRank(u = {}) {
  return u.rank || u.questRank || u.tier || "F";
}

function getExp(u = {}) {
  return Math.max(toNumber(u.exp), toNumber(u.xp), toNumber(u.experience), 0);
}

export function normalizeUser(id, u = {}, questClearMap = {}) {
  return {
    id,

    name:
      u.username ||
      u.name ||
      u.displayName ||
      u.discordName ||
      u.nickname ||
      `Adventurer ${id.slice(-4)}`,

    rank: getRank(u),
    spina: getSpina(u),
    questClear: questClearMap[id] || 0,
    exp: getExp(u)
  };
}

export async function loadUsers() {
  try {
    const { initializeApp, getApps } = await import(
      "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"
    );

    const { getDatabase, ref, get } = await import(
      "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js"
    );

    const { firebaseConfig } = await import("./firebase-config.js");

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getDatabase(app);

    const [usersSnap, submissionsSnap] = await Promise.all([
      get(ref(db, "users")),
      get(ref(db, "questSubmissions"))
    ]);

    const rawUsers = usersSnap.val() || {};
    const rawSubmissions = submissionsSnap.val() || {};

    const questClearMap = {};

    Object.values(rawSubmissions).forEach((submission) => {
      if (!submission) return;

      const userId = String(submission.userId || "");
      const status = String(submission.status || "").toLowerCase();

      if (!userId) return;

      if (status === "approved" || status === "accepted" || status === "clear") {
        questClearMap[userId] = (questClearMap[userId] || 0) + 1;
      }
    });

    const users = Object.entries(rawUsers).map(([id, u]) =>
      normalizeUser(id, u || {}, questClearMap)
    );

    console.log("Aqua Mirage users:", users);
    console.log("Quest clear map:", questClearMap);

    return users;
  } catch (e) {
    console.warn("Firebase loadUsers error:", e);
    return [];
  }
}

export function setActive() {
  const path = location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });

  document.querySelectorAll("[data-discord]").forEach((a) => {
    a.href = DISCORD_INVITE;
  });
}

export function renderRows(el, users, type = "quest", limit = 5) {
  if (!el) return;

  const sorters = {
    quest: (a, b) => b.questClear - a.questClear,
    tier: (a, b) => rankValue(b.rank) - rankValue(a.rank) || b.exp - a.exp,
    spina: (a, b) => b.spina - a.spina
  };

  const labels = {
    quest: (u) => `${u.questClear.toLocaleString("id-ID")} clear`,
    tier: (u) => `Rank ${u.rank}`,
    spina: (u) => `${u.spina.toLocaleString("id-ID")} Spina`
  };

  const sorted = [...users].sort(sorters[type]).slice(0, limit);

  el.innerHTML = sorted.length
    ? sorted.map((u, i) => `
      <div class="rankRow">
        <div class="pos">${i + 1}</div>
        <div>
          <div class="name">${escapeHtml(u.name)}</div>
          <div class="meta">Rank ${escapeHtml(u.rank)} • ${u.exp.toLocaleString("id-ID")} EXP</div>
        </div>
        <div class="score">${labels[type](u)}</div>
      </div>
    `).join("")
    : `<div class="empty">Belum ada data user dari Firebase.</div>`;
}

export function escapeHtml(s = "") {
  return String(s).replace(/[&<>'"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[c]));
}

setActive();
