/**
 * Example: narrow, validated IPC handlers.
 *
 * Why this pattern:
 * - The renderer never gets raw filesystem or Node access.
 * - Only allow-listed channels are registered.
 * - Every argument is validated before it reaches a privileged operation.
 *
 * Illustrative code only.
 */

const { ipcMain } = require('electron');

const ALLOWED_CHANNELS = ['study:load-subject', 'study:save-progress'];

function sanitizeId(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return /^[a-z0-9_-]{1,64}$/i.test(trimmed) ? trimmed : null;
}

function registerHandlers({ loadSubject, saveProgress }) {
    // Register once; remove first so hot reloads cannot duplicate handlers.
    for (const channel of ALLOWED_CHANNELS) {
        ipcMain.removeHandler(channel);
    }

    ipcMain.handle('study:load-subject', async (_event, payload) => {
        const courseId = sanitizeId(payload && payload.courseId);
        const subject = sanitizeId(payload && payload.subject);

        if (!courseId || !subject) {
            throw new Error('Invalid subject request');
        }

        return loadSubject(courseId, subject);
    });

    ipcMain.handle('study:save-progress', async (_event, payload) => {
        const courseId = sanitizeId(payload && payload.courseId);
        const position = Number(payload && payload.position);

        if (!courseId || !Number.isInteger(position) || position < 0) {
            throw new Error('Invalid progress payload');
        }

        await saveProgress(courseId, position);
        return { ok: true };
    });
}

module.exports = { registerHandlers };
