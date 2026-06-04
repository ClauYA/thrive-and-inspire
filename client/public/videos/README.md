# Background videos

Drop the final-CTA background video here as:

    final-cta.mp4

It's used by `client/src/components/FinalCta.jsx` (the "Your future self is
waiting" section) as a looping, muted background.

## Tips for a good background video
- **Format:** MP4 (H.264) for broad browser support.
- **Length:** 8–20 seconds, seamless loop.
- **Resolution:** 1920×1080 is plenty; 1280×720 keeps the file lighter.
- **File size:** aim for under ~5 MB so the page stays fast. Compress if needed.
- **No audio needed** — it plays muted.

Until the file is added, the section gracefully falls back to the poster image
(`/images/story-bg.jpg`) over the dark background.
