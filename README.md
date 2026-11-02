# 🎬 ExtTorrent Web — Glass & Neumorphic Streaming Cinema

> A next-generation, Netflix-style web application for searching, discovering, and streaming torrents in real-time, featuring a hybrid **Glassmorphism + Neumorphism** design system with seamless **Day & Dark Mode**.

Powered by the live [Ext.to Hybrid API Gateway](https://ext-torrent-backend.onrender.com) and free metadata from Cinemeta and TVMaze.

---

## ✨ Key Features

### 💎 Hybrid Glassmorphism & Neumorphism Design
- **Dark Mode (Default):** Deep obsidian canvas (`#0a0c13`) with radiant aurora mesh gradients (electric indigo `#6366f1` and cyan glow `#06b6d4`), frosted glass panels with `backdrop-filter: blur(20px)`, and extruded dual-tone neumorphic shadows.
- **Day / Light Mode:** Soft porcelain clouds (`#f0f3f8`) with bright frosted glass, clean light-bounce bevels, and tactile neumorphic shadows.
- **Persistent Toggle:** Day/Dark mode switch saved in `localStorage` with smooth CSS transitions across all cards, modals, and navigation bars.

### 🎥 Netflix-Style Cinematic UX
- **Hero Billboard Banner:** High-definition featured blockbuster with dynamic backdrop, rating badge, year, genres, seeders meter, and instant action triggers.
- **Horizontal Carousel Shelves:** Smooth-scrolling Netflix rows with hover controls for:
  - 🔥 Trending Releases
  - 🎬 Blockbuster Movies
  - 📺 Binge-Worthy TV Series
  - ⚡ Latest Verified Uploads
  - 🎌 Anime & Animation
  - 🎮 PC Games & Repacks
- **Fluent Hover Cards:** Cards smoothly expand (`scale: 1.03`), illuminate with glowing neon borders, and reveal quick actions: *Stream*, *Details*, and *Copy Magnet*.

### ⚡ Instant Streaming & Player Options
- **In-App WebTor Streaming Theater:** Opens directly inside the app with the magnet link pre-encoded and pre-loaded:
  ```
  https://webtor.io/#action=load&magnet=<ENCODED_MAGNET>
  ```
  Zero manual copy-pasting required!
- **Multi-Player Selector:**
  - In-App WebTor Player with Theater Mode
  - TorrServer sequential HTTP stream
  - One-click launch in VLC Media Player (`vlc://<magnet>`)
  - Open in New Tab
  - Copy Magnet Link with instant visual toast feedback

### 🔍 Advanced Search & Discovery
- Real-time search across millions of torrents.
- Category filtering: All, Movies, TV Shows, Anime, Music, Games, Software, Books.
- Sort by: Most Seeders, Newest First, Largest Size, Smallest Size.
- Persistent Search History with 1-click query chips and clear options.

### 📱 Responsive for All Screen Sizes
- Desktop & Ultrawide (multi-column shelves and theater mode)
- Tablet & iPad (touch-friendly sliders and drawers)
- Mobile (compact cards, glass bottom bar, responsive drawer)

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 + Vite |
| **Icons** | Lucide React |
| **Styling** | Custom Glassmorphic + Neumorphic CSS System (Zero external CSS framework bloat) |
| **Metadata** | Cinemeta API + TVMaze API (Posters, Backdrops, IMDb Ratings, Synopsis, Trailers) |
| **Backend API Gateway** | Node.js / Express on Render (`https://ext-torrent-backend.onrender.com`) |
| **Torrent Sources** | Multi-source indexer (Apibay, Torrents-CSV, Ext.to) |
| **Streaming Engine** | WebTor.io (WebTorrent in-browser streaming) |

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/M0hitMehra/ext.torrent-web.git
cd ext.torrent-web
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Production Build
```bash
npm run build
```
Creates an optimized static bundle in the `dist/` directory ready for instant zero-configuration deployment to **Vercel**, **Netlify**, **Render**, or **GitHub Pages**.

---

## 🌐 Connected Live Backend API
The frontend connects directly to the production gateway:
- **Base URL:** `https://ext-torrent-backend.onrender.com`
- **Search Endpoint:** `GET /api/search?q=:query&page=1&sort=seeders`
- **Trending Endpoint:** `GET /api/trending?category=all`
- **Browse Endpoint:** `GET /api/browse?category=movies&page=1`
- **Detail Endpoint:** `GET /api/torrent/:id`

---

## 📄 License
MIT License. Built for educational and personal media organization purposes.
