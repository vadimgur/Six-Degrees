import { NextRequest, NextResponse } from "next/server";
import { searchPeople } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const people = await searchPeople(q);
    const results = people.slice(0, 8).map((p) => ({
      id: p.id,
      name: p.name,
      profile_path: p.profile_path,
      popularity: p.popularity,
      known_for: p.known_for
        ?.slice(0, 2)
        .map((k) => k.title ?? k.name)
        .filter(Boolean)
        .join(", "),
    }));
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
