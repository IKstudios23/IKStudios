# IKstudios — website

Minimalist, cinematic portfolio for **Ishan Kapoor / IKstudios**.
Black `#000000` · blue `#0084ff` · purple `#543ad6`. Pure HTML / CSS / JS —
no build step, no framework. Upload the folder to GitHub Pages (or any host).

```
index.html         Home — logo, tagline, moving 70mm film reels
about.html         Photography — bio, specialties, services
creator.html       Creator — YouTube, TikTok, Instagram ×2, X cards
actor.html         Actor — headshot reel + Voice / Acting demo-reel triangles
voice-reel.html    Voice demo reels (custom audio player)
acting-reel.html   Acting demo reels
contact.html       Contact form
assets/
  css/styles.css   all styling
  js/config.js     ⭐ the file you edit (see below)
  js/drift.js      moves the film reels (runs on phones even with Reduce Motion on) and powers wheel / drag / swipe browsing on every reel except the home page
  img/             logos, photos, actor/ (headshots + reel posters)
  audio/           the voice-reel MP3s
  video/           the acting-reel MP4s
```

## What to edit — `assets/js/config.js`

| Setting | What it does |
|---|---|
| `contact` | Web3Forms key + destination for the contact form |
| `flickr` | Reels pull random photos live from your Flickr (API → public feed → built-in snapshot) |
| `youtubeChannelId` | Reels + Creator page show your latest YouTube thumbnails (3 streams + 5 uploads) |
| `tweets` | Tweet URLs. They swap every 4 seconds in the Creator X card until a visitor clicks, then it's manual. They also appear in the reels |
| `tiktokVideos` | TikTok video URLs. One at a time in the Creator TikTok card, swapping every 4 seconds until a visitor clicks an arrow or plays a video (then manual; a finished video moves on to the next). The comment in the file has a one-paste way to collect them |
| `actor.reels` | The acting reels page: `title` (shown on the blurred first frame), `src` (MP4 in `assets/video/`) and `poster` (first-frame still in `assets/img/actor/`). Viewers can play, pause and scrub. Keep each MP4 under 25 MB (720p, H.264) so GitHub's web upload accepts it |
| `instagramFeeds` | Optional Behold.so feed URLs, to put Instagram posts in the reels |
| `actor.headshots` | The headshot reel on the Actor page. It drifts on its own and visitors can scroll the mouse wheel, drag, or swipe it (files live in `assets/img/actor/`; photos are 2:3 portraits, ~1000×1500) |

## Browsing the reels

Every film reel except the home page's background reels can be browsed: mouse wheel, click-and-drag,
finger swipe (with a little momentum) and the arrow keys. When the visitor lets go, the reel eases
back into its slow drift on its own. A small "Scroll or drag" / "Swipe" pill fades in over each reel
the first time, then goes away once they use it (and for the rest of that visit). On a wide screen the
tall reel on the Creator and Actor pages takes the mouse wheel while the cursor is over it; on the
horizontal bands only sideways gestures (or Shift + wheel) move the reel, so normal page scrolling still works.
The home page shows "Scroll · Next: Photography ↓" under the logo, and clicking it goes to the Photography page.

## Voice reels

The page list and waveforms live in `assets/js/voice-data.js` (generated from the audio files,
including the waveform shape), so to add, replace or reorder a reel, send the new audio and
it needs regenerating. Every reel has 1 second of silence at the start so the first word never gets clipped. Keep only the MP3s you still use in `assets/audio/`.

## Notes

- The Flickr key and Web3Forms key sit in `config.js` and are visible to anyone who views the site.
  Web3Forms keys are meant to be public; rotate the Flickr key if GitHub flags it.
- YouTube, X and TikTok embeds only work on the live (https) site, not when the page is opened as a local file.
- Logo files: `logo.png` (wide, hero/footer) and `logo-mark.png` (small, header).
