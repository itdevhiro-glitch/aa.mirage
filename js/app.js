export const DISCORD_INVITE = "https://discord.gg/kVqaRA6aqM";

export const RANK_POWER = {
  F: 1, E: 2, D: 3, C: 4, B: 5, A: 6, S: 7, SS: 8, SSS: 9
};

export function rankValue(rank = "F") {
  return RANK_POWER[String(rank).toUpperCase().replace("RANK ", "").trim()] || 0;
}

function num(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v.replace(/[^\d.-]/g, "")) || 0;
  return 0;
}

function pickUserId(obj = {}) {
  return String(
    obj.userId ||
    obj.uid ||
    obj.discordId ||
    obj.discordID ||
    obj.memberId ||
    obj.authorId ||
    obj.playerId ||
    obj.user ||
    ""
  );
}

function isApproved(obj = {}) {
  const status = String(obj.status || "").toLowerCase();
  return (
    status === "approved" ||
    status === "accept" ||
    status === "accepted" ||
    status === "clear" ||
    status === "cleared" ||
    Boolean(obj.approvedAt)
  );
}

function collectObjects(node, result = []) {
  if (!node || typeof node !== "object") return result;

  if (
    node.questId ||
    node.type ||
    node.amount ||
    node.status ||
    node.approvedAt
  ) {
    result.push(node);
  }

  for (const value of Object.values(node)) {
    if (value && typeof value === "object") {
      collectObjects(value, result);
    }
  }

  return result;
}

function getName(id, u = {}) {
  return (
    u.username ||
    u.name ||
    u.displayName ||
    u.discordName ||
    u.nickname ||
    `Adventurer ${id.slice(-4)}`
  );
}

function getRank(u = {}) {
  return u.rank || u.questRank || u.tier || "F";
}

function getExp(u = {}) {
  return Math.max(num(u.exp), num(u.xp), num(u.experience), 0);
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

    const [usersSnap, submissionsSnap, claimsSnap] = await Promise.all([
      get(ref(db, "users")),
      get(ref(db, "questSubmissions")),
      get(ref(db, "claims"))
    ]);

    const rawUsers = usersSnap.val() || {};
    const rawSubmissions = submissionsSnap.val() || {};
    const rawClaims = claimsSnap.val() || {};

    const questClearMap = {};
    const spinaMap = {};

    const allSubmissions = collectObjects(rawSubmissions);

    allSubmissions.forEach((s) => {
      if (!s || !s.questId) return;
      if (!isApproved(s)) return;

      const uid = pickUserId(s);
      if (!uid) return;

      questClearMap[uid] = (questClearMap[uid] || 0) + 1;
    });

    const allClaims = collectObjects(rawClaims);

    allClaims.forEach((c) => {
      if (!c || !isApproved(c)) return;

      const uid = pickUserId(c);
      if (!uid) return;

      const type = String(c.type || "").toLowerCase();

      if (type === "spina" || type === "gold" || type === "money") {
        spinaMap[uid] = (spinaMap[uid] || 0) + num(c.amount);
      }

      if (type === "quest" || c.questId) {
        questClearMap[uid] = (questClearMap[uid] || 0) + 1;
      }
    });

    const users = Object.entries(rawUsers).map(([id, u]) => {
      return {
        id,
        name: getName(id, u || {}),
        rank: getRank(u || {}),
        exp: getExp(u || {}),
        questClear: questClearMap[id] || num(u?.questsCleared) || num(u?.questClear) || 0,
        spina:
          spinaMap[id] ||
          num(u?.spina) ||
          num(u?.gold) ||
          num(u?.coins) ||
          num(u?.balance) ||
          0
      };
    });

    console.log("RAW USERS:", rawUsers);
    console.log("RAW QUEST SUBMISSIONS:", rawSubmissions);
    console.log("RAW CLAIMS:", rawClaims);
    console.log("QUEST CLEAR MAP:", questClearMap);
    console.log("SPINA MAP:", spinaMap);
    console.log("FINAL USERS:", users);

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
