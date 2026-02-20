"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { IMAGE_BASE } from "@/lib/tmdb";

export interface ActorResult {
  id: number;
  name: string;
  profile_path: string | null;
  popularity: number;
  known_for?: string;
}

interface ActorSearchProps {
  label: string;
  placeholder?: string;
  selected: ActorResult | null;
  onSelect: (actor: ActorResult) => void;
}

export default function ActorSearch({
  label,
  placeholder = "Search for an actor...",
  selected,
  onSelect,
}: ActorSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ActorResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/search-actor?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(actor: ActorResult) {
    onSelect(actor);
    setQuery("");
    setIsOpen(false);
    setResults([]);
  }

  function handleClear() {
    onSelect(null as unknown as ActorResult);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <p className="text-xs font-semibold uppercase tracking-widest text-cinema-muted mb-2">
        {label}
      </p>

      {selected ? (
        /* Selected actor card */
        <div className="flex items-center gap-3 p-3 rounded-xl bg-cinema-card border border-cinema-gold/40 shadow-lg shadow-cinema-gold/5">
          <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-cinema-gold/50">
            {selected.profile_path ? (
              <Image
                src={`${IMAGE_BASE}/w185${selected.profile_path}`}
                alt={selected.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full bg-cinema-border flex items-center justify-center text-cinema-muted text-xl">
                🎭
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{selected.name}</p>
            {selected.known_for && (
              <p className="text-xs text-cinema-muted truncate">
                {selected.known_for}
              </p>
            )}
          </div>
          <button
            onClick={handleClear}
            className="flex-shrink-0 w-7 h-7 rounded-full bg-cinema-border hover:bg-red-900/50 flex items-center justify-center text-cinema-muted hover:text-red-400 transition-colors"
            aria-label="Clear selection"
          >
            ✕
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-10 rounded-xl bg-cinema-card border border-cinema-border text-white placeholder-cinema-muted focus:outline-none focus:border-cinema-gold/60 focus:ring-1 focus:ring-cinema-gold/30 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cinema-muted">
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-cinema-muted border-t-cinema-gold rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && results.length > 0 && !selected && (
        <div className="absolute z-50 w-full mt-1 rounded-xl bg-cinema-card border border-cinema-border shadow-2xl overflow-hidden">
          {results.map((actor) => (
            <button
              key={actor.id}
              onClick={() => handleSelect(actor)}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-cinema-border transition-colors text-left border-b border-cinema-border/50 last:border-0"
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-cinema-border">
                {actor.profile_path ? (
                  <Image
                    src={`${IMAGE_BASE}/w185${actor.profile_path}`}
                    alt={actor.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cinema-muted">
                    🎭
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{actor.name}</p>
                {actor.known_for && (
                  <p className="text-xs text-cinema-muted truncate">
                    {actor.known_for}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 rounded-xl bg-cinema-card border border-cinema-border shadow-2xl px-4 py-3 text-cinema-muted text-sm">
          No actors found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
