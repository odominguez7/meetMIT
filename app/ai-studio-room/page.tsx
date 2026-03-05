"use client";

import { useEffect, useMemo, useState } from "react";

type Agent = {
  id: string;
  name: string;
  capabilities: string[];
  status: "active" | "paused";
};

type SimInteraction = {
  id: string;
  timestamp: string;
  closesAt: string;
  fromAgentId: string;
  toAgentId: string;
  offer: string;
  requestedSkill: string;
  importance: "low" | "medium" | "high";
  status: "agreed" | "declined";
  agreement: string;
};

type SimAgentState = {
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

type SimulationView = {
  running: boolean;
  lastClosedAt: string | null;
  nextAllowedInteractionAt: string | null;
  totalScheduleOverlapPreventions: number;
  updatedAt: string;
  interactions: SimInteraction[];
  agents: SimAgentState[];
  maxClosedPerCooldown: number;
  cooldownSeconds: number;
  totals: {
    interactions: number;
    agreed: number;
    declined: number;
    acceptanceRate: number;
  };
};

const ARENA_SIZE = 520;
const ARENA_RADIUS = 200;

export default function AIStudioRoomPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [simulation, setSimulation] = useState<SimulationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadData() {
    setError("");
    try {
      const [agentsRes, simRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/ai-studio/simulation"),
      ]);
      const [agentsJson, simJson] = await Promise.all([agentsRes.json(), simRes.json()]);
      if (!agentsRes.ok) throw new Error(agentsJson.error ?? "Failed to load agents");
      if (!simRes.ok) throw new Error(simJson.error ?? "Failed to load simulation");

      setAgents((agentsJson.agents ?? []) as Agent[]);
      setSimulation(simJson as SimulationView);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load AI Studio Room");
    } finally {
      setLoading(false);
    }
  }

  async function act(action: "start" | "stop" | "tick" | "reset") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai-studio/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as SimulationView & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Simulation action failed");
      setSimulation(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation action failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!simulation?.running) return;
    const timer = setInterval(() => {
      void act("tick");
    }, 4000);
    return () => clearInterval(timer);
  }, [simulation?.running]);

  const activeCount = useMemo(
    () => agents.filter((a) => a.status === "active").length,
    [agents]
  );

  const arenaNodes = useMemo(() => {
    const list = simulation?.agents ?? [];
    return list.map((agent, index) => {
      const angle = (index / Math.max(list.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const x = ARENA_SIZE / 2 + Math.cos(angle) * ARENA_RADIUS;
      const y = ARENA_SIZE / 2 + Math.sin(angle) * ARENA_RADIUS;
      return { ...agent, x, y };
    });
  }, [simulation?.agents]);

  const recentLinks = useMemo(() => {
    const map = new Map(arenaNodes.map((n) => [n.id, n]));
    return (simulation?.interactions ?? []).slice(0, 12).map((i) => ({
      ...i,
      from: map.get(i.fromAgentId),
      to: map.get(i.toAgentId),
    }));
  }, [simulation?.interactions, arenaNodes]);

  const cooldownText = useMemo(() => {
    const nextAt = simulation?.nextAllowedInteractionAt;
    if (!nextAt) return "No cooldown. Interactions can run now.";
    const ms = new Date(nextAt).getTime() - Date.now();
    if (ms <= 0) return "Cooldown window elapsed. New interactions can run.";
    const secs = Math.ceil(ms / 1000);
    return `Interaction cooldown active. Next close allowed in about ${secs}s.`;
  }, [simulation?.nextAllowedInteractionAt]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-night-100 md:text-4xl">
            AI Studio Room
          </h1>
          <p className="mt-2 font-body text-night-300">
            Live arena: 10 MIT-simulated agents negotiating offers and value exchange.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => act(simulation?.running ? "stop" : "start")}
            disabled={busy}
            className="rounded-xl bg-spark-500 px-4 py-2 font-body font-semibold text-night-950 hover:bg-spark-400 disabled:opacity-60"
          >
            {simulation?.running ? "Pause Simulation" : "Start Simulation"}
          </button>
          <button
            type="button"
            onClick={() => act("tick")}
            disabled={busy || !simulation?.running}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 font-body text-night-100 hover:border-spark-500 hover:text-spark-400 disabled:opacity-60"
          >
            Force Tick
          </button>
          <button
            type="button"
            onClick={() => act("reset")}
            disabled={busy}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 font-body text-night-100 hover:border-red-400 hover:text-red-300 disabled:opacity-60"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={loadData}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 font-body text-night-100 hover:border-spark-500 hover:text-spark-400"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <p className="font-body text-night-300">Loading simulation...</p>}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <p className="font-body text-sm text-red-300">{error}</p>
        </div>
      )}

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Agent Roster" value={String(agents.length)} />
        <MetricCard label="Active Agents" value={String(activeCount)} />
        <MetricCard label="Interactions" value={String(simulation?.totals.interactions ?? 0)} />
        <MetricCard label="Agreements" value={String(simulation?.totals.agreed ?? 0)} />
        <MetricCard
          label="Acceptance Rate"
          value={`${simulation?.totals.acceptanceRate ?? 0}%`}
        />
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="glass p-6">
          <h2 className="mb-2 font-display text-2xl font-semibold text-night-100">
            Live Arena
          </h2>
          <p className="mb-4 font-body text-sm text-night-300">
            Visual graph of exchange activity between agents.
          </p>

          <div
            className="relative mx-auto rounded-2xl border border-white/10 bg-gradient-to-br from-night-950 via-night-900 to-night-950"
            style={{ width: ARENA_SIZE, height: ARENA_SIZE, maxWidth: "100%" }}
          >
            <svg className="absolute inset-0 h-full w-full">
              {recentLinks.map((link) => {
                if (!link.from || !link.to) return null;
                const color =
                  link.status === "agreed"
                    ? "rgba(16, 185, 129, 0.7)"
                    : "rgba(245, 158, 11, 0.7)";
                return (
                  <line
                    key={link.id}
                    x1={link.from.x}
                    y1={link.from.y}
                    x2={link.to.x}
                    y2={link.to.y}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="6 6"
                  />
                );
              })}
            </svg>

            {arenaNodes.map((node) => (
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: node.x, top: node.y }}
              >
                <div className="rounded-xl border border-white/20 bg-black/50 px-2 py-1 text-center shadow-lg">
                  <p className="max-w-[130px] truncate font-body text-xs font-semibold text-night-100">
                    {node.name}
                  </p>
                  <p className="font-body text-[10px] text-spark-400">
                    score {node.influenceScore}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="font-body text-sm text-night-300">
              Rate Limit: {simulation?.maxClosedPerCooldown ?? 1} closed interaction every{" "}
              {simulation?.cooldownSeconds ?? 20} seconds.
            </p>
            <p className="font-body text-sm text-night-300">{cooldownText}</p>
            <p className="font-body text-xs text-night-400">
              Total overlap preventions recorded:{" "}
              {simulation?.totalScheduleOverlapPreventions ?? 0}
            </p>
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="mb-3 font-display text-2xl font-semibold text-night-100">
            Interaction Resolution Feed
          </h2>
          <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
            {(simulation?.interactions ?? []).length === 0 ? (
              <p className="font-body text-sm text-night-400">
                No interactions yet. Start simulation to generate the first exchange.
              </p>
            ) : (
              simulation?.interactions.slice(0, 25).map((i) => (
                <article
                  key={i.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-body text-xs text-night-400">
                      {new Date(i.timestamp).toLocaleString()}
                    </p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        i.status === "agreed"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {i.status}
                    </span>
                  </div>
                  <p className="font-body text-sm text-night-200">
                    <span className="font-semibold text-spark-400">{i.fromAgentId}</span> offered{" "}
                    <span className="font-semibold">{i.offer}</span>
                  </p>
                  <p className="font-body text-sm text-night-300">
                    Requested in exchange: {i.requestedSkill} (importance: {i.importance})
                  </p>
                  <p className="font-body text-xs text-night-400">
                    Closed at: {new Date(i.closesAt).toLocaleTimeString()}
                  </p>
                  <p className="mt-1 font-body text-sm text-night-200">{i.agreement}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 font-display text-2xl font-semibold text-night-100">
          Agent Strategy Board
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(simulation?.agents ?? []).map((a) => (
            <article key={a.id} className="glass p-5">
              <p className="font-display text-lg font-semibold text-night-100">{a.name}</p>
              <p className="mb-2 font-mono text-xs text-night-400">{a.id}</p>
              <p className="mb-2 font-body text-xs text-night-300">
                Last action: {a.lastAction}
              </p>
              <p className="font-body text-xs text-night-300">
                Offers: {a.offersMade} | Accepted: {a.offersAccepted} | Declined:{" "}
                {a.offersDeclined}
              </p>
              <p className="font-body text-xs text-night-300">
                Commitments: {a.commitmentsCount} | Overlap preventions: {a.overlapPreventions}
              </p>
              <p className="font-body text-xs text-night-300">
                Busy until: {a.busyUntil ? new Date(a.busyUntil).toLocaleTimeString() : "available"}
              </p>
              <p className="font-body text-xs text-spark-400">
                Influence score: {a.influenceScore}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-semibold text-night-100">
          Agreement Ledger
        </h2>
        <div className="glass overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wider text-night-400">
                  Time
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wider text-night-400">
                  Offer From
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wider text-night-400">
                  Offer To
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wider text-night-400">
                  Exchange
                </th>
                <th className="px-4 py-3 font-body text-xs uppercase tracking-wider text-night-400">
                  Resolution
                </th>
              </tr>
            </thead>
            <tbody>
              {(simulation?.interactions ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-4 font-body text-sm text-night-400" colSpan={5}>
                    No agreements yet.
                  </td>
                </tr>
              ) : (
                simulation?.interactions.map((i) => (
                  <tr key={i.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-body text-xs text-night-300">
                      {new Date(i.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-night-300">{i.fromAgentId}</td>
                    <td className="px-4 py-3 font-body text-xs text-night-300">{i.toAgentId}</td>
                    <td className="px-4 py-3 font-body text-xs text-night-300">{i.requestedSkill}</td>
                    <td className="px-4 py-3 font-body text-xs text-night-300">{i.agreement}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="glass p-5">
      <p className="font-body text-xs uppercase tracking-wider text-night-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-night-100">{value}</p>
    </article>
  );
}
