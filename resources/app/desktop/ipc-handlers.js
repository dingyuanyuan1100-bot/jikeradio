const { app, ipcMain, shell, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

const WALLPAPER_LIBRARY_DIR = path.resolve(__dirname, '..', '..', '..', '壁纸文件夹');

function isWallpaperLibraryMediaFile(filePath) {
  const ext = path.extname(String(filePath || '')).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm', '.mov'].includes(ext);
}

function wallpaperLibraryAssetType(filePath) {
  const ext = path.extname(String(filePath || '')).toLowerCase();
  return ['.mp4', '.webm', '.mov'].includes(ext) ? 'video' : 'image';
}

function wallpaperLibraryMimeType(filePath) {
  const ext = path.extname(String(filePath || '')).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  if (ext === '.mov') return 'video/quicktime';
  return wallpaperLibraryAssetType(filePath) === 'video' ? 'video/mp4' : 'image/jpeg';
}

function listWallpaperLibraryAssetsFromDisk() {
  if (!fs.existsSync(WALLPAPER_LIBRARY_DIR)) return [];
  return fs.readdirSync(WALLPAPER_LIBRARY_DIR, { withFileTypes: true })
    .filter((entry) => entry && entry.isFile && entry.isFile())
    .map((entry) => path.join(WALLPAPER_LIBRARY_DIR, entry.name))
    .filter((filePath) => isWallpaperLibraryMediaFile(filePath))
    .map((filePath) => {
      const stat = fs.statSync(filePath);
      return {
        name: path.basename(filePath),
        path: filePath,
        type: wallpaperLibraryAssetType(filePath),
        ext: path.extname(filePath).toLowerCase(),
        size: stat && stat.size ? stat.size : 0,
        mtimeMs: stat && stat.mtimeMs ? stat.mtimeMs : 0,
      };
    })
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN'));
}

function registerIpcHandlers(deps) {
  const {
    getSenderWindow,
    toggleFullscreen,
    exitFullscreenToWindow,
    getWindowState,
    configureMineradioGlobalHotkeys,
    openNeteaseMusicLoginWindow,
    clearNeteaseMusicLoginSession,
    openQQMusicLoginWindow,
    clearQQMusicLoginSession,
    openKugouMusicLoginWindow,
    clearKugouMusicLoginSession,
    getUpdateDownloadDir,
    createDesktopLyricsWindow,
    closeDesktopLyricsWindow,
    broadcastDesktopLyricsEnabledState,
    applyDesktopLyricsMouseBehavior,
    sendDesktopLyricsState,
    clampNumber,
    broadcastDesktopLyricsLockState,
    createWallpaperWindow,
    closeWallpaperWindow,
    positionWallpaperWindow,
    sendWallpaperState,
    getDesktopLyricsState,
    setDesktopLyricsState,
    getDesktopLyricsWindow,
    setDesktopLyricsPointerCapture,
    getDesktopLyricsPointerCapture,
    setDesktopLyricsHotBounds,
    setDesktopLyricsUserBounds,
    getWallpaperState,
    setWallpaperState,
    getWallpaperWindow,
  } = deps;

  ipcMain.handle('desktop-window-minimize', (event) => {
    getSenderWindow(event)?.minimize();
  });

  ipcMain.handle('desktop-window-toggle-maximize', (event) => {
    toggleFullscreen(getSenderWindow(event));
  });

  ipcMain.handle('desktop-window-toggle-fullscreen', (event) => {
    toggleFullscreen(getSenderWindow(event));
  });

  ipcMain.handle('desktop-window-exit-fullscreen-windowed', (event) => {
    exitFullscreenToWindow(getSenderWindow(event));
  });

  ipcMain.handle('desktop-window-get-state', (event) => {
    return getWindowState(getSenderWindow(event));
  });

  ipcMain.handle('desktop-window-close', (event) => {
    getSenderWindow(event)?.close();
  });

  ipcMain.handle('mineradio-hotkeys-configure-global', (_event, bindings) => {
    return configureMineradioGlobalHotkeys(bindings);
  });

  ipcMain.handle('mineradio-export-json-file', async (event, payload = {}) => {
    try {
      const owner = getSenderWindow(event);
      const defaultName = String(payload.defaultName || 'mineradio-export.json').replace(/[\\/:*?"<>|]+/g, '-');
      const result = await dialog.showSaveDialog(owner, {
        title: '瀵煎嚭 Jikeradio 鏁版嵁',
        defaultPath: defaultName.toLowerCase().endsWith('.json') ? defaultName : `${defaultName}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (result.canceled || !result.filePath) return { ok: false, canceled: true };
      const text = typeof payload.text === 'string' ? payload.text : JSON.stringify(payload.data || {}, null, 2);
      fs.writeFileSync(result.filePath, text, 'utf8');
      return { ok: true, filePath: result.filePath };
    } catch (e) {
      return { ok: false, error: e.message || 'EXPORT_FAILED' };
    }
  });

  ipcMain.handle('mineradio-import-json-file', async (event) => {
    try {
      const owner = getSenderWindow(event);
      const result = await dialog.showOpenDialog(owner, {
        title: '瀵煎叆 Jikeradio 鏁版嵁',
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (result.canceled || !result.filePaths || !result.filePaths[0]) return { ok: false, canceled: true };
      const filePath = result.filePaths[0];
      const text = fs.readFileSync(filePath, 'utf8');
      return { ok: true, filePath, text };
    } catch (e) {
      return { ok: false, error: e.message || 'IMPORT_FAILED' };
    }
  });

  ipcMain.handle('mineradio-wallpaper-library-list', async () => {
    try {
      return { ok: true, dir: WALLPAPER_LIBRARY_DIR, items: listWallpaperLibraryAssetsFromDisk() };
    } catch (e) {
      return { ok: false, error: e.message || 'WALLPAPER_LIBRARY_LIST_FAILED', dir: WALLPAPER_LIBRARY_DIR, items: [] };
    }
  });

  ipcMain.handle('mineradio-wallpaper-library-pick', async (event) => {
    try {
      const owner = getSenderWindow(event);
      const result = await dialog.showOpenDialog(owner, {
        title: '閫夋嫨澹佺焊绱犳潗',
        properties: ['openFile'],
        filters: [{ name: 'Wallpaper Media', extensions: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mov'] }],
      });
      if (result.canceled || !result.filePaths || !result.filePaths[0]) return { ok: false, canceled: true };
      const filePath = path.resolve(result.filePaths[0]);
      if (!isWallpaperLibraryMediaFile(filePath)) return { ok: false, error: 'INVALID_WALLPAPER_MEDIA' };
      const stat = fs.statSync(filePath);
      return {
        ok: true,
        item: {
          name: path.basename(filePath),
          path: filePath,
          type: wallpaperLibraryAssetType(filePath),
          ext: path.extname(filePath).toLowerCase(),
          size: stat && stat.size ? stat.size : 0,
          mtimeMs: stat && stat.mtimeMs ? stat.mtimeMs : 0,
        },
      };
    } catch (e) {
      return { ok: false, error: e.message || 'WALLPAPER_LIBRARY_PICK_FAILED' };
    }
  });

  ipcMain.handle('mineradio-wallpaper-library-read', async (_event, inputPath) => {
    try {
      const filePath = path.resolve(String(inputPath || ''));
      if (!filePath || !isWallpaperLibraryMediaFile(filePath)) return { ok: false, error: 'INVALID_WALLPAPER_MEDIA' };
      if (!fs.existsSync(filePath)) return { ok: false, error: 'WALLPAPER_MEDIA_MISSING' };
      const buffer = fs.readFileSync(filePath);
      return {
        ok: true,
        path: filePath,
        type: wallpaperLibraryAssetType(filePath),
        mime: wallpaperLibraryMimeType(filePath),
        dataUrl: `data:${wallpaperLibraryMimeType(filePath)};base64,${buffer.toString('base64')}`,
      };
    } catch (e) {
      return { ok: false, error: e.message || 'WALLPAPER_LIBRARY_READ_FAILED' };
    }
  });

  ipcMain.handle('netease-music-open-login', async (event) => {
    return openNeteaseMusicLoginWindow(getSenderWindow(event));
  });

  ipcMain.handle('netease-music-clear-login', async () => {
    return clearNeteaseMusicLoginSession();
  });

  ipcMain.handle('qq-music-open-login', async (event) => {
    return openQQMusicLoginWindow(getSenderWindow(event));
  });

  ipcMain.handle('qq-music-clear-login', async () => {
    return clearQQMusicLoginSession();
  });

  ipcMain.handle('kugou-music-open-login', async (event) => {
    return openKugouMusicLoginWindow(getSenderWindow(event));
  });

  ipcMain.handle('kugou-music-clear-login', async () => {
    return clearKugouMusicLoginSession();
  });

  ipcMain.handle('mineradio-open-update-installer', async (_event, filePath) => {
    try {
      const target = path.resolve(String(filePath || ''));
      const updateDir = path.resolve(getUpdateDownloadDir());
      if (!target || !target.startsWith(updateDir + path.sep)) {
        return { ok: false, error: 'INVALID_UPDATE_PATH' };
      }
      if (!fs.existsSync(target)) return { ok: false, error: 'UPDATE_FILE_MISSING' };
      const error = await shell.openPath(target);
      return error ? { ok: false, error } : { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'OPEN_UPDATE_FAILED' };
    }
  });

  ipcMain.handle('mineradio-restart-app', async () => {
    try {
      app.relaunch();
      app.exit(0);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'RESTART_FAILED' };
    }
  });

  ipcMain.handle('mineradio-desktop-lyrics-set-enabled', async (_event, enabled, payload) => {
    try {
      if (enabled) {
        createDesktopLyricsWindow(payload || {});
        broadcastDesktopLyricsEnabledState(true);
      } else {
        closeDesktopLyricsWindow();
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'DESKTOP_LYRICS_FAILED' };
    }
  });

  ipcMain.handle('mineradio-desktop-lyrics-update', async (_event, payload) => {
    try {
      const nextState = { ...getDesktopLyricsState(), ...(payload || {}) };
      if (nextState.enabled) {
        createDesktopLyricsWindow(payload || {});
      } else if (getDesktopLyricsWindow() && !getDesktopLyricsWindow().isDestroyed()) {
        setDesktopLyricsState(nextState);
        sendDesktopLyricsState();
      } else {
        setDesktopLyricsState(nextState);
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'DESKTOP_LYRICS_UPDATE_FAILED' };
    }
  });

  ipcMain.handle('mineradio-desktop-lyrics-set-dragging', async () => {
    return { ok: true };
  });

  ipcMain.handle('mineradio-desktop-lyrics-set-pointer-capture', async (_event, active) => {
    try {
      setDesktopLyricsPointerCapture(!!active);
      applyDesktopLyricsMouseBehavior();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'DESKTOP_LYRICS_POINTER_FAILED' };
    }
  });

  ipcMain.handle('mineradio-desktop-lyrics-set-hot-bounds', async (_event, bounds) => {
    try {
      const left = clampNumber(bounds && bounds.left, -2000, 4000, 0);
      const top = clampNumber(bounds && bounds.top, -2000, 4000, 0);
      const right = clampNumber(bounds && bounds.right, left + 1, 6000, left + 1);
      const bottom = clampNumber(bounds && bounds.bottom, top + 1, 6000, top + 1);
      setDesktopLyricsHotBounds({ left, top, right, bottom });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'DESKTOP_LYRICS_HOT_BOUNDS_FAILED' };
    }
  });

  ipcMain.handle('mineradio-desktop-lyrics-set-lock-state', async (_event, locked) => {
    try {
      const nextState = { ...getDesktopLyricsState(), clickThrough: !!locked };
      setDesktopLyricsState(nextState);
      if (nextState.clickThrough !== false) setDesktopLyricsPointerCapture(false);
      applyDesktopLyricsMouseBehavior();
      broadcastDesktopLyricsLockState();
      return { ok: true, locked: nextState.clickThrough !== false };
    } catch (e) {
      return { ok: false, error: e.message || 'DESKTOP_LYRICS_LOCK_FAILED' };
    }
  });

  ipcMain.handle('mineradio-desktop-lyrics-move-by', async (_event, dx, dy) => {
    try {
      const desktopLyricsWindow = getDesktopLyricsWindow();
      const desktopLyricsState = getDesktopLyricsState();
      if (!desktopLyricsWindow || desktopLyricsWindow.isDestroyed()) return { ok: false, error: 'NO_DESKTOP_LYRICS_WINDOW' };
      if (desktopLyricsState.clickThrough !== false) return { ok: false, error: 'DESKTOP_LYRICS_LOCKED' };
      const bounds = desktopLyricsWindow.getBounds();
      const next = {
        ...bounds,
        x: Math.round(bounds.x + clampNumber(dx, -160, 160, 0)),
        y: Math.round(bounds.y + clampNumber(dy, -160, 160, 0)),
      };
      desktopLyricsWindow.setBounds(next, false);
      setDesktopLyricsUserBounds(desktopLyricsWindow.getBounds());
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'DESKTOP_LYRICS_MOVE_FAILED' };
    }
  });

  ipcMain.handle('mineradio-wallpaper-set-enabled', async (_event, enabled, payload) => {
    try {
      if (enabled) createWallpaperWindow(payload || {});
      else closeWallpaperWindow();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'WALLPAPER_FAILED' };
    }
  });

  ipcMain.handle('mineradio-wallpaper-update', async (_event, payload) => {
    try {
      setWallpaperState({ ...getWallpaperState(), ...(payload || {}) });
      const wallpaperState = getWallpaperState();
      const wallpaperWindow = getWallpaperWindow();
      if (wallpaperState.enabled) {
        createWallpaperWindow(wallpaperState);
        if (getWallpaperWindow() && !getWallpaperWindow().isDestroyed()) {
          positionWallpaperWindow();
          sendWallpaperState();
        }
      } else if (wallpaperWindow && !wallpaperWindow.isDestroyed()) {
        sendWallpaperState();
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'WALLPAPER_UPDATE_FAILED' };
    }
  });
}

module.exports = {
  registerIpcHandlers,
};
