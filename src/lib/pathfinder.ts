import { getPersonMovies, getMovieCredits } from "./tmdb";

export type PathStep =
  | { type: "actor"; id: number; name: string; imagePath: string | null }
  | { type: "movie"; id: number; name: string; imagePath: string | null };

// How many top movies to consider per actor (by popularity)
const MAX_MOVIES_PER_ACTOR = 6;
// How many top cast members to consider per movie
const MAX_CAST_PER_MOVIE = 15;
// Concurrent TMDB requests per batch
const CONCURRENCY = 5;
// Max degrees to search
const MAX_DEGREES = 4;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function pMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + concurrency < items.length) {
      await sleep(250); // Stay within TMDB rate limit
    }
  }
  return results;
}

interface SearchState {
  // actor id → full path from source actor to this actor (inclusive on both ends)
  actorPaths: Map<number, PathStep[]>;
  // movie id → full path from source actor to this movie (movie is last element)
  moviePaths: Map<number, PathStep[]>;
}

/**
 * Expand one BFS level: for each actor in the frontier, fetch their top movies,
 * then fetch each movie's cast. Adds newly discovered actors to state and returns
 * their IDs as the next frontier.
 */
async function expandLevel(
  frontier: number[],
  state: SearchState,
  signal: AbortSignal
): Promise<number[]> {
  if (signal.aborted) return [];

  // Fetch movies for all frontier actors in parallel
  const actorMovieResults = await pMap(
    frontier,
    async (actorId) => {
      const movies = await getPersonMovies(actorId);
      // Filter low-popularity / already-seen movies and take top N
      const top = movies
        .filter((m) => m.vote_count > 50 && !state.moviePaths.has(m.id))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, MAX_MOVIES_PER_ACTOR);
      return { actorId, movies: top };
    },
    CONCURRENCY
  );

  // Collect new movies that we haven't visited yet
  const newMovies: Array<{ movieId: number; movieStep: PathStep }> = [];
  for (const { actorId, movies } of actorMovieResults) {
    const actorPath = state.actorPaths.get(actorId)!;
    for (const movie of movies) {
      if (state.moviePaths.has(movie.id)) continue;
      const movieStep: PathStep = {
        type: "movie",
        id: movie.id,
        name: movie.title,
        imagePath: movie.poster_path,
      };
      state.moviePaths.set(movie.id, [...actorPath, movieStep]);
      newMovies.push({ movieId: movie.id, movieStep });
    }
  }

  if (signal.aborted || newMovies.length === 0) return [];

  // Fetch cast for all new movies in parallel
  const castResults = await pMap(
    newMovies,
    async ({ movieId }) => {
      const cast = await getMovieCredits(movieId);
      return { movieId, cast: cast.slice(0, MAX_CAST_PER_MOVIE) };
    },
    CONCURRENCY
  );

  const nextFrontier: number[] = [];
  for (const { movieId, cast } of castResults) {
    const moviePath = state.moviePaths.get(movieId)!;
    for (const member of cast) {
      if (state.actorPaths.has(member.id)) continue;
      const actorStep: PathStep = {
        type: "actor",
        id: member.id,
        name: member.name,
        imagePath: member.profile_path,
      };
      state.actorPaths.set(member.id, [...moviePath, actorStep]);
      nextFrontier.push(member.id);
    }
  }

  return nextFrontier;
}

/**
 * Build the combined path when bidirectional BFS frontiers meet at an actor.
 *
 * fwdPath:  [actor1, ..., meetActor]  (left → meeting)
 * bwdPath:  [actor2, ..., meetActor]  (right → meeting)
 * result:   [actor1, ..., meetActor, ..., actor2]
 */
function joinAtActor(fwdPath: PathStep[], bwdPath: PathStep[]): PathStep[] {
  // bwdPath goes from actor2 to meetActor; reverse (minus the last element = meetActor)
  return [...fwdPath, ...bwdPath.slice(0, -1).reverse()];
}

/**
 * Build the combined path when both sides reach the same movie.
 *
 * fwdPath:  [actor1, ..., sharedMovie]  (movie is last)
 * bwdPath:  [actor2, ..., sharedMovie]  (movie is last)
 * result:   [actor1, ..., sharedMovie, ..., actor2]
 */
function joinAtMovie(fwdPath: PathStep[], bwdPath: PathStep[]): PathStep[] {
  // Drop the duplicate movie from bwdPath, reverse, append
  return [...fwdPath, ...bwdPath.slice(0, -1).reverse()];
}

function checkIntersection(
  fwd: SearchState,
  bwd: SearchState
): PathStep[] | null {
  // Check shared actors
  for (const [actorId, fwdPath] of fwd.actorPaths) {
    if (bwd.actorPaths.has(actorId)) {
      return joinAtActor(fwdPath, bwd.actorPaths.get(actorId)!);
    }
  }
  // Check shared movies
  for (const [movieId, fwdPath] of fwd.moviePaths) {
    if (bwd.moviePaths.has(movieId)) {
      return joinAtMovie(fwdPath, bwd.moviePaths.get(movieId)!);
    }
  }
  return null;
}

export async function findPath(
  actor1: PathStep & { type: "actor" },
  actor2: PathStep & { type: "actor" },
  timeoutMs = 45_000
): Promise<{ path: PathStep[] | null; timedOut: boolean }> {
  if (actor1.id === actor2.id) {
    return { path: [actor1], timedOut: false };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const fwd: SearchState = {
    actorPaths: new Map([[actor1.id, [actor1]]]),
    moviePaths: new Map(),
  };
  const bwd: SearchState = {
    actorPaths: new Map([[actor2.id, [actor2]]]),
    moviePaths: new Map(),
  };

  let fwdFrontier = [actor1.id];
  let bwdFrontier = [actor2.id];

  try {
    for (let depth = 0; depth < MAX_DEGREES; depth++) {
      if (controller.signal.aborted) break;

      // Expand forward one level
      fwdFrontier = await expandLevel(fwdFrontier, fwd, controller.signal);

      const hit1 = checkIntersection(fwd, bwd);
      if (hit1) return { path: hit1, timedOut: false };

      if (controller.signal.aborted) break;

      // Expand backward one level
      bwdFrontier = await expandLevel(bwdFrontier, bwd, controller.signal);

      const hit2 = checkIntersection(fwd, bwd);
      if (hit2) return { path: hit2, timedOut: false };

      if (fwdFrontier.length === 0 && bwdFrontier.length === 0) break;
    }
  } finally {
    clearTimeout(timer);
  }

  return { path: null, timedOut: controller.signal.aborted };
}
