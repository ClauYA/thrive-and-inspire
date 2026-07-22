// Fetch a demo GIF for an exercise by name, via our server proxy (which holds
// the Giphy key server-side — see GET /api/exercise-gif). Returns a GIF URL or
// null. When the server has no key (or nothing matches), the video modal falls
// back to a YouTube "how to <exercise>" search.
export async function fetchExerciseGif(name) {
  if (!name) return null;
  try {
    const res = await fetch(`/api/exercise-gif?name=${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.gif ? data.gif : null;
  } catch {
    return null;
  }
}
