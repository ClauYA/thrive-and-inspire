// Fetch a demo GIF for an exercise by name (Giphy). Returns a GIF URL or null.
//
// Env-gated on VITE_GIPHY_KEY — without a key it returns null and the video
// modal falls back to the YouTube search embed. Create a free key at
// https://developers.giphy.com. The key is public (client-side, rate-limited).
export async function fetchExerciseGif(name, key = import.meta.env.VITE_GIPHY_KEY) {
  if (!key || !name) return null;
  try {
    const q = encodeURIComponent(`${name} exercise`);
    const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${q}&limit=1&rating=g&lang=en`);
    if (!res.ok) return null;
    const data = await res.json();
    const g = data && data.data && data.data[0];
    return (g && (g.images?.downsized_medium?.url || g.images?.original?.url)) || null;
  } catch {
    return null;
  }
}
