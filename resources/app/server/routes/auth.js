async function handleAuthRoutes(req, res, url, deps) {
  const pn = url.pathname;
  const {
    sendJSON,
    readRequestBody,
    normalizeCookieHeader,
    parseCookieString,
    saveCookie,
    getLoginInfo,
    getUserCookie,
    logout,
    login_qr_key,
    login_qr_create,
    login_qr_check,
    readCookieFromResponse,
    normalizeLoginInfo,
    user_playlist,
  } = deps;

  if (pn === '/api/login/cookie') {
    try {
      const body = await readRequestBody(req);
      const raw = body.cookie || body.data || body.text || '';
      const normalized = normalizeCookieHeader(raw);
      const obj = parseCookieString(normalized);
      if (!obj.MUSIC_U) {
        sendJSON(res, { loggedIn: false, error: 'INVALID_NETEASE_COOKIE', message: 'Netease cookie missing MUSIC_U' }, 400);
        return true;
      }
      saveCookie(normalized);
      let info = await getLoginInfo();
      if (!info.loggedIn && getUserCookie()) {
        info = {
          loggedIn: true,
          pendingProfile: true,
          nickname: 'Netease user',
          avatar: '',
          vipType: 0,
          vipLevel: 'none',
          isVip: false,
          isSvip: false,
          vipLabel: 'No VIP',
        };
      }
      sendJSON(res, { ...info, saved: true, hasCookie: !!getUserCookie() });
    } catch (err) {
      console.error('[LoginCookie]', err);
      sendJSON(res, { loggedIn: false, error: err.message }, 500);
    }
    return true;
  }

  if (pn === '/api/login/qr/key') {
    try {
      const result = await login_qr_key({ timestamp: Date.now() });
      const key = result.body && result.body.data && result.body.data.unikey;
      sendJSON(res, { key });
    } catch (err) {
      sendJSON(res, { error: err.message }, 500);
    }
    return true;
  }

  if (pn === '/api/login/qr/create') {
    try {
      const key = url.searchParams.get('key');
      const result = await login_qr_create({ key, qrimg: true, timestamp: Date.now() });
      const data = result.body && result.body.data;
      sendJSON(res, { img: data && data.qrimg, url: data && data.qrurl });
    } catch (err) {
      sendJSON(res, { error: err.message }, 500);
    }
    return true;
  }

  if (pn === '/api/login/qr/check') {
    try {
      const key = url.searchParams.get('key');
      let result = await login_qr_check({ key, noCookie: true, timestamp: Date.now() });
      let body = result.body || {};
      let code = Number(body.code || result.code);
      let message = body.message || result.message || '';
      let cookie = readCookieFromResponse(result);

      if (code === 803 && !cookie) {
        try {
          const retry = await login_qr_check({ key, timestamp: Date.now() });
          const retryCookie = readCookieFromResponse(retry);
          if (retryCookie) {
            result = retry;
            body = retry.body || body;
            code = Number(body.code || retry.code || code);
            message = body.message || retry.message || message;
            cookie = retryCookie;
          }
        } catch (retryErr) {
          console.warn('[Login] qr cookie retry failed:', retryErr.message);
        }
      }

      if (code === 803) {
        if (cookie) saveCookie(cookie);
        let info = await getLoginInfo();
        if (!info.loggedIn) {
          const profile = body.profile || (body.data && body.data.profile) || {};
          info = normalizeLoginInfo(profile, body.account || (body.data && body.data.account), body.data || body);
        }
        if (!info.loggedIn && cookie) {
          info = {
            loggedIn: true,
            pendingProfile: true,
            nickname: body.nickname || (body.profile && body.profile.nickname) || 'Netease user',
            avatar: body.avatarUrl || (body.profile && body.profile.avatarUrl) || '',
            vipType: 0,
            vipLevel: 'none',
            isVip: false,
            isSvip: false,
            vipLabel: 'No VIP',
          };
        }
        sendJSON(res, { code, message, ...info, hasCookie: !!cookie });
        return true;
      }

      sendJSON(res, { code, message, nickname: body.nickname, avatar: body.avatarUrl });
    } catch (err) {
      sendJSON(res, { error: err.message }, 500);
    }
    return true;
  }

  if (pn === '/api/login/status') {
    const info = await getLoginInfo();
    sendJSON(res, info);
    return true;
  }

  if (pn === '/api/logout') {
    try {
      await logout({ cookie: getUserCookie() });
    } catch (e) {}
    saveCookie('');
    sendJSON(res, { ok: true });
    return true;
  }

  if (pn === '/api/user/playlists') {
    try {
      const info = await getLoginInfo();
      if (!info.loggedIn || !info.userId) {
        sendJSON(res, { loggedIn: false, playlists: [] });
        return true;
      }
      const limit = Math.max(12, Math.min(100, parseInt(url.searchParams.get('limit') || '60', 10) || 60));
      const result = await user_playlist({ uid: info.userId, limit, cookie: getUserCookie(), timestamp: Date.now() });
      const list = ((result.body && result.body.playlist) || []).map(pl => ({
        id: pl.id,
        name: pl.name,
        cover: pl.coverImgUrl || '',
        trackCount: pl.trackCount || 0,
        playCount: pl.playCount || 0,
        creator: (pl.creator && pl.creator.nickname) || '',
        subscribed: !!pl.subscribed,
        specialType: pl.specialType || 0,
      }));
      sendJSON(res, { loggedIn: true, userId: info.userId, playlists: list });
    } catch (err) {
      console.error('[UserPlaylists]', err);
      sendJSON(res, { error: err.message, loggedIn: false, playlists: [] }, 500);
    }
    return true;
  }

  return false;
}

module.exports = {
  handleAuthRoutes,
};
