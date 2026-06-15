const ACTIONS = [
    { id: "wood", label: "Couper du bois" },
  { id: "fish", label: "Pecher" },
  { id: "water", label: "Chercher de l'eau" },
  { id: "explore", label: "Explorer" },
  { id: "sleep", label: "Dormir" }
];

const START_NAMES = ["Nora", "Basile", "Mina", "Solal", "Iris", "Tarek", "Lena", "Noe", "Ava", "Malo", "Yara", "Eden"];
const BOT_NAMES = ["Brume", "Rive", "Corail", "Falaise", "Aube", "Silex", "Onde", "Ronce", "Ecume", "Cendre", "Dune", "Mousse"];
const MISSIONS = ["Pecheur", "Bucheron", "Source"];
const ITEMS = {
  pistol: "Pistolet",
  amulet: "Amulette anti-vote",
  crystal: "Boule de cristal",
  doubleVote: "Double vote",
  medkit: "Kit de soin",
  vest: "Gilet"
};
const ITEM_EFFECTS = {
  pistol: "Tue un joueur apres que tous les joueurs ont choisi leur action. Usage unique.",
  amulet: "Protège d'un vote de pénurie complet. Usage unique.",
  crystal: "Regarde le role secret, la derniere action et le dernier vote d'un joueur. Usage unique.",
  doubleVote: "Ton vote compte double pendant un vote de pénurie complet. Usage unique.",
  medkit: "Retire 1 fatigue. Usage unique.",
  vest: "Encaisse automatiquement un tir de pistolet. Usage unique."
};
const ROLES = ["Assassin", "Robinson", "Chaman", "Survivant", "Enfant", "Chien"];
const ROLE_EFFECTS = {
  Assassin: "Vole 1 objet une fois. Peut éliminer un joueur à 1 fatigue une fois. Pistolet +20%, Double vote +10%, Boule de cristal -20%, Kit de soin -10%.",
  Robinson: "Commence avec 1 objet de plus. Peut dormir +1 fois et explorer +1 fois. Kit de soin +10%, Boule de cristal -10%.",
  Chaman: "Boule de cristal +10%, Amulette +10%, Double vote -20%.",
  Survivant: "+1 ressource sur bois/eau/nourriture. Faim et soif max 2. Gilet +10%, Kit de soin +10%, Boule de cristal -10%, Double vote -10%.",
  Enfant: "Ne peut pas explorer. Pouvoir actif illimite: jeter un objet pour copier un objet de son mentor. En debut de partie, un mentor lui est attribue. Son mentor voit sur sa carte qui est l'enfant. Quand le mentor meurt, l'enfant ne peut plus copier les objets de son mentor.",
  Chien: "Explore sans limite, ne trouve aucun objet et gagne 1 joie. Peut depenser sa joie pour se retablir, detruire un objet ou activer une amulette. Peche maximum 2 fois et rapporte 3 nourriture."
};
const ROLE_SUMMARY = {
  Assassin: {
    objects: "Pistolet +20%, Double vote +10%, Boule de cristal -20%, Kit de soin -10%.",
    powers: "Vole 1 objet à un joueur une fois. Peut préparer l'élimination d'un joueur à 1 fatigue; si la cible n'est plus fatiguée à la résolution, le pouvoir revient."
  },
  Robinson: {
    objects: "Kit de soin +10%, Boule de cristal -10%.",
    powers: "Commence avec 1 objet supplementaire. Peut dormir 1 fois de plus et explorer 1 fois de plus."
  },
  Chaman: {
    objects: "Boule de cristal +10%, Amulette +10%, Double vote -20%.",
    powers: "Reanime un joueur mort une fois. Cree une amulette pour lui-meme ou pour son allie reanime."
  },
  Survivant: {
    objects: "Gilet +10%, Kit de soin +10%, Boule de cristal -10%, Double vote -10%.",
    powers: "+1 ressource quand il coupe du bois, pêche ou cherche de l'eau. Sa faim et sa soif ne peuvent pas dépasser 2. Une fois, peut ajouter 3 nourriture et 3 eau si une pénurie arrive en fin de tour."
  },
  Enfant: {
    objects: "Aucun modificateur.",
    powers: "Ne peut pas explorer. Pouvoir actif illimite: jeter un objet pour copier un objet de son mentor. En debut de partie, un mentor lui est attribue. Son mentor voit sur sa carte qui est l'enfant. Quand le mentor meurt, l'enfant ne peut plus copier les objets de son mentor."
  },
  Chien: {
    objects: "Aucun objet au depart. Aucun objet trouve en exploration.",
    powers: "Explore sans limite. Chaque exploration retire 1 nourriture et 1 eau de la reserve, puis donne 1 joie visible uniquement par lui. Depenser 3 joie: faim, soif et fatigue a 0. Depenser 2 joie: amulette active. Depenser 1 joie: detruire un objet chez un joueur cible. Peut pecher maximum 2 fois; chaque peche ajoute automatiquement 3 nourriture."
  }
};
const BASE_ITEM_RATES = {
  pistol: 10,
  amulet: 20,
  crystal: 20,
  doubleVote: 20,
  medkit: 20,
  vest: 10
};

const EVENTS = [
  {
    title: "Pluie noire",
    text: "La pluie souille une reserve d'eau.",
    apply: game => changeResource(game, "water", -2)
  },
  {
    title: "Cris dans la grotte",
    text: "Personne ne dort vraiment. Le moral baisse.",
    apply: game => changeResource(game, "morale", -4)
  },
  {
    title: "Courant favorable",
    text: "Des poissons s'approchent du rivage.",
    apply: game => changeResource(game, "food", 2)
  },
  {
    title: "Vent violent",
    text: "Le vent arrache des reserves et mine le moral.",
    apply: game => {
      changeResource(game, "wood", -1);
      changeResource(game, "morale", -5);
    }
  },
  {
    title: "Baies amères",
    text: "Un repas douteux fait chuter le moral du camp.",
    apply: game => changeResource(game, "morale", -5)
  },
  {
    title: "Silence lourd",
    text: "Les regards se croisent. Le soupcon gagne le camp.",
    apply: game => living(game).forEach(player => player.suspicion = clamp(player.suspicion + 5, 0, 100))
  }
];

const DAY_5_EVENTS = [
  {
    id: "storm",
    title: "Tempete",
    apply: summary => {
      game.camp.wood = 0;
      game.camp.rafts = Math.max(0, game.camp.rafts - 1);
      summary.push("Tempete: le camp perd tout son bois et 1 radeau.");
      queueNarration("Tempete. Le camp perd tout son bois et un radeau.");
    }
  },
  {
    id: "raid",
    title: "Pillage",
    apply: summary => {
      changeResource(game, "water", -3);
      changeResource(game, "food", -3);
      summary.push("Pillage: le stock d'eau et de nourriture baisse de 3.");
      queueNarration("Pillage. Le stock d'eau et de nourriture baisse.");
    }
  },
  {
    id: "bear",
    title: "Ours",
    apply: summary => {
      living().forEach(player => {
        if (player.items.length) {
          const lostIndex = Math.floor(Math.random() * player.items.length);
          const [lostItem] = player.items.splice(lostIndex, 1);
          player.privateNote = `Ours: tu perds ${ITEMS[lostItem.type]}.`;
        } else {
          addFatigue(player, 1);
          player.privateNote = "Ours: aucun objet a perdre, tu prends +1 fatigue.";
        }
      });
      summary.push("Ours: chaque joueur perd 1 objet. Ceux sans objet prennent +1 fatigue.");
      queueNarration("Ours. Chaque joueur perd un objet, ou prend une fatigue s'il n'en a pas.");
    }
  },
  {
    id: "spirit",
    title: "Esprit",
    apply: summary => {
      const cursed = randomLiving();
      if (!cursed) return;
      cursed.cursed = true;
      summary.push("Esprit: un joueur est maudit sans le savoir.");
      queueNarration("Esprit. Un joueur est maudit sans le savoir.");
    }
  }
];

let game = null;
let speechQueue = [];
let speechBusy = false;
let speechCurrentStartedAt = 0;
let setupOpenRole = "Assassin";
const heardNarrationIds = new Set();
const recentNarrations = new Map();
const MAX_SPEECH_QUEUE = 3;
const MAX_SPEECH_DELAY_MS = 9000;

const app = document.querySelector("#app");
const SETUP_STORAGE_KEY = "ile-des-ombres-setup";
const ONLINE_CLIENT_ID = localStorage.getItem("ile-des-ombres-client-id") || globalThis.crypto?.randomUUID?.() || String(Date.now() + Math.random());
localStorage.setItem("ile-des-ombres-client-id", ONLINE_CLIENT_ID);
const online = {
  roomCode: "",
  connected: false,
  status: "Hors ligne",
  version: 0,
  applyingRemote: false,
  publishTimer: null,
  pollTimer: null
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function defaultSetupSettings() {
  return {
    totalPlayers: 6,
    humanCount: 6,
    playMode: "sameScreen",
    names: START_NAMES.slice(0, 6),
    roleCounts: {
      Assassin: 0,
      Robinson: 0,
      Chaman: 0,
      Survivant: 6,
      Enfant: 0,
      Chien: 0
    }
  };
}

function loadSetupSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETUP_STORAGE_KEY));
    const defaults = defaultSetupSettings();
    if (!saved || typeof saved !== "object") return defaults;
    const savedTotal = Number(saved.totalPlayers);
    const savedHumans = Number(saved.humanCount);
    const totalPlayers = clamp(Number.isFinite(savedTotal) && savedTotal > 0 ? savedTotal : defaults.totalPlayers, 3, START_NAMES.length);
    const humanCount = clamp(Number.isFinite(savedHumans) ? savedHumans : defaults.humanCount, 0, totalPlayers);
    const playMode = saved.playMode === "separateDevices" ? "separateDevices" : "sameScreen";
    return {
      totalPlayers,
      humanCount,
      playMode,
      names: START_NAMES.map((name, index) => saved.names?.[index] || name),
      roleCounts: Object.fromEntries(ROLES.map(role => [role, clamp(Number(saved.roleCounts?.[role]) || 0, 0, START_NAMES.length)]))
    };
  } catch {
    return defaultSetupSettings();
  }
}

function saveSetupSettings(settings) {
  try {
    localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Le jeu reste jouable si le navigateur refuse le stockage local.
  }
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function living(state = game) {
  return state.players.filter(player => player.alive && !player.leftBehind);
}

function randomLiving(state = game) {
  const pool = living(state);
  return pool[Math.floor(Math.random() * pool.length)];
}

function changeResource(state, key, amount) {
  const max = resourceMax(state, key);
  state.camp[key] = clamp(state.camp[key] + amount, 0, max);
  if (key === "wood") buildRafts(state);
}

function resourceMax(state, key) {
  if (key === "morale") return 100;
  if (key === "wood") return 10;
  if (key === "food" || key === "water") return Math.max(1, state.players.length * 3);
  return 20;
}

function buildRafts(state = game) {
  if (!state?.camp || typeof state.camp.rafts !== "number") return;
  const newRafts = Math.floor(state.camp.wood / 10);
  if (!newRafts) return;
  state.camp.wood -= newRafts * 10;
  state.camp.rafts += newRafts;
  if (state === game) {
    addLog(`${newRafts} radeau${newRafts > 1 ? "x" : ""} construit${newRafts > 1 ? "s" : ""}.`, "important");
  }
}

function addFatigue(player, amount) {
  player.fatigue = clamp(player.fatigue + amount, 0, 2);
  enforceChildMentorLimits(player);
  player.wounded = player.alive && player.fatigue === 1;
}

function mentorFor(child) {
  return game.players.find(player => player.id === child.mentorId) || null;
}

function hasLivingMentor(child) {
  const mentor = mentorFor(child);
  return Boolean(child.role === "Enfant" && mentor?.alive && !mentor.leftBehind);
}

function enforceChildMentorLimits(player) {
  if (player?.role !== "Enfant") return;
  player.wounded = player.fatigue === 1;
}

function protectLivingChildren(summary = null) {
  game.players.filter(player => player.role === "Enfant").forEach(child => {
    enforceChildMentorLimits(child);
    protectChildFromDeath(child, summary);
  });
}

function protectChildFromDeath(child, summary = null) {
  return false;
}

function applyMentorLoss(summary = null) {
  game.players.filter(player => player.role === "Enfant" && player.mentorId && !player.mentorLost).forEach(child => {
    const mentor = mentorFor(child);
    if (mentor && (mentor.alive || mentor.leftBehind)) return;
    child.mentorLost = true;
    child.privateNote = `Ton mentor ${child.mentorName} est mort: tu ne peux plus copier ses objets.`;
    summary?.push(`${child.name} perd son mentor et ne peut plus copier ses objets.`);
  });
}

function randomGain() {
  return Math.floor(Math.random() * 3) + 1;
}

function randomEntry(entries) {
  return entries[Math.floor(Math.random() * entries.length)];
}

function itemRatesForRole(role) {
  if (role === "Assassin") {
    return { pistol: 30, amulet: 20, crystal: 0, doubleVote: 30, medkit: 10, vest: 10 };
  }
  if (role === "Robinson") {
    return { pistol: 10, amulet: 20, crystal: 10, doubleVote: 20, medkit: 30, vest: 10 };
  }
  if (role === "Chaman") {
    return { pistol: 10, amulet: 30, crystal: 30, doubleVote: 0, medkit: 20, vest: 10 };
  }
  if (role === "Survivant") {
    return { pistol: 10, amulet: 20, crystal: 10, doubleVote: 10, medkit: 30, vest: 20 };
  }
  if (role === "Chien") {
    return { pistol: 0, amulet: 0, crystal: 0, doubleVote: 0, medkit: 0, vest: 0 };
  }
  return BASE_ITEM_RATES;
}

function randomExploreItem(role = "Survivant") {
  const rates = itemRatesForRole(role);
  let roll = Math.random() * 100;
  for (const [type, rate] of Object.entries(rates)) {
    roll -= rate;
    if (roll < 0) return type;
  }
  return "medkit";
}

function randomGuaranteedItem(role = "Survivant") {
  let type = null;
  while (!type) {
    type = randomExploreItem(role);
  }
  return type;
}

function createItem(type, availableDay = game.day + 1) {
  return {
    id: `item-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    availableDay
  };
}

function itemNames(player) {
  return player.items?.length ? player.items.map(item => ITEMS[item.type]).join(", ") : "aucun";
}

function missionAction(mission) {
  if (mission === "Bucheron") return "wood";
  if (mission === "Pecheur") return "fish";
  return "water";
}

function actionLabel(actionId) {
  return ACTIONS.find(action => action.id === actionId)?.label || "Aucune";
}

function actionHint(actionId) {
  if (actionId === "wood" || actionId === "fish" || actionId === "water") return "1 a 3";
  if (actionId === "explore") return "Trouver un objet";
  if (actionId === "sleep") return "-1 fatigue, faim 0, soif 0";
  return "";
}

function canUseAction(player, actionId) {
  if (player.role === "Chien") {
    if (actionId === "explore") return true;
    if (actionId === "fish") return (player.dogFishCount || 0) < 2;
    return false;
  }
  if (actionId === "explore") return canExplore(player);
  if (actionId === "sleep") return canSleep(player);
  return true;
}

function exploreLimit(player) {
  if (player?.role === "Chien") return Infinity;
  const baseLimit = game.day >= 5 ? 2 : 1;
  return baseLimit + (player?.role === "Robinson" ? 1 : 0);
}

function canExplore(player) {
  if (player.role === "Enfant") return false;
  if (player.role === "Chien") return true;
  return (player.exploreCount || 0) < exploreLimit(player);
}

function sleepLimit(player) {
  if (player?.role === "Chien") return 0;
  return 1 + (player?.role === "Robinson" ? 1 : 0);
}

function sleepCount(player) {
  return player.sleepCount || (player.hasSlept ? 1 : 0);
}

function canSleep(player) {
  return sleepCount(player) < sleepLimit(player);
}

function botAction(player) {
  if (player.role === "Chien") {
    if ((player.dogFishCount || 0) < 2 && Math.random() < 0.45) return "fish";
    return "explore";
  }
  if (player.fatigue >= 1 && !availableItems(player, "medkit").length && canSleep(player)) {
    return "sleep";
  }
  const preferred = missionAction(player.mission);
  const roll = Math.random();
  const aliveCount = living().length;
  const criticalStock = Math.round(aliveCount / 3);
  const foodIsCritical = game.camp.food < criticalStock;
  const waterIsCritical = game.camp.water < criticalStock;
  if ((foodIsCritical || waterIsCritical) && roll < 0.66) {
    return preferred;
  }
  const missionRate = 0.5;
  if (roll < missionRate) return preferred;
  if (roll < missionRate + 0.3 && canExplore(player)) return "explore";
  const alternatives = ACTIONS.filter(action =>
    action.id !== preferred
    && (action.id !== "explore" || canExplore(player))
    && (action.id !== "sleep" || (player.fatigue > 0 && canSleep(player)))
  );
  if (!alternatives.length) return preferred;
  return alternatives[Math.floor(Math.random() * alternatives.length)].id;
}

function assignBotActions() {
  if (game.phase !== "actions") return;
  useBotActionItems();
  living().forEach(player => {
    if (player.isBot && !player.action) {
      player.action = botAction(player);
      player.privateNote = "";
    }
  });
  lockActionsIfReady();
}

function availableItems(player, type = null) {
  return player.items.filter(item => item.availableDay <= game.day && (!type || item.type === type));
}

function consumeBotItem(player, type) {
  const item = availableItems(player, type)[0];
  if (!item) return null;
  player.items = player.items.filter(candidate => candidate.id !== item.id);
  return item;
}

function useBotActionItems() {
  living().filter(player => player.isBot).forEach(player => {
    useBotRolePowers(player);
    if (shouldBotUseCrystal(player)) {
      const target = botTargetForItem(player);
      if (target && consumeBotItem(player, "crystal")) {
        rememberCrystalSpy(player, target);
        trackItemActivation("crystal");
      }
    }
    if (shouldBotUsePistol(player)) {
      const target = botTargetForItem(player);
      if (target && consumeBotItem(player, "pistol")) {
        game.pendingPistols.push({ shooterId: player.id, targetId: target.id });
        trackItemActivation("pistol");
      }
    }
  });
}

function useBotMedkitsAtActionLock() {
  living().filter(player => player.isBot).forEach(player => {
    useBotMedkit(player);
  });
}

function useBotMedkit(player) {
  if (!player.isBot || !player.alive || player.fatigue <= 0) return false;
  const item = consumeBotItem(player, "medkit");
  if (!item) return false;
  game.pendingBotMedkits = game.pendingBotMedkits || [];
  game.pendingBotMedkits.push({ playerId: player.id });
  addPendingPublicAnnouncement("Un kit de soin est utilisé.");
  return true;
}

function useBotRolePowers(player) {
  if (!player?.isBot || !player.alive || game.phase !== "actions") return;
  if (player.role === "Assassin") {
    useBotAssassinPowers(player);
  } else if (player.role === "Chaman") {
    useBotChamanPowers(player);
  } else if (player.role === "Survivant") {
    useBotSurvivantPower(player);
  } else if (player.role === "Enfant") {
    useBotChildPower(player);
  } else if (player.role === "Chien") {
    useBotDogPowers(player);
  }
}

function botSurvivalPressure(player) {
  return player.fatigue * 4 + player.hunger + player.thirst + (likelyShortageSoon() ? 2 : 0);
}

function botResourceStress() {
  const needs = rationNeeds();
  return Math.max(
    needs.food ? 1 - game.camp.food / needs.food : 0,
    needs.water ? 1 - game.camp.water / needs.water : 0
  );
}

function shouldBotUseCrystal(player) {
  if (!availableItems(player, "crystal").length) return false;
  const unknownTargets = living().filter(target => target.id !== player.id && !player.crystalMemory?.[target.id]);
  if (!unknownTargets.length) return false;
  if (unknownTargets.some(target => target.cursed)) return Math.random() < 0.8;
  const pressure = botSurvivalPressure(player);
  const rate = pressure >= 5 ? 0.65 : game.day >= 4 ? 0.48 : 0.32;
  return Math.random() < rate;
}

function useBotAssassinPowers(assassin) {
  if (!assassin.assassinKillUsed && !assassin.pendingAssassinKill) {
    const killTarget = botAssassinKillTarget(assassin);
    if (killTarget && Math.random() < 0.82) {
      assassin.assassinKillUsed = true;
      assassin.pendingAssassinKill = killTarget.id;
      assassin.privateNote = `Elimination preparee contre ${killTarget.name}.`;
      addPendingPublicAnnouncement("Une élimination d'assassin est préparée.");
    }
  }

  if (!assassin.assassinStealUsed && !assassin.pendingAssassinSteal) {
    const stealTarget = botStealTarget(assassin);
    const wantsSteal = stealTarget && (game.day >= 2 || botSurvivalPressure(assassin) >= 4 || stealTarget.items.length >= 2);
    if (wantsSteal && Math.random() < 0.72) {
      assassin.assassinStealUsed = true;
      assassin.pendingAssassinSteal = stealTarget.id;
      game.pendingAssassinSteals.push({ assassinId: assassin.id, targetId: stealTarget.id });
      assassin.privateNote = `Vol prepare contre ${stealTarget.name}.`;
    }
  }
}

function botAssassinKillTarget(assassin) {
  const targets = living().filter(target => target.id !== assassin.id && target.fatigue === 1 && !target.leftBehind);
  if (!targets.length) return null;
  return targets.sort((a, b) => botTargetValue(b) - botTargetValue(a))[0];
}

function botStealTarget(assassin) {
  const targets = living().filter(target => target.id !== assassin.id && !target.leftBehind && availableItems(target).length);
  if (!targets.length) return null;
  return targets.sort((a, b) => availableItems(b).length - availableItems(a).length || botTargetValue(b) - botTargetValue(a))[0];
}

function botTargetValue(target) {
  const roleValue = { Assassin: 4, Chaman: 3, Survivant: 2.3, Robinson: 2, Chien: 2, Enfant: 1.4 };
  return (roleValue[target.role] || 1) + availableItems(target).length * 0.6 + target.fatigue * 0.4;
}

function useBotChamanPowers(chaman) {
  if (!chaman.chamanReviveUsed && !chaman.pendingChamanRevive) {
    const target = game.players
      .filter(candidate => !candidate.alive && !candidate.leftBehind)
      .sort((a, b) => botTargetValue(b) - botTargetValue(a))[0];
    if (target && Math.random() < 0.88) {
      chaman.chamanReviveUsed = true;
      chaman.pendingChamanRevive = target.id;
      chaman.privateNote = `Reanimation preparee pour ${target.name}.`;
    }
  }

  chaman.chamanAmuletTargets ||= [];
  chaman.chamanAmuletUses ||= 0;
  if (chaman.chamanAmuletUses < 1) {
    const target = botProtectTarget(chaman);
    if (target && Math.random() < 0.78) {
      chaman.chamanAmuletUses += 1;
      chaman.chamanAmuletTargets.push(target.id);
      target.items.push(createItem("amulet", game.day));
      target.privateNote = `${chaman.name} t'a donne une amulette de protection.`;
      addPendingPublicAnnouncement("Une amulette de protection est creee par un chaman.", "Une amulette de protection est offerte par un chaman.");
    }
  }
}

function botProtectTarget(chaman) {
  chaman.chamanAmuletTargets ||= [];
  const candidates = chamanAmuletTargets(chaman).filter(target => !chaman.chamanAmuletTargets.includes(target.id));
  if (!candidates.length) return null;
  const stressed = candidates
    .filter(target => botSurvivalPressure(target) >= 4 || target.id === chaman.id || likelyShortageSoon())
    .sort((a, b) => botSurvivalPressure(b) - botSurvivalPressure(a));
  return stressed[0] || null;
}

function chamanAmuletTargets(chaman) {
  if (!chaman) return [];
  return living().filter(target => target.id === chaman.id || target.revivedById === chaman.id);
}

function useBotSurvivantPower(player) {
  if (player.survivorSupplyUsed || player.pendingSurvivorSupply) return;
  const stress = botResourceStress();
  const shouldPrepare = likelyShortageSoon() || stress > 0.35 || game.day >= 7;
  if (shouldPrepare && Math.random() < 0.86) {
    player.survivorSupplyUsed = true;
    player.pendingSurvivorSupply = true;
    player.privateNote = "Soutien de reserves prepare.";
    addPendingPublicAnnouncement("Un survivant prepare un soutien de reserves.");
  }
}

function useBotChildPower(child) {
  child.childCopyUses ||= 0;
  if (!availableItems(child).length) return;
  const mentor = mentorFor(child);
  if (!mentor || !mentor.alive || mentor.leftBehind) return;
  const mentorItem = bestCopyItem(availableItems(mentor));
  if (!mentorItem) return;
  const discard = lowestValueItem(availableItems(child));
  if (!discard || itemUtility(mentorItem.type) <= itemUtility(discard.type)) return;
  if (Math.random() < 0.72) {
    child.items = child.items.filter(item => item.id !== discard.id);
    child.items.push(createItem(mentorItem.type, game.day));
    child.childCopyUses += 1;
    child.privateNote = `Tu copies ${ITEMS[mentorItem.type]} de ton mentor.`;
    addPendingPublicAnnouncement("Un enfant copie un objet de son mentor.");
  }
}

function bestCopyItem(items) {
  return [...items].sort((a, b) => itemUtility(b.type) - itemUtility(a.type))[0] || null;
}

function lowestValueItem(items) {
  return [...items].sort((a, b) => itemUtility(a.type) - itemUtility(b.type))[0] || null;
}

function itemUtility(type) {
  return { medkit: 6, amulet: 5, vest: 4.5, doubleVote: 4, pistol: 3.5, crystal: 2.5 }[type] || 1;
}

function useBotDogPowers(dog) {
  const joy = dog.joy || 0;
  if (joy >= 3 && (dog.fatigue > 0 || dog.hunger + dog.thirst >= 2)) {
    dog.joy -= 3;
    dog.hunger = 0;
    dog.thirst = 0;
    dog.fatigue = 0;
    dog.wounded = false;
    dog.privateNote = `Pouvoir du chien: retabli. Joie restante: ${dog.joy}.`;
    return;
  }
  if (joy >= 2 && !dog.voteShield && likelyShortageSoon() && botSurvivalPressure(dog) >= 3) {
    dog.joy -= 2;
    dog.voteShield = true;
    dog.privateNote = `Pouvoir du chien: amulette active. Joie restante: ${dog.joy}.`;
    return;
  }
  const target = living().filter(candidate => candidate.id !== dog.id && availableItems(candidate).length)
    .sort((a, b) => availableItems(b).length - availableItems(a).length || botTargetValue(b) - botTargetValue(a))[0];
  if (joy >= 1 && target && game.day >= 4 && Math.random() < 0.38) {
    const item = lowestValueItem(availableItems(target)) || randomEntry(availableItems(target));
    target.items = target.items.filter(candidate => candidate.id !== item.id);
    dog.joy -= 1;
    dog.privateNote = `Pouvoir du chien: ${ITEMS[item.type]} detruit chez ${target.name}.`;
    target.privateNote = `${ITEMS[item.type]} a ete detruit.`;
    addPendingPublicAnnouncement("Un objet est detruit.");
  }
}

function likelyShortageSoon() {
  const needs = living().reduce((total, player) => ({
    food: total.food + clamp(player.hunger + 1, 0, needCap(player)),
    water: total.water + clamp(player.thirst + 1, 0, needCap(player))
  }), { food: 0, water: 0 });
  return game.camp.food < needs.food || game.camp.water < needs.water;
}

function botTargetForItem(player) {
  const targets = living().filter(target => target.id !== player.id);
  if (!targets.length) return null;
  const sorted = [...targets].sort((a, b) => {
    const pressureA = a.fatigue * 3 + a.hunger + a.thirst;
    const pressureB = b.fatigue * 3 + b.hunger + b.thirst;
    return pressureB - pressureA;
  });
  return Math.random() < 0.7 ? sorted[0] : targets[Math.floor(Math.random() * targets.length)];
}

function shouldBotUsePistol(player) {
  if (!availableItems(player, "pistol").length || living().length <= 2) return false;
  const isThreatened = player.fatigue > 0 || player.hunger + player.thirst >= 3 || botSurvivalPressure(player) >= 5;
  const assassinBonus = player.role === "Assassin" ? 0.2 : 0;
  return isThreatened && likelyShortageSoon() && Math.random() < 0.55 + assassinBonus;
}

function assignBotVotes() {
  if (game.phase !== "shortage-vote" && game.phase !== "escape-vote") return;
  const botVoters = living()
    .filter(voter => voter.isBot)
    .sort((a, b) => Number(Boolean(a.revivedById)) - Number(Boolean(b.revivedById)));
  botVoters.forEach(voter => {
    if (!voter.isBot || game.votes[voter.id]) return;
    const targets = voteTargetsFor(voter);
    if (!targets.length) {
      game.votes[voter.id] = "none";
      voter.lastVote = "Aucun";
      return;
    }
    const chosen = botVoteChoice(voter, targets);
    game.votes[voter.id] = chosen.id;
    voter.lastVote = chosen.name;
  });
  markNoTargetVotes();
}

function botVoteChoice(voter, targets) {
  const saviorVote = voteFromSavior(voter, targets);
  if (saviorVote) return saviorVote;
  const hasKnownRoles = targets.some(target => knownRoleFor(voter, target));
  if (!hasKnownRoles && !voter.revivedById) {
    return randomEntry(targets);
  }
  const weightedTargets = targets.map(target => ({
    target,
    weight: botVoteWeight(voter, target)
  }));
  const totalWeight = weightedTargets.reduce((total, entry) => total + entry.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of weightedTargets) {
    roll -= entry.weight;
    if (roll <= 0) return entry.target;
  }
  return randomEntry(targets);
}

function voteFromSavior(voter, targets) {
  if (!voter.revivedById) return null;
  const savior = game.players.find(player => player.id === voter.revivedById);
  if (!savior) return null;
  const currentVote = game.votes[savior.id];
  if (currentVote && targets.some(target => target.id === currentVote)) {
    return targets.find(target => target.id === currentVote);
  }
  if (savior.lastVote && savior.lastVote !== "Aucun" && savior.lastVote !== "Aucun vote") {
    return targets.find(target => target.name === savior.lastVote) || null;
  }
  return null;
}

function knownRoleFor(voter, target) {
  if (target.id === voter.revivedById) return "Sauveur";
  return voter.crystalMemory?.[target.id]?.role || null;
}

function botVoteWeight(voter, target) {
  const knownRole = knownRoleFor(voter, target);
  if (target.id === voter.revivedById) return 0.05;
  if (knownRole === "Assassin") return 3;
  if (knownRole === "Chaman") return 0.55;
  if (knownRole === "Survivant") return 0.75;
  if (knownRole === "Robinson") return 0.85;
  return 1;
}

function balancedMissions(count) {
  const missions = [];
  for (let index = 0; index < count; index++) {
    missions.push(MISSIONS[index % MISSIONS.length]);
  }
  return shuffle(missions);
}

function rolePool(config, totalPlayers) {
  const counts = {
    Assassin: Number(config.roleCounts?.Assassin) || 0,
    Robinson: Number(config.roleCounts?.Robinson) || 0,
    Chaman: Number(config.roleCounts?.Chaman) || 0,
    Survivant: Number(config.roleCounts?.Survivant) || 0,
    Enfant: Number(config.roleCounts?.Enfant) || 0,
    Chien: Number(config.roleCounts?.Chien) || 0
  };
  let roles = ROLES.flatMap(role => Array(counts[role]).fill(role));
  if (roles.length < totalPlayers) {
    roles = roles.concat(Array(totalPlayers - roles.length).fill("Survivant"));
  }
  return shuffle(roles.slice(0, totalPlayers));
}

function newGame(config = {}) {
  const totalPlayers = clamp(Number(config.totalPlayers) || 6, 3, START_NAMES.length);
  const configuredHumans = Number(config.humanCount);
  const humanCount = clamp(Number.isFinite(configuredHumans) ? configuredHumans : totalPlayers, 0, totalPlayers);
  const names = Array.from({ length: totalPlayers }, (_, index) => {
    const fallback = index < humanCount ? START_NAMES[index] : BOT_NAMES[index % BOT_NAMES.length];
    return cleanPlayerName(config.names?.[index], fallback);
  });
  const roles = rolePool(config, totalPlayers);
  const missions = balancedMissions(names.length);
  const playMode = config.playMode === "separateDevices" ? "separateDevices" : "sameScreen";
  game = {
    day: 1,
    phase: "actions",
    playMode,
    activeIndex: 0,
    openPlayerId: null,
    selectedAction: null,
    selectedInfoItem: "pistol",
    bottomDrawer: null,
    day5EventDone: false,
    shortage: null,
    rationReview: null,
    voteTurnIndex: 0,
    voteAnnouncementDay: null,
    doubleVoteCountAnnouncementDay: null,
    winner: null,
    camp: {
      wood: 0,
      water: names.length * 2,
      food: names.length * 2,
      morale: 75,
      rafts: 0
    },
    players: names.map((name, index) => ({
      id: `p${index}`,
      name,
      role: roles[index],
      roleRevealed: false,
      mission: missions[index],
      isBot: index >= humanCount,
      ownerId: "",
      alive: true,
      wounded: false,
      hunger: 0,
      thirst: 0,
      fatigue: 0,
      suspicion: 0,
      action: null,
      items: [],
      voteShield: false,
      doubleVote: false,
      roleDetailsOpen: false,
      exploreCount: 0,
      sleepCount: 0,
      hasSlept: false,
      joy: 0,
      dogFishCount: 0,
      assassinStealUsed: false,
      pendingAssassinSteal: null,
      assassinKillUsed: false,
      pendingAssassinKill: null,
      survivorSupplyUsed: false,
      pendingSurvivorSupply: false,
      mentorId: null,
      mentorName: "",
      mentorRole: "",
      mentorLost: false,
      childCopyUses: 0,
      chamanReviveUsed: false,
      pendingChamanRevive: null,
      chamanAmuletUses: 0,
      chamanAmuletTargets: [],
      leftBehind: false,
      deathByPistol: false,
      cursed: false,
      lastAction: "Aucune",
      lastVote: "Aucun vote",
      crystalMemory: {},
      revivedById: null,
      revivedByName: "",
      protected: false,
      privateNote: ""
    })),
    log: [
      { text: "Jour 1. Le camp s'organise pres de l'epave.", type: "important" }
    ],
    narrations: [],
    votes: {},
    pendingPistols: [],
    pendingAssassinSteals: [],
    pendingBotMedkits: [],
    itemActivationsThisTurn: {},
    pendingPublicAnnouncements: [],
    pendingVoteAnnouncements: []
  };
  game.players.forEach(player => {
    const startItems = player.role === "Chien" ? 0 : player.role === "Robinson" ? 3 : 2;
    for (let index = 0; index < startItems; index++) {
      player.items.push(createItem(randomGuaranteedItem(player.role), game.day));
    }
  });
  assignChildMentors();
  assignBotActions();
  render();
}

function assignChildMentors() {
  const children = game.players.filter(player => player.role === "Enfant");
  children.forEach(child => {
    const candidates = game.players.filter(player => player.id !== child.id);
    if (!candidates.length) return;
    const mentor = randomEntry(candidates);
    child.mentorId = mentor.id;
    child.mentorName = mentor.name;
    child.mentorRole = mentor.role;
    child.privateNote = `Ton mentor est ${mentor.name}. Role connu: ${mentor.role}.`;
    mentor.privateNote = `${child.name} est ton enfant protege.`;
    enforceChildMentorLimits(child);
  });
}

function addLog(text, type = "") {
  game.log.unshift({ text, type });
  game.log = game.log.slice(0, 14);
}

function addNarrationLog(text) {
  if (!game?.log) return;
  const spoken = spokenFrench(text);
  if (!spoken) return;
  const alreadyVisible = game.log.slice(0, 4).some(entry => entry.text === spoken);
  if (alreadyVisible) return;
  addLog(spoken, "important");
}

function onlineApi(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  }).then(async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Connexion impossible");
    return data;
  });
}

function packedOnlineGame() {
  const copy = JSON.parse(JSON.stringify(game));
  copy.openPlayerId = null;
  copy.selectedAction = null;
  copy.bottomDrawer = null;
  copy.narrations = (copy.narrations || []).slice(-80);
  copy.players?.forEach(player => {
    player.roleDetailsOpen = false;
  });
  return copy;
}

function applyOnlineGame(state, version = online.version) {
  if (!state) return;
  const localOpenPlayerId = game?.openPlayerId || null;
  const localRoleDetails = new Set((game?.players || [])
    .filter(player => player.roleDetailsOpen)
    .map(player => player.id));
  online.applyingRemote = true;
  game = state;
  const localOpenPlayer = game.players?.find(player => player.id === localOpenPlayerId);
  game.openPlayerId = localOpenPlayer && localOpenPlayer.alive && canControlPlayer(localOpenPlayer) ? localOpenPlayerId : null;
  game.players?.forEach(player => {
    player.roleDetailsOpen = localRoleDetails.has(player.id) && player.id === game.openPlayerId;
  });
  game.selectedAction = null;
  game.bottomDrawer = game.bottomDrawer || null;
  online.version = version;
  playSharedNarrations();
  online.status = `Synchronisé (${online.roomCode})`;
  render();
  online.applyingRemote = false;
}

function humanPlayers() {
  return game?.players?.filter(player => !player.isBot) || [];
}

function needsPlayerIdentity() {
  return Boolean(game && game.playMode === "separateDevices" && !game.winner && humanPlayers().length >= 2 && !controlledHumanPlayer() && humanPlayers().some(player => !player.ownerId));
}

function controlledHumanPlayer() {
  return humanPlayers().find(player => player.ownerId === ONLINE_CLIENT_ID) || null;
}

function canControlPlayer(player) {
  if (!player || player.isBot) return false;
  if (humanPlayers().length < 2 || game.playMode !== "separateDevices") return true;
  return player.ownerId === ONLINE_CLIENT_ID;
}

function choosePlayerIdentity(playerId) {
  if (!game) return;
  const player = humanPlayers().find(candidate => candidate.id === playerId);
  if (!player || (player.ownerId && player.ownerId !== ONLINE_CLIENT_ID)) return;
  humanPlayers().forEach(candidate => {
    if (candidate.ownerId === ONLINE_CLIENT_ID) candidate.ownerId = "";
  });
  player.ownerId = ONLINE_CLIENT_ID;
  game.openPlayerId = null;
  render();
}

function releasePlayerIdentity() {
  if (!game) return;
  humanPlayers().forEach(player => {
    if (player.ownerId === ONLINE_CLIENT_ID) player.ownerId = "";
  });
  game.openPlayerId = null;
  render();
}

function scheduleOnlinePublish() {
  if (!online.connected || !online.roomCode || !game || online.applyingRemote) return;
  clearTimeout(online.publishTimer);
  online.publishTimer = setTimeout(publishOnlineState, 220);
}

async function publishOnlineState() {
  if (!online.connected || !online.roomCode || !game || online.applyingRemote) return;
  try {
    const data = await onlineApi(`/api/rooms/${online.roomCode}/state`, {
      method: "POST",
      body: JSON.stringify({
        clientId: ONLINE_CLIENT_ID,
        state: packedOnlineGame()
      })
    });
    online.version = data.version || online.version;
    online.status = `Synchronisé (${online.roomCode})`;
  } catch (error) {
    online.status = error.message || "Synchronisation impossible";
  }
}

function startOnlinePolling() {
  clearInterval(online.pollTimer);
  online.pollTimer = setInterval(fetchOnlineState, 900);
}

async function fetchOnlineState() {
  if (!online.connected || !online.roomCode) return;
  try {
    const data = await onlineApi(`/api/rooms/${online.roomCode}`);
    if (data.version > online.version && data.updatedBy !== ONLINE_CLIENT_ID) {
      applyOnlineGame(data.state, data.version);
    } else {
      online.version = Math.max(online.version, data.version || 0);
      online.status = `Synchronisé (${online.roomCode})`;
    }
  } catch (error) {
    online.status = error.message || "Salon indisponible";
  }
}

async function createOnlineRoom() {
  if (!game) return;
  try {
    const data = await onlineApi("/api/rooms", { method: "POST", body: "{}" });
    online.roomCode = data.code;
    online.connected = true;
    online.version = 0;
    online.status = `Salon créé: ${data.code}`;
    await publishOnlineState();
    startOnlinePolling();
    render();
  } catch (error) {
    online.status = "Lance le serveur en ligne pour créer un salon.";
    render();
  }
}

async function joinOnlineRoom(inputId = "online-room-code") {
  const input = document.querySelector(`#${inputId}`);
  const code = (input?.value || "").trim().toUpperCase();
  if (!code) return;
  try {
    const data = await onlineApi(`/api/rooms/${code}`);
    online.roomCode = code;
    online.connected = true;
    online.version = data.version || 0;
    online.status = `Salon rejoint: ${code}`;
    applyOnlineGame(data.state, data.version || 0);
    startOnlinePolling();
  } catch (error) {
    online.status = error.message || "Salon introuvable";
    render();
  }
}

function leaveOnlineRoom() {
  clearInterval(online.pollTimer);
  clearTimeout(online.publishTimer);
  online.roomCode = "";
  online.connected = false;
  online.version = 0;
  online.status = "Hors ligne";
  render();
}

function announceImportant(text, narration = text) {
  addLog(text, "important");
  queueNarration(narration);
}

function pushImportantSummary(summary, text, narration = text) {
  if (summary) {
    summary.push(text);
    queueNarration(narration);
    return;
  }
  announceImportant(text, narration);
}

function deathTextWithRole(player, text) {
  player.roleRevealed = true;
  return `${text} Son role etait ${player.role}.`;
}

function announceDeath(player, text, narration = text) {
  announceImportant(deathTextWithRole(player, text), `${narration} Son rôle était ${player.role}.`);
}

function pushDeathSummary(summary, player, text, narration = text) {
  pushImportantSummary(summary, deathTextWithRole(player, text), `${narration} Son rôle était ${player.role}.`);
}

function addPendingPublicAnnouncement(text, narration = text) {
  if (!game?.pendingPublicAnnouncements) return;
  game.pendingPublicAnnouncements.push({ text, narration });
}

function trackItemActivation(type, amount = 1) {
  if (!game) return;
  game.itemActivationsThisTurn = game.itemActivationsThisTurn || {};
  game.itemActivationsThisTurn[type] = (game.itemActivationsThisTurn[type] || 0) + amount;
}

function pendingItemActivationAnnouncements() {
  const counts = game?.itemActivationsThisTurn || {};
  const announcements = [];
  if (counts.pistol) {
    announcements.push({
      text: `${counts.pistol} pistolet${counts.pistol > 1 ? "s" : ""} ${counts.pistol > 1 ? "sont préparés" : "est préparé"} ce tour-ci.`,
      narration: `${counts.pistol} pistolet${counts.pistol > 1 ? "s" : ""} ${counts.pistol > 1 ? "sont préparés" : "est préparé"} ce tour-ci.`
    });
  }
  if (counts.crystal) {
    announcements.push({
      text: `${counts.crystal} boule de cristal utilise.`,
      narration: `${counts.crystal} boule de cristal utilise.`
    });
  }
  return announcements;
}

function flushPendingVoteAnnouncements() {
  game.pendingVoteAnnouncements = [];
}

function flushPendingPublicAnnouncements() {
  const announcements = [
    ...pendingItemActivationAnnouncements(),
    ...(game.pendingPublicAnnouncements || [])
  ];
  if (!announcements.length) return;
  announcements.forEach(announcement => {
    addLog(announcement.text, "important");
    if (announcement.narration) queueNarration(announcement.narration);
  });
  game.pendingPublicAnnouncements = [];
  game.itemActivationsThisTurn = {};
}

function queueNarration(text) {
  const spoken = spokenFrench(text);
  if (isDuplicateNarration(spoken)) return;
  addNarrationLog(spoken);
  markNarrationHeard(spoken);
  recordSharedNarration(spoken);
  const synth = globalThis.speechSynthesis;
  const Utterance = globalThis.SpeechSynthesisUtterance;
  if (!synth || !Utterance) return;
  enqueueSpeech(spoken);
  playNextNarration();
}

function enqueueSpeech(text) {
  const now = Date.now();
  speechQueue = speechQueue
    .filter(entry => now - narrationQueuedAt(entry) <= MAX_SPEECH_DELAY_MS)
    .slice(-(MAX_SPEECH_QUEUE - 1));
  speechQueue.push({ text, queuedAt: now });
  if (speechBusy && speechQueue.length >= MAX_SPEECH_QUEUE && speechCurrentStartedAt && now - speechCurrentStartedAt > MAX_SPEECH_DELAY_MS) {
    globalThis.speechSynthesis?.cancel?.();
  }
}

function narrationText(entry) {
  return typeof entry === "string" ? entry : entry?.text || "";
}

function narrationQueuedAt(entry) {
  return typeof entry === "string" ? Date.now() : entry?.queuedAt || Date.now();
}

function narrationKey(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[.,;:!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isDuplicateNarration(text, windowMs = 4500) {
  const key = narrationKey(text);
  if (!key) return true;
  const now = Date.now();
  const last = recentNarrations.get(key) || 0;
  return now - last < windowMs || speechQueue.some(entry => narrationKey(narrationText(entry)) === key);
}

function markNarrationHeard(text) {
  const key = narrationKey(text);
  if (!key) return;
  const now = Date.now();
  recentNarrations.set(key, now);
  for (const [entryKey, timestamp] of recentNarrations) {
    if (now - timestamp > 30000) recentNarrations.delete(entryKey);
  }
}

function recordSharedNarration(spokenText) {
  if (!game || online.applyingRemote) return;
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  game.narrations = [...(game.narrations || []), { id, text: spokenText }].slice(-80);
  heardNarrationIds.add(id);
}

function playSharedNarrations() {
  const synth = globalThis.speechSynthesis;
  const Utterance = globalThis.SpeechSynthesisUtterance;
  if (!synth || !Utterance) return;
  (game?.narrations || []).forEach(entry => {
    if (!entry?.id || heardNarrationIds.has(entry.id)) return;
    heardNarrationIds.add(entry.id);
    if (isDuplicateNarration(entry.text)) return;
    addNarrationLog(entry.text);
    markNarrationHeard(entry.text);
    enqueueSpeech(entry.text);
  });
  playNextNarration();
}

function spokenFrench(text) {
  return cleanSpeechText(text)
    .replace(/\bTempete\b/g, "\u0054emp\u00eate")
    .replace(/\bPenurie\b/g, "\u0050\u00e9nurie")
    .replace(/\bpenurie\b/g, "\u0070\u00e9nurie")
    .replace(/\butilisee\b/g, "\u0075tilis\u00e9e")
    .replace(/\butilise\b/g, "\u0075tilis\u00e9")
    .replace(/\butilises\b/g, "\u0075tilis\u00e9s")
    .replace(/\bactivee\b/g, "\u0061ctiv\u00e9e")
    .replace(/\bactive\b/g, "\u0061ctiv\u00e9")
    .replace(/\bpreparee\b/g, "\u0070r\u00e9par\u00e9e")
    .replace(/\bprepare\b/g, "\u0070r\u00e9par\u00e9")
    .replace(/\breanime\b/g, "\u0072\u00e9anim\u00e9")
    .replace(/\bcreee\b/g, "\u0063r\u00e9\u00e9e")
    .replace(/\bcree\b/g, "\u0063r\u00e9\u00e9")
    .replace(/\bprotege\b/g, "\u0070rot\u00e9g\u00e9")
    .replace(/\bprotegent\b/g, "\u0070rot\u00e8gent")
    .replace(/\bprive\b/g, "\u0070riv\u00e9")
    .replace(/\bprives\b/g, "\u0070riv\u00e9s")
    .replace(/\bdepensees\b/g, "\u0064\u00e9pens\u00e9es")
    .replace(/\bdepense\b/g, "\u0064\u00e9pense")
    .replace(/\bdepenser\b/g, "\u0064\u00e9penser")
    .replace(/\bdesign(?:e|er)\b/g, match => match.endsWith("er") ? "\u0064\u00e9signer" : "\u0064\u00e9sign\u00e9")
    .replace(/\bpret\b/g, "\u0070r\u00eat")
    .replace(/\bechappe\b/g, "\u00e9chappe")
    .replace(/\bechappent\b/g, "\u00e9chappent")
    .replace(/\belimination\b/g, "\u00e9limination")
    .replace(/\belimine\b/g, "\u00e9limin\u00e9")
    .replace(/\btue\b/g, "\u0074u\u00e9")
    .replace(/\betait\b/g, "\u00e9tait")
    .replace(/\bete\b/g, "\u00e9t\u00e9")
    .replace(/\bfatiguee\b/g, "\u0066atigu\u00e9e")
    .replace(/\breserves\b/g, "\u0072\u00e9serves")
    .replace(/\breserve\b/g, "\u0072\u00e9serve")
    .replace(/\bile\b/g, "\u00eele")
    .replace(/\beau\b/g, "eau")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSpeechText(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/Ã©/g, "\u00e9")
    .replace(/Ã¨/g, "\u00e8")
    .replace(/Ãª/g, "\u00ea")
    .replace(/Ã«/g, "\u00eb")
    .replace(/Ã /g, "\u00e0")
    .replace(/Ã¢/g, "\u00e2")
    .replace(/Ã®/g, "\u00ee")
    .replace(/Ã¯/g, "\u00ef")
    .replace(/Ã´/g, "\u00f4")
    .replace(/Ã»/g, "\u00fb")
    .replace(/Ã¹/g, "\u00f9")
    .replace(/Ã§/g, "\u00e7")
    .replace(/â€™/g, "'")
    .replace(/â€œ|â€/g, "\"")
    .replace(/â€“|â€”/g, "-")
    .replace(/[\u00a9\u00ae\u2122]/g, "")
    .replace(/[^\p{L}\p{N}\s.,;:!?'"’()\-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanPlayerName(name, fallback) {
  const cleaned = cleanSpeechText(name || fallback)
    .replace(/[.,;:!?'"’()]/g, "")
    .slice(0, 14)
    .trim();
  return cleaned || fallback;
}

function playNextNarration() {
  const synth = globalThis.speechSynthesis;
  const Utterance = globalThis.SpeechSynthesisUtterance;
  if (!synth || !Utterance || speechBusy || !speechQueue.length) return;

  speechBusy = true;
  speechQueue = speechQueue.filter(entry => Date.now() - narrationQueuedAt(entry) <= MAX_SPEECH_DELAY_MS);
  if (!speechQueue.length) {
    speechBusy = false;
    return;
  }
  speechCurrentStartedAt = Date.now();
  const utterance = new Utterance(narrationText(speechQueue.shift()));
  utterance.lang = "fr-FR";
  utterance.rate = 0.95;
  utterance.pitch = 0.72;
  utterance.voice = pickMaleFrenchVoice();
  utterance.onend = () => {
    speechBusy = false;
    speechCurrentStartedAt = 0;
    playNextNarration();
  };
  utterance.onerror = () => {
    speechBusy = false;
    speechCurrentStartedAt = 0;
    playNextNarration();
  };
  synth.speak(utterance);
}

function pickMaleFrenchVoice() {
  const voices = globalThis.speechSynthesis?.getVoices?.() || [];
  const maleNames = ["henri", "thomas", "paul", "antoine", "luc", "mathieu", "guillaume", "nicolas", "male", "homme"];
  return voices.find(voice => voice.lang?.toLowerCase().startsWith("fr") && maleNames.some(name => voice.name.toLowerCase().includes(name)))
    || voices.find(voice => voice.lang?.toLowerCase().startsWith("fr"))
    || null;
}

function activePlayer() {
  return living()[game.activeIndex] || living()[0];
}

function selectAction(playerId, actionId) {
  const player = game.players.find(candidate => candidate.id === playerId);
  if (!player || !player.alive || game.phase !== "actions") return;
  if (player.isBot) return;
  if (!canControlPlayer(player)) return;
  if (!canUseAction(player, actionId)) {
    player.privateNote = player.role === "Chien" ? "Le chien peut seulement explorer ou pecher 2 fois." : "Action impossible.";
    render();
    return;
  }
  if (actionId === "explore" && !canExplore(player)) {
    player.privateNote = player.role === "Enfant" ? "L'enfant ne peut pas explorer." : `Limite d'exploration atteinte (${player.exploreCount || 0}/${exploreLimit(player)}).`;
    render();
    return;
  }
  if (actionId === "sleep" && !canSleep(player)) {
    player.privateNote = `Limite de sommeil atteinte (${sleepCount(player)}/${sleepLimit(player)}).`;
    render();
    return;
  }
  player.action = actionId;
  player.privateNote = "";
  game.selectedAction = actionId;
  game.openPlayerId = null;

  const live = living();
  const next = live.findIndex(candidate => !candidate.action);
  game.activeIndex = Math.max(0, next);
  lockActionsIfReady();
  render();
}

function lockActionsIfReady() {
  if (game.phase !== "actions" || !living().length) return false;
  if (!living().every(candidate => candidate.action)) return false;
  useBotMedkitsAtActionLock();
  resolvePendingAssassinSteals();
  resolvePendingChamanRevives();
  game.phase = "resolve-ready";
  flushPendingPublicAnnouncements();
  return true;
}

function resolveDay() {
  if (game.phase !== "resolve-ready") return;

  const summary = [];
  resolvePendingBotMedkits(summary);
  resolvePendingPistols(summary);
  const resourceGains = { wood: 0, food: 0, water: 0 };
  const actionStats = {
    camp: 0,
    sleep: 0,
    explore: 0
  };
  const workers = living();
  workers.forEach(player => {
    switch (player.action) {
      case "wood":
        const woodGain = randomGain();
        const totalWoodGain = woodGain + resourceBonus(player);
        resourceGains.wood += totalWoodGain;
        changeResource(game, "wood", totalWoodGain);
        actionStats.camp += 1;
        break;
      case "fish":
        const foodGain = player.role === "Chien" ? 3 : randomGain();
        const totalFoodGain = player.role === "Chien" ? foodGain : foodGain + resourceBonus(player);
        resourceGains.food += totalFoodGain;
        changeResource(game, "food", totalFoodGain);
        if (player.role === "Chien") player.dogFishCount = (player.dogFishCount || 0) + 1;
        actionStats.camp += 1;
        break;
      case "water":
        const waterGain = randomGain();
        const totalWaterGain = waterGain + resourceBonus(player);
        resourceGains.water += totalWaterGain;
        changeResource(game, "water", totalWaterGain);
        actionStats.camp += 1;
        break;
      case "explore":
        resolveExplore(player, summary);
        actionStats.explore += 1;
        break;
      case "sleep":
        addFatigue(player, -1);
        player.hunger = 0;
        player.thirst = 0;
        player.sleepCount = sleepCount(player) + 1;
        player.hasSlept = true;
        actionStats.sleep += 1;
        break;
    }
    resolveCursedMissionAction(player, summary);
  });
  resolvePendingAssassinKills(summary);

  summary.push(`${actionStats.camp} ${actionStats.camp === 1 ? "a oeuvré" : "ont oeuvré"} pour le camp.`);
  summary.push(`${actionStats.sleep} ${actionStats.sleep === 1 ? "s'est reposé" : "se sont reposés"}.`);
  summary.push(`${actionStats.explore} sont partis en exploration.`);
  queueNarration(`${actionStats.camp} joueur${actionStats.camp === 1 ? " a" : "s ont"} oeuvré pour le camp.`);
  increaseNeeds(summary);
  triggerEvent(summary);
  applyConditionDamage(summary);
  clearDayActions();
  checkWin();

  summary.reverse().forEach(text => addLog(text, text.includes("mort") || text.includes("banni") || text.includes("elimine") || text.includes("tue") ? "important" : ""));
  if (game.winner) {
    game.phase = "ended";
  } else {
    resourceGains.campWorkers = actionStats.camp;
    prepareRationReview(resourceGains);
  }
  render();
}

function resolvePendingBotMedkits(summary) {
  const pending = game.pendingBotMedkits || [];
  if (!pending.length) return;
  let used = 0;
  pending.forEach(entry => {
    const player = game.players.find(candidate => candidate.id === entry.playerId);
    if (!player?.alive || player.leftBehind || player.fatigue <= 0) return;
    addFatigue(player, -1);
    used += 1;
  });
  game.pendingBotMedkits = [];
  if (used) {
    summary.push(`${used} kit${used > 1 ? "s" : ""} de soin ${used > 1 ? "sont utilisés" : "est utilisé"}.`);
  }
}

function resolveCursedMissionAction(player, summary) {
  if (!player.cursed || player.action !== missionAction(player.mission)) return;
  const targets = living().filter(target => target.id !== player.id);
  const target = randomEntry(targets.length ? targets : living());
  if (!target) return;
  addFatigue(target, 1);
  summary.push(`La malédiction de l'esprit frappe ${target.name}: +1 fatigue.`);
  queueNarration(`La malédiction de l'esprit frappe ${target.name}. ${target.name} prend une fatigue.`);
}

function prepareRationReview(resourceGains) {
  const needs = rationNeeds(game.shortage?.deprivedIds || []);
  game.rationReview = {
    gains: resourceGains,
    campWorkers: resourceGains.campWorkers || 0,
    stock: {
      food: game.camp.food,
      water: game.camp.water
    },
    needs,
    missing: {
      food: Math.max(0, needs.food - game.camp.food),
      water: Math.max(0, needs.water - game.camp.water)
    }
  };
  game.phase = "ration-review";
}

function applyRationReview() {
  if (game.phase !== "ration-review") return;
  game.rationReview = null;
  const hasShortage = settleRations();
  if (game.winner) {
    game.phase = "ended";
  } else if (hasShortage) {
    game.phase = "shortage-vote";
    assignBotVotes();
  } else if (game.day > 10) {
    startEscape();
  } else {
    beginActionPhase();
  }
  render();
}

function resolveExplore(player, summary) {
  if (!canExplore(player)) {
    player.privateNote = player.role === "Enfant" ? "L'enfant ne peut pas explorer." : `Limite d'exploration atteinte (${player.exploreCount || 0}/${exploreLimit(player)}).`;
    return;
  }
  player.exploreCount = (player.exploreCount || 0) + 1;
  if (player.role === "Chien") {
    changeResource(game, "food", -1);
    changeResource(game, "water", -1);
    player.joy = (player.joy || 0) + 1;
    player.privateNote = `Exploration du chien: +1 joie. Joie actuelle: ${player.joy}.`;
    return;
  }
  const type = randomExploreItem(player.role);
  if (!type) {
    player.privateNote = "Exploration: tu ne trouves aucun objet.";
    return;
  }
  const item = createItem(type);
  player.items.push(item);
  player.privateNote = `Trouve: ${ITEMS[type]}. Utilisable a partir du jour ${item.availableDay}.`;
}

function resourceBonus(player) {
  return player.role === "Survivant" ? 1 : 0;
}

function needCap(player) {
  return player.role === "Survivant" ? 2 : 100;
}

function increaseNeeds(summary) {
  living().forEach(player => {
    if (player.action === "sleep") {
      player.hunger = 0;
      player.thirst = 0;
      return;
    }
    player.hunger = clamp(player.hunger + 1, 0, needCap(player));
    player.thirst = clamp(player.thirst + 1, 0, needCap(player));
  });
  summary.push("La journee use le camp: chaque joueur gagne 1 faim et 1 soif.");
}

function rationNeeds(excludedIds = []) {
  const excluded = new Set(excludedIds);
  return living().reduce((needs, player) => {
    if (excluded.has(player.id)) return needs;
    needs.food += player.hunger;
    needs.water += player.thirst;
    return needs;
  }, { food: 0, water: 0 });
}

function settleRations() {
  const deprivedIds = game.shortage?.deprivedIds || [];
  const needs = rationNeeds(deprivedIds);
  let foodMissing = Math.max(0, needs.food - game.camp.food);
  let waterMissing = Math.max(0, needs.water - game.camp.water);
  const survivorSupplyUsed = resolvePendingSurvivorSupplies(foodMissing || waterMissing);
  if (survivorSupplyUsed) {
    foodMissing = Math.max(0, needs.food - game.camp.food);
    waterMissing = Math.max(0, needs.water - game.camp.water);
  }
  const aliveCount = living().length;

  if (foodMissing >= aliveCount || waterMissing >= aliveCount) {
    game.shortage = null;
    clearVoteEffects();
    living().forEach(player => {
      addFatigue(player, 1);
      if (player.fatigue >= 2) {
        player.alive = false;
        player.wounded = false;
        if (protectChildFromDeath(player)) return;
        changeResource(game, "morale", -18);
        announceDeath(player, `${player.name} est mort après avoir atteint 2 fatigue.`, `${player.name} est mort après avoir atteint deux points de fatigue.`);
      }
    });
    addLog(`Crise totale: personne ne peut manger ou boire. Tous les joueurs prennent +1 fatigue.`, "important");
    queueNarration(totalShortageNarration(foodMissing, waterMissing, aliveCount));
    checkWin();
    return false;
  }

  if (foodMissing || waterMissing) {
    const announceVoteDetails = game.voteAnnouncementDay !== game.day;
    game.shortage = {
      deprivedIds,
      foodNeed: needs.food,
      waterNeed: needs.water,
      foodMissing,
      waterMissing
    };
    useBotVoteItemsForShortage();
    updateVoteShieldsForShortage();
    addLog(shortageLogText(foodMissing, waterMissing, needs), "important");
    queueNarration(shortageVoteNarration(foodMissing, waterMissing));
    if (announceVoteDetails) {
      flushPendingVoteAnnouncements();
      announceFirstShortageVoteDetails();
      game.voteAnnouncementDay = game.day;
    } else {
      game.pendingVoteAnnouncements = [];
    }
    return true;
  }

  changeResource(game, "food", -needs.food);
  changeResource(game, "water", -needs.water);
  living().forEach(player => {
    if (deprivedIds.includes(player.id)) return;
    player.hunger = 0;
    player.thirst = 0;
    enforceChildMentorLimits(player);
  });
  game.shortage = null;
  clearVoteEffects();
  addLog(`Rations payees: ${needs.food} nourriture et ${needs.water} eau depensees.`);
  queueNarration("Il y a suffisamment de nourriture et d'eau pour le camp.");
  return false;
}

function startEscape() {
  buildRafts();
  const survivors = living();
  if (!survivors.length) {
    checkWin();
    game.phase = "ended";
    return;
  }
  if (game.camp.rafts <= 0) {
    survivors.forEach(player => {
      player.leftBehind = true;
    });
    game.winner = "Aucun radeau n'est pret. Tous les survivants restent sur l'ile et perdent la partie.";
    game.phase = "ended";
    queueNarration("Aucun radeau n'est pret. Personne ne s'echappe de l'ile.");
    return;
  }
  if (game.camp.rafts >= survivors.length) {
    game.winner = `${survivors.map(player => player.name).join(", ")} s'echappent de l'ile en radeau.`;
    game.phase = "ended";
    queueNarration("Les survivants s'echappent de l'ile en radeau.");
    return;
  }
  game.phase = "escape-vote";
  game.votes = {};
  const missing = survivors.length - game.camp.rafts;
  addLog(`Jour 10 termine: ${game.camp.rafts} radeau${game.camp.rafts > 1 ? "x" : ""} pour ${survivors.length} survivants. Vote pour designer ${missing} joueur${missing > 1 ? "s" : ""} qui reste${missing > 1 ? "nt" : ""} sur l'ile.`, "important");
  queueNarration(`Il manque ${missing} radeau${missing > 1 ? "x" : ""}. Vote pour designer qui reste sur l'ile.`);
  assignBotVotes();
}

function finishEscapeIfReady() {
  const survivors = living();
  if (game.camp.rafts < survivors.length) {
    game.phase = "escape-vote";
    game.votes = {};
    assignBotVotes();
    return;
  }
  game.winner = `${survivors.map(player => player.name).join(", ")} s'echappent de l'ile en radeau.`;
  game.phase = "ended";
  queueNarration("Les survivants restants s'echappent de l'ile en radeau.");
}

function useBotVoteItemsForShortage() {
  living().filter(player => player.isBot).forEach(player => {
    if (shouldBotUseVoteShield(player) && !player.voteShield && consumeBotItemBeforeCurrentDay(player, "amulet")) {
      player.voteShield = true;
    }
    if (shouldBotUseDoubleVote(player) && !player.doubleVote && consumeBotItemBeforeCurrentDay(player, "doubleVote")) {
      player.doubleVote = true;
    }
    if (shouldBotUseVoteShield(player) && player.role === "Chien" && !player.voteShield && (player.joy || 0) >= 2) {
      player.joy -= 2;
      player.voteShield = true;
      player.privateNote = `Pouvoir du chien: amulette active. Joie restante: ${player.joy}.`;
    }
  });
}

function shouldBotUseVoteShield(player) {
  if (player.voteShield) return false;
  const targets = voteTargetsFor(player);
  const canBeTargeted = living().some(voter => voter.id !== player.id && voteTargetsFor(voter).some(target => target.id === player.id));
  if (!canBeTargeted) return false;
  const missing = (game.shortage?.foodMissing || 0) + (game.shortage?.waterMissing || 0);
  const pressure = botSurvivalPressure(player);
  if (player.fatigue >= 1) return true;
  if (pressure >= 5) return Math.random() < 0.9;
  if (missing >= Math.max(2, Math.ceil(living().length / 3))) return Math.random() < 0.65;
  return targets.length <= 2 && Math.random() < 0.5;
}

function shouldBotUseDoubleVote(player) {
  if (player.doubleVote) return false;
  if (!voteTargetsFor(player).length) return false;
  const missing = (game.shortage?.foodMissing || 0) + (game.shortage?.waterMissing || 0);
  const pressure = botSurvivalPressure(player);
  const hasHighValueTarget = voteTargetsFor(player).some(target => {
    const role = knownRoleFor(player, target);
    return role === "Assassin" || role === "Chaman" || target.fatigue === 0;
  });
  if (pressure >= 5) return Math.random() < 0.88;
  if (missing >= 2 && hasHighValueTarget) return Math.random() < 0.75;
  if (missing >= Math.ceil(living().length / 3)) return Math.random() < 0.55;
  return false;
}

function consumeBotItemBeforeCurrentDay(player, type) {
  const item = player.items.find(candidate => candidate.type === type && candidate.availableDay < game.day);
  if (!item) return null;
  player.items = player.items.filter(candidate => candidate.id !== item.id);
  return item;
}

function shortageVoteNarration(foodMissing, waterMissing) {
  const parts = [];
  if (foodMissing) parts.push(`${foodMissing} nourriture`);
  if (waterMissing) parts.push(`${waterMissing} eau`);
  return `Rations manquantes: ${parts.join(" et ")}.`;
}

function shortageLogText(foodMissing, waterMissing, needs) {
  const parts = [];
  if (foodMissing) parts.push(`${foodMissing} nourriture`);
  if (waterMissing) parts.push(`${waterMissing} eau`);
  return `Rations manquantes: ${parts.join(" et ")}. Besoin total: ${needs.food} nourriture et ${needs.water} eau.`;
}

function playerListSentence(players) {
  return players.map(player => player.name).join(", ");
}

function announceFirstShortageVoteDetails() {
  const deprived = new Set(game.shortage?.deprivedIds || []);
  const shielded = living().filter(player => player.voteShield && !deprived.has(player.id));
  const doubleVoters = living().filter(player => player.doubleVote);

  if (shielded.length) {
    const names = playerListSentence(shielded);
    const text = `${shielded.length === 1 ? "Le joueur" : "Les joueurs"} ${names} ${shielded.length === 1 ? "est protégé" : "sont protégés"} par une amulette.`;
    addLog(text, "important");
    queueNarration(text);
  }

  if (doubleVoters.length) {
    const names = playerListSentence(doubleVoters);
    const text = `${doubleVoters.length === 1 ? "Le joueur" : "Les joueurs"} ${names} ${doubleVoters.length === 1 ? "a" : "ont"} un double vote.`;
    addLog(text, "important");
    queueNarration(text);
  }
}

function totalShortageNarration(foodMissing, waterMissing, aliveCount) {
  if (foodMissing >= aliveCount && waterMissing >= aliveCount) {
    return "Crise totale. Personne ne mange ni ne boit.";
  }
  if (foodMissing >= aliveCount) return "Crise totale. Personne ne mange.";
  return "Crise totale. Personne ne boit.";
}

function updateVoteShieldsForShortage() {
  const deprived = new Set(game.shortage?.deprivedIds || []);
  const remainingTargets = living().filter(player => !deprived.has(player.id));
  const immuneRemaining = remainingTargets.filter(player => player.voteShield);
  if (!remainingTargets.length || immuneRemaining.length !== remainingTargets.length) return;
  immuneRemaining.forEach(player => {
    player.voteShield = false;
  });
  const names = immuneRemaining.map(player => player.name).join(", ");
  addLog(`Les amulettes de ${names} ne protegent plus: il ne reste plus qu'eux a pouvoir etre prives de ration.`, "important");
  queueNarration(`Les amulettes de ${names} ne protegent plus. Un vote doit les departager.`);
}

function clearVoteEffects() {
  game.players.forEach(player => {
    player.voteShield = false;
    player.doubleVote = false;
  });
  game.pendingVoteAnnouncements = [];
}

function removeItem(player, itemId) {
  const item = player.items.find(candidate => candidate.id === itemId);
  if (!item) return null;
  if (item.availableDay > game.day) return null;
  player.items = player.items.filter(candidate => candidate.id !== itemId);
  return item;
}

function useItem(playerId, itemId) {
  const player = game.players.find(candidate => candidate.id === playerId);
  if (!player || !player.alive || player.isBot || game.phase !== "actions") return;
  if (!canControlPlayer(player)) return;
  const item = removeItem(player, itemId);
  if (!item) return;

  if (item.type === "amulet") {
    player.voteShield = true;
    player.privateNote = "Amulette active: impossible de te voter pendant cette crise.";
  } else if (item.type === "doubleVote") {
    player.doubleVote = true;
    player.privateNote = "Double vote actif pour le prochain vote de penurie.";
  } else if (item.type === "medkit") {
    addFatigue(player, -1);
    player.privateNote = "Kit de soin utilisé: -1 fatigue.";
    addPendingPublicAnnouncement("Un kit de soin est utilisé.");
  }
  render();
}

function useTargetItem(playerId, itemId) {
  const select = document.querySelector(`#target-${itemId}`);
  const targetId = select?.value;
  const player = game.players.find(candidate => candidate.id === playerId);
  const target = game.players.find(candidate => candidate.id === targetId);
  if (!player || !target || !player.alive || player.isBot || game.phase !== "actions") return;
  if (!canControlPlayer(player)) return;
  const item = removeItem(player, itemId);
  if (!item) return;

  if (item.type === "pistol") {
    game.pendingPistols.push({
      shooterId: player.id,
      targetId: target.id
    });
    player.privateNote = `Pistolet prepare contre ${target.name}. Le tir sera revele apres les actions.`;
    trackItemActivation("pistol");
  } else if (item.type === "crystal") {
    rememberCrystalSpy(player, target);
    player.privateNote = `Boule de cristal: ${target.name}, role ${target.role}${target.cursed ? ", maudit" : ""}, action ${target.lastAction || "Aucune"}, vote ${target.lastVote || "Aucun vote"}, objets ${itemNames(target)}.`;
    trackItemActivation("crystal");
  }
  render();
}

function rememberCrystalSpy(player, target) {
  player.crystalMemory[target.id] = {
    targetId: target.id,
    name: target.name,
    role: target.role,
    cursedRevealed: Boolean(target.cursed),
    lastAction: target.lastAction || "Aucune",
    lastVote: target.lastVote || "Aucun vote"
  };
}

function resolvePendingPistols(summary) {
  if (!game.pendingPistols?.length) return;
  game.pendingPistols.forEach(shot => {
    const target = game.players.find(player => player.id === shot.targetId);
    if (!target?.alive) return;
    if (consumePassiveVest(target)) {
      const text = `${target.name} etait vise par le pistolet, mais s'est protege avec un gilet.`;
      summary.push(text);
      queueNarration(`${target.name} s'est protégé avec un gilet.`);
      return;
    }
    target.alive = false;
    target.deathByPistol = true;
    target.fatigue = 2;
    target.wounded = false;
    changeResource(game, "morale", -12);
    pushDeathSummary(summary, target, `${target.name} est mort par le pistolet.`);
  });
  game.pendingPistols = [];
  checkWin();
}

function consumePassiveVest(player) {
  const vest = player.items.find(item => item.type === "vest" && item.availableDay <= game.day);
  if (!vest) return false;
  player.items = player.items.filter(item => item.id !== vest.id);
  player.privateNote = "Ton gilet a bloque un tir de pistolet.";
  return true;
}

function deprivePlayer(player) {
  if (!player || !player.alive || player.leftBehind) return;
  const missing = currentShortageMissingText();
  announceImportant(`${player.name} ne recoit pas de ration. ${missing}`, `${player.name} ne recoit pas de ration. ${missing}`);
  if (!game.shortage) {
    game.shortage = { deprivedIds: [], foodNeed: 0, waterNeed: 0, foodMissing: 0, waterMissing: 0 };
  }
  if (!game.shortage.deprivedIds.includes(player.id)) {
    game.shortage.deprivedIds.push(player.id);
  }
  addFatigue(player, 1);
  player.privateNote = "Vote de pénurie: tu n'as pas reçu de ration et tu prends +1 fatigue.";

  if (player.fatigue >= 2) {
    player.alive = false;
    player.wounded = false;
    if (protectChildFromDeath(player)) {
      return;
    }
    changeResource(game, "morale", -18);
    announceDeath(player, `${player.name} est mort après avoir atteint 2 fatigue.`, `${player.name} est mort après avoir atteint deux points de fatigue.`);
  }
}

function currentShortageMissingText() {
  const shortage = game?.shortage;
  if (!shortage) return "Rations manquantes: aucune.";
  const food = Math.max(0, shortage.foodMissing || 0);
  const water = Math.max(0, shortage.waterMissing || 0);
  return `Rations manquantes: ${food} nourriture et ${water} eau.`;
}

function assassinStealItem(playerId) {
  const assassin = game.players.find(player => player.id === playerId);
  const targetId = document.querySelector(`#assassin-steal-${playerId}`)?.value;
  const target = game.players.find(player => player.id === targetId);
  if (!canControlPlayer(assassin)) return;
  if (!assassin || !target || assassin.role !== "Assassin" || assassin.assassinStealUsed || assassin.pendingAssassinSteal || game.phase !== "actions") return;
  if (!target.alive || target.leftBehind || target.id === assassin.id) return;
  if (!target.items.length) {
    assassin.privateNote = `${target.name} n'a aucun objet. Ton pouvoir de vol reste disponible.`;
    render();
    return;
  }
  assassin.assassinStealUsed = true;
  assassin.pendingAssassinSteal = target.id;
  game.pendingAssassinSteals.push({ assassinId: assassin.id, targetId: target.id });
  assassin.privateNote = `Vol prepare contre ${target.name}. Il sera revele apres les actions.`;
  render();
}

function resolvePendingAssassinSteals() {
  const pending = game.pendingAssassinSteals || [];
  if (!pending.length) return;
  pending.forEach(steal => {
    const assassin = game.players.find(player => player.id === steal.assassinId);
    const target = game.players.find(player => player.id === steal.targetId);
    if (assassin) assassin.pendingAssassinSteal = null;
    if (!assassin || !target || !assassin.alive || !target.alive || target.leftBehind || !target.items.length) {
      if (assassin) {
        assassin.assassinStealUsed = false;
        assassin.privateNote = "Le vol echoue: la cible n'avait plus d'objet disponible. Ton pouvoir revient.";
      }
      return;
    }
    const stolenIndex = Math.floor(Math.random() * target.items.length);
    const [item] = target.items.splice(stolenIndex, 1);
    assassin.items.push(item);
    assassin.privateNote = `Objet vole a ${target.name}: ${ITEMS[item.type]}.`;
    target.privateNote = `${ITEMS[item.type]} a disparu de ta carte.`;
    addPendingPublicAnnouncement(`${target.name} s'est fait voler un objet.`);
  });
  game.pendingAssassinSteals = [];
}

function assassinPrepareKill(playerId) {
  const assassin = game.players.find(player => player.id === playerId);
  const targetId = document.querySelector(`#assassin-kill-${playerId}`)?.value;
  const target = game.players.find(player => player.id === targetId);
  if (!canControlPlayer(assassin)) return;
  if (!assassin || !target || assassin.role !== "Assassin" || assassin.assassinKillUsed || game.phase !== "actions") return;
  if (!target.alive || target.leftBehind || target.id === assassin.id || target.fatigue !== 1) return;
  assassin.assassinKillUsed = true;
  assassin.pendingAssassinKill = target.id;
  assassin.privateNote = `Élimination préparée contre ${target.name}. Elle sera vérifiée après les actions.`;
  addPendingPublicAnnouncement("Une élimination d'assassin est préparée.");
  render();
}

function resolvePendingAssassinKills(summary) {
  game.players.forEach(assassin => {
    if (assassin.role !== "Assassin" || !assassin.pendingAssassinKill) return;
    const target = game.players.find(player => player.id === assassin.pendingAssassinKill);
    assassin.pendingAssassinKill = null;
    if (!target || !target.alive || target.leftBehind || target.fatigue !== 1) {
      assassin.assassinKillUsed = false;
      assassin.privateNote = "Ta cible n'était plus à 1 fatigue. Ton pouvoir d'élimination revient.";
      summary.push("Une élimination d'assassin échoue: la cible n'était plus assez fatiguée.");
      return;
    }
    target.alive = false;
    target.wounded = false;
    target.fatigue = 2;
    if (protectChildFromDeath(target, summary)) return;
    target.privateNote = "Tu as ete tue par l'assassin.";
    changeResource(game, "morale", -10);
    pushDeathSummary(summary, target, `${target.name} est mort, tué par l'assassin.`);
  });
}

function survivorPrepareSupply(playerId) {
  const survivor = game.players.find(player => player.id === playerId);
  if (!canControlPlayer(survivor)) return;
  if (!survivor || survivor.role !== "Survivant" || !survivor.alive || survivor.survivorSupplyUsed || game.phase !== "actions") return;
  survivor.survivorSupplyUsed = true;
  survivor.pendingSurvivorSupply = true;
  survivor.privateNote = "Soutien prepare: +3 nourriture et +3 eau seulement si une penurie arrive en fin de tour.";
  addPendingPublicAnnouncement("Un survivant prepare un soutien de reserves.");
  render();
}

function resolvePendingSurvivorSupplies(hasShortageBeforeSupply) {
  const pending = living().filter(player => player.role === "Survivant" && player.pendingSurvivorSupply);
  if (!pending.length) return false;
  pending.forEach(player => {
    player.pendingSurvivorSupply = false;
    if (!hasShortageBeforeSupply) {
      player.survivorSupplyUsed = false;
      player.privateNote = "Aucune penurie en fin de tour: ton soutien n'a pas ete utilise et ton pouvoir revient.";
      return;
    }
    changeResource(game, "food", 3);
    changeResource(game, "water", 3);
    player.privateNote = "Soutien utilise: +3 nourriture et +3 eau pour le camp.";
  });
  if (hasShortageBeforeSupply) {
    addLog(`${pending.length} soutien${pending.length > 1 ? "s" : ""} de survivant ajoute${pending.length > 1 ? "nt" : ""} des reserves au camp.`, "important");
    queueNarration(`${pending.length} soutien${pending.length === 1 ? " de survivant ajoute" : "s de survivant ajoutent"} des réserves au camp.`);
  }
  return hasShortageBeforeSupply;
}

function chamanRevive(playerId) {
  const chaman = game.players.find(player => player.id === playerId);
  const targetId = document.querySelector(`#chaman-revive-${playerId}`)?.value;
  const target = game.players.find(player => player.id === targetId);
  if (!canControlPlayer(chaman)) return;
  if (!chaman || !target || chaman.role !== "Chaman" || chaman.chamanReviveUsed || game.phase !== "actions") return;
  if (target.alive || target.leftBehind) return;
  chaman.chamanReviveUsed = true;
  chaman.pendingChamanRevive = target.id;
  chaman.privateNote = `Réanimation préparée pour ${target.name}. Elle prendra effet quand tout le monde aura joué.`;
  render();
}

function resolvePendingChamanRevives() {
  game.players.forEach(chaman => {
    if (chaman.role !== "Chaman" || !chaman.pendingChamanRevive) return;
    const target = game.players.find(player => player.id === chaman.pendingChamanRevive);
    chaman.pendingChamanRevive = null;
    if (!target || target.alive || target.leftBehind) {
      chaman.chamanReviveUsed = false;
      chaman.privateNote = "Réanimation annulée: la cible n'est plus disponible.";
      return;
    }
    target.alive = true;
    target.deathByPistol = false;
    target.fatigue = 0;
    target.wounded = false;
    target.revivedById = chaman.id;
    target.revivedByName = chaman.name;
    target.privateNote = `${chaman.name} t'a réanimé. Tu sais qui t'a sauvé.`;
    chaman.privateNote = `${target.name} sera réanimé à la révélation du tour.`;
    addPendingPublicAnnouncement("Un joueur mort est réanimé par un chaman.", "Un joueur mort est réanimé par un chaman.");
  });
}

function chamanCreateAmulet(playerId) {
  const chaman = game.players.find(player => player.id === playerId);
  const targetId = document.querySelector(`#chaman-amulet-${playerId}`)?.value;
  const target = game.players.find(player => player.id === targetId);
  if (!canControlPlayer(chaman)) return;
  if (!chaman || !target || chaman.role !== "Chaman" || game.phase !== "actions") return;
  if (chaman.chamanAmuletUses >= 1 || chaman.chamanAmuletTargets.includes(target.id) || !target.alive || target.leftBehind) return;
  if (!chamanAmuletTargets(chaman).some(candidate => candidate.id === target.id)) return;
  chaman.chamanAmuletUses += 1;
  chaman.chamanAmuletTargets.push(target.id);
  target.items.push(createItem("amulet", game.day));
  target.privateNote = `${chaman.name} t'a donne une amulette de protection.`;
  addPendingPublicAnnouncement("Une amulette de protection est creee par un chaman.", "Une amulette de protection est offerte par un chaman.");
  render();
}

function childCopyMentorItem(playerId) {
  const child = game.players.find(player => player.id === playerId);
  if (!canControlPlayer(child)) return;
  if (!child || child.role !== "Enfant" || !child.alive || child.isBot || game.phase !== "actions") return;
  const mentor = mentorFor(child);
  if (!mentor || !mentor.alive || mentor.leftBehind) {
    child.privateNote = "Ton mentor n'est plus disponible: copie impossible.";
    render();
    return;
  }
  const discardId = document.querySelector(`#child-discard-${playerId}`)?.value;
  const copyType = document.querySelector(`#child-copy-${playerId}`)?.value;
  const discard = child.items.find(item => item.id === discardId && item.availableDay <= game.day);
  const source = mentor.items.find(item => item.type === copyType && item.availableDay <= game.day);
  if (!discard || !source) return;
  child.items = child.items.filter(item => item.id !== discard.id);
  child.items.push(createItem(source.type, game.day));
  child.childCopyUses += 1;
  child.privateNote = `Tu as jete ${ITEMS[discard.type]} pour copier ${ITEMS[source.type]} de ${mentor.name}.`;
  addPendingPublicAnnouncement("Un enfant copie un objet de son mentor.");
  render();
}

function dogRestore(playerId) {
  const dog = game.players.find(player => player.id === playerId);
  if (!canControlPlayer(dog)) return;
  if (!dog || dog.role !== "Chien" || !dog.alive || game.phase !== "actions" || (dog.joy || 0) < 3) return;
  dog.joy -= 3;
  dog.hunger = 0;
  dog.thirst = 0;
  dog.fatigue = 0;
  dog.wounded = false;
  dog.privateNote = `Pouvoir du chien: retabli. Joie restante: ${dog.joy}.`;
  render();
}

function dogDestroyItem(playerId) {
  const dog = game.players.find(player => player.id === playerId);
  const targetId = document.querySelector(`#dog-destroy-${playerId}`)?.value;
  const target = game.players.find(player => player.id === targetId);
  if (!canControlPlayer(dog)) return;
  if (!dog || dog.role !== "Chien" || !dog.alive || game.phase !== "actions" || (dog.joy || 0) < 1 || !target?.items?.length) return;
  const item = randomEntry(target.items);
  target.items = target.items.filter(candidate => candidate.id !== item.id);
  dog.joy -= 1;
  dog.privateNote = `Pouvoir du chien: ${ITEMS[item.type]} detruit chez ${target.name}. Joie restante: ${dog.joy}.`;
  target.privateNote = `${ITEMS[item.type]} a ete detruit.`;
  addPendingPublicAnnouncement("Un objet est detruit.");
  render();
}

function dogActivateAmulet(playerId) {
  const dog = game.players.find(player => player.id === playerId);
  if (!canControlPlayer(dog)) return;
  if (!dog || dog.role !== "Chien" || !dog.alive || game.phase !== "actions" || (dog.joy || 0) < 2 || dog.voteShield) return;
  dog.joy -= 2;
  dog.voteShield = true;
  dog.privateNote = `Pouvoir du chien: amulette active. Joie restante: ${dog.joy}.`;
  render();
}

function triggerEvent(summary) {
  if (Math.random() < 0.72) {
    const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    event.apply(game);
    summary.push(`${event.title}: ${event.text}`);
  }
}

function applyConditionDamage(summary) {
  protectLivingChildren(summary);
  applyMentorLoss(summary);
  living().forEach(player => {
    player.fatigue = clamp(player.fatigue, 0, 2);
    player.hunger = clamp(player.hunger, 0, needCap(player));
    player.thirst = clamp(player.thirst, 0, needCap(player));
    player.suspicion = clamp(player.suspicion, 0, 100);
    if (player.fatigue >= 2) {
      player.alive = false;
      player.wounded = false;
      if (protectChildFromDeath(player, summary)) return;
      pushDeathSummary(summary, player, `${player.name} est mort après avoir atteint 2 fatigue.`, `${player.name} est mort après avoir atteint deux points de fatigue.`);
    }
  });
  protectLivingChildren(summary);
  applyMentorLoss(summary);
}

function clearDayActions() {
  game.players.forEach(player => {
    player.lastAction = player.action ? actionLabel(player.action) : "Aucune";
    player.action = null;
    player.protected = false;
  });
  game.votes = {};
  game.pendingPistols = [];
  game.pendingBotMedkits = [];
  game.itemActivationsThisTurn = {};
  game.activeIndex = 0;
  game.openPlayerId = null;
  game.selectedAction = null;
  game.day += 1;
  queueNarration(`Jour ${game.day}.`);
}

function beginActionPhase() {
  game.phase = "actions";
  triggerDayStartEvent();
  if (game.winner) {
    game.phase = "ended";
    return;
  }
  assignBotActions();
}

function triggerDayStartEvent() {
  if (game.day !== 5 || game.day5EventDone) return;
  game.day5EventDone = true;
  const summary = [];
  game.players.filter(player => player.role === "Chien" && player.alive).forEach(player => {
    player.joy = (player.joy || 0) + 1;
    player.privateNote = `Jour 5: +1 joie. Joie actuelle: ${player.joy}.`;
  });
  const event = randomEntry(DAY_5_EVENTS);
  queueNarration(`Évènement du jour cinq: ${spokenDay5EventTitle(event.title)}.`);
  event.apply(summary);
  applyConditionDamage(summary);
  checkWin();
  summary.reverse().forEach(text => addLog(text, "important"));
}

function spokenDay5EventTitle(title) {
  if (title === "Tempete") return "Tempête";
  return title;
}

function castVote(voterId, targetId) {
  if (game.phase !== "vote" && game.phase !== "shortage-vote" && game.phase !== "escape-vote") return;
  const voter = game.players.find(player => player.id === voterId);
  if (voter && !voter.isBot && !canControlPlayer(voter)) return;
  const validTargets = voteTargetsFor(voter).map(player => player.id).concat("none");
  if (!validTargets.includes(targetId)) return;
  game.votes[voterId] = targetId;
  const target = game.players.find(player => player.id === targetId);
  voter.lastVote = targetId === "none" ? "Aucun" : target?.name || "Aucun vote";
  render();
}

function currentHumanVoter() {
  if (game.phase !== "vote" && game.phase !== "shortage-vote" && game.phase !== "escape-vote") return null;
  markNoTargetVotes();
  const controlled = controlledHumanPlayer();
  if (game.playMode === "separateDevices" && humanPlayers().length >= 2) {
    if (!controlled || !controlled.alive || game.votes[controlled.id] || !voteTargetsFor(controlled).length) return null;
    return controlled;
  }
  return living().find(player => !player.isBot && !game.votes[player.id] && voteTargetsFor(player).length) || null;
}

function submitSecretVote(voterId) {
  const targetId = document.querySelector(`#secret-vote-${voterId}`)?.value;
  castVote(voterId, targetId);
}

function allVotesReady() {
  if (game.phase !== "vote" && game.phase !== "shortage-vote" && game.phase !== "escape-vote") return false;
  return living().every(player => game.votes[player.id] || voteTargetsFor(player).length === 0 || voteCanBeSkipped(player));
}

function voteCanBeSkipped(player) {
  return Boolean(game.playMode === "separateDevices" && !player.isBot && humanPlayers().length >= 2 && !player.ownerId);
}

function markNoTargetVotes() {
  if (game.phase !== "vote" && game.phase !== "shortage-vote" && game.phase !== "escape-vote") return;
  living().forEach(voter => {
    if (game.votes[voter.id] || voteTargetsFor(voter).length) return;
    game.votes[voter.id] = "none";
    voter.lastVote = "Aucun";
  });
  if (game.playMode === "separateDevices" && humanPlayers().length >= 2) {
    living().filter(voteCanBeSkipped).forEach(voter => {
      if (game.votes[voter.id]) return;
      game.votes[voter.id] = "none";
      voter.lastVote = "Aucun";
    });
  }
}

function resolveVote() {
  if (game.phase !== "vote" && game.phase !== "shortage-vote" && game.phase !== "escape-vote") return;
  markNoTargetVotes();
  if (!allVotesReady()) return;
  const isShortageVote = game.phase === "shortage-vote";
  const isEscapeVote = game.phase === "escape-vote";
  const counts = {};
  let doubleVoteUsed = 0;
  Object.entries(game.votes).forEach(([voterId, targetId]) => {
    const voter = game.players.find(player => player.id === voterId);
    const targetIsValid = voteTargetsFor(voter).some(target => target.id === targetId);
    if (targetId !== "none" && targetIsValid) {
      const hasDoubleVote = Boolean(voter?.doubleVote);
      if (hasDoubleVote) doubleVoteUsed += 1;
      counts[targetId] = (counts[targetId] || 0) + (hasDoubleVote ? 2 : 1);
    }
  });
  if (doubleVoteUsed && game.doubleVoteCountAnnouncementDay !== game.day) {
    game.doubleVoteCountAnnouncementDay = game.day;
  }
  const targetId = voteWinner(counts);
  const targetVotes = targetId ? counts[targetId] : 0;
  announceTopVoteResult(targetId, targetVotes);
  if (targetId && (isShortageVote || isEscapeVote || targetVotes >= Math.ceil(living().length / 2))) {
    const target = game.players.find(player => player.id === targetId);
    if (isShortageVote) {
      deprivePlayer(target);
    } else if (isEscapeVote) {
      target.leftBehind = true;
      addLog(`${target.name} reste sur l'ile et perd la partie.`, "important");
      queueNarration(`${target.name} reste sur l'ile.`);
    } else {
      target.alive = false;
      changeResource(game, "morale", -8);
      announceDeath(target, `${target.name} est banni par le vote et meurt.`);
    }
  } else {
    addLog(isShortageVote || isEscapeVote ? "Aucun vote valide: le vote doit recommencer." : "Aucun vote ne rassemble assez de voix.");
  }
  checkWin();
  if (game.winner) {
    game.phase = "ended";
  } else if (isEscapeVote) {
    finishEscapeIfReady();
  } else if (isShortageVote) {
    game.votes = {};
    const hasShortage = settleRations();
    if (game.winner) {
      game.phase = "ended";
    } else {
      if (hasShortage) {
        game.phase = "shortage-vote";
        assignBotVotes();
      } else if (game.day > 10) {
        startEscape();
      } else {
        beginActionPhase();
      }
    }
  } else {
    beginActionPhase();
  }
  render();
}

function announceTopVoteResult(targetId, votes) {
  if (!targetId || !votes) return;
  const target = game.players.find(player => player.id === targetId);
  if (!target) return;
  const text = `${target.name} a reçu le plus de voix: ${votes} voix.`;
  addLog(text, "important");
  queueNarration(text);
}

function skipVote() {
  if (game.phase !== "vote") return;
  addLog("Le camp remet le jugement a plus tard.");
  beginActionPhase();
  render();
}

function voteWinner(counts) {
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  const topVotes = Math.max(...entries.map(([, count]) => count));
  const topCandidates = entries
    .filter(([, count]) => count === topVotes)
    .map(([playerId]) => game.players.find(player => player.id === playerId))
    .filter(Boolean);
  const lowestFatigue = Math.min(...topCandidates.map(player => player.fatigue));
  const tied = topCandidates.filter(player => player.fatigue === lowestFatigue);
  return tied[Math.floor(Math.random() * tied.length)].id;
}

function voteTargetsFor(voter) {
  if (!voter) return [];
  if (game.phase === "escape-vote") {
    return living().filter(target => target.id !== voter.id);
  }
  const alreadyDeprived = new Set(game.shortage?.deprivedIds || []);
  return living().filter(target => target.id !== voter.id && !target.voteShield && !alreadyDeprived.has(target.id));
}

function checkWin() {
  protectLivingChildren();
  applyMentorLoss();
  protectLivingChildren();
  const alive = living();

  if (!alive.length) {
    game.winner = "L'ile gagne. Il ne reste personne.";
  }
}

function togglePlayer(playerId) {
  if (game.phase !== "actions") return;
  const player = game.players.find(candidate => candidate.id === playerId);
  if (!player || !player.alive || player.action) return;
  if (!player.isBot && !canControlPlayer(player)) return;
  game.openPlayerId = game.openPlayerId === playerId ? null : playerId;
  renderLocalOnly();
}

function toggleRoleDetails(playerId) {
  const player = game.players.find(candidate => candidate.id === playerId);
  if (!player || !player.alive || player.isBot || game.phase !== "actions" || game.openPlayerId !== player.id) return;
  player.roleDetailsOpen = !player.roleDetailsOpen;
  renderLocalOnly();
}

function playerStateClass(player) {
  if (player.leftBehind || !player.alive || player.fatigue >= 2) return "state-dead";
  if (player.fatigue === 1) return "state-wounded";
  return "state-alive";
}

function restartFromSetup() {
  game = null;
  renderSetup();
}

function render() {
  if (!game) {
    renderSetup();
    return;
  }

  app.innerHTML = `
    <main class="game">
      ${renderResources()}
      ${renderPlayers()}
      ${renderBottom()}
    </main>
    ${game.phase === "ration-review" ? renderRationReviewModal() : ""}
    ${renderSecretVoteModal()}
    ${renderIdentityModal()}
    ${game.winner ? renderEndModal() : ""}
  `;
  scheduleOnlinePublish();
}

function renderLocalOnly() {
  const wasApplyingRemote = online.applyingRemote;
  online.applyingRemote = true;
  render();
  online.applyingRemote = wasApplyingRemote;
}

function renderIdentityModal() {
  if (!needsPlayerIdentity()) return "";
  const humans = humanPlayers();
  return `
    <div class="overlay">
      <section class="modal identity-modal">
        <h1>Choisis ton personnage</h1>
        <p>Chaque joueur humain contrôle uniquement son personnage: ses objets, son rôle, ses actions et ses votes.</p>
        <div class="identity-grid">
          ${humans.map(player => {
            const taken = Boolean(player.ownerId && player.ownerId !== ONLINE_CLIENT_ID);
            return `
              <button class="identity-card ${taken ? "taken" : ""}" ${taken ? "disabled" : ""} onclick="choosePlayerIdentity('${player.id}')">
                <strong>${player.name}</strong>
                <span>${taken ? "déjà choisi" : "choisir ce personnage"}</span>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderSetup() {
  const setup = loadSetupSettings();
  app.innerHTML = `
    <div class="overlay">
      <section class="modal setup-modal">
        <div class="setup-hero">
          <div>
            <h1>Ile des Ombres</h1>
            <p>Prepare ton expedition: choisis le groupe, dose les roles, nomme chaque personnage puis lance la survie.</p>
          </div>
          <div class="setup-hero-side">
            <span class="pill">Jour 10: radeaux</span>
            <div class="setup-category-map">
              <span class="category-chip category-group">Groupe</span>
              <span class="category-chip category-roles">Roles</span>
              <span class="category-chip category-help">Aide</span>
              <span class="category-chip category-names">Noms</span>
            </div>
          </div>
        </div>
        ${renderOnlineSetupControls()}
        <div class="setup-board">
          <section class="setup-card setup-controls-card category-group">
            <div class="setup-card-title">
              <span class="setup-kicker">Groupe</span>
              <strong>Participants</strong>
            </div>
            <div class="setup-options">
              <label>Nombre de joueurs
                <select id="total-players" onchange="syncSetupNames(true)">
                  ${Array.from({ length: 10 }, (_, index) => index + 3).map(count => `<option value="${count}" ${count === setup.totalPlayers ? "selected" : ""}>${count}</option>`).join("")}
                </select>
              </label>
              <label>Joueurs humains
                <select id="human-count" onchange="syncSetupNames(true)">
                  ${Array.from({ length: setup.totalPlayers + 1 }, (_, count) => `<option value="${count}" ${count === setup.humanCount ? "selected" : ""}>${count}</option>`).join("")}
                </select>
              </label>
              <label>Mode humain
                <select id="play-mode" onchange="saveSetupDraft()">
                  <option value="sameScreen" ${setup.playMode === "sameScreen" ? "selected" : ""}>Même écran</option>
                  <option value="separateDevices" ${setup.playMode === "separateDevices" ? "selected" : ""}>Chacun son appareil</option>
                </select>
              </label>
            </div>
          </section>
          <section class="setup-card setup-controls-card category-roles">
            <div class="setup-card-title">
              <span class="setup-kicker">Roles</span>
              <strong>Composition</strong>
            </div>
            <div class="role-setup">
              ${ROLES.map(role => `
                <label><span>${role}</span>
                  <input id="role-${role}" type="number" min="0" max="12" value="${setup.roleCounts[role] || 0}" oninput="saveSetupDraft()">
                </label>
              `).join("")}
            </div>
          </section>
          <section class="setup-card setup-role-summary category-help">
            <div class="setup-card-title">
              <span class="setup-kicker">Aide de jeu</span>
              <strong>Recapitulatif des roles</strong>
            </div>
            <div class="role-summary-list">
              ${ROLES.map(role => `
                <button class="role-summary-row ${setupOpenRole === role ? "open" : ""}" onclick="toggleSetupRole('${role}')">
                  <strong>${role}</strong>
                  <span>${setupOpenRole === role ? "refermer" : "details"}</span>
                </button>
                ${setupOpenRole === role ? `
                  <div class="role-summary-detail">
                    ${renderRoleDescriptionLine("Obtention objets:", ROLE_SUMMARY[role].objects)}
                    ${renderRoleDescriptionLine("Pouvoirs / effets:", ROLE_SUMMARY[role].powers)}
                  </div>
                ` : ""}
              `).join("")}
            </div>
          </section>
          <section class="setup-card setup-names-card category-names">
            <div class="setup-card-title">
              <span class="setup-kicker">Personnages</span>
              <strong>Noms visibles en partie</strong>
            </div>
            <div class="character-tools">
              <button id="remove-player" onclick="changePlayerCount(-1)" ${setup.totalPlayers <= 3 ? "disabled" : ""}>Supprimer personnage</button>
              <span id="setup-player-count" class="pill">${setup.totalPlayers} joueur${setup.totalPlayers > 1 ? "s" : ""}</span>
              <button id="add-player" onclick="changePlayerCount(1)" ${setup.totalPlayers >= START_NAMES.length ? "disabled" : ""}>Ajouter personnage</button>
            </div>
            <div class="setup-grid">
              ${START_NAMES.map((name, index) => `
                <label>
                  <span><strong class="player-index">Joueur ${index + 1}</strong> <em id="name-kind-${index}">${index < setup.humanCount ? "humain" : "bot"}</em></span>
                  <input id="name-${index}" value="${escapeAttr(setup.names[index] || name)}" maxlength="14" oninput="saveSetupDraft()">
                </label>
              `).join("")}
            </div>
          </section>
        </div>
        <button class="primary" onclick="startFromInputs()">Commencer</button>
      </section>
    </div>
  `;
  syncSetupNames(false);
}

function renderOnlineSetupControls() {
  return `
    <section class="online-panel setup-online">
      <div>
        <strong>Jouer en ligne</strong>
        <span>${online.status}</span>
      </div>
      <div class="online-actions">
        <input id="setup-online-room-code" maxlength="5" placeholder="Code salon">
        <button onclick="joinOnlineRoom('setup-online-room-code')">Rejoindre</button>
      </div>
    </section>
  `;
}

function renderOnlineGameControls() {
  const controlled = controlledHumanPlayer();
  const identityLine = game.playMode === "separateDevices" && humanPlayers().length >= 2
    ? controlled
      ? `<span>Tu joues ${controlled.name}</span>`
      : `<span>Choisis ton personnage pour jouer.</span>`
    : "";
  const releaseButton = game.playMode === "separateDevices" && controlled && humanPlayers().length >= 2 ? `<button onclick="releasePlayerIdentity()">Changer</button>` : "";
  if (online.connected) {
    return `
      <section class="online-panel">
        <div>
          <strong>Salon ${online.roomCode}</strong>
          <span>${online.status}</span>
          ${identityLine}
        </div>
        ${releaseButton}
        <button onclick="leaveOnlineRoom()">Quitter</button>
      </section>
    `;
  }
  return `
    <section class="online-panel">
      <div>
        <strong>En ligne</strong>
        <span>${online.status}</span>
        ${identityLine}
      </div>
      <div class="online-actions">
        ${releaseButton}
        <button onclick="createOnlineRoom()">Créer salon</button>
        <input id="online-room-code" maxlength="5" placeholder="Code">
        <button onclick="joinOnlineRoom('online-room-code')">Rejoindre</button>
      </div>
    </section>
  `;
}

function toggleSetupRole(role) {
  setupOpenRole = setupOpenRole === role ? null : role;
  renderSetup();
}

function changePlayerCount(delta) {
  const totalSelect = document.querySelector("#total-players");
  if (!totalSelect) return;
  const nextCount = clamp(Number(totalSelect.value) + delta, 3, START_NAMES.length);
  totalSelect.value = String(nextCount);
  syncSetupNames(true);
}

function startFromInputs() {
  const totalPlayers = Number(document.querySelector("#total-players").value);
  const humanCount = Number(document.querySelector("#human-count").value);
  const playMode = document.querySelector("#play-mode")?.value || "sameScreen";
  const names = START_NAMES.slice(0, totalPlayers).map((_, index) => document.querySelector(`#name-${index}`).value);
  const roleCounts = Object.fromEntries(ROLES.map(role => [role, Number(document.querySelector(`#role-${role}`).value) || 0]));
  saveSetupSettings({
    totalPlayers,
    humanCount,
    playMode,
    names: START_NAMES.map((_, index) => document.querySelector(`#name-${index}`).value),
    roleCounts
  });
  newGame({ totalPlayers, humanCount, playMode, names, roleCounts });
}

function saveSetupDraft() {
  const totalSelect = document.querySelector("#total-players");
  const humanSelect = document.querySelector("#human-count");
  const playModeSelect = document.querySelector("#play-mode");
  if (!totalSelect || !humanSelect) return;
  const totalPlayers = Number(totalSelect.value);
  const humanCount = Math.min(Number(humanSelect.value), totalPlayers);
  const playMode = playModeSelect?.value || "sameScreen";
  const names = START_NAMES.map((name, index) => document.querySelector(`#name-${index}`)?.value || name);
  const roleCounts = Object.fromEntries(ROLES.map(role => [role, Number(document.querySelector(`#role-${role}`)?.value) || 0]));
  saveSetupSettings({ totalPlayers, humanCount, playMode, names, roleCounts });
}

function syncSetupNames(shouldSave = false) {
  const totalSelect = document.querySelector("#total-players");
  const humanSelect = document.querySelector("#human-count");
  if (!totalSelect || !humanSelect) return;
  const totalPlayers = Number(totalSelect.value);
  const currentHuman = Math.min(Number(humanSelect.value), totalPlayers);
  humanSelect.innerHTML = Array.from({ length: totalPlayers + 1 }, (_, count) => `<option value="${count}" ${count === currentHuman ? "selected" : ""}>${count}</option>`).join("");
  const countLabel = document.querySelector("#setup-player-count");
  if (countLabel) countLabel.textContent = `${totalPlayers} joueur${totalPlayers > 1 ? "s" : ""}`;
  const removeButton = document.querySelector("#remove-player");
  const addButton = document.querySelector("#add-player");
  if (removeButton) removeButton.disabled = totalPlayers <= 3;
  if (addButton) addButton.disabled = totalPlayers >= START_NAMES.length;
  START_NAMES.forEach((_, index) => {
    const label = document.querySelector(`#name-${index}`)?.closest("label");
    if (label) label.hidden = index >= totalPlayers;
    const kind = document.querySelector(`#name-kind-${index}`);
    if (kind) kind.textContent = index < currentHuman ? "humain" : "bot";
  });
  if (shouldSave) saveSetupDraft();
}

function renderResources() {
  const expectedNeeds = expectedEndOfDayNeeds();
  const resources = [
    ["wood", "Bois", "BO", game.camp.wood, resourceMax(game, "wood")],
    ["water", "Eau", "EA", game.camp.water, resourceMax(game, "water")],
    ["food", "Nourriture", "NO", game.camp.food, resourceMax(game, "food")],
    ["morale", "Moral", "MO", game.camp.morale, resourceMax(game, "morale")],
    ["rafts", "Radeaux", "RA", game.camp.rafts, Math.max(1, game.players.length)]
  ];

  return `
    <aside class="panel side">
      <div class="title-row">
        <h1>Ile des Ombres</h1>
        <span class="day-current"><span>Jour actuel</span><strong>${game.day}</strong></span>
      </div>
      ${renderOnlineGameControls()}
      <div class="resources">
        <div class="ration-preview">
          <div class="item-title">Consommation fin de journee</div>
          <span class="tag hunger">nourriture ${expectedNeeds.food}</span>
          <span class="tag thirst">eau ${expectedNeeds.water}</span>
        </div>
        ${resources.map(([key, label, icon, value, max]) => `
          <div class="resource">
            <div class="icon">${icon}</div>
            <div>
              <div class="stat-name"><span>${label}</span><strong>${value}/${max}</strong></div>
              <div class="meter"><span style="width:${clamp(value / max * 100, 0, 100)}%; background:${resourceColor(value, max)}"></span></div>
            </div>
          </div>
        `).join("")}
      </div>
    </aside>
  `;
}

function expectedEndOfDayNeeds() {
  return living().reduce((needs, player) => {
    const dayIncrease = game.phase === "actions" || game.phase === "resolve-ready" ? 1 : 0;
    needs.food += clamp(player.hunger + dayIncrease, 0, needCap(player));
    needs.water += clamp(player.thirst + dayIncrease, 0, needCap(player));
    return needs;
  }, { food: 0, water: 0 });
}

function resourceColor(value, max) {
  const ratio = value / max;
  if (ratio <= 0.2) return "linear-gradient(90deg, #d95f50, #e58d5a)";
  if (ratio <= 0.5) return "linear-gradient(90deg, #e2b15c, #d9c36b)";
  return "linear-gradient(90deg, #78c98c, #57b6c9)";
}

function phaseLabel() {
  if (game.phase === "actions") return `Action de ${activePlayer()?.name || "personne"}`;
  if (game.phase === "resolve-ready") return "Jour pret a resoudre";
  if (game.phase === "ration-review") return "Rations a verifier";
  if (game.phase === "shortage-vote") return "Vote de penurie";
  if (game.phase === "escape-vote") return "Vote du radeau";
  return "Partie terminee";
}

function renderPlayers() {
  const columns = game.players.length > 6
    ? [game.players.slice(0, 6), game.players.slice(6, 12)]
    : [game.players];
  return `
    <aside class="panel side">
      <div class="title-row">
        <h2>Joueurs</h2>
        <span class="pill">${phaseLabel()}</span>
      </div>
      <div class="players ${game.players.length > 6 ? "players-two-columns" : ""}">
        ${columns.map(column => `
          <div class="player-column">
            ${column.map(player => renderPlayerCard(player)).join("")}
          </div>
        `).join("")}
      </div>
    </aside>
  `;
}

function renderPlayerCard(player) {
  const canOpen = player.alive && game.phase === "actions" && !player.action && (player.isBot || canControlPlayer(player));
  const identityTag = player.isBot
    ? ""
    : game.playMode === "separateDevices" && humanPlayers().length >= 2 && player.ownerId === ONLINE_CLIENT_ID
      ? `<span class="tag good">toi</span>`
      : game.playMode === "separateDevices" && humanPlayers().length >= 2 && player.ownerId
        ? `<span class="tag">pris</span>`
        : game.playMode === "separateDevices" && humanPlayers().length >= 2
          ? `<span class="tag">libre</span>`
          : "";
  return `
    <article class="player ${playerStateClass(player)} ${game.openPlayerId === player.id ? "active" : ""}">
      <button class="player-summary" onclick="togglePlayer('${player.id}')" ${canOpen ? "" : "disabled"}>
        <span class="player-identity">
          <span class="player-name">${player.name}</span>
          <span class="tag mission ${missionClass(player.mission)}">${player.mission}</span>
          ${player.roleRevealed ? `<span class="tag bad">role: ${player.role}</span>` : ""}
          ${identityTag}
        </span>
        <span class="summary-stats">
          <span class="tag hunger">faim ${player.hunger}</span>
          <span class="tag thirst">soif ${player.thirst}</span>
          <span class="tag">fatigue ${player.fatigue}/2</span>
          ${player.action && !player.isBot ? `<span class="tag good">action choisie</span>` : ""}
        </span>
      </button>
      <div class="player-details ${game.openPlayerId === player.id ? "open" : ""}">
        ${renderRoleInfo(player)}
        ${canControlPlayer(player) && player.role === "Chien" ? `<div class="role">Joie privee: ${player.joy || 0}</div>` : ""}
        ${canControlPlayer(player) && player.privateNote ? `<div class="role">Note privee: ${player.privateNote}</div>` : ""}
        ${renderCrystalMemory(player)}
        ${renderPlayerItems(player)}
        ${renderPlayerActions(player)}
      </div>
    </article>
  `;
}

function renderBottom() {
  const activeDrawer = activeBottomDrawer();
  return `
    <section class="bottom bottom-dock">
      <div class="panel command-strip">
        <div class="command-main">
          <div>
            <h2 class="current-day-title">Jour <strong>${game.day}</strong></h2>
            ${renderDayControls()}
          </div>
          <div class="phase-metrics">
            <span class="pill">${phaseLabel()}</span>
            <span class="pill">${actionProgress()}</span>
          </div>
        </div>
        <div class="drawer-tabs">
          ${renderDrawerTab("items", "Objets")}
          ${renderDrawerTab("log", "Journal")}
          ${renderDrawerTab("vote", `Vote ${voteIsOpen() ? "ouvert" : "ferme"}`)}
        </div>
      </div>
      ${activeDrawer ? renderBottomDrawer(activeDrawer) : ""}
    </section>
  `;
}

function voteIsOpen() {
  return game.phase === "vote" || game.phase === "shortage-vote" || game.phase === "escape-vote";
}

function activeBottomDrawer() {
  if (voteIsOpen()) return "vote";
  return game.bottomDrawer || null;
}

function renderDrawerTab(type, label) {
  const active = activeBottomDrawer() === type;
  return `<button class="drawer-tab ${active ? "active" : ""}" onclick="toggleBottomDrawer('${type}')">${label}</button>`;
}

function renderBottomDrawer(type) {
  const title = type === "items" ? "Recapitulatif des objets" : type === "vote" ? "Vote" : "Journal";
  return `
    <div class="panel drawer-panel drawer-${type}">
      <div class="title-row">
        <h2>${title}</h2>
        ${type === "log" ? `<button onclick="restartFromSetup()">Nouvelle partie</button>` : ""}
        ${type !== "log" && !voteIsOpen() ? `<button onclick="toggleBottomDrawer('${type}')">Fermer</button>` : ""}
      </div>
      <div class="drawer-body">
        ${type === "items" ? renderItemReference() : type === "vote" ? renderVoteControls() : renderLogDrawer()}
      </div>
    </div>
  `;
}

function renderLogDrawer() {
  return `
    <div class="log">
      ${game.log.map(entry => `<div class="log-entry ${entry.type}">${entry.text}</div>`).join("")}
    </div>
  `;
}

function toggleBottomDrawer(type) {
  if (voteIsOpen() && type === "vote") return;
  game.bottomDrawer = game.bottomDrawer === type ? null : type;
  render();
}

function actionProgress() {
  if (game.phase === "ration-review") return "rations";
  const done = living().filter(player => player.action).length;
  return `${done}/${living().length}`;
}

function renderDayControls() {
  if (game.phase === "resolve-ready") {
    return `<div class="command-copy"><span>Toutes les actions sont verrouillees.</span><button class="primary" onclick="resolveDay()">Reveler les resultats</button></div>`;
  }
  if (game.phase === "ration-review") {
    return `<p class="command-copy">Validation des rations en attente.</p>`;
  }
  if (game.phase !== "actions") {
    return `<p class="command-copy">${game.phase === "shortage-vote" ? "Le camp doit priver quelqu'un de ration avant de continuer." : game.phase === "escape-vote" ? "Le camp doit designer qui reste sur l'ile." : "Les actions reprendront apres le vote."}</p>`;
  }
  return `
    <p class="command-copy">Ouvre une carte joueur pour choisir une action. Les objets, le journal et le vote sont ranges dans les volets du bas.</p>
  `;
}

function renderRationReview() {
  const review = game.rationReview;
  if (!review) return "";
  return `
    <div class="ration-review">
      <div>
        <div class="item-title">Ressources recoltees</div>
        <p class="role">${review.campWorkers} joueur${review.campWorkers > 1 ? "s" : ""} ${review.campWorkers === 1 ? "a participé" : "ont participé"} au camp.</p>
        <div class="gain-row">
          <span class="tag mission-wood">bois +${review.gains.wood}</span>
          <span class="tag hunger">nourriture +${review.gains.food}</span>
          <span class="tag thirst">eau +${review.gains.water}</span>
        </div>
      </div>
      <div>
        <div class="item-title">Comparaison des rations</div>
        ${renderRationCompare("Nourriture", "hunger", review.stock.food, review.needs.food, review.missing.food)}
        ${renderRationCompare("Eau", "thirst", review.stock.water, review.needs.water, review.missing.water)}
      </div>
      <div class="controls">
        <button class="primary" onclick="applyRationReview()">Consommer les rations</button>
      </div>
    </div>
  `;
}

function renderRationReviewModal() {
  return `
    <div class="overlay">
      <section class="modal ration-modal">
        <h1>Rations du jour</h1>
        ${renderRationReview()}
      </section>
    </div>
  `;
}

function renderRationCompare(label, tagClass, stock, need, missing) {
  return `
    <div class="ration-compare ${missing ? "short" : "ok"}">
      <span class="ration-label ${tagClass}">${label}</span>
      <strong class="ration-big">${stock} / ${need}</strong>
      <span class="tag ${missing ? "bad" : "good"}">${missing ? `manque ${missing}` : "suffisant"}</span>
    </div>
  `;
}

function renderItemReference() {
  const selected = game.selectedInfoItem || "pistol";
  return `
    <div class="item-reference">
      ${Object.keys(ITEMS).map(type => `
        <button class="${selected === type ? "selected" : ""}" onclick="selectInfoItem('${type}')">${ITEMS[type]} ${BASE_ITEM_RATES[type]}%</button>
      `).join("")}
    </div>
    <p class="role">${ITEMS[selected]}: ${ITEM_EFFECTS[selected]}</p>
  `;
}

function selectInfoItem(type) {
  game.selectedInfoItem = type;
  render();
}

function renderPlayerActions(player) {
  if (!player.alive || player.isBot || !canControlPlayer(player) || game.phase !== "actions" || game.openPlayerId !== player.id) return "";
  if (player.action) {
    return `<div class="player-actions"><span class="tag good">action choisie</span></div>`;
  }
  return `
    <div class="player-actions">
      ${ACTIONS.map(action => `<button title="${actionHint(action.id)}" ${canUseAction(player, action.id) ? "" : "disabled"} onclick="selectAction('${player.id}', '${action.id}')">${action.label}${actionSuffix(player, action.id)}</button>`).join("")}
    </div>
  `;
}

function actionSuffix(player, actionId) {
  if (player.role === "Chien" && actionId === "explore") return " (illimite)";
  if (player.role === "Chien" && actionId === "fish") return ` (${player.dogFishCount || 0}/2)`;
  if (actionId === "explore") return ` (${player.exploreCount || 0}/${exploreLimit(player)})`;
  if (actionId === "sleep") return ` (${sleepCount(player)}/${sleepLimit(player)})`;
  return "";
}

function renderRoleInfo(player) {
  if (!player.alive || player.isBot || !canControlPlayer(player) || game.phase !== "actions" || game.openPlayerId !== player.id) return "";
  const isOpen = Boolean(player.roleDetailsOpen);
  return `
    <div class="role role-card">
      <button class="role-toggle" onclick="toggleRoleDetails('${player.id}')">
        Role: <strong>${player.role}</strong>
      </button>
      ${isOpen ? `
        <div class="role-detail">
          ${renderRoleDescriptionLine("Obtention objets:", ROLE_SUMMARY[player.role].objects)}
          ${renderRoleDescriptionLine("Pouvoirs / effets:", ROLE_SUMMARY[player.role].powers)}
          ${renderMentorInfo(player)}
        </div>
      ` : ""}
    </div>
  `;
}

function renderRoleDescriptionLine(label, text) {
  const lines = splitRoleDescription(text, label.startsWith("Obtention"));
  if (label.startsWith("Obtention")) return renderObjectModifierColumns(label, lines);
  return `
    <div class="role-lines">
      <strong>${label}</strong>
      ${lines.map(line => `<span>${line}</span>`).join("")}
    </div>
  `;
}

function renderObjectModifierColumns(label, lines) {
  const modifiers = lines.map(parseModifierLine);
  const bonuses = modifiers.filter(modifier => modifier.kind === "bonus");
  const maluses = modifiers.filter(modifier => modifier.kind === "malus");
  return `
    <div class="role-lines role-object-modifiers">
      <strong>${label}</strong>
      <div class="modifier-columns">
        <div class="modifier-column bonus">
          ${bonuses.length ? bonuses.map(modifier => `<span>${modifier.text}</span>`).join("") : `<span>Aucun bonus.</span>`}
        </div>
        <div class="modifier-column malus">
          ${maluses.length ? maluses.map(modifier => `<span>${modifier.text}</span>`).join("") : `<span>Aucun malus.</span>`}
        </div>
      </div>
    </div>
  `;
}

function parseModifierLine(line) {
  return {
    text: line,
    kind: line.includes("-") ? "malus" : "bonus"
  };
}

function splitRoleDescription(text, splitCommas = false) {
  const separator = splitCommas ? /(?:,\s+|\.\s+|;\s+)/ : /(?:\.\s+|;\s+)/;
  return text
    .split(separator)
    .map(line => line.trim())
    .filter(Boolean)
    .map(capitalizeRoleLine)
    .map(line => line.endsWith(".") ? line : `${line}.`);
}

function capitalizeRoleLine(line) {
  return line ? `${line.charAt(0).toUpperCase()}${line.slice(1)}` : line;
}

function renderMentorInfo(player) {
  const protectedChildren = game.players.filter(child => child.role === "Enfant" && child.mentorId === player.id);
  const childInfo = player.role === "Enfant" && player.mentorId
    ? `<span><strong>Mentor:</strong> ${player.mentorName} (${player.mentorRole})${player.mentorLost ? " - mort" : ""}</span>`
    : "";
  const mentorInfo = protectedChildren.length
    ? `<span><strong>Enfant protege:</strong> ${protectedChildren.map(child => `${child.name} (${child.role})`).join(", ")}</span>`
    : "";
  return `${childInfo}${mentorInfo}`;
}

function renderEnfantPowers(player) {
  const mentor = mentorFor(player);
  const ownItems = player.items.filter(item => item.availableDay <= game.day);
  const mentorItems = mentor?.alive ? mentor.items.filter(item => item.availableDay <= game.day) : [];
  const disabled = !ownItems.length || !mentorItems.length || !mentor?.alive || mentor.leftBehind;
  return `
    <div class="role-powers">
      <div class="item-row">
        <span><span class="tag">Pouvoir</span> Copie illimitée${player.childCopyUses ? ` (${player.childCopyUses})` : ""}</span>
        <select id="child-discard-${player.id}" ${disabled ? "disabled" : ""}>
          ${ownItems.length ? ownItems.map(item => `<option value="${item.id}">Jeter ${ITEMS[item.type]}</option>`).join("") : `<option>Aucun objet</option>`}
        </select>
        <select id="child-copy-${player.id}" ${disabled ? "disabled" : ""}>
          ${mentorItems.length ? mentorItems.map(item => `<option value="${item.type}">Copier ${ITEMS[item.type]}</option>`).join("") : `<option>Mentor sans objet</option>`}
        </select>
        <button ${disabled ? "disabled" : ""} onclick="childCopyMentorItem('${player.id}')">Copier</button>
      </div>
    </div>
  `;
}

function renderSurvivantPowers(player) {
  return `
    <div class="role-powers">
      <div class="item-row">
        <span><span class="tag">Pouvoir</span> Soutien ${player.survivorSupplyUsed ? "1/1" : "0/1"}</span>
        <span>+3 nourriture, +3 eau</span>
        <button ${player.survivorSupplyUsed ? "disabled" : ""} onclick="survivorPrepareSupply('${player.id}')">Preparer</button>
      </div>
    </div>
  `;
}

function renderAssassinPowers(player) {
  const stealTargets = living().filter(target => target.id !== player.id && !target.leftBehind);
  const killTargets = living().filter(target => target.id !== player.id && !target.leftBehind && target.fatigue === 1);
  return `
    <div class="role-powers">
      <div class="item-row">
        <span><span class="tag">Pouvoir</span> Vol ${player.assassinStealUsed ? "1/1" : "0/1"}</span>
        <select id="assassin-steal-${player.id}" ${player.assassinStealUsed || !stealTargets.length ? "disabled" : ""}>
          ${stealTargets.length ? stealTargets.map(target => `<option value="${target.id}">${target.name}</option>`).join("") : `<option>Aucune cible</option>`}
        </select>
        <button ${player.assassinStealUsed || !stealTargets.length ? "disabled" : ""} onclick="assassinStealItem('${player.id}')">Voler</button>
      </div>
      <div class="item-row">
        <span><span class="tag">Pouvoir</span> Elimination ${player.assassinKillUsed ? "1/1" : "0/1"}</span>
        <select id="assassin-kill-${player.id}" ${player.assassinKillUsed || !killTargets.length ? "disabled" : ""}>
          ${killTargets.length ? killTargets.map(target => `<option value="${target.id}">${target.name}</option>`).join("") : `<option>Aucune cible</option>`}
        </select>
        <button ${player.assassinKillUsed || !killTargets.length ? "disabled" : ""} onclick="assassinPrepareKill('${player.id}')">Eliminer</button>
      </div>
    </div>
  `;
}

function renderChamanPowers(player) {
  const deadTargets = game.players.filter(target => !target.alive && !target.leftBehind);
  const amuletTargets = chamanAmuletTargets(player).filter(target => !player.chamanAmuletTargets.includes(target.id));
  const reviveLocked = player.chamanReviveUsed || Boolean(player.pendingChamanRevive) || !deadTargets.length;
  return `
    <div class="role-powers">
      <div class="item-row">
        <span><span class="tag">Pouvoir</span> Reanimation ${player.pendingChamanRevive ? "en attente" : player.chamanReviveUsed ? "1/1" : "0/1"}</span>
        <select id="chaman-revive-${player.id}" ${reviveLocked ? "disabled" : ""}>
          ${deadTargets.length ? deadTargets.map(target => `<option value="${target.id}">${target.name}</option>`).join("") : `<option>Aucun mort</option>`}
        </select>
        <button ${reviveLocked ? "disabled" : ""} onclick="chamanRevive('${player.id}')">Reanimer</button>
      </div>
      <div class="item-row">
        <span><span class="tag">Pouvoir</span> Amulette ${player.chamanAmuletUses}/1</span>
        <select id="chaman-amulet-${player.id}" ${player.chamanAmuletUses >= 1 || !amuletTargets.length ? "disabled" : ""}>
          ${amuletTargets.length ? amuletTargets.map(target => `<option value="${target.id}">${target.name}</option>`).join("") : `<option>Aucune cible</option>`}
        </select>
        <button ${player.chamanAmuletUses >= 1 || !amuletTargets.length ? "disabled" : ""} onclick="chamanCreateAmulet('${player.id}')">Donner</button>
      </div>
    </div>
  `;
}

function renderDogPowers(player) {
  const joy = player.joy || 0;
  const destroyTargets = living().filter(target => target.id !== player.id && target.items.length);
  return `
    <div class="role-powers">
      <div class="item-row">
        <span><span class="tag">Pouvoir</span> Joie ${joy}</span>
        <span>3 joie: faim, soif, fatigue a 0</span>
        <button ${joy < 3 ? "disabled" : ""} onclick="dogRestore('${player.id}')">Retablir</button>
      </div>
      <div class="item-row">
        <span><span class="tag">Pouvoir</span> Detruire objet</span>
        <select id="dog-destroy-${player.id}" ${joy < 1 || !destroyTargets.length ? "disabled" : ""}>
          ${destroyTargets.length ? destroyTargets.map(target => `<option value="${target.id}">${target.name}</option>`).join("") : `<option>Aucune cible</option>`}
        </select>
        <button ${joy < 1 || !destroyTargets.length ? "disabled" : ""} onclick="dogDestroyItem('${player.id}')">Detruire</button>
      </div>
      <div class="item-row">
        <span><span class="tag">Pouvoir</span> Amulette</span>
        <span>2 joie: immunite vote</span>
        <button ${joy < 2 || player.voteShield ? "disabled" : ""} onclick="dogActivateAmulet('${player.id}')">Activer</button>
      </div>
    </div>
  `;
}

function renderCrystalMemory(player) {
  if (!player.alive || player.isBot || !canControlPlayer(player) || game.phase !== "actions" || game.openPlayerId !== player.id) return "";
  const memories = Object.values(player.crystalMemory || {});
  if (!memories.length) return "";
  return `
    <div class="item-box crystal-memory">
      <div class="item-title">Boule de cristal</div>
      ${memories.map(memory => {
        const target = game.players.find(candidate => candidate.id === memory.targetId) || memory;
        return `
        <div class="memory-row">
          <strong>${target.name}</strong>
          <span><b>Role</b>${target.role}${memory.cursedRevealed || target.cursed ? ` <em class="tag bad">maudit</em>` : ""}</span>
          <span><b>Action precedente</b>${target.lastAction || "Aucune"}</span>
          <span><b>Vote precedent</b>${target.lastVote || "Aucun vote"}</span>
          <span><b>Objets actuels</b>${itemNames(target)}</span>
        </div>
      `;
      }).join("")}
    </div>
  `;
}

function renderPlayerItems(player) {
  if (!player.alive || player.isBot || !canControlPlayer(player) || game.phase !== "actions" || game.openPlayerId !== player.id) return "";
  const powers = renderUsableRolePowers(player);
  if (!player.items.length && !player.voteShield && !player.doubleVote && !powers) return "";
  return `
    <div class="item-box">
      <div class="item-title">Objets secrets</div>
      ${player.voteShield ? `<span class="tag good">amulette active</span>` : ""}
      ${player.doubleVote ? `<span class="tag good">double vote actif</span>` : ""}
      ${player.items.map(item => renderItemControl(player, item)).join("")}
      ${powers}
    </div>
  `;
}

function renderUsableRolePowers(player) {
  if (player.role === "Assassin") return renderAssassinPowers(player);
  if (player.role === "Chaman") return renderChamanPowers(player);
  if (player.role === "Survivant") return renderSurvivantPowers(player);
  if (player.role === "Enfant") return renderEnfantPowers(player);
  if (player.role === "Chien") return renderDogPowers(player);
  return "";
}

function renderItemControl(player, item) {
  const locked = item.availableDay > game.day;
  if (locked) {
    return `<div class="item-row"><span>${ITEMS[item.type]}</span><span class="tag">jour ${item.availableDay}</span></div>`;
  }
  if (item.type === "vest") {
    return `<div class="item-row"><span>${ITEMS[item.type]}</span><span class="tag good">automatique</span></div>`;
  }
  if (item.type === "pistol" || item.type === "crystal") {
    return `
      <div class="item-row">
        <span>${ITEMS[item.type]}</span>
        <select id="target-${item.id}">
          ${living().filter(target => target.id !== player.id).map(target => `<option value="${target.id}">${target.name}</option>`).join("")}
        </select>
        <button onclick="useTargetItem('${player.id}', '${item.id}')">Utiliser</button>
      </div>
    `;
  }
  return `
    <div class="item-row">
      <span>${ITEMS[item.type]}</span>
      <button onclick="useItem('${player.id}', '${item.id}')">Utiliser</button>
    </div>
  `;
}

function missionClass(mission) {
  if (mission === "Bucheron") return "mission-wood";
  if (mission === "Pecheur") return "mission-fish";
  return "mission-water";
}

function renderVoteControls() {
  if (game.phase !== "vote" && game.phase !== "shortage-vote" && game.phase !== "escape-vote") {
    return `<p class="role">Le vote s'ouvre uniquement en cas de penurie.</p>`;
  }
  const isShortageVote = game.phase === "shortage-vote";
  const isEscapeVote = game.phase === "escape-vote";
  const missingRafts = Math.max(0, living().length - game.camp.rafts);
  const leftBehind = game.players.filter(player => player.leftBehind);
  return `
    ${isShortageVote ? `<p class="role">Penurie: il manque ${game.shortage.foodMissing} nourriture et ${game.shortage.waterMissing} eau. Vote obligatoire pour choisir qui ne mange/boit pas.</p>` : ""}
    ${isEscapeVote ? `<p class="role">Evasion: ${game.camp.rafts} radeau${game.camp.rafts > 1 ? "x" : ""} pour ${living().length} survivants. Vote pour designer ${missingRafts} joueur${missingRafts > 1 ? "s" : ""} qui reste${missingRafts > 1 ? "nt" : ""} sur l'ile.</p>` : ""}
    ${isEscapeVote && leftBehind.length ? `
      <div class="left-behind-list">
        <div class="item-title">Designes pour rester sur l'ile</div>
        ${leftBehind.map(player => `<span class="tag bad">${player.name}</span>`).join("")}
      </div>
    ` : ""}
    <div class="players">
      ${living().map(voter => `
        <div class="vote-row">
          <span>${voter.name}</span>
          <span class="tag ${voteStatusClass(voter)}">${voteStatusLabel(voter)}</span>
        </div>
      `).join("")}
    </div>
    <div class="controls">
      <button class="primary" onclick="resolveVote()" ${allVotesReady() ? "" : "disabled"}>Depouiller</button>
      ${isShortageVote || isEscapeVote ? "" : `<button onclick="skipVote()">Passer</button>`}
    </div>
  `;
}

function voteStatusLabel(voter) {
  if (game.votes[voter.id] === "none") return "aucun choix";
  if (game.votes[voter.id]) return voter.isBot ? "vote cache" : "vote secret reçu";
  if (!voteTargetsFor(voter).length) return "aucun choix";
  if (!voter.isBot && game.playMode === "separateDevices" && humanPlayers().length >= 2 && !canControlPlayer(voter)) return "en attente";
  return voter.isBot ? "vote cache" : "vote secret attendu";
}

function voteStatusClass(voter) {
  if (game.votes[voter.id] === "none") return "";
  if (game.votes[voter.id]) return "good";
  if (!voteTargetsFor(voter).length) return "";
  return "";
}

function renderSecretVoteModal() {
  const voter = currentHumanVoter();
  if (!voter) return "";
  const targets = voteTargetsFor(voter);
  return `
    <div class="overlay">
      <section class="modal secret-vote-modal">
        <h1>Vote secret</h1>
        <p>${voter.name}, choisis discretement ton vote.</p>
        <div class="item-row secret-vote-row">
          <span>Cible</span>
          <select id="secret-vote-${voter.id}">
            ${targets.map(target => `<option value="${target.id}">${target.name}</option>`).join("")}
            ${targets.length ? "" : `<option value="none">Aucun choix possible</option>`}
          </select>
          <button class="primary" onclick="submitSecretVote('${voter.id}')">Valider</button>
        </div>
      </section>
    </div>
  `;
}

function renderEndModal() {
  return `
    <div class="overlay">
      <section class="modal">
        <h1>Fin de partie</h1>
        <p>${game.winner}</p>
        <div class="players">
          ${game.players.map(player => `
            <div class="vote-row">
              <span>${player.name}</span>
              <strong>${player.leftBehind ? "reste sur l'ile" : player.alive ? "present" : "elimine"}</strong>
            </div>
          `).join("")}
        </div>
        <div class="controls">
          <button class="primary" onclick="restartFromSetup()">Rejouer</button>
        </div>
      </section>
    </div>
  `;
}

render();

const originalAssassinStealItem = assassinStealItem;
assassinStealItem = function(playerId) {
      const assassin = game.players.find(player => player.id === playerId);
      const targetId = document.querySelector("#assassin-steal-" + playerId)?.value;
      const target = game.players.find(player => player.id === targetId);
      if (target && !availableItems(target).length) {
              if (assassin) assassin.privateNote = target.name + " n'a aucun objet disponible. Ton pouvoir de vol reste disponible.";
              render();
              return;
      }
      originalAssassinStealItem(playerId);
};
