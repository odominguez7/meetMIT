import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type AgentType =
  | "study-helper"
  | "founder-advisor"
  | "wellness"
  | "moderator"
  | "custom";

export type AgentStatus = "active" | "paused";

export type AgentRecord = {
  id: string;
  name: string;
  capabilities: string[];
  endpoint: string;
  contactEmail?: string;
  agentType: AgentType;
  agentToken: string;
  status: AgentStatus;
  createdAt: string;
  lastSeen: string | null;
  sessionsToday: number;
  totalSessions: number;
  reports: {
    id: string;
    reason: string;
    details?: string;
    reporterId?: string;
    timestamp: string;
  }[];
};

type ActivityRecord = {
  id: string;
  actorType: "agent" | "user" | "system";
  actorId: string;
  action: string;
  details: string;
  timestamp: string;
};

type AgentStore = {
  agents: AgentRecord[];
  activity: ActivityRecord[];
};

const DATA_DIR =
  process.env.AGENT_STORE_DIR ||
  (process.env.K_SERVICE ? "/tmp/meetmit-data" : path.join(process.cwd(), ".data"));
const STORE_FILE = path.join(DATA_DIR, "agents-store.json");

const minuteCounter = new Map<string, number>();
const idempotencyCache = new Map<string, unknown>();

function nowIso() {
  return new Date().toISOString();
}

function normalizeId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function loadManifestAgents(): Promise<AgentRecord[]> {
  try {
    const manifestPath = path.join(process.cwd(), "agents.manifest.json");
    const raw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw) as {
      agents?: Array<{
        id: string;
        name: string;
        capabilities: string[];
        endpoint: string;
        agent_type: AgentType;
      }>;
    };
    const now = nowIso();
    const openclawBase =
      process.env.OPENCLAW_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    return (manifest.agents ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      capabilities: a.capabilities ?? [],
      endpoint: (a.endpoint || "").replace("https://<openclaw-service>", openclawBase),
      contactEmail: undefined,
      agentType: a.agent_type,
      agentToken: `agnt_${a.id.replace(/[^a-z0-9]/gi, "")}`,
      status: "active",
      createdAt: now,
      lastSeen: null,
      sessionsToday: 0,
      totalSessions: 0,
      reports: [],
    }));
  } catch {
    return [];
  }
}

function ensureUniqueId(existing: Set<string>, preferred: string) {
  if (!existing.has(preferred)) return preferred;
  let n = 2;
  while (existing.has(`${preferred}-${n}`)) n += 1;
  return `${preferred}-${n}`;
}

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(STORE_FILE, "utf8");
  } catch {
    const initial: AgentStore = { agents: await loadManifestAgents(), activity: [] };
    await writeFile(STORE_FILE, JSON.stringify(initial, null, 2) + "\n", "utf8");
  }
}

async function readStore(): Promise<AgentStore> {
  await ensureStoreFile();
  const raw = await readFile(STORE_FILE, "utf8");
  const parsed = JSON.parse(raw) as AgentStore;
  if (!Array.isArray(parsed.agents) || !Array.isArray(parsed.activity)) {
    return { agents: await loadManifestAgents(), activity: [] };
  }
  if (parsed.agents.length === 0) {
    parsed.agents = await loadManifestAgents();
    await writeStore(parsed);
  }
  return parsed;
}

async function writeStore(store: AgentStore) {
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2) + "\n", "utf8");
}

function logActivity(store: AgentStore, entry: Omit<ActivityRecord, "id" | "timestamp">) {
  store.activity.unshift({
    id: crypto.randomUUID(),
    timestamp: nowIso(),
    ...entry,
  });
  // keep recent activity bounded
  if (store.activity.length > 2000) {
    store.activity = store.activity.slice(0, 2000);
  }
}

export async function listAgents() {
  const store = await readStore();
  return store.agents;
}

export async function getAgentById(id: string) {
  const store = await readStore();
  return store.agents.find((a) => a.id === id) ?? null;
}

export async function registerAgent(input: {
  name: string;
  capabilities: string[];
  endpoint: string;
  contactEmail?: string;
  agentType: AgentType;
}) {
  const store = await readStore();
  const existingIds = new Set(store.agents.map((a) => a.id));
  const id = ensureUniqueId(existingIds, normalizeId(input.name));

  const agent: AgentRecord = {
    id,
    name: input.name,
    capabilities: input.capabilities,
    endpoint: input.endpoint,
    contactEmail: input.contactEmail,
    agentType: input.agentType,
    agentToken: `agnt_${crypto.randomUUID().replace(/-/g, "")}`,
    status: "active",
    createdAt: nowIso(),
    lastSeen: null,
    sessionsToday: 0,
    totalSessions: 0,
    reports: [],
  };

  store.agents.push(agent);
  logActivity(store, {
    actorType: "agent",
    actorId: id,
    action: "registered",
    details: `Agent ${input.name} registered`,
  });
  await writeStore(store);
  return agent;
}

export async function updateAgentStatus(id: string, status: AgentStatus) {
  const store = await readStore();
  const idx = store.agents.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  store.agents[idx].status = status;
  logActivity(store, {
    actorType: "system",
    actorId: id,
    action: status === "paused" ? "paused" : "activated",
    details: `Agent ${id} set to ${status}`,
  });
  await writeStore(store);
  return store.agents[idx];
}

export async function reportAgent(
  id: string,
  payload: { reason: string; details?: string; reporterId?: string }
) {
  const store = await readStore();
  const idx = store.agents.findIndex((a) => a.id === id);
  if (idx < 0) return null;

  const report = {
    id: crypto.randomUUID(),
    reason: payload.reason,
    details: payload.details,
    reporterId: payload.reporterId,
    timestamp: nowIso(),
  };
  store.agents[idx].reports.push(report);
  logActivity(store, {
    actorType: "user",
    actorId: payload.reporterId ?? "anonymous",
    action: "reported",
    details: `Reported agent ${id}: ${payload.reason}`,
  });
  await writeStore(store);
  return report;
}

function checkPerMinuteLimit(agentId: string, limit = 10) {
  const minuteBucket = Math.floor(Date.now() / 60000);
  const key = `${agentId}:${minuteBucket}`;
  const current = minuteCounter.get(key) ?? 0;
  minuteCounter.set(key, current + 1);
  return current + 1 <= limit;
}

export async function interactWithAgent(args: {
  id: string;
  body: { task: string; context?: Record<string, unknown>; meetmit_user?: string };
  idempotencyKey?: string;
}) {
  const store = await readStore();
  const idx = store.agents.findIndex((a) => a.id === args.id);
  if (idx < 0) return { error: "agent_not_found" as const };
  const agent = store.agents[idx];
  if (agent.status === "paused") return { error: "agent_paused" as const };

  if (!checkPerMinuteLimit(agent.id)) {
    logActivity(store, {
      actorType: "system",
      actorId: agent.id,
      action: "rate_limit_exceeded",
      details: `Agent ${agent.id} exceeded 10 msg/min`,
    });
    await writeStore(store);
    return { error: "rate_limit_exceeded" as const };
  }

  if (args.idempotencyKey && idempotencyCache.has(args.idempotencyKey)) {
    return { cached: true, data: idempotencyCache.get(args.idempotencyKey) };
  }

  let responseJson: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(agent.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${agent.agentToken}`,
        },
        body: JSON.stringify({
          task: args.body.task,
          context: args.body.context ?? {},
          meetmit_user: args.body.meetmit_user ?? "local-user",
        }),
      });
      if (!res.ok) throw new Error(`endpoint_http_${res.status}`);
      responseJson = await res.json();
      break;
    } catch (e) {
      if (attempt === 3) {
        logActivity(store, {
          actorType: "system",
          actorId: agent.id,
          action: "error",
          details: `Agent unreachable after 3 attempts: ${String(e)}`,
        });
        await writeStore(store);
        return { error: "agent_unreachable" as const };
      }
      await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }

  store.agents[idx].lastSeen = nowIso();
  store.agents[idx].sessionsToday += 1;
  store.agents[idx].totalSessions += 1;
  logActivity(store, {
    actorType: "agent",
    actorId: agent.id,
    action: "task_completed",
    details: `Handled task: ${args.body.task.slice(0, 140)}`,
  });
  await writeStore(store);

  if (args.idempotencyKey) {
    idempotencyCache.set(args.idempotencyKey, responseJson);
  }
  return { data: responseJson };
}

export async function listActivity(limit = 100, offset = 0) {
  const store = await readStore();
  return store.activity.slice(offset, offset + limit);
}

export async function listAgentActivity(id: string, limit = 100, offset = 0) {
  const store = await readStore();
  return store.activity
    .filter((a) => a.actorId === id || a.details.includes(` ${id}`))
    .slice(offset, offset + limit);
}

export async function observabilitySummary() {
  const store = await readStore();
  const today = new Date().toISOString().slice(0, 10);
  const activityToday = store.activity.filter((a) => a.timestamp.startsWith(today));
  const errorsToday = activityToday.filter((a) => a.action === "error").length;
  const activeAgents = store.agents.filter((a) => a.status === "active").length;
  const sessionsToday = store.agents.reduce((acc, a) => acc + a.sessionsToday, 0);

  return {
    activeAgents,
    sessionsToday,
    messagesToday: activityToday.length,
    errorsToday,
  };
}
