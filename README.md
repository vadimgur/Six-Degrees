# Six Degrees

Find the shortest connection between any two movie actors — inspired by the "Six Degrees of Kevin Bacon" concept.

## How it works

The app finds the shortest path between two actors through shared movie appearances:

> Actor A → Movie X → Actor C → Movie Y → Actor B

This is a **2-degree** connection (2 intermediate movies, 1 intermediate actor).

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **TMDB API** for actor/movie data and images
- **Bidirectional BFS** for efficient shortest-path finding
- **Tailwind CSS** for styling

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Get a free API key from [The Movie Database](https://www.themoviedb.org/settings/api)
4. Create `.env.local`:
   ```
   TMDB_API_KEY=your_api_key_here
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000)

## Algorithm

Uses **bidirectional BFS** on the actor-movie bipartite graph:
- Expands from both actors simultaneously
- Explores top movies by popularity (limiting branching factor)
- Detects when the two search frontiers meet
- Reconstructs the shortest path

This is significantly faster than one-directional BFS, especially for longer paths.

## Data Source

All actor/movie data comes from [The Movie Database (TMDB)](https://www.themoviedb.org/). TMDB is not affiliated with IMDB but contains comprehensive movie/actor data including images.
