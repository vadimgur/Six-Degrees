"use client";

import { useState } from "react";
import ActorSearch, { ActorResult } from "@/components/ActorSearch";
import PathGraph from "@/components/PathGraph";
import type { PathStep } from "@/lib/pathfinder";

type Status = "idle" | "searching" | "found" | "not_found" | "error";

const EXAMPLE_PAIRS = [
  ["Tom Hanks", "Meryl Streep"],
  ["Leonardo DiCaprio", "Cate Blanchett"],
  ["Brad Pitt", "Jennifer Aniston"],
];

export default function Home() {
  const [actor1, setActor1] = useState<ActorResult | null>(null);
  const [actor2, setActor2] = useState<ActorResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [path, setPath] = useState<PathStep[] | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFind() {
    if (!actor1 || !actor2) return;
    setStatus("searching");
    setPath(null);
    setErrorMsg("");

    const payload = {
      actor1: {
        type: "actor" as const,
        id: actor1.id,
        name: actor1.name,
        imagePath: actor1.profile_path,
      },
      actor2: {
        type: "actor" as const,
        id: actor2.id,
        name: actor2.name,
        imagePath: actor2.profile_path,
      },
    };

    try {
      const res = await fetch("/api/find-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }

      setPath(data.path);
      setStatus("found");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  function handleReset() {
    setActor1(null);
    setActor2(null);
    setPath(null);
    setStatus("idle");
    setErrorMsg("");
  }

  const canSearch = actor1 !== null && actor2 !== null && actor1.id !== actor2.id;
  const isSearching = status === "searching";

  return (
    <main className="min-h-screen bg-cinema-dark">
      {/* Header */}
      <header className="border-b border-cinema-border bg-cinema-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Six Degrees
              </h1>
              <p className="text-xs text-cinema-muted">
                Movie actor connections
              </p>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cinema-muted hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            How connected are they?
          </h2>
          <p className="text-cinema-muted text-lg max-w-xl mx-auto">
            Find the shortest path between any two actors through shared movie
            appearances. Inspired by{" "}
            <span className="text-slate-300">Six Degrees of Kevin Bacon</span>.
          </p>
        </div>

        {/* Search panel */}
        <div className="bg-cinema-card rounded-2xl border border-cinema-border p-6 shadow-2xl shadow-black/50 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <ActorSearch
              label="Actor 1"
              placeholder="e.g. Tom Hanks"
              selected={actor1}
              onSelect={setActor1}
            />

            {/* Swap icon */}
            <div className="sm:hidden flex items-center justify-center">
              <div className="text-cinema-muted text-2xl">↕</div>
            </div>

            <ActorSearch
              label="Actor 2"
              placeholder="e.g. Meryl Streep"
              selected={actor2}
              onSelect={setActor2}
            />
          </div>

          {/* Divider with swap visual on desktop */}
          <div className="hidden sm:flex items-center justify-center -mt-8 mb-4 pointer-events-none">
            <span className="text-cinema-border text-3xl">⟷</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleFind}
              disabled={!canSearch || isSearching}
              className="flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all
                bg-cinema-gold text-black hover:bg-amber-400
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-cinema-gold
                flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <span>✦</span> Find Connection
                </>
              )}
            </button>

            {status !== "idle" && (
              <button
                onClick={handleReset}
                className="py-3 px-5 rounded-xl border border-cinema-border text-cinema-muted hover:text-white hover:border-cinema-muted transition-colors text-sm"
              >
                Reset
              </button>
            )}
          </div>

          {/* Hint text */}
          {!actor1 && !actor2 && (
            <p className="text-center text-xs text-cinema-muted mt-3">
              Try:{" "}
              {EXAMPLE_PAIRS.map((pair, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  <span className="text-slate-400">
                    {pair[0]} & {pair[1]}
                  </span>
                </span>
              ))}
            </p>
          )}
        </div>

        {/* Loading state */}
        {isSearching && (
          <div className="bg-cinema-card rounded-2xl border border-cinema-border p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-6 h-6 border-2 border-cinema-border border-t-cinema-gold rounded-full animate-spin" />
              <span className="text-white font-semibold">
                Searching the movie graph...
              </span>
            </div>
            <p className="text-cinema-muted text-sm">
              Running bidirectional BFS across movie credits. This may take up
              to 30 seconds for obscure actors.
            </p>
            {/* Shimmer placeholder */}
            <div className="mt-6 flex items-center justify-center gap-4 overflow-hidden">
              {[80, 72, 80, 72, 80].map((w, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2"
                >
                  {i % 2 === 0 ? (
                    <div
                      className="rounded-full shimmer"
                      style={{ width: w, height: w }}
                    />
                  ) : (
                    <div
                      className="rounded-lg shimmer"
                      style={{ width: 72, height: 108 }}
                    />
                  )}
                  <div className="w-16 h-3 rounded shimmer" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result: found */}
        {status === "found" && path && (
          <div className="bg-cinema-card rounded-2xl border border-cinema-border p-6 shadow-2xl">
            <PathGraph path={path} />
          </div>
        )}

        {/* Result: error / not found */}
        {(status === "error" || status === "not_found") && (
          <div className="bg-cinema-card rounded-2xl border border-red-900/40 p-6 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-white font-semibold mb-1">
              {status === "not_found"
                ? "No connection found"
                : "Something went wrong"}
            </p>
            <p className="text-cinema-muted text-sm">{errorMsg}</p>
          </div>
        )}

        {/* How it works */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "🔍",
              title: "Search actors",
              desc: "Type any actor's name and select from the results.",
            },
            {
              icon: "🧠",
              title: "Bidirectional BFS",
              desc: "Searches the movie graph from both sides simultaneously to find the shortest path.",
            },
            {
              icon: "🎞️",
              title: "Visual path",
              desc: "See the connection as a graph with actor photos and movie posters.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-cinema-card/50 rounded-xl border border-cinema-border p-4"
            >
              <p className="text-2xl mb-2">{icon}</p>
              <p className="font-semibold text-white text-sm mb-1">{title}</p>
              <p className="text-cinema-muted text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <footer className="mt-12 text-center text-cinema-muted text-xs">
          Movie data provided by{" "}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors underline underline-offset-2"
          >
            The Movie Database (TMDB)
          </a>
          . This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </footer>
      </div>
    </main>
  );
}
