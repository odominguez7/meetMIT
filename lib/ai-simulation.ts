import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { listAgents } from "@/lib/agents-store";

type SimStatus = "agreed" | "declined";

export type SimInteraction = {
  id: string;
  timestamp: string;
  closesAt: string;
  fromAgentId: string;
  toAgentId: string;
  offer: string;
  requestedSkill: string;
  importance: "low" | "medium" | "high";
  status: SimStatus;
  agreement: string;
};

export type SimAgentState = {
  id: string;
  name: string;
  skills: string[];
  offersMade: number;
  offersAccepted: number;
  offersDeclined: number;
  commitmentsCount: number;
  overlapPreventions: number;
  busyUntil: string | null;
  lastAction: string;
  influenceScore: number;
};

type PersistedSimulation = {
  running: boolean;
  lastClosedAt: string | null;
  nextAllowedInteractionAt: string | null;
  totalScheduleOverlapPreventions: number;
  updatedAt: string;
  interactions: SimInteraction[];
  agents: SimAgentState[];
};

export type SimulationView = PersistedSimulation & {
  maxClosedPerCooldown: number;
  cooldownSeconds: number;
  totals: {
    interactions: number;
    agreed: number;
    declined: number;
    acceptanceRate: number;
  };
};

const COOLDOWN_SECONDS = 20;
const MAX_CLOSED_PER_COOLDOWN = 1;

const DATA_DIR =
  process.env.AGENT_STORE_DIR ||
  (process.env.K_SERVICE ? "/tmp/meetmit-data" : path.join(process.cwd(), ".data"));
const SIM_FILE = path.join(DATA_DIR, "ai-studio-simulation.json");

const OFFER_TEMPLATES = [
  "I can share a warm intro to a campus founder in exchange for your support on",
  "I can review your prototype and provide strategic feedback if you help me with",
  "I can co-host a small meetup and bring attendees if you contribute expertise on",
  "I can draft an execution plan and weekly milestones if you assist with",
  "I can help de-risk your launch strategy in exchange for your guidance on",
];

function nowIso() {
  return new Date().toISOString();
}

function addSeconds(iso: string, seconds: number) {
  const d = new Date(iso);
  d.setSeconds(d.getSeconds() + seconds);
  return d.toISOString();
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function deriveTotals(interactions: SimInteraction[]) {
  const agreed = interactions.filter((i) => i.status === "agreed").length;
  const declined = interactions.filter((i) => i.status === "declined").length;
  const total = interactions.length;
  return {
    interactions: total,
    agreed,
    declined,
    acceptanceRate: total > 0 ? Math.round((agreed / total) * 100) : 0,
  };
}

function isBusy(agent: SimAgentState, now: Date) {
  return agent.busyUntil ? now.getTime() < new Date(agent.busyUntil).getTime() : false;
}

async function buildFreshState(): Promise<PersistedSimulation> {
  const agents = await listAgents();
  const now = nowIso();
  return {
    running: false,
    lastClosedAt: null,
    nextAllowedInteractionAt: null,
    totalScheduleOverlapPreventions: 0,
    updatedAt: now,
    interactions: [],
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      skills: a.capabilities ?? [],
      offersMade: 0,
      offersAccepted: 0,
      offersDeclined: 0,
      commitmentsCount: 0,
      overlapPreventions: 0,
      busyUntil: null,
      lastAction: "waiting",
      influenceScore: 50,
    })),
  };
}

async function ensureFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(SIM_FILE, "utf8");
  } catch {
    const initial = await buildFreshState();
    await writeFile(SIM_FILE, JSON.stringify(initial, null, 2) + "\n", "utf8");
  }
}

async function readState(): Promise<PersistedSimulation> {
  await ensureFile();
  const raw = await readFile(SIM_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<PersistedSimulation> & {
    agents?: Array<Partial<SimAgentState>>;
  };

  if (!Array.isArray(parsed.interactions) || !Array.isArray(parsed.agents)) {
    return buildFreshState();
  }

  return {
    running: Boolean(parsed.running),
    lastClosedAt: parsed.lastClosedAt ?? null,
    nextAllowedInteractionAt: parsed.nextAllowedInteractionAt ?? null,
    totalScheduleOverlapPreventions: parsed.totalScheduleOverlapPreventions ?? 0,
    updatedAt: parsed.updatedAt ?? nowIso(),
    interactions: parsed.interactions as SimInteraction[],
    agents: parsed.agents.map((a) => ({
      id: a.id ?? "unknown",
      name: a.name ?? a.id ?? "Unknown",
      skills: Array.isArray(a.skills) ? (a.skills as string[]) : [],
      offersMade: a.offersMade ?? 0,
      offersAccepted: a.offersAccepted ?? 0,
      offersDeclined: a.offersDeclined ?? 0,
      commitmentsCount: a.commitmentsCount ?? 0,
      overlapPreventions: a.overlapPreventions ?? 0,
      busyUntil: a.busyUntil ?? null,
      lastAction: a.lastAction ?? "waiting",
      influenceScore: a.influenceScore ?? 50,
    })),
  };
}

async function writeState(state: PersistedSimulation) {
  state.updatedAt = nowIso();
  await writeFile(SIM_FILE, JSON.stringify(state, null, 2) + "\n", "utf8");
}

function syncCooldown(state: PersistedSimulation) {
  if (!state.lastClosedAt) {
    state.nextAllowedInteractionAt = null;
    return;
  }
  const next = new Date(addSeconds(state.lastClosedAt, COOLDOWN_SECONDS));
  if (Date.now() >= next.getTime()) {
    state.nextAllowedInteractionAt = null;
    return;
  }
  state.nextAllowedInteractionAt = next.toISOString();
}

function choosePair(state: PersistedSimulation): { proposer: SimAgentState; receiver: SimAgentState } | null {
  if (state.agents.length < 2) return null;
  const now = new Date();

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const proposer = randomFrom(state.agents);
    if (isBusy(proposer, now)) {
      proposer.overlapPreventions += 1;
      state.totalScheduleOverlapPreventions += 1;
      continue;
    }

    let receiver = randomFrom(state.agents);
    let localAttempts = 0;
    while (receiver.id === proposer.id && localAttempts < 10) {
      receiver = randomFrom(state.agents);
      localAttempts += 1;
    }
    if (receiver.id === proposer.id) continue;

    if (isBusy(receiver, now)) {
      receiver.overlapPreventions += 1;
      state.totalScheduleOverlapPreventions += 1;
      continue;
    }

    return { proposer, receiver };
  }
  return null;
}

function generateInteraction(state: PersistedSimulation): SimInteraction | null {
  const pair = choosePair(state);
  if (!pair) return null;
  const { proposer, receiver } = pair;

  const requestedSkill =
    receiver.skills.length > 0 ? randomFrom(receiver.skills) : "collaboration";
  const offerPrefix = randomFrom(OFFER_TEMPLATES);
  const importance = randomFrom(["low", "medium", "high"] as const);

  const acceptanceBias =
    importance === "high" ? 0.68 : importance === "medium" ? 0.56 : 0.44;
  const accepted = Math.random() < acceptanceBias;
  const status: SimStatus = accepted ? "agreed" : "declined";
  const agreement = accepted
    ? `${receiver.name} agrees to exchange ${requestedSkill} support for ${proposer.name}'s offer.`
    : `${receiver.name} declines for now due to schedule/priority mismatch.`;

  const ts = nowIso();
  const closesAt = addSeconds(ts, COOLDOWN_SECONDS);

  proposer.offersMade += 1;
  proposer.commitmentsCount += 1;
  proposer.busyUntil = closesAt;
  proposer.lastAction = `offered value to ${receiver.id}`;

  receiver.commitmentsCount += 1;
  receiver.busyUntil = closesAt;
  receiver.lastAction = accepted
    ? `accepted exchange with ${proposer.id}`
    : `declined exchange with ${proposer.id}`;

  if (accepted) {
    proposer.influenceScore = Math.min(100, proposer.influenceScore + 3);
    receiver.influenceScore = Math.min(100, receiver.influenceScore + 2);
    proposer.offersAccepted += 1;
    receiver.offersAccepted += 1;
  } else {
    proposer.influenceScore = Math.max(0, proposer.influenceScore - 1);
    proposer.offersDeclined += 1;
    receiver.offersDeclined += 1;
  }

  state.lastClosedAt = ts;

  return {
    id: crypto.randomUUID(),
    timestamp: ts,
    closesAt,
    fromAgentId: proposer.id,
    toAgentId: receiver.id,
    offer: `${offerPrefix} ${requestedSkill}.`,
    requestedSkill,
    importance,
    status,
    agreement,
  };
}

function toView(state: PersistedSimulation): SimulationView {
  return {
    ...state,
    maxClosedPerCooldown: MAX_CLOSED_PER_COOLDOWN,
    cooldownSeconds: COOLDOWN_SECONDS,
    totals: deriveTotals(state.interactions),
  };
}

export async function getSimulationView(): Promise<SimulationView> {
  const state = await readState();
  syncCooldown(state);
  await writeState(state);
  return toView(state);
}

export async function resetSimulation(): Promise<SimulationView> {
  const fresh = await buildFreshState();
  await writeState(fresh);
  return toView(fresh);
}

export async function setSimulationRunning(running: boolean): Promise<SimulationView> {
  const state = await readState();
  state.running = running;
  syncCooldown(state);
  await writeState(state);
  return toView(state);
}

export async function tickSimulation(): Promise<SimulationView> {
  const state = await readState();
  syncCooldown(state);

  if (!state.running) {
    return toView(state);
  }

  if (state.nextAllowedInteractionAt) {
    await writeState(state);
    return toView(state);
  }

  const interaction = generateInteraction(state);
  if (interaction) {
    state.interactions.unshift(interaction);
    if (state.interactions.length > 300) {
      state.interactions = state.interactions.slice(0, 300);
    }
  }

  syncCooldown(state);
  await writeState(state);
  return toView(state);
}
