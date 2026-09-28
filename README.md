<div align="center">

# ✦ OBSIDIAN DETAIL CO. ✦
### High-Performance Night-Shift Auto Detailing Studio

[![Vite](https://img.shields.io/badge/Vite-7.3.6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r182-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![GSAP](https://img.shields.io/badge/GSAP-3.14-88CE02?style=for-the-badge&logo=greensock&logoColor=white)](https://greensock.com/gsap/)
[![Anime.js](https://img.shields.io/badge/Anime.js-v4-FF4B4B?style=for-the-badge)](https://animejs.com/)
[![License](https://img.shields.io/badge/License-MIT-acid?style=for-the-badge&color=c8ff2e&labelColor=090a0c)](LICENSE)

*An ultra-luxury, dark-aesthetic automotive detailing experience crafted with kinetic particle physics, scroll-scrubbed process architecture, and an interactive real-time 3D vehicle studio.*

</div>

---

## ⚡ Highlights & Key Features

- **Cinematic Diagnostic Preloader & Cross-Dissolve**  
  High-energy diagnostic telemetry sequence with a real-time laser-welded hexagonal HUD. Smoothly transitions into the landing page via an optical cross-dissolve with zero scrollbar jump or layout hitching.
- **Interactive 3D Studio ([Three.js](https://threejs.org/))**  
  Real-time WebGL vehicle customizer featuring customizable paint swatches (*Obsidian Black, Ceramic White, Satin Gunmetal, Acid Neon, Liquid Bronze, Deep Sapphire*), finish shaders (*Gloss, Matte, Wet Ceramic Armor*), an interactive iron-decontamination slider, and orbit controls. Isolated in a lazy-loaded chunk for lightning-fast initial page loads.
- **Kinetic Hero Canvas**  
  High-framerate 600-particle physics grid featuring cursor repulsion, organic ambient breathing, and scroll-driven deconstruction, optimized for sub-millisecond per-frame render times.
- **Scroll-Scrubbed 4-Pass Process ([GSAP](https://greensock.com/gsap/) + ScrollTrigger)**  
  Pinned process breakdown walking the user through every stage of paint correction (*01 Active Foam & Decon → 02 Surface Iron Dissolution → 03 Multi-Stage Polish → 04 Ceramic Armor Curing*). Includes keyboard-accessible tab switches.
- **Before / After Paint Defect Comparator**  
  Interactive dual-layer canvas comparison slider with drag controls, keyboard navigation (Arrow keys, Home, End, PageUp/Down), and sample defect switcher.
- **Instant Service & Pricing Planner**  
  Dynamic quote generator that adapts instantly based on vehicle tier (Coupe, Sedan, SUV/Truck) and custom package add-ons with animated spring pricing.
- **Seamless Booking Pipeline**  
  Streamlined reservation form with client-side date boundary enforcement, phone/email validation, and animated confirmation feedback.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Tooling & Bundler** | [Vite 7](https://vitejs.dev/) | Ultra-fast HMR, manual chunk splitting (`three`, `gsap`, `animejs`) |
| **Core Architecture** | Vanilla ES Modules (No Framework) | Zero runtime overhead, clean browser-native performance |
| **3D Rendering** | [Three.js r182](https://threejs.org/) | Procedural sports car model, custom PBR clearcoat shaders, orbit controls |
| **Pinned Motion** | [GSAP 3.14](https://greensock.com/gsap/) + ScrollTrigger | Pinned process scrub, element reveals, and 3D card tilt |
| **Kinetic Animations** | [Anime.js v4](https://animejs.com/) | Micro-interactions, spring physics, and telemetry readouts |
| **Typography** | Space Grotesk & JetBrains Mono | WOFF2 preloaded for immediate sub-second paint with zero FOIT |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` or `pnpm`

### Installation
```bash
# Clone the repository
git clone https://github.com/sampathkumar8421-netizen/Obsidian-car-decor.git

# Enter project directory
cd Obsidian-car-decor

# Install dependencies
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser to preview the live application with instant Hot Module Replacement.

### Production Build
```bash
# Compile and optimize for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Directory Structure

```
Obsidian-car-decor/
├── index.html              # Main HTML entry with semantic landmarks and SVG HUD
├── vite.config.js          # Vite configuration with vendor chunk splitting
├── package.json            # Project dependencies and build scripts
├── DESIGN.md               # Design tokens, motion guidelines, and styling spec
├── public/                 # Static assets, SVG icons, and WOFF2 typography
│   ├── fonts/              # Space Grotesk & JetBrains Mono font files
│   └── favicon.svg         # Hexagonal neon brand icon
└── src/
    ├── style.css           # Pure CSS design system (tokens, components, responsive)
    ├── main.js             # Application orchestrator and lazy boot pipeline
    └── js/
        ├── loader.js       # Diagnostic preloader, laser hex draw, and cross-dissolve
        ├── hero-particles.js # 600-particle kinetic canvas and cursor repulsion
        ├── studio3d.js     # Three.js 3D car studio, paint swatches, and decon slider
        ├── process.js      # GSAP pinned 4-pass correction scrub and reveals
        ├── gallery.js      # Interactive before/after defect comparison slider
        ├── planner.js      # Real-time vehicle tier pricing calculator
        ├── booking.js      # Reservation suite with validation and confirmation
        ├── marquee.js      # Seamless infinite studio ticker
        ├── anim.js         # Spring animation utilities
        └── droplet.js      # Water-beading contact angle physics animation
```

---

## ♿ Accessibility & Performance

- **Reduced Motion Support:** Respects `prefers-reduced-motion: reduce` across all animations, providing immediate data presentation without disorienting motion.
- **Full Keyboard Navigation:** Interactive components (Comparison slider, Process tabs, Swatches, Finish toggles, Planner buttons) support native keyboard focus (`Tab`, `Space`, `Enter`, Arrow keys) with high-contrast `:focus-visible` indicators.
- **Scrollbar Lock Architecture:** Locks viewport overflow and completely hides the side scrollbar during the preloader phase, unveiling it only after the dissolve transition concludes.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
