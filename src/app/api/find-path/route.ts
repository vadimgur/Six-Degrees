import { NextRequest, NextResponse } from "next/server";
import { findPath, PathStep } from "@/lib/pathfinder";
import { getPersonExternalIds, getMovieExternalIds } from "@/lib/tmdb";

export const maxDuration = 60;

async function enrichWithImdbIds(path: PathStep[]): Promise<PathStep[]> {
  const enriched = await Promise.all(
    path.map(async (step) => {
      try {
        const imdbId =
          step.type === "actor"
            ? await getPersonExternalIds(step.id)
            : await getMovieExternalIds(step.id);
        return { ...step, imdbId };
      } catch {
        return { ...step, imdbId: null };
      }
    })
  );
  return enriched;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { actor1, actor2 } = body as {
      actor1: PathStep & { type: "actor" };
      actor2: PathStep & { type: "actor" };
    };

    if (!actor1?.id || !actor2?.id) {
      return NextResponse.json(
        { error: "actor1 and actor2 are required" },
        { status: 400 }
      );
    }

    const { path, timedOut } = await findPath(actor1, actor2);

    if (timedOut) {
      return NextResponse.json(
        {
          error:
            "Search timed out. These actors may be too obscure or unconnected. Try more popular actors.",
        },
        { status: 408 }
      );
    }

    if (!path) {
      return NextResponse.json(
        {
          error:
            "No connection found within 4 degrees. Try different actors.",
        },
        { status: 404 }
      );
    }

    const enrichedPath = await enrichWithImdbIds(path);

    return NextResponse.json({ path: enrichedPath });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("find-path error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
