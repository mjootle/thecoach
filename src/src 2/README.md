# thecoach — U12 football drills

A drill book for U12 coaching. Browse drills by category, build sessions, mark favourites.

## Live version

https://mjootle.github.io/thecoach/

Served from `index.html` at the repo root — a single self-contained build with all
assets inlined, so it works offline once loaded. Add to Home Screen on iOS to use it
like an app.

## Layout

```
index.html                  built output — this is what GitHub Pages serves
src/
  U12 Drill Cards.dc.html   the app: all screens, layout, interaction
  drills.json               THE DATA — every category and drill (source of truth)
  drills.data.js            generated from drills.json; do not edit by hand
  support.js                runtime
  wake-lock.js              keeps the screen awake during a session
  i18n/                     translations (see i18n/README.md)
  _ds/modernist-.../        design system: tokens, stylesheet, components
```

## Interface text

No interface text is hard-coded in the app. Every string lives in `src/i18n/en.json`
and is looked up by key. `src/i18n/README.md` covers adding a language, plurals and
translated drill content.

## The data

`src/drills.json` is the only place drill content should be edited. Shape:

```
{
  "version": 1,
  "categories": [ { "id", "num", "title", "intro" }, ... ],
  ...
}
```

`drills.data.js` is a regenerated copy of the same JSON assigned to
`window.U12_DRILL_DATA`, because the page loads it with a plain `<script>` tag rather
than fetching it (so it works from `file://` too). If you change `drills.json`,
`drills.data.js` must be regenerated to match — otherwise the two drift and the app
shows stale content.

## Building for a native app

`drills.json` is the piece that carries over. A Capacitor or React Native build should
read that file directly and leave the HTML behind — the screens here are the design
reference, not the implementation. Note that Apple's guideline 4.2 tends to reject apps
that are only a website in a WebView, so a wrapper around `index.html` is a risk.

## Updating the hosted version

Replace `index.html` at the repo root and commit. GitHub Pages redeploys in a minute or
two; the URL does not change.
