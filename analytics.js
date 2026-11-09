// Vercel Web Analytics ESM initialization
import { inject } from 'https://cdn.jsdelivr.net/npm/@vercel/analytics@1/+esm';

try {
  inject();
} catch (e) {
  console.warn('Vercel Analytics error:', e);
}
