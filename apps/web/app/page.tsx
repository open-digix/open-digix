import { connection } from "next/server";
import { Suspense } from "react";

type Health = { status: string; database: string };

async function getHealth(): Promise<Health | null> {
  try {
    const response = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://localhost:3001"}/health`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    return (await response.json()) as Health;
  } catch {
    return null;
  }
}

async function HealthStatus() {
  await connection();
  const health = await getHealth();

  return (
    <p role="status">
      {health?.status === "ok" && health.database === "ok"
        ? "API and database: connected"
        : "API or database: unavailable"}
    </p>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-8">
      <h1 className="text-4xl font-semibold">DigiX</h1>
      <p>Environment smoke test: Web → API → PostgreSQL</p>
      <Suspense fallback={<p role="status">Checking API and database…</p>}>
        <HealthStatus />
      </Suspense>
    </main>
  );
}
