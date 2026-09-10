// Lightweight i18n runtime. Reads packs from window.U12_I18N (i18n/strings.js),
// merges the active locale over English, and falls back to English per key.
(function () {
  var BASE = 'en';
  var SUPPORTED = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl'];
  var KEY = 'u12-locale';
  var packs = window.U12_I18N || {};

  function detect() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved && SUPPORTED.indexOf(saved) >= 0) return saved;
    } catch (e) {}
    var list = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || BASE];
    for (var i = 0; i < list.length; i++) {
      var base = String(list[i] || '').toLowerCase().split('-')[0];
      if (SUPPORTED.indexOf(base) >= 0) return base;
    }
    return BASE;
  }

  function plainObj(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
  }

  // Deep merge: `over` wins, but empty strings and absent keys keep the base value.
  function merge(base, over) {
    if (!plainObj(base)) return over == null ? base : over;
    var out = {};
    for (var k in base) out[k] = base[k];
    if (plainObj(over)) {
      for (var j in over) {
        var b = out[j], o = over[j];
        if (o == null || o === '') continue;
        out[j] = (plainObj(b) && plainObj(o)) ? merge(b, o) : o;
      }
    }
    return out;
  }

  function lookup(obj, key) {
    var parts = String(key).split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (!cur || typeof cur !== 'object') return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function fill(str, vars) {
    if (!vars) return str;
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      return vars[k] == null ? m : String(vars[k]);
    });
  }

  function countLeaves(obj) {
    var n = 0;
    for (var k in obj) {
      if (k.charAt(0) === '$') continue;
      var v = obj[k];
      if (typeof v === 'string') n++;
      else if (plainObj(v)) n += countLeaves(v);
    }
    return n;
  }

  var api = {
    BASE: BASE,
    SUPPORTED: SUPPORTED,
    STORAGE_KEY: KEY,
    packs: packs,
    locale: BASE,
    strings: {},

    build: function () {
      this.strings = merge(packs[BASE] || {}, packs[this.locale] || {});
      try { document.documentElement.lang = this.locale; } catch (e) {}
      return this.strings;
    },

    set: function (loc) {
      if (SUPPORTED.indexOf(loc) < 0) return this.locale;
      this.locale = loc;
      try { localStorage.setItem(KEY, loc); } catch (e) {}
      this.build();
      return loc;
    },

    // Resolved string for a dotted key. Objects with plural categories are
    // selected via Intl.PluralRules using vars.n.
    t: function (key, vars) {
      var v = lookup(this.strings, key);
      if (plainObj(v)) {
        var cat = 'other';
        try { cat = new Intl.PluralRules(this.locale).select(Number(vars && vars.n)); } catch (e) {}
        v = v[cat] != null ? v[cat] : (v.other != null ? v.other : v.one);
      }
      if (typeof v !== 'string') {
        if (window.console) console.warn('[i18n] missing key: ' + key);
        return '';
      }
      return fill(v, vars);
    },

    // Locale list for the settings selector, with translation coverage.
    catalogue: function () {
      var baseCount = countLeaves(packs[BASE] || {}) || 1;
      return SUPPORTED.map(function (code) {
        var pack = packs[code] || {};
        var meta = pack.$meta || {};
        var done = code === BASE ? baseCount : countLeaves(pack);
        return {
          code: code,
          name: meta.name || code,
          englishName: meta.englishName || code,
          coverage: Math.round((done / baseCount) * 100)
        };
      });
    },

    // Localised short date, e.g. "9 Sep".
    date: function (value) {
      var d = value instanceof Date ? value : new Date(value);
      if (isNaN(d.getTime())) return '';
      try {
        return new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'short' }).format(d);
      } catch (e) {
        return d.toDateString();
      }
    },

    // Content translations live alongside the content: a drill or category may
    // carry an `i18n` block keyed by locale. Missing fields fall back to the
    // base field, so untranslated content still reads correctly.
    content: function (item, field) {
      if (!item) return '';
      var block = item.i18n && item.i18n[this.locale];
      var v = block ? block[field] : undefined;
      if (v == null || v === '') v = item[field];
      return v == null ? '' : v;
    }
  };

  api.locale = detect();
  api.build();
  window.I18N = api;
})();
