// fountain.js - Lightweight Luby Transform (LT) Fountain Code Implementation

// Simple deterministic PRNG (SplitMix32 / Mulberry32)
function mulberry32(a) {
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Generate degree from Ideal Soliton / Robust Soliton-like distribution
function sampleDegree(prng, K) {
    if (K <= 1) return 1;
    const p = prng();
    // Simplified distribution biased towards degree 1 and small degrees
    // Ensures quick ripple startup and good coverage
    if (p < 1 / K) return 1;
    for (let d = 2; d <= K; d++) {
        if (p < 1 / d) return d;
    }
    return Math.min(K, Math.max(2, Math.floor(prng() * K) + 1));
}

// Pick degree unique indices out of [0, K - 1] using PRNG
function getBlockIndices(seed, K) {
    const prng = mulberry32(seed);
    const degree = sampleDegree(prng, K);
    const chosen = new Set();
    while (chosen.size < degree) {
        const idx = Math.floor(prng() * K);
        chosen.add(idx);
    }
    return Array.from(chosen);
}

export class FountainEncoder {
    constructor(dataBytes, chunkSize = 160, transferId = null) {
        this.chunkSize = chunkSize;
        this.totalLength = dataBytes.length;
        this.K = Math.max(1, Math.ceil(this.totalLength / chunkSize));
        this.transferId = transferId !== null ? transferId : Math.floor(Math.random() * 65535);
        
        // Pad data into exactly K chunks of chunkSize
        this.chunks = [];
        for (let i = 0; i < this.K; i++) {
            const chunk = new Uint8Array(chunkSize);
            const start = i * chunkSize;
            const slice = dataBytes.subarray(start, Math.min(start + chunkSize, this.totalLength));
            chunk.set(slice);
            this.chunks.push(chunk);
        }
        this.seed = 0;
    }

    // Produces the next droplet: Uint8Array [2 bytes transferId, 2 bytes K, 4 bytes seed, 4 bytes totalLen, N bytes payload]
    nextDroplet() {
        this.seed = (this.seed + 1) & 0xFFFFFF; // 24-bit counter/seed
        const indices = getBlockIndices(this.seed, this.K);
        
        // XOR blocks together
        const dropletData = new Uint8Array(this.chunkSize);
        for (const idx of indices) {
            const block = this.chunks[idx];
            for (let i = 0; i < this.chunkSize; i++) {
                dropletData[i] ^= block[i];
            }
        }

        // Header (12 bytes):
        // [0..1]: Transfer ID (Uint16)
        // [2..3]: K (Uint16)
        // [4..7]: Seed (Uint32)
        // [8..11]: Total file length (Uint32)
        const packet = new Uint8Array(12 + this.chunkSize);
        const view = new DataView(packet.buffer);
        view.setUint16(0, this.transferId, false);
        view.setUint16(2, this.K, false);
        view.setUint32(4, this.seed, false);
        view.setUint32(8, this.totalLength, false);
        packet.set(dropletData, 12);

        return packet;
    }
}

export class FountainDecoder {
    constructor() {
        this.reset();
    }

    reset() {
        this.transferId = null;
        this.K = null;
        this.totalLength = null;
        this.chunkSize = null;
        this.sourceBlocks = [];     // Array of Uint8Array | null
        this.solvedCount = 0;
        this.equations = [];        // Array of { indices: Set<number>, data: Uint8Array }
        this.isDone = false;
        this.seenSeeds = new Set();
    }

    // Processes a received packet
    addDroplet(packetBytes) {
        if (packetBytes.length < 13) return false;

        const view = new DataView(packetBytes.buffer, packetBytes.byteOffset, packetBytes.byteLength);
        const transferId = view.getUint16(0, false);
        const K = view.getUint16(2, false);
        const seed = view.getUint32(4, false);
        const totalLength = view.getUint32(8, false);
        const payload = packetBytes.subarray(12);

        // Detect if a new transfer has started
        if (this.transferId !== null && this.transferId !== transferId) {
            this.reset();
        }

        if (this.isDone) return false;

        if (this.seenSeeds.has(seed)) return false;
        this.seenSeeds.add(seed);

        if (this.K === null) {
            this.transferId = transferId;
            this.K = K;
            this.totalLength = totalLength;
            this.chunkSize = payload.length;
            this.sourceBlocks = new Array(K).fill(null);
        }

        const indices = new Set(getBlockIndices(seed, this.K));
        const data = new Uint8Array(payload);

        // Reduce equation with already known blocks
        for (const idx of Array.from(indices)) {
            if (this.sourceBlocks[idx] !== null) {
                const known = this.sourceBlocks[idx];
                for (let i = 0; i < this.chunkSize; i++) {
                    data[i] ^= known[i];
                }
                indices.delete(idx);
            }
        }

        if (indices.size === 0) return false;

        this.equations.push({ indices, data });
        this.processRipple();
        return true;
    }

    // Belief propagation solver (ripple decoding)
    processRipple() {
        let changed = true;
        while (changed) {
            changed = false;
            for (let i = 0; i < this.equations.length; i++) {
                const eq = this.equations[i];
                if (!eq) continue;

                // Eliminate knowns from this equation
                for (const idx of Array.from(eq.indices)) {
                    if (this.sourceBlocks[idx] !== null) {
                        const known = this.sourceBlocks[idx];
                        for (let j = 0; j < this.chunkSize; j++) {
                            eq.data[j] ^= known[j];
                        }
                        eq.indices.delete(idx);
                    }
                }

                // If only 1 unknown remains, we solved a source block!
                if (eq.indices.size === 1) {
                    const [solvedIdx] = eq.indices;
                    this.sourceBlocks[solvedIdx] = eq.data;
                    this.solvedCount++;
                    this.equations[i] = null;
                    changed = true;
                } else if (eq.indices.size === 0) {
                    this.equations[i] = null; // Redundant equation
                }
            }
        }

        // Clean out nulls
        this.equations = this.equations.filter(Boolean);

        if (this.K !== null && this.solvedCount === this.K) {
            this.isDone = true;
        }
    }

    getProgress() {
        if (!this.K) return 0;
        return Math.min(100, Math.round((this.solvedCount / this.K) * 100));
    }

    getRecoveredData() {
        if (!this.isDone) return null;
        const full = new Uint8Array(this.totalLength);
        let offset = 0;
        for (let i = 0; i < this.K; i++) {
            const block = this.sourceBlocks[i];
            const toCopy = Math.min(this.chunkSize, this.totalLength - offset);
            full.set(block.subarray(0, toCopy), offset);
            offset += toCopy;
        }
        return full;
    }
}
