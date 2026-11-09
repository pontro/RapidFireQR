# ⚡ RapidFireQR

> Optical Air-Gap Data Transfer with Fountain Erasure Codes.

**RapidFireQR** transfers data between devices (e.g. PC to Phone) visually using high-speed animated QR code streams. By using Luby Transform (LT) rateless fountain codes, the system recovers data even with dropped or blurred frames, requiring zero network connection, Wi-Fi permissions, or Bluetooth pairing.

## ✨ Features
- **Rateless Fountain Codes:** Continuous droplet streaming with ripple belief-propagation linear decoding.
- **Client-Side Compression:** Native `deflate-raw` compression cuts payload size by 40–70%.
- **Zero Configuration:** 100% client-side web application — zero backend dependencies.
- **PWA & Offline Ready:** Installs as a standalone full-screen web app.
- **Adaptive Ergonomics:** 2-column dashboard on desktop, auto-focus morph on mobile.
- **Opt-in Auto-Stop:** Camera verification QR handshake automatically signals the transmitter to stop when done.

## 🚀 Deployment

RapidFireQR is a pure client-side application. It can be deployed to any static host with zero build steps.

### Vercel Deployment Guide
1. Import your GitHub repository in [Vercel](https://vercel.com).
2. Configure settings:
   - **Framework Preset:** `Other`
   - **Build Command:** *(Leave empty)*
   - **Output Directory:** `.` *(Root)*
3. Click **Deploy**.
