const { contextBridge, ipcRenderer } = require('electron');
const { createDesktopWindowApi } = require('./preload-api');

contextBridge.exposeInMainWorld('desktopWindow', createDesktopWindowApi(ipcRenderer));

window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('desktop-shell-root');
  document.body.classList.add('desktop-shell');
});
