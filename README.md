<p align="center">
<img alt="JellyFlix" src="docs/banner.png"/>
</p>

<h3 align="center">A Netflix-style web client for <a href="https://jellyfin.org">Jellyfin</a></h3>

---

JellyFlix is a fork of [jellyfin-web](https://github.com/jellyfin/jellyfin-web) that makes Jellyfin look and feel like
Netflix: profiles with "Who's watching?", a home screen of poster rows, personalized recommendations, Netflix-style
title pages and a TV mode built for remote controls. Together with the
[JellyFlix plugin](https://github.com/yourmomsbasement/JellyFlix-Plugin) it is installed and kept up to date from the
Jellyfin dashboard. No files to copy and no server settings to change.

<p align="center">
<img alt="Home" src="docs/screenshots/home.jpg" width="49%"/>
<img alt="Title page" src="docs/screenshots/title.jpg" width="49%"/>
</p>

<sub>Screenshots use a test library with generated artwork; your own posters and backdrops show up here.</sub>

## Features

### Profiles

One sign-in, several profiles. Each profile keeps its own watch history, Continue Watching, Next Up, My List and
parental controls. Optional 4-digit PINs, kids profiles, and "Who's watching?" every time the app opens.

<p align="center"><img alt="Who's watching?" src="docs/screenshots/profiles.jpg" width="70%"/></p>

### Home

A full-bleed hero picked from your Top Picks, then rows of 2:3 posters: Continue Watching (with *Mark as watched* and
*Remove from Continue Watching*), Next Up, Top Picks, New on JellyFlix, My List, Top Rated, *Because you watched…*,
genres and Watch It Again.

### Title pages

Backdrop and title art, match percentage, Play/Resume that picks up the right episode, trailers, My List, thumbs up and
down, seasons and episodes, More Like This, cast and crew, and the file's video and audio details (container,
resolution, HDR format, audio and subtitle tracks, size and bitrate) with 4K / HDR / Dolby Vision / 5.1 / Atmos badges.

<p align="center"><img alt="Episodes" src="docs/screenshots/title-episodes.jpg" width="70%"/></p>

### TV mode

Jellyfin's TV apps (LG webOS, Samsung Tizen, Android TV…) load the web client from your server, so they get JellyFlix
too, with no app to rebuild. In TV layout the home and title pages are rebuilt for the remote: the focused title fills
the top of the screen, rows slide as you move, Left opens the side menu, Back steps back out, the Play key starts the
focused title, and LG's Magic Remote pointer works.

<p align="center">
<img alt="TV home" src="docs/screenshots/tv-home.jpg" width="49%"/>
<img alt="TV side menu" src="docs/screenshots/tv-menu.jpg" width="49%"/>
</p>
<p align="center"><img alt="TV title page" src="docs/screenshots/tv-title.jpg" width="70%"/></p>

### Dashboard

The admin dashboard uses the JellyFlix look, with a JellyFlix section for profiles, recommendations and web client
updates.

<p align="center">
<img alt="Dashboard" src="docs/screenshots/dashboard.jpg" width="49%"/>
<img alt="JellyFlix settings" src="docs/screenshots/dashboard-jellyflix.jpg" width="49%"/>
</p>

## Install

JellyFlix needs **Jellyfin 13** (the `unstable` builds).

1. In Jellyfin, open **Dashboard → Plugins → Repositories** and add
   `https://raw.githubusercontent.com/yourmomsbasement/JellyFlix-Plugin/main/manifest.json`.
2. Install **JellyFlix** from the catalog and restart Jellyfin.

That's all. The plugin downloads the newest JellyFlix web client built for your Jellyfin version, serves it in place of
the stock one, and keeps it up to date. See the [plugin's README](https://github.com/yourmomsbasement/JellyFlix-Plugin)
for details.

## Releases

Every push to `master` builds the client and publishes it as a `web-<date>.<run>` GitHub release with
`jellyflix-web.zip`, its SHA-256 and `release.json` (the Jellyfin version it targets). The plugin installs these.

## Build Process

### Dependencies

- [Node.js](https://nodejs.org/en/download) 24
- npm (included in Node.js)

### Getting Started

1. Clone or download this repository.

   ```sh
   git clone https://github.com/yourmomsbasement/JellyFlix-Web.git
   cd JellyFlix-Web
   ```

2. Install build dependencies in the project directory.

   ```sh
   npm install
   ```

3. Run the web client with webpack for local development.

   ```sh
   npm start
   ```

4. Build the client with sourcemaps available.

   ```sh
   npm run build:development
   ```

Where the code lives:

| Path | What |
| --- | --- |
| `src/apps/profiles` | "Who's watching?", profile editor, PIN entry |
| `src/apps/modern/features/home`, `routes/home.tsx` | Home rows and hero |
| `src/apps/modern/features/title`, `routes/title.tsx` | Title pages |
| `src/apps/tv` | TV mode: remote navigation, TV home and title pages |
| `src/apps/dashboard/features/jellyflix` | JellyFlix dashboard settings |
| `src/themes/jellyflix` | The JellyFlix theme |

JellyFlix builds on the work of the [Jellyfin project](https://jellyfin.org). Review Jellyfin's
[Contributing Guide](./CONTRIBUTING.md) for more on the tech stack.
