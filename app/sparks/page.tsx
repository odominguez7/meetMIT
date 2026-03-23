"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SparkCard } from "@/components/SparkCard";

type Spark = {
  id: string;
  sparkType: string;
  locationHint: string;
  durationMinutes: number;
  startsAt: string;
  matchScore: number | null;
  visibility?: string;
  creator?: { email?: string };
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "tonight", label: "Tonight" },
  { id: "study", label: "Study" },
  { id: "founder", label: "Founder" },
  { id: "low_energy", label: "Low-energy" },
  { id: "group_only", label: "Group-only" },
];

const STUDY_TYPES = ["study_sync", "homework_hack"];
const FOUNDER_TYPES = ["blitz_brainstorm"];
const LOW_ENERGY_TYPES = ["walk_wave", "recess_rush"];

function filterSparks(sparks: Spark[], activeFilter: string): Spark[] {
  if (activeFilter === "all") return sparks;
  const now = new Date();
  const tonightEnd = new Date(now);
  tonightEnd.setHours(23, 59, 59, 999);

  return sparks.filter((s) => {
    const startDate = new Date(s.startsAt);
    if (activeFilter === "tonight") {
      return startDate >= now && startDate <= tonightEnd;
    }
    if (activeFilter === "study") return STUDY_TYPES.includes(s.sparkType);
    if (activeFilter === "founder") return FOUNDER_TYPES.includes(s.sparkType);
    if (activeFilter === "low_energy")
      return LOW_ENERGY_TYPES.includes(s.sparkType);
    if (activeFilter === "group_only") return s.visibility === "group_only";
    return true;
  });
}

export default function SparksPage() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    async function fetchSparks() {
      try {
        const res = await fetch("/api/sparks/recommendations");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch");
        setSparks(data.sparks ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch sparks");
      } finally {
        setLoading(false);
      }
    }
    fetchSparks();
  }, []);

  const filteredSparks = filterSparks(sparks, activeFilter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 font-display text-3xl font-bold text-night-100 md:text-4xl">
        Sparks
      </h1>

      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`rounded-xl border px-4 py-2 font-body text-sm transition-colors ${
              activeFilter === f.id
                ? "border-spark-500 bg-spark-500/20 text-spark-400"
                : "border-white/10 bg-white/5 text-night-200 hover:border-white/20"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="font-body text-night-400">Loading sparks…</p>
      )}
      {error && (
        <div className="glass p-4">
          <p className="font-body text-red-400">{error}</p>
        </div>
      )}
      {!loading && !error && filteredSparks.length === 0 && (
        <motion.div
          className="glass p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="font-body text-night-300">
            No sparks yet. Be the first to create one!
          </p>
        </motion.div>
      )}
      {!loading && !error && filteredSparks.length > 0 && (
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.05 },
            },
          }}
        >
          {filteredSparks.map((spark) => (
            <motion.div
              key={spark.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <SparkCard
                id={spark.id}
                sparkType={spark.sparkType}
                locationHint={spark.locationHint}
                durationMinutes={spark.durationMinutes}
                startsAt={spark.startsAt}
                matchScore={spark.matchScore}
                creatorEmail={spark.creator?.email}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <button
        type="button"
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-spark-500 text-2xl text-night-950 shadow-lg transition-transform hover:scale-110"
        aria-label="Create a Spark"
      >
        +
      </button>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <motion.div
            className="glass max-w-md p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="mb-4 font-display text-xl font-semibold text-night-100">
              Create a Spark
            </h2>
            <p className="mb-4 font-body text-sm text-night-400">
              Spark creation is available via the API. A full form is in development.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="w-full rounded-xl bg-spark-500 py-3 font-body font-semibold text-night-950 hover:bg-spark-400"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
