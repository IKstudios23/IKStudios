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

  /* OPTION B — pull automatically from your Flickr (recommended,
     so the rolls show your real work at random):
       1. Free key: https://www.flickr.com/services/apps/create/apply
       2. Paste the key below and set enabled:true.
     Leave albumId "" to draw from your whole photostream, or paste
     a specific album id to draw only from that album. Photos are
     sampled at random from across your library (not just the newest). */

  flickr: {
    enabled: true,                                  // pull from Flickr
    apiKey: "6d66c782541b406e5d41dc62477d6520",      // your Flickr API key
    userUrl: "https://www.flickr.com/photos/vtkrrishblazephotography/",
    albumId: "",                                     // "" = whole photostream, or an album id
    count: 24                                        // photos to pull into the rolls
  }
};
