# ⚡ RapidFire QR

> Optical Air-Gap Data Transfer with Fountain Erasure Codes.

RapidFire transmits data between devices (e.g. PC to Phone) visually using high-speed animated QR code streams. By using Luby Transform (LT) rateless fountain codes, the system recovers data even with dropped or blurred frames, requiring zero network connection or Bluetooth pairing.

## ✨ Features
- **Rateless Fountain Codes:** Continuous droplet streaming with ripple belief-propagation decoding.
- **Client-Side Compression:** Native `deflate-raw` compression cuts payload size by 40–70%.
- **Zero Configuration:** Works completely client-side in the browser.
- **PWA & Offline Ready:** Installs as a standalone full-screen web app.
- **Adaptive Ergonomics:** 2-column dashboard on desktop, auto-focus morph on mobile.
- **Opt-in Auto-Stop:** Camera ACK handshake automatically signals the transmitter to stop when done.

## 🚀 Deployment
Deployable to any static host (Vercel, Cloudflare Pages, Netlify, GitHub Pages).

### Vercel
- **Build Command:** *(Leave empty)*
- **Output Directory:** `.` *(Root)*
- **Framework Preset:** `Other`
