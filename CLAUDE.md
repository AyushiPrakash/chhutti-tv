# Saturday Morning TV

A nostalgic Indian living room photo with a working CRT TV. A photo of a real remote controls it, and real cartoons play from YouTube.

## Run
- `npm run dev`, then open http://localhost:3000
- Without Node: `python3 serve.py` (same port, and it tells the browser never to cache, so edits always show).
- YouTube only plays when the page is served over http(s). Opening index.html directly from disk shows only static.
- No build step. Plain HTML, CSS and JS, so edits show on refresh. When you replace an image or file, bump the `?v=` number on its link in index.html so cached copies are dropped.

## Files
- `index.html`: markup. The `.stage` holds the room photo at its natural size (2752 x 1536) with the screen, doily and TV power button placed in photo pixels.
- `style.css`: all styling, including CRT effects (scanlines, roll bar, vignette, glare, power on/off animations) and the remote's position.
- `channels.js`: the channel list (YouTube ids and titles). Edit this to add or remove shows.
- `app.js`: behaviour.
  - `QUAD` holds the four screen corners in photo pixels (TL, TR, BL, BR). `fit()` scales the stage to cover the window and warps a 640x480 screen box onto the glass with `matrix3d`.
  - The YouTube IFrame API player, "live TV" offset (it joins each video partway through), static and sound effects made in the browser with Web Audio.
  - `ACTIONS` maps remote buttons (`data-act` on `.rk` hotspots in index.html) to behaviour. Two-digit channel entry works like a real TV.
- `assets/room.jpg`: the room. `assets/doily.png`: the crochet doily cut out so it sits in front of the video. `assets/remote.png`: the remote, cut out.

## Conventions
- The owner prefers no em dashes in any copy.
- Never show the show name on screen. The on-screen display shows "CH 07" style numbers and the volume bar. Empty channels (null entries in channels.js, or numbers past the list) show static with a steady green "NO SIGNAL".
- Remote hotspot positions are percentages of the remote image. If the remote image changes, recompute them.
- Before adding or swapping a channel video, check three things: it plays embedded (no error 150/101), its YouTube storyboard frames show the right show from start to end (not a slideshow, mirrored anti-copyright edit, or another show), and the channel walk test passes (right video on screen, sound only from the shown channel).
- Hidden preload players are moved off the glass with a transform, never hidden with opacity or visibility: the curved-glass SVG filter ignores opacity on iframes, and browsers pause hidden videos.

## Deploying
Drag this folder onto the site's Deploys page in Netlify (site: sweet-mochi-d4aeed).
