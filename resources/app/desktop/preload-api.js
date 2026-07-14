function createDesktopWindowApi(ipcRenderer) {
  return {
    isDesktop: true,
    minimize: () => ipcRenderer.invoke('desktop-window-minimize'),
    toggleMaximize: () => ipcRenderer.invoke('desktop-window-toggle-maximize'),
    toggleFullscreen: () => ipcRenderer.invoke('desktop-window-toggle-fullscreen'),
    exitFullscreenWindowed: () => ipcRenderer.invoke('desktop-window-exit-fullscreen-windowed'),
    getState: () => ipcRenderer.invoke('desktop-window-get-state'),
    close: () => ipcRenderer.invoke('desktop-window-close'),
    openNeteaseMusicLogin: () => ipcRenderer.invoke('netease-music-open-login'),
    clearNeteaseMusicLogin: () => ipcRenderer.invoke('netease-music-clear-login'),
    openQQMusicLogin: () => ipcRenderer.invoke('qq-music-open-login'),
    clearQQMusicLogin: () => ipcRenderer.invoke('qq-music-clear-login'),
    openKugouMusicLogin: () => ipcRenderer.invoke('kugou-music-open-login'),
    clearKugouMusicLogin: () => ipcRenderer.invoke('kugou-music-clear-login'),
    openUpdateInstaller: (filePath) => ipcRenderer.invoke('mineradio-open-update-installer', filePath),
    restartApp: () => ipcRenderer.invoke('mineradio-restart-app'),
    configureGlobalHotkeys: (bindings) => ipcRenderer.invoke('mineradio-hotkeys-configure-global', bindings || []),
    exportJsonFile: (payload) => ipcRenderer.invoke('mineradio-export-json-file', payload || {}),
    importJsonFile: () => ipcRenderer.invoke('mineradio-import-json-file'),
    listWallpaperLibraryAssets: () => ipcRenderer.invoke('mineradio-wallpaper-library-list'),
    pickWallpaperLibraryAsset: () => ipcRenderer.invoke('mineradio-wallpaper-library-pick'),
    readWallpaperLibraryAsset: (filePath) => ipcRenderer.invoke('mineradio-wallpaper-library-read', filePath),
    onGlobalHotkey: (callback) => bindRendererEvent(ipcRenderer, 'mineradio-global-hotkey', callback),
    setDesktopLyricsEnabled: (enabled, payload) => ipcRenderer.invoke('mineradio-desktop-lyrics-set-enabled', !!enabled, payload || {}),
    updateDesktopLyrics: (payload) => ipcRenderer.invoke('mineradio-desktop-lyrics-update', payload || {}),
    onDesktopLyricsLockState: (callback) => bindRendererEvent(ipcRenderer, 'mineradio-desktop-lyrics-lock-state', callback),
    onDesktopLyricsEnabledState: (callback) => bindRendererEvent(ipcRenderer, 'mineradio-desktop-lyrics-enabled-state', callback),
    setWallpaperMode: (enabled, payload) => ipcRenderer.invoke('mineradio-wallpaper-set-enabled', !!enabled, payload || {}),
    updateWallpaperMode: (payload) => ipcRenderer.invoke('mineradio-wallpaper-update', payload || {}),
    onStateChange: (callback) => {
      if (typeof callback !== 'function') return () => {};
      const listener = (_event, state) => callback(state);
      ipcRenderer.on('desktop-window-state', listener);
      return () => ipcRenderer.removeListener('desktop-window-state', listener);
    },
  };
}

function bindRendererEvent(ipcRenderer, channel, callback) {
  if (typeof callback !== 'function') return () => {};
  const listener = (_event, payload) => callback(payload || {});
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

module.exports = {
  createDesktopWindowApi,
};
