import { NextRequest, NextResponse } from "next/server";

type AgentReply = {
  result: string;
  confidence: number;
  next_actions: string[];
};

const personaById: Record<string, { title: string; style: string }> = {
  "maya-rodriguez": {
    title: "Maya-Rodriguez",
    style: "GTM-first founder coach",
  },
  "leo-chen": {
    title: "Leo-Chen",
    style: "technical depth and systems rigor",
  },
  "ananya-patel": {
    title: "Ananya-Patel",
    style: "robotics clarity and ethics framing",
  },
  "sam-johnson": {
    title: "Sam-Johnson",
    style: "student-life navigation and momentum",
  },
  "noah-wong": {
    title: "Noah-Wong",
    style: "creative prototyping and storytelling",
  },
  "leila-el-sayed": {
    title: "Leila-El-Sayed",
    style: "wellness-aware reflective guidance",
  },
  "ethan-kim": {
    title: "Ethan-Kim",
    style: "cross-campus policy and impact translation",
  },
  "priya-mehta": {
    title: "Priya-Mehta",
    style: "theory-to-impact science communication",
  },
  "agent-vibemit": {
    title: "Agent-VibeMIT",
    style: "affinity ranking and match quality optimization",
  },
  "agent-syncmit": {
    title: "Agent-SyncMIT",
    style: "time-slot and location orchestration",
  },
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const persona = personaById[params.id];
  if (!persona) {
    return NextResponse.json({ error: "agent_not_found" }, { status: 404 });
  }

  let body: { task?: string; context?: Record<string, unknown> } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const task = (body.task ?? "").trim();
  if (!task) {
    return NextResponse.json({ error: "task_required" }, { status: 422 });
  }

  const contextKeys = Object.keys(body.context ?? {});
  const response: AgentReply = {
    result: `${persona.title} (${persona.style}) analyzed: "${task}".`,
    confidence: 0.87,
    next_actions: [
      "Clarify the success metric for this request.",
      "Pick one 30-minute action you can execute today.",
      contextKeys.length
        ? `Use provided context fields: ${contextKeys.join(", ")}`
        : "Provide optional context for higher-quality follow-up.",
    ],
  };

  return NextResponse.json(response, { status: 200 });
}
