/*
 * Pocket Tally sync: one private file in the person's own Google Drive
 * (the app-data folder, visible only to this app), merged with the device.
 * Plain script: window.PocketTallySync in the browser, module.exports in Node (tests).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PocketTallySync = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var FILE_NAME = "pocket-tally.json";
  var SCOPE = "https://www.googleapis.com/auth/drive.appdata";
  var TOMB_KEEP_MS = 180 * 86400000; // keep deletion markers for 180 days

  // ---------- merge (last change wins per record, deletions win over older changes) ----------
  function modOf(r) { return Number(r && r.mod) || Number(r && r.ts) || Number(r && r.createdAt) || 0; }

  function mergeRecords(a, b, tomb) {
    var byId = {};
    [a || [], b || []].forEach(function (list) {
      list.forEach(function (r) {
        if (!r || !r.id) return;
        var cur = byId[r.id];
        if (!cur || modOf(r) > modOf(cur)) byId[r.id] = r;
      });
    });
    return Object.keys(byId).filter(function (id) { return !(tomb[id] && tomb[id] >= modOf(byId[id])); }).map(function (id) { return byId[id]; });
  }

  function mergeTombstones(a, b, now) {
    var t = {};
    [a || {}, b || {}].forEach(function (src) {
      Object.keys(src).forEach(function (id) { var v = Number(src[id]) || 0; if (v > (t[id] || 0)) t[id] = v; });
    });
    Object.keys(t).forEach(function (id) { if (now - t[id] > TOMB_KEEP_MS) delete t[id]; });
    return t;
  }

  function merge(local, remote, now) {
    now = now || Date.now();
    local = local || {}; remote = remote || {};
    var tomb = mergeTombstones(local.tombstones, remote.tombstones, now);
    return {
      version: 2,
      updatedAt: now,
      currency: local.currency || remote.currency || null,
      learned: Object.assign({}, remote.learned || {}, local.learned || {}),
      tombstones: tomb,
      entries: mergeRecords(local.entries, remote.entries, tomb),
      events: mergeRecords(local.events, remote.events, tomb)
    };
  }

  // A cheap signature of a data set: which records exist and when each last changed.
  function fingerprint(data) {
    if (!data) return "";
    var parts = [];
    (data.entries || []).forEach(function (r) { parts.push("e:" + r.id + ":" + modOf(r)); });
    (data.events || []).forEach(function (r) { parts.push("v:" + r.id + ":" + modOf(r)); });
    Object.keys(data.tombstones || {}).forEach(function (id) { parts.push("t:" + id + ":" + data.tombstones[id]); });
    Object.keys(data.learned || {}).forEach(function (k) { parts.push("l:" + k + "=" + data.learned[k]); });
    return parts.sort().join("|");
  }

  // ---------- Google sign-in (OAuth 2.0 implicit flow, redirect back to the app) ----------
  function authUrl(clientId, redirectUri, state, silent) {
    var p = {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: SCOPE,
      include_granted_scopes: "true",
      state: state || ""
    };
    if (silent) p.prompt = "none";
    return "https://accounts.google.com/o/oauth2/v2/auth?" + Object.keys(p).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(p[k]); }).join("&");
  }

  // Parses "#access_token=...&expires_in=3599&state=..." (or "#error=...") after Google sends the person back.
  function parseHash(hash) {
    var h = String(hash || "").replace(/^#/, "");
    if (!h || (h.indexOf("access_token=") < 0 && h.indexOf("error=") < 0)) return null;
    var out = {};
    h.split("&").forEach(function (kv) {
      var i = kv.indexOf("=");
      var k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i)), v = i < 0 ? "" : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " "));
      out[k] = v;
    });
    if (out.expires_in) out.expires_in = parseInt(out.expires_in, 10) || 3600;
    return out;
  }

  // ---------- Drive app-data folder ----------
  function authFetch(token, url, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ Authorization: "Bearer " + token }, opts.headers || {});
    return fetch(url, opts).then(function (res) {
      if (res.status === 401) { var e = new Error("unauthorized"); e.code = "unauthorized"; throw e; }
      if (!res.ok) { var e2 = new Error("drive " + res.status); e2.code = "drive_" + res.status; throw e2; }
      return res;
    });
  }
  function driveFind(token) {
    var url = "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,modifiedTime)&q=" + encodeURIComponent("name='" + FILE_NAME + "' and trashed=false");
    return authFetch(token, url).then(function (r) { return r.json(); }).then(function (j) { return (j.files && j.files[0]) || null; });
  }
  function driveDownload(token, id) {
    return authFetch(token, "https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(id) + "?alt=media").then(function (r) { return r.json(); });
  }
  function driveUpload(token, id, data) {
    var body = JSON.stringify(data);
    if (id) {
      return authFetch(token, "https://www.googleapis.com/upload/drive/v3/files/" + encodeURIComponent(id) + "?uploadType=media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: body })
        .then(function (r) { return r.json(); }).then(function (j) { return j.id || id; });
    }
    var boundary = "pt" + Math.random().toString(36).slice(2);
    var meta = JSON.stringify({ name: FILE_NAME, parents: ["appDataFolder"], mimeType: "application/json" });
    var multipart = "--" + boundary + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" + meta + "\r\n--" + boundary + "\r\nContent-Type: application/json\r\n\r\n" + body + "\r\n--" + boundary + "--";
    return authFetch(token, "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", { method: "POST", headers: { "Content-Type": "multipart/related; boundary=" + boundary }, body: multipart })
      .then(function (r) { return r.json(); }).then(function (j) { return j.id; });
  }
  function revoke(token) {
    return fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(token), { method: "POST" }).catch(function () {});
  }

  return {
    FILE_NAME: FILE_NAME, SCOPE: SCOPE,
    modOf: modOf, merge: merge, mergeRecords: mergeRecords, mergeTombstones: mergeTombstones, fingerprint: fingerprint,
    authUrl: authUrl, parseHash: parseHash,
    driveFind: driveFind, driveDownload: driveDownload, driveUpload: driveUpload, revoke: revoke
  };
});
