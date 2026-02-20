const BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE = "https://image.tmdb.org/t/p";

async function tmdbFetch(path: string) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not set");
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${path}${sep}api_key=${apiKey}`;
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`TMDB error ${res.status}: ${path}`);
  return res.json();
}

export function getImageUrl(
  path: string | null,
  size: "w185" | "w342" | "w500" = "w342"
): string {
  if (!path) return "";
  return `${IMAGE_BASE}/${size}${path}`;
}

export interface TMDBPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for?: Array<{ title?: string; name?: string; media_type?: string }>;
}

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  popularity: number;
  release_date: string;
  vote_count: number;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  profile_path: string | null;
  character: string;
  order: number;
}

export async function searchPeople(query: string): Promise<TMDBPerson[]> {
  const data = await tmdbFetch(
    `/search/person?query=${encodeURIComponent(query)}&language=en-US&page=1`
  );
  return (data.results ?? []).filter(
    (p: TMDBPerson) => p.known_for_department === "Acting"
  );
}

export async function getPersonMovies(personId: number): Promise<TMDBMovie[]> {
  const data = await tmdbFetch(
    `/person/${personId}/movie_credits?language=en-US`
  );
  return data.cast ?? [];
}

export async function getMovieCredits(
  movieId: number
): Promise<TMDBCastMember[]> {
  const data = await tmdbFetch(`/movie/${movieId}/credits?language=en-US`);
  return data.cast ?? [];
}

export async function getPersonExternalIds(
  personId: number
): Promise<string | null> {
  const data = await tmdbFetch(`/person/${personId}/external_ids`);
  return data.imdb_id ?? null;
}

export async function getMovieExternalIds(
  movieId: number
): Promise<string | null> {
  const data = await tmdbFetch(`/movie/${movieId}?language=en-US`);
  return data.imdb_id ?? null;
}
