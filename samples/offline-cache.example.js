/**
 * Example: content-addressed local cache.
 *
 * A resource path is hashed into a stable key. The same path always maps to
 * the same file, independent of directory ordering or platform separators.
 * A missing entry returns null instead of throwing.
 *
 * Illustrative code only. The production app validates and decrypts its own
 * content packs; no real data is included here.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function cacheKey(resourcePath) {
    const normalized = resourcePath.replace(/\\/g, '/');
    return crypto.createHash('sha1').update(normalized).digest('hex');
}

function readCachedJson(cacheDir, resourcePath) {
    const filePath = path.join(cacheDir, `${cacheKey(resourcePath)}.json`);

    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        // Corrupt or unreadable entry: treat it as a cache miss.
        return null;
    }
}

function writeCachedJson(cacheDir, resourcePath, value) {
    fs.mkdirSync(cacheDir, { recursive: true });
    const filePath = path.join(cacheDir, `${cacheKey(resourcePath)}.json`);
    fs.writeFileSync(filePath, JSON.stringify(value), 'utf8');
    return filePath;
}

module.exports = { cacheKey, readCachedJson, writeCachedJson };
