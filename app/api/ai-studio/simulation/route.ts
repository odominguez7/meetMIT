import { NextRequest } from "next/server";
import { err, ok } from "@/lib/api";
import {
  getSimulationView,
  resetSimulation,
  setSimulationRunning,
  tickSimulation,
} from "@/lib/ai-simulation";

export async function GET() {
  try {
    const state = await getSimulationView();
    return ok(state);
  } catch {
    return err("Internal error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { action?: string };
    const action = body.action ?? "";

    if (action === "start") return ok(await setSimulationRunning(true));
    if (action === "stop") return ok(await setSimulationRunning(false));
    if (action === "tick") return ok(await tickSimulation());
    if (action === "reset") return ok(await resetSimulation());

    return err("invalid_action", 422);
  } catch {
    return err("Internal error", 500);
  }
}
