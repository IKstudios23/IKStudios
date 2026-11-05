/* ============================================================
   IKSTUDIOS — SITE CONFIG
   This is the ONLY file you need to edit to make the site yours.
   Everything below is documented. Save the file and refresh.
   ============================================================ */

window.IK_CONFIG = {

  /* --------------------------------------------------------
     1) CONTACT FORM  →  where messages get sent
     --------------------------------------------------------
     A website cannot email you on its own, so it hands the
     message to a free form service that emails it to you.

     Web3Forms (no account): get a key at https://web3forms.com,
     enter the email you want messages sent to, then paste the
     Access Key below.                                            */

  contact: {
    provider: "web3forms",                            // "web3forms" or "formspree"
    accessKey: "fa46793d-f37f-497d-82bc-bc1d691d6f2d", // ← your Web3Forms key
    formspreeEndpoint: "",                             // OR a Formspree URL + set provider:"formspree"
    destinationEmail: "ikstudiosofficial@gmail.com",   // for reference (real target is set in the service)
    subject: "New message from IKstudios.com"
  },

  /* --------------------------------------------------------
     2) FILM-REEL PHOTOS  →  the moving rolls
     --------------------------------------------------------
     The home page has TWO rolls and the About / Contact pages
     each have one. They pull a RANDOM selection of photos and
     the two home rolls are given DIFFERENT pictures.

     Source order:  Flickr (if enabled) → the photos[] list
     below → stylised placeholder frames.

     photos[] is the local fallback (used if Flickr is off or
     unreachable). Drop files in assets/img/ and list them here. */

  photos: [
    "assets/img/reel-01.jpg",
    "assets/img/reel-02.jpg",
    "assets/img/reel-03.jpg"
  ],

  /* YouTube thumbnails for the Creator reel + home reel.
     They load live from your channel feed. As a backup (or if you
     want a specific set), list video IDs — the part after "v=" in a
     video URL:  { id: "dQw4w9WgXcQ", title: "My video" }          */
  youtubeChannelId: "UC5cV_3L83rugHA5MkGjJfqA",
  videos: [],

  /* Extra images for the home-page reel — Instagram posts, tweets, etc.
     Instagram/X don't allow a static site to pull these directly, so:
       social: ["assets/img/social/01.jpg", ...]  (screenshots/exports)
       instagramFeeds: ["https://feeds.behold.so/XXXX"]  (free Behold
       JSON feed URL — public, not a secret)                           */
  social: [],
  instagramFeeds: [],

  /* Tweets — they rotate one at a time in the Creator page's X card (arrows,
     dots, auto-advance) and also appear as cards in the reels. Paste post URLs,
     newest first, e.g. "https://x.com/_ikstudios_/status/1234567890".      */
  tweets: [
    "https://x.com/_ikstudios_/status/2114587701533872258",
    "https://x.com/_ikstudios_/status/2113480529937076508",
    "https://x.com/_ikstudios_/status/2113117564020601186",
    "https://x.com/_ikstudios_/status/2113059815148913118",
    "https://x.com/_ikstudios_/status/2112551859357683894",
    "https://x.com/_ikstudios_/status/2112396685414387841",
    "https://x.com/_ikstudios_/status/2112225029354066303",
    "https://x.com/_ikstudios_/status/2110212570988638317",
    "https://x.com/_ikstudios_/status/2109510399498313834"
  ],

  /* TikTok videos for the Creator page's TikTok card.
     They play ONE AT A TIME in the order listed: when a video finishes, the next
     one slides in from the right and plays; after the last one it loops back to
     the first. (Visitors press play on the first one; the rest follow on their own.)
     Any number works — more than 12 shows a "3 / 40" counter instead of dots.

     EASIEST WAY to fill this in (takes a minute):
       1. On a computer, open https://www.tiktok.com/@_ikstudios_ and scroll to the
          very bottom so every video has loaded.
       2. Open the browser console (Chrome: right-click → Inspect → Console tab),
          paste the line below, press Enter. (If it asks, type "allow pasting" first.)
            copy([...new Set([...document.querySelectorAll('a[href*="/video/"]')].map(a=>a.href.split('?')[0]))].map(u=>'    "'+u+'"').join(',\n'))
       3. That copies every video link, already formatted. Paste it between the
          [ ] below, save, upload. New videos later: repeat, or add one line.
     Each link looks like  "https://www.tiktok.com/@_ikstudios_/video/7123456789012345678"  */
  tiktokVideos: [
    "https://www.tiktok.com/@_ikstudios_/video/7699668860957396231",
    "https://www.tiktok.com/@_ikstudios_/video/7690972645176757512",
    "https://www.tiktok.com/@_ikstudios_/video/7678358829184158994",
    "https://www.tiktok.com/@_ikstudios_/video/7675417972738936082",
    "https://www.tiktok.com/@_ikstudios_/video/7642796658698259730",
    "https://www.tiktok.com/@_ikstudios_/video/7607638162327817479",
    "https://www.tiktok.com/@_ikstudios_/video/7606023419716488466"
  ],

  /* ACTOR tab.
     headshots → the tall scrolling reel on the Actor landing page (replace the
       files in assets/img/actor/ or add more to this list; any number works, they loop).
     reels     → the acting reels page. Each reel needs:
         title   shown on the blurred first frame ("Character (Where it's from) Monologue")
         src     the MP4 file in assets/video/ (keep each under 25 MB so GitHub's
                 web upload accepts it)
         poster  a still from the video's first frame (assets/img/actor/)
       They show in this order; viewers can play, pause and scrub each one.   */
  actor: {
    headshots: [
      "assets/img/actor/headshot-01.jpg", "assets/img/actor/headshot-02.jpg", "assets/img/actor/headshot-03.jpg",
      "assets/img/actor/headshot-04.jpg", "assets/img/actor/headshot-05.jpg", "assets/img/actor/headshot-06.jpg"
    ],
    reels: [
      { title: "Jesse (Before Sunrise) Monologue", src: "assets/video/jesse-before-sunrise-monologue.mp4", poster: "assets/img/actor/jesse-before-sunrise-monologue.jpg" },
      { title: "James (Adventureland) Monologue", src: "assets/video/james-adventureland-monologue.mp4", poster: "assets/img/actor/james-adventureland-monologue.jpg" }
    ]
  },

  /* OPTION B — pull automatically from your Flickr (recommended,
     so the rolls show your real work at random):
       1. Free key: https://www.flickr.com/services/apps/create/apply
       2. Paste the key below and set enabled:true.
     Leave albumId "" to draw from your whole photostream, or paste
     a specific album id to draw only from that album. Photos are
     sampled at random from across your library (not just the newest). */

  flickr: {
    enabled: true,                                  // pull from Flickr (live key first → key-less feed → local photos)
    apiKey: "6d66c782541b406e5d41dc62477d6520",      // your Flickr API key
    userUrl: "https://www.flickr.com/photos/vtkrrishblazephotography/",
    nsid: "198962785@N02",                           // your Flickr ID — lets the reels load the latest ~20 photos with NO key (backup)
    albumId: "",                                     // "" = whole photostream, or an album id
    count: 40                                        // photos pulled at random from your whole public photostream each time a page loads
  }
};
