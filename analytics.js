// Vercel Web Analytics initialization
import { inject } from 'https://cdn.jsdelivr.net/npm/@vercel/analytics@1/dist/index.js';

try {
  inject();
} catch (e) {
  console.warn('Vercel Analytics error:', e);
}
