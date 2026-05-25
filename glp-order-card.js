const GLP_ORDER_CARD_VERSION = '1.3.4';

function _esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function _safeUrl(url) {
  if (!url) return null;
  try { const u = new URL(url); return (u.protocol==='http:'||u.protocol==='https:') ? url : null; }
  catch { return null; }
}

const STYLES = `
  :host {
    --oc-bg:     var(--card-background-color, #1c1c1e);
    --oc-border: var(--divider-color, #3a3a3c);
    --oc-text:   var(--primary-text-color, #f5f5f5);
    --oc-sub:    var(--secondary-text-color, #8e8e93);
    --oc-accent: #ef4444;
    --oc-green:  #22c55e;
    --oc-amber:  #f59e0b;
  }
  .card {
    background: var(--oc-bg);
    border-radius: 12px;
    padding: 18px;
    font-family: var(--paper-font-body1_-_font-family, sans-serif);
    color: var(--oc-text);
  }
  .header {
    display: flex; align-items: center; gap: 8px;
    font-size: .9rem; font-weight: 600; color: var(--oc-sub);
    letter-spacing: .03em; margin-bottom: 16px;
  }
  .machine-off {
    background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2);
    border-radius: 10px; color: #ef4444; font-size: .85rem;
    text-align: center; padding: 14px;
  }

  /* Menu grid */
  .menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
    margin-bottom: 16px;
  }
  .menu-item {
    background: rgba(255,255,255,.04);
    border: 1px solid var(--oc-border);
    border-radius: 10px;
    padding: 12px 8px;
    text-align: center;
    cursor: pointer;
    transition: all .15s;
    user-select: none;
  }
  .menu-item:hover    { border-color: rgba(255,255,255,.2); background: rgba(255,255,255,.07); }
  .menu-item.selected { border-color: var(--oc-amber); background: rgba(245,158,11,.1); }
  .menu-item-emoji { font-size: 1.6rem; margin-bottom: 4px; }
  .menu-item-name  { font-size: .75rem; color: var(--oc-sub); }

  /* Order form */
  .order-form { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
  .note-input {
    background: rgba(255,255,255,.05); border: 1px solid var(--oc-border);
    border-radius: 8px; color: var(--oc-text); font-family: inherit;
    font-size: .85rem; padding: 8px 12px; outline: none; width: 100%; box-sizing: border-box;
  }
  .note-input:focus { border-color: rgba(255,255,255,.25); }
  .order-btn {
    width: 100%; padding: 12px; border: none; border-radius: 10px;
    font-size: .9rem; font-weight: 700; cursor: pointer;
    font-family: inherit; transition: all .15s;
    background: var(--oc-amber); color: #000;
  }
  .order-btn:disabled { opacity: .4; cursor: default; }
  .order-btn:not(:disabled):hover { filter: brightness(1.1); }

  /* Status card */
  .status-card {
    border-radius: 10px; padding: 14px 16px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .status-card.pending  { background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.25); }
  .status-card.accepted { background: rgba(34,197,94,.08);  border: 1px solid rgba(34,197,94,.25); }
  .status-card.done     { background: rgba(34,197,94,.06);  border: 1px solid rgba(34,197,94,.15); }
  .status-card.declined { background: rgba(239,68,68,.07);  border: 1px solid rgba(239,68,68,.2); }
  .status-item  { font-size: 1rem; font-weight: 700; }
  .status-line  { font-size: .82rem; color: var(--oc-sub); }
  .status-eta   { font-size: .85rem; font-weight: 600; color: var(--oc-green); }
  .status-decline { font-size: .82rem; color: var(--oc-accent); }
  .status-done-msg { font-size: .9rem; font-weight: 700; color: var(--oc-green); }
  .shot-summary {
    margin-top: 10px;
    background: rgba(255,255,255,.03);
    border: 1px solid var(--oc-border);
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .shot-summary-meta {
    display: flex;
    gap: 14px;
    font-size: .8rem;
    color: var(--oc-sub);
  }
  .shot-summary-profile {
    font-size: .82rem;
    font-weight: 600;
    color: var(--oc-text);
  }
  .shot-sparkline { width: 100%; height: 42px; display: block; }
  .new-order-btn {
    margin-top: 10px; background: none; border: 1px solid var(--oc-border);
    border-radius: 8px; color: var(--oc-sub); font-family: inherit;
    font-size: .8rem; padding: 7px 14px; cursor: pointer; transition: all .15s;
  }
  .new-order-btn:hover { border-color: rgba(255,255,255,.25); color: var(--oc-text); }
  .loading { color: var(--oc-sub); font-size: .85rem; text-align: center; padding: 16px 0; }
`;

const STRINGS = {
  de: {
    title: 'Bestellen',
    off:    'Maschine aus — Bestellung nicht möglich',
    paused: 'Bestellungen momentan pausiert',
    order_btn: (item) => `☕ ${item} bestellen`,
    order_btn_select: 'Getränk auswählen',
    note_ph: 'Notiz (optional) …',
    pending: (item) => `⏳ ${item} — wartet auf Bestätigung`,
    accepted: (item, min) => `☕ ${item} — fertig in ~${min} Min`,
    done: (item) => `✓ ${item} ist fertig!`,
    declined: (item) => `✕ ${item} wurde abgelehnt`,
    decline_reason: (r) => `Grund: ${r}`,
    new_order: '+ Neue Bestellung',
    loading: 'Lade …',
    no_menu: 'Noch kein Menü konfiguriert',
  },
  en: {
    title: 'Order',
    off:    'Machine is off — ordering not available',
    paused: 'Orders are currently paused',
    order_btn: (item) => `☕ Order ${item}`,
    order_btn_select: 'Select a drink',
    note_ph: 'Note (optional) …',
    pending: (item) => `⏳ ${item} — waiting for confirmation`,
    accepted: (item, min) => `☕ ${item} — ready in ~${min} min`,
    done: (item) => `✓ ${item} is ready!`,
    declined: (item) => `✕ ${item} was declined`,
    decline_reason: (r) => `Reason: ${r}`,
    new_order: '+ New Order',
    loading: 'Loading …',
    no_menu: 'No menu configured yet',
  },
};

function _s(key, lang, ...args) {
  const tr = STRINGS[lang] || STRINGS.en;
  const val = tr[key] ?? STRINGS.en[key] ?? key;
  return typeof val === 'function' ? val(...args) : val;
}

class GlpOrderCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._token     = null;
    this._menu      = null;
    this._enabled   = true;
    this._selected  = null;
    this._activeOrder = null;
    this._lastShot  = null;
    this._pollTimer = null;
    this._submitting = false;
    this._ingressRefreshed = null;
    this._lang = navigator.language.slice(0,2).toLowerCase();
    if (!STRINGS[this._lang]) this._lang = 'en';
  }

  setConfig(config) {
    this._config = { title: null, switch_entity: null, ...config };
  }

  _getBase() {
    const url = this._config?.glp_url;
    if (url) return _safeUrl(url.replace(/\/$/, ''));
    // Auto-detect: card runs inside HA browser, use ingress path (no token needed)
    return window.location.origin + '/api/hassio_ingress/gaggiuino_local_profiler';
  }

  _getSwitchEntity() {
    if (this._config?.switch_entity) return this._config.switch_entity;
    if (!this._hass) return null;
    const found = Object.keys(this._hass.states).find(id => id.endsWith('_machine_status'));
    return found ? (this._hass.states[found]?.attributes?.switch_entity || null) : null;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() { this._startPoll(); }
  disconnectedCallback() { this._stopPoll(); }

  _startPoll() {
    this._stopPoll();
    this._load();
    this._pollTimer = setInterval(() => this._loadStatus(), 10000);
  }
  _stopPoll() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  }

  _useIngress() { return !this._config?.glp_url; }

  // HA Supervisor requires an ingress session cookie for XHR requests made from
  // outside the ingress iframe (e.g. a Lovelace card). Without it, HA returns 503.
  async _ensureIngress() {
    if (!this._useIngress()) return;
    const token = this._hass?.auth?.data?.access_token;
    if (!token) return;
    if (this._ingressRefreshed && Date.now() - this._ingressRefreshed < 30000) return;
    try {
      await fetch('/api/hassio/ingress/session', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      this._ingressRefreshed = Date.now();
    } catch {}
  }

  async _ensureToken() {
    if (this._useIngress()) return null; // ingress bypasses token check
    if (this._token) return this._token;
    try {
      const d = await fetch(`${this._getBase()}/api/status`).then(r => r.json());
      this._token = d.apiToken || null;
    } catch {}
    return this._token;
  }

  async _fetch(path, opts = {}) {
    const token = await this._ensureToken();
    if (token) opts = { ...opts, headers: { ...opts.headers, 'X-GLP-Token': token } };
    return fetch(`${this._getBase()}/${path}`, opts);
  }

  async _load() {
    await this._ensureIngress();
    try {
      const [menuRes, settingsRes] = await Promise.all([
        this._fetch('api/orders/menu'),
        this._fetch('api/orders/settings'),
      ]);
      if (menuRes.status === 404 && settingsRes.status === 404) {
        // Feature disabled at add-on level
        this._menu    = [];
        this._enabled = false;
      } else if (menuRes.ok && settingsRes.ok) {
        const menu     = await menuRes.json();
        const settings = await settingsRes.json();
        this._menu    = Array.isArray(menu) ? menu : [];
        this._enabled = settings?.enabled !== false;
      }
      // else: other non-ok (401, 500 …) — leave _menu = null so _loadStatus retries
    } catch { /* network error — keep this._menu = null so _loadStatus retries */ }
    await this._loadStatus(true);
    this._render();
  }

  async _loadStatus(fromLoad = false) {
    // If initial _load() failed (menu still null), retry the full load instead of just status
    if (!fromLoad && this._menu === null) {
      await this._load();
      return;
    }
    if (!this._hass) return;
    const haUser = this._hass.user;
    if (!haUser) return;
    // Keep ingress session alive; throttled to once per 30 s
    if (!fromLoad) await this._ensureIngress();
    // Re-check enabled/paused state on every periodic poll so barista toggle changes
    // are picked up within 10 s without requiring a page reload
    if (!fromLoad) {
      try {
        const sr = await this._fetch('api/orders/settings');
        if (sr.ok) this._enabled = (await sr.json())?.enabled !== false;
      } catch {}
    }
    try {
      const orders = await this._fetch(`api/orders/mine?haUserId=${encodeURIComponent(haUser.id)}`).then(r => r.json());
      const active = orders.find(o => ['pending','accepted'].includes(o.status));
      const recent = !active ? orders.find(o => ['done','declined'].includes(o.status) && (Date.now() - (o.completedAt||0)) < 120000) : null;
      this._activeOrder = active || recent || null;
      if (this._activeOrder?.status === 'done' && !this._lastShot) {
        try {
          const shotId = this._activeOrder.shotId;
          const path = shotId ? `api/shots/${encodeURIComponent(shotId)}` : 'api/shots/last';
          this._lastShot = await this._fetch(path).then(r => r.json());
        } catch { this._lastShot = null; }
      } else if (!this._activeOrder || this._activeOrder.status !== 'done') {
        this._lastShot = null;
      }
    } catch { this._activeOrder = null; this._lastShot = null; }
    this._render();
  }

  _machineOff() {
    const entity = this._getSwitchEntity();
    if (!entity || !this._hass) return false;
    const s = this._hass.states[entity];
    return s?.state === 'off' || s?.state === 'unavailable';
  }

  _render() {
    if (!this._config) return;
    const lang  = this._lang;
    const title = this._config.title || _s('title', lang);
    const off   = this._machineOff();

    let body = '';

    if (off) {
      body = `<div class="machine-off">${_s('off', lang)}</div>`;
    } else if (!this._enabled) {
      body = `<div class="machine-off">${_s('paused', lang)}</div>`;
    } else if (this._activeOrder) {
      body = this._renderStatus(this._activeOrder, lang);
    } else if (this._menu === null) {
      body = `<div class="loading">${_s('loading', lang)}</div>`;
    } else {
      body = this._renderOrderForm(lang);
    }

    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <ha-card>
        <div class="card">
          <div class="header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21v-2h2V3h14v2h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2v6h2v2H2zm4-2h8V5H6v14zm10-6h2V7h-2v6z"/>
            </svg>
            ${_esc(title)}
          </div>
          ${body}
        </div>
      </ha-card>`;

    this._bindEvents();
  }

  _renderOrderForm(lang) {
    if (!this._menu || this._menu.length === 0) {
      return `<div class="loading">${_s('no_menu', lang)}</div>`;
    }
    const items = this._menu.map(m => `
      <div class="menu-item${this._selected === m.name ? ' selected' : ''}" data-item="${_esc(m.name)}">
        <div class="menu-item-emoji">${_esc(m.emoji)}</div>
        <div class="menu-item-name">${_esc(m.name)}</div>
      </div>`).join('');

    const btnLabel = this._selected ? _s('order_btn', lang, this._selected) : _s('order_btn_select', lang);
    return `
      <div class="order-form">
        <div class="menu-grid">${items}</div>
        <input class="note-input" id="oc-note" placeholder="${_s('note_ph', lang)}" maxlength="200">
        <button class="order-btn" id="oc-submit" ${!this._selected || this._submitting ? 'disabled' : ''}>
          ${_esc(btnLabel)}
        </button>
      </div>`;
  }

  _sparklineSvg(shot) {
    const raw = shot?.datapoints?.pressure;
    if (!Array.isArray(raw) || raw.length < 4) return '';
    const vals = raw.map(v => v / 10);
    const W = 240, H = 40, pad = 2;
    const minV = Math.min(...vals), maxV = Math.max(...vals) || 1;
    const pts = vals.map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
      const y = H - pad - ((v - minV) / (maxV - minV)) * (H - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<svg class="shot-sparkline" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <polyline points="${pts}" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`;
  }

  _renderShotSummary(shot, lang) {
    if (!shot) return '';
    const profile  = shot.profile?.name || shot.profileName || '–';
    const dur      = shot.duration ? `${(shot.duration / 10).toFixed(0)} s` : null;
    const wtArr    = shot.datapoints?.shotWeight || shot.datapoints?.weight;
    const yield_g  = Array.isArray(wtArr) && wtArr.length ? `${(wtArr[wtArr.length - 1] / 10).toFixed(1)} g` : null;
    const meta     = [dur, yield_g].filter(Boolean).join(' · ');
    const sparkline = this._sparklineSvg(shot);
    return `<div class="shot-summary">
      <div class="shot-summary-profile">${_esc(profile)}</div>
      ${meta ? `<div class="shot-summary-meta">${_esc(meta)}</div>` : ''}
      ${sparkline}
    </div>`;
  }

  _renderStatus(order, lang) {
    let content = '';
    const item = _esc(order.item);

    if (order.status === 'pending') {
      content = `<div class="status-card pending">
        <div class="status-item">${_esc(_s('pending', lang, order.item))}</div>
      </div>`;
    } else if (order.status === 'accepted') {
      const etaDone   = order.acceptedAt + order.eta * 60000;
      const minsLeft  = Math.max(0, Math.ceil((etaDone - Date.now()) / 60000));
      content = `<div class="status-card accepted">
        <div class="status-item">${_esc(_s('accepted', lang, order.item, minsLeft))}</div>
        <div class="status-eta">${minsLeft === 0 ? '🎉 Gleich fertig!' : `~${minsLeft} min`}</div>
      </div>`;
    } else if (order.status === 'done') {
      const shotHtml = this._renderShotSummary(this._lastShot, lang);
      content = `<div class="status-card done">
        <div class="status-done-msg">${_esc(_s('done', lang, order.item))}</div>
      </div>${shotHtml}`;
    } else if (order.status === 'declined') {
      content = `<div class="status-card declined">
        <div class="status-item">${_esc(_s('declined', lang, order.item))}</div>
        ${order.declineReason ? `<div class="status-decline">${_esc(_s('decline_reason', lang, order.declineReason))}</div>` : ''}
      </div>`;
    }

    return `${content}<button class="new-order-btn" id="oc-new-order">${_s('new_order', lang)}</button>`;
  }

  _bindEvents() {
    // Menu item selection
    this.shadowRoot.querySelectorAll('.menu-item').forEach(el => {
      el.addEventListener('click', () => {
        this._selected = this._selected === el.dataset.item ? null : el.dataset.item;
        this._render();
      });
    });
    // Submit
    const submitBtn = this.shadowRoot.getElementById('oc-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this._placeOrder());
    }
    // New order
    const newBtn = this.shadowRoot.getElementById('oc-new-order');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        this._activeOrder = null;
        this._selected    = null;
        this._render();
      });
    }
  }

  async _placeOrder() {
    if (!this._selected || this._submitting) return;
    const noteEl = this.shadowRoot.getElementById('oc-note');
    const note   = noteEl?.value?.trim() || '';
    const haUser = this._hass?.user;
    if (!haUser) return;

    this._submitting = true;
    this._render();

    try {
      const order = await this._fetch('api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item:     this._selected,
          note,
          customer: haUser.name,
          haUserId: haUser.id,
        }),
      }).then(r => r.json());

      if (order.id) {
        this._activeOrder = order;
        this._selected    = null;
      }
    } catch {}
    this._submitting = false;
    this._render();
  }

  getCardSize() { return 3; }

  static getConfigElement() { return document.createElement('glp-order-card-editor'); }
  static getStubConfig()    { return {}; }
}

customElements.define('glp-order-card', GlpOrderCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type:        'glp-order-card',
  name:        'GLP Order Card',
  description: 'Customer-facing order card for Gaggiuino Local Profiler',
  preview:     false,
  documentationURL: 'https://github.com/mxkissnr/glp-order-card',
});

console.info(`%c GLP-ORDER-CARD %c v${GLP_ORDER_CARD_VERSION} `, 'background:#f59e0b;color:#000;padding:2px 4px;border-radius:3px 0 0 3px', 'background:#1c1c1e;color:#f59e0b;padding:2px 4px;border-radius:0 3px 3px 0');
