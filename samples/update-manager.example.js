/**
 * Example: auto-update flow for a public GitHub release repository.
 *
 * The repository is public, so the installed application does not need a
 * token to check for or download updates. Keep publishing credentials on the
 * build machine only (GH_TOKEN in the environment).
 *
 * Illustrative code only.
 */

const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.autoDownload = false;

function configureUpdater(mainWindow) {
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'KhanHassanRiaz',
        repo: 'ProQuiz_Simulator'
    });

    autoUpdater.on('update-available', (info) => {
        mainWindow.webContents.send('update:available', {
            version: info.version,
            releaseDate: info.releaseDate
        });
    });

    autoUpdater.on('update-not-available', () => {
        mainWindow.webContents.send('update:none');
    });

    autoUpdater.on('download-progress', (progress) => {
        mainWindow.webContents.send('update:progress', {
            percent: Math.round(progress.percent),
            transferred: progress.transferred,
            total: progress.total
        });
    });

    autoUpdater.on('update-downloaded', () => {
        mainWindow.webContents.send('update:ready');
    });

    autoUpdater.on('error', (error) => {
        log.warn('Update error:', error.message);
        mainWindow.webContents.send('update:error', error.message);
    });
}

async function checkForUpdates() {
    try {
        await autoUpdater.checkForUpdates();
    } catch (error) {
        log.warn('Update check failed:', error.message);
    }
}

function downloadUpdate() {
    return autoUpdater.downloadUpdate();
}

function quitAndInstall() {
    autoUpdater.quitAndInstall();
}

module.exports = {
    configureUpdater,
    checkForUpdates,
    downloadUpdate,
    quitAndInstall
};
