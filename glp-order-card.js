const GLP_ORDER_CARD_VERSION = '1.16.0';

// Menu items younger than this show the NEW badge (config: new_badge_days)
const NEW_BADGE_DAYS_DEFAULT = 7;

function _esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// Origin: since GLP app 1.96.0 an ISO 3166-1 alpha-2 code — render flag emoji
// + localized country name; legacy free-text values render as-is. Since GLP
// app 1.120.0 a bean can have multiple origins (a blend, each with an
// optional weighting percent) — `origins` here is always an array of
// {code, percent?}; a single origin is just the one-element case. Mirrors
// originDisplay() in the app's own public-src/views/library.js.
function _originHtml(origins, lang) {
  return origins.map(o => {
    const raw = o?.code;
    if (typeof raw !== 'string' || !/^[A-Z]{2}$/.test(raw.trim())) return _esc(raw);
    const code = raw.trim();
    const flag = String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
    let name = code;
    try { name = new Intl.DisplayNames([lang || 'en'], { type: 'region' }).of(code) || code; } catch {}
    const label = `${flag} ${_esc(name)}`;
    return o.percent != null ? `${label} ${o.percent}%` : label;
  }).join(' + ');
}

function _safeUrl(url) {
  if (!url) return null;
  try { const u = new URL(url); return (u.protocol==='http:'||u.protocol==='https:') ? url : null; }
  catch { return null; }
}

const STYLES = `
  :host {
    --oc-bg:       #111113;
    --oc-surface:  rgba(255,255,255,.055);
    --oc-surface2: rgba(255,255,255,.03);
    --oc-border:   rgba(255,255,255,.08);
    --oc-text:     #f2f2f7;
    --oc-sub:      #8e8e93;
    --oc-accent:   #ff3b30;
    --oc-amber:    #ff9f0a;
    --oc-green:    #30d158;
  }
  ha-card {
    background: var(--oc-bg);
    border: 1px solid var(--oc-border);
    border-radius: 20px;
    overflow: hidden;
  }
  .card {
    background: var(--oc-bg);
    border-radius: 20px;
    padding: 20px;
    font-family: var(--paper-font-body1_-_font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
    color: var(--oc-text);
  }
  .header {
    display: flex; align-items: center; gap: 8px;
    font-size: .8rem; font-weight: 700; color: var(--oc-sub);
    letter-spacing: .08em; text-transform: uppercase; margin-bottom: 18px;
  }
  .machine-off {
    background: linear-gradient(180deg, rgba(255,59,48,.10), rgba(255,59,48,.04));
    border: 1px solid rgba(255,59,48,.22);
    border-radius: 14px; color: #ff6b61; font-size: .85rem; font-weight: 600;
    text-align: center; padding: 16px;
  }

  /* Menu grid */
  .menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 10px;
    margin-bottom: 16px;
  }
  .menu-item {
    position: relative;
    background: var(--oc-surface);
    border: 1px solid var(--oc-border);
    border-radius: 16px;
    padding: 14px 8px;
    text-align: center;
    cursor: pointer;
    transition: transform .18s cubic-bezier(.25,.46,.45,.94), border-color .18s, background .18s, box-shadow .18s;
    user-select: none;
    overflow: hidden;
  }
  .menu-item::before {
    content: ''; position: absolute; inset: 0 0 auto 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.14), transparent);
  }
  .menu-item:hover { transform: translateY(-2px); border-color: rgba(255,255,255,.18); background: rgba(255,255,255,.08); }
  .menu-item.selected {
    border-color: rgba(255,159,10,.55);
    background: linear-gradient(180deg, rgba(255,159,10,.16), rgba(255,159,10,.05));
    box-shadow: 0 0 0 1px rgba(255,159,10,.25), 0 6px 18px -8px rgba(255,159,10,.5);
  }
  .menu-item-emoji { font-size: 1.9rem; margin-bottom: 5px; line-height: 1; }
  .menu-item-name  { font-size: .72rem; font-weight: 500; color: var(--oc-sub); }
  .menu-item.selected .menu-item-name { color: var(--oc-text); }

  /* Order form */
  .order-form { display: flex; flex-direction: column; gap: 12px; margin-bottom: 4px; }
  .note-input {
    background: var(--oc-surface2); border: 1px solid var(--oc-border);
    border-radius: 12px; color: var(--oc-text); font-family: inherit;
    font-size: .85rem; padding: 11px 14px; outline: none; width: 100%; box-sizing: border-box;
    transition: border-color .18s, background .18s;
  }
  .note-input::placeholder { color: var(--oc-sub); }
  .note-input:focus { border-color: rgba(255,159,10,.45); background: rgba(255,255,255,.05); }
  .order-btn {
    width: 100%; padding: 14px; border: none; border-radius: 14px;
    font-size: .92rem; font-weight: 800; letter-spacing: .01em; cursor: pointer;
    font-family: inherit; color: #1a1205;
    background: linear-gradient(180deg, #ffb340, #ff9f0a);
    box-shadow: 0 8px 20px -8px rgba(255,159,10,.6);
    transition: transform .15s, box-shadow .15s, opacity .15s, background .15s;
  }
  .order-btn:disabled { opacity: .4; cursor: default; background: var(--oc-surface); color: var(--oc-sub); box-shadow: none; }
  .order-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 10px 26px -8px rgba(255,159,10,.7); }
  .order-btn:not(:disabled):active { transform: translateY(0); }

  /* Status card */
  .status-card {
    position: relative; border-radius: 16px; padding: 16px 18px;
    display: flex; flex-direction: column; gap: 7px; overflow: hidden;
    animation: oc-fade .3s ease-out both;
  }
  @keyframes oc-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  .status-card.pending  { background: linear-gradient(180deg, rgba(255,159,10,.12), rgba(255,159,10,.04)); border: 1px solid rgba(255,159,10,.28); }
  .status-card.accepted { background: linear-gradient(180deg, rgba(48,209,88,.12), rgba(48,209,88,.04)); border: 1px solid rgba(48,209,88,.28); }
  .status-card.done     { background: linear-gradient(180deg, rgba(48,209,88,.10), rgba(48,209,88,.03)); border: 1px solid rgba(48,209,88,.2); }
  .status-card.declined { background: linear-gradient(180deg, rgba(255,59,48,.10), rgba(255,59,48,.03)); border: 1px solid rgba(255,59,48,.22); }
  .status-item  { font-size: 1.02rem; font-weight: 700; letter-spacing: -.01em; }
  .status-line  { font-size: .82rem; color: var(--oc-sub); }
  .status-eta   { font-size: .9rem; font-weight: 700; color: var(--oc-green); }
  .status-card.accepted .status-eta { animation: oc-pulse 2s ease-in-out infinite; }
  @keyframes oc-pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
  .status-decline { font-size: .82rem; color: #ff6b61; }
  .status-done-msg { font-size: .95rem; font-weight: 800; color: var(--oc-green); letter-spacing: -.01em; }
  .shot-summary {
    margin-top: 12px;
    background: var(--oc-surface2);
    border: 1px solid var(--oc-border);
    border-radius: 14px;
    padding: 14px 16px;
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
    font-size: .85rem;
    font-weight: 700;
    color: var(--oc-text);
  }
  .shot-chart { width: 100%; height: 80px; display: block; }
  .shot-chart-legend { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
  .shot-chart-legend-item { display: flex; align-items: center; gap: 5px; font-size: .68rem; color: var(--oc-sub); }
  .shot-chart-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .menu-badge { display: inline-block; font-size: .58rem; font-weight: 800; padding: 1px 5px; border-radius: 5px; vertical-align: middle; margin-left: 4px; line-height: 1.5; letter-spacing: .03em; }
  .menu-badge-new { background: rgba(48,209,88,.18); color: var(--oc-green); border: 1px solid rgba(48,209,88,.3); }
  .menu-badge-trend { background: rgba(255,59,48,.15); color: #ff7a70; border: 1px solid rgba(255,59,48,.25); }
  .menu-section-title { font-size: .64rem; font-weight: 800; color: var(--oc-sub); letter-spacing: .09em; text-transform: uppercase; margin: 0 0 8px; }
  .new-order-btn {
    margin-top: 12px; width: 100%; background: var(--oc-surface); border: 1px solid var(--oc-border);
    border-radius: 12px; color: var(--oc-sub); font-family: inherit; font-weight: 600;
    font-size: .8rem; padding: 9px 14px; cursor: pointer; transition: all .15s;
  }
  .new-order-btn:hover { border-color: rgba(255,255,255,.22); color: var(--oc-text); background: rgba(255,255,255,.07); }
  .loading { color: var(--oc-sub); font-size: .85rem; text-align: center; padding: 20px 0; }

  /* Variant picker */
  .variant-label { font-size: .64rem; font-weight: 800; color: var(--oc-sub); letter-spacing: .08em; text-transform: uppercase; margin: 2px 0 8px; }
  .variant-grid { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 4px; }
  .variant-chip {
    background: var(--oc-surface); border: 1px solid var(--oc-border);
    border-radius: 20px; padding: 6px 15px; font-size: .8rem; cursor: pointer;
    color: var(--oc-sub); transition: all .15s; user-select: none;
  }
  .variant-chip:hover { border-color: rgba(255,255,255,.2); color: var(--oc-text); }
  .variant-chip.selected { border-color: rgba(255,159,10,.55); background: rgba(255,159,10,.14); color: var(--oc-text); font-weight: 700; }

  /* Bean description info box (shown when a bean variant is selected) */
  .bean-info {
    background: var(--oc-surface); border: 1px solid var(--oc-border);
    border-radius: 10px; padding: 9px 12px; margin: 2px 0 6px;
    font-size: .74rem; line-height: 1.45; color: var(--oc-sub);
  }
  .bean-info-notes { color: var(--oc-text); font-style: italic; margin-bottom: 3px; }
  .bean-info-row { display: flex; gap: 6px; }
  .bean-info-label {
    font-weight: 800; font-size: .6rem; letter-spacing: .07em; text-transform: uppercase;
    color: var(--oc-sub); flex-shrink: 0; padding-top: 1px;
  }
`;

const STRINGS = {
  de: {
    title: 'Bestellen',
    off:    'Maschine aus — Bestellung nicht möglich',
    paused: 'Bestellungen momentan pausiert',
    order_btn: (item) => `☕ ${item} bestellen`,
    order_btn_select: 'Getränk auswählen',
    variant_select: 'Variante wählen',
    variant_label: 'Variante',
    bean_origin: 'Herkunft',
    bean_variety: 'Varietät',
    bean_process: 'Aufbereitung',
    almost_ready: '🎉 Gleich fertig!',
    note_ph: 'Notiz (optional) …',
    pending: (item) => `⏳ ${item} — wartet auf Bestätigung`,
    queue_pos: (pos, eta) => `Pos. ${pos} in der Warteschlange · ~${eta} Min`,
    accepted: (item, min) => `☕ ${item} — fertig in ~${min} Min`,
    done: (item) => `✓ ${item} ist fertig!`,
    declined: (item) => `✕ ${item} wurde abgelehnt`,
    decline_reason: (r) => `Grund: ${r}`,
    new_order: '+ Neue Bestellung',
    loading: 'Lade …',
    no_menu: 'Noch kein Menü konfiguriert',
    menu_all: 'Alle Getränke',
  },
  en: {
    title: 'Order',
    off:    'Machine is off — ordering not available',
    paused: 'Orders are currently paused',
    order_btn: (item) => `☕ Order ${item}`,
    order_btn_select: 'Select a drink',
    variant_select: 'Select variant',
    variant_label: 'Variant',
    bean_origin: 'Origin',
    bean_variety: 'Variety',
    bean_process: 'Process',
    almost_ready: '🎉 Almost ready!',
    note_ph: 'Note (optional) …',
    pending: (item) => `⏳ ${item} — waiting for confirmation`,
    queue_pos: (pos, eta) => `Position ${pos} in queue · ~${eta} min`,
    accepted: (item, min) => `☕ ${item} — ready in ~${min} min`,
    done: (item) => `✓ ${item} is ready!`,
    declined: (item) => `✕ ${item} was declined`,
    decline_reason: (r) => `Reason: ${r}`,
    new_order: '+ New Order',
    loading: 'Loading …',
    no_menu: 'No menu configured yet',
    menu_all: 'All drinks',
  },
  it: {
    title: 'Ordina',
    off:    'Macchina spenta — ordine non disponibile',
    paused: 'Ordini momentaneamente in pausa',
    order_btn: (item) => `☕ Ordina ${item}`,
    order_btn_select: 'Seleziona una bevanda',
    variant_select: 'Seleziona variante',
    variant_label: 'Variante',
    bean_origin: 'Origine',
    bean_variety: 'Varietà',
    bean_process: 'Lavorazione',
    almost_ready: '🎉 Quasi pronto!',
    note_ph: 'Nota (opzionale) …',
    pending: (item) => `⏳ ${item} — in attesa di conferma`,
    queue_pos: (pos, eta) => `Posizione ${pos} in coda · ~${eta} min`,
    accepted: (item, min) => `☕ ${item} — pronto tra ~${min} min`,
    done: (item) => `✓ ${item} è pronto!`,
    declined: (item) => `✕ ${item} è stato rifiutato`,
    decline_reason: (r) => `Motivo: ${r}`,
    new_order: '+ Nuovo ordine',
    loading: 'Caricamento …',
    no_menu: 'Nessun menu configurato ancora',
    menu_all: 'Tutte le bevande',
  },
  fr: {
    title: 'Commander',
    off:    'Machine éteinte — commande impossible',
    paused: 'Commandes actuellement en pause',
    order_btn: (item) => `☕ Commander ${item}`,
    order_btn_select: 'Choisir une boisson',
    variant_select: 'Choisir la variante',
    variant_label: 'Variante',
    bean_origin: 'Origine',
    bean_variety: 'Variété',
    bean_process: 'Traitement',
    almost_ready: '🎉 Presque prêt !',
    note_ph: 'Note (facultatif) …',
    pending: (item) => `⏳ ${item} — en attente de confirmation`,
    queue_pos: (pos, eta) => `Position ${pos} dans la file · ~${eta} min`,
    accepted: (item, min) => `☕ ${item} — prêt dans ~${min} min`,
    done: (item) => `✓ ${item} est prêt !`,
    declined: (item) => `✕ ${item} a été refusé`,
    decline_reason: (r) => `Raison : ${r}`,
    new_order: '+ Nouvelle commande',
    loading: 'Chargement …',
    no_menu: 'Aucun menu configuré pour le moment',
    menu_all: 'Toutes les boissons',
  },
  es: {
    title: 'Pedir',
    off:    'Máquina apagada — no se puede pedir',
    paused: 'Los pedidos están pausados por ahora',
    order_btn: (item) => `☕ Pedir ${item}`,
    order_btn_select: 'Selecciona una bebida',
    variant_select: 'Selecciona variante',
    variant_label: 'Variante',
    bean_origin: 'Origen',
    bean_variety: 'Variedad',
    bean_process: 'Proceso',
    almost_ready: '🎉 ¡Casi listo!',
    note_ph: 'Nota (opcional) …',
    pending: (item) => `⏳ ${item} — esperando confirmación`,
    queue_pos: (pos, eta) => `Posición ${pos} en la cola · ~${eta} min`,
    accepted: (item, min) => `☕ ${item} — listo en ~${min} min`,
    done: (item) => `✓ ¡${item} está listo!`,
    declined: (item) => `✕ ${item} fue rechazado`,
    decline_reason: (r) => `Motivo: ${r}`,
    new_order: '+ Nuevo pedido',
    loading: 'Cargando …',
    no_menu: 'Aún no hay menú configurado',
    menu_all: 'Todas las bebidas',
  },
  nl: {
    title: 'Bestellen',
    off:    'Machine uit — bestellen niet mogelijk',
    paused: 'Bestellingen zijn momenteel gepauzeerd',
    order_btn: (item) => `☕ ${item} bestellen`,
    order_btn_select: 'Kies een drankje',
    variant_select: 'Variant kiezen',
    variant_label: 'Variant',
    bean_origin: 'Herkomst',
    bean_variety: 'Variëteit',
    bean_process: 'Verwerking',
    almost_ready: '🎉 Bijna klaar!',
    note_ph: 'Notitie (optioneel) …',
    pending: (item) => `⏳ ${item} — wacht op bevestiging`,
    queue_pos: (pos, eta) => `Positie ${pos} in de wachtrij · ~${eta} min`,
    accepted: (item, min) => `☕ ${item} — klaar over ~${min} min`,
    done: (item) => `✓ ${item} is klaar!`,
    declined: (item) => `✕ ${item} is afgewezen`,
    decline_reason: (r) => `Reden: ${r}`,
    new_order: '+ Nieuwe bestelling',
    loading: 'Laden …',
    no_menu: 'Nog geen menu ingesteld',
    menu_all: 'Alle drankjes',
  },
};

// Interpolates ...args raw into the translation string — NOT escaped here.
// Every call site must wrap the result in _esc() before it reaches innerHTML.
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
    this._selectedVariant = null;
    this._activeBeans = null;
    this._activeOrder = null;
    this._lastShot  = null;
    this._pollTimer = null;
    this._submitting = false;
    this._noteInteracting = false;
    this._pendingRender   = false;
    this._clickBlocked    = false;
    this._queueEta        = null;
    this._clickBlockTimer = null;
    this._hassRenderTimer = null;
    this._lang = navigator.language.slice(0,2).toLowerCase();
    if (!STRINGS[this._lang]) this._lang = 'en';
  }

  setConfig(config) {
    this._config = { title: null, switch_entity: null, glp_token: null, machine: null, ...config };
    // Allow explicit token override in YAML for direct-URL mode
    if (config.glp_token) this._token = String(config.glp_token);
  }

  _getBase() {
    const url = this._config?.glp_url;
    if (url) return _safeUrl(url.replace(/\/$/, ''));
    // Auto-detect: card runs inside HA browser, use ingress path (no token needed)
    return window.location.origin + '/api/hassio_ingress/gaggiuino_local_profiler';
  }

  // machine (#29): optional config option for setups with more than one GLP
  // machine (the app's multi-machine mode, GLP #317). Ingress stays bound to
  // the one app instance regardless (see README — a documented limitation,
  // not a bug: there's still only one add-on), but `_getSwitchEntity()`
  // resolution and the order payload's `machine` field use it to target the
  // right machine's switch/queue display. Falls back to the previous "first
  // *_machine_status entity" behavior when unset, so existing single-machine
  // cards are unaffected.
  _findMachineStatusEntity() {
    if (!this._hass) return null;
    const candidates = Object.keys(this._hass.states).filter(id => id.endsWith('_machine_status'));
    if (this._config?.machine) {
      const needle = String(this._config.machine).toLowerCase();
      const needleSlug = needle.replace(/\s+/g, '_');
      const matched = candidates.find(id =>
        this._hass.states[id]?.attributes?.friendly_name?.toLowerCase().includes(needle) ||
        id.toLowerCase().includes(needleSlug));
      if (matched) return matched;
    }
    return candidates[0] || null;
  }

  _getSwitchEntity() {
    if (this._config?.switch_entity) return this._config.switch_entity;
    const found = this._findMachineStatusEntity();
    return found ? (this._hass.states[found]?.attributes?.switch_entity || null) : null;
  }

  set hass(hass) {
    const firstHass = !this._hass;
    this._hass = hass;
    if (firstHass && this._menu === null) {
      this._load();
    } else if (!this._noteInteracting && !this._clickBlocked) {
      // Debounce hass-triggered renders: HA pushes updates very frequently
      // (entity state ticks, etc.) — 1 s is fast enough for machine on/off changes
      clearTimeout(this._hassRenderTimer);
      this._hassRenderTimer = setTimeout(() => {
        if (!this._noteInteracting && !this._clickBlocked) this._render();
      }, 1000);
    }
  }

  connectedCallback() { this._startPoll(); }
  disconnectedCallback() { this._stopPoll(); }

  _startPoll() {
    this._stopPoll();
    this._load();
    this._schedulePoll();
  }
  _schedulePoll() {
    if (this._pollTimer) clearTimeout(this._pollTimer);
    const hasActive = this._activeOrder?.status === 'pending' || this._activeOrder?.status === 'accepted';
    this._pollTimer = setTimeout(async () => {
      await this._loadStatus();
      this._schedulePoll();
    }, hasActive ? 3000 : 10000);
  }
  _stopPoll() {
    if (this._pollTimer) { clearTimeout(this._pollTimer); this._pollTimer = null; }
  }

  _useIngress() { return !this._config?.glp_url; }

  async _ensureToken() {
    if (this._useIngress()) return null; // ingress bypasses token check
    if (this._token) return this._token;
    // /api/token is only served to Supervisor-originating requests or already-
    // authenticated callers. In direct-URL mode the card is browser-originated
    // (LAN IP) so this call will return 401. Users must set glp_token in YAML.
    try {
      const d = await fetch(`${this._getBase()}/api/token`).then(r => r.ok ? r.json() : {});
      this._token = d.apiToken || null;
    } catch {}
    return this._token;
  }

  async _fetch(path, opts = {}) {
    // In zero-config mode route through the HA integration REST proxy (/api/glp/*)
    // which the integration registers as a standard HA HTTP view, authenticated via
    // Bearer token — no Supervisor ingress session cookie required.
    if (this._useIngress() && this._hass?.fetchWithAuth) {
      const proxyPath = '/api/glp/' + path.replace(/^api\//, '');
      return this._hass.fetchWithAuth(proxyPath, opts);
    }
    const url = `${this._getBase()}/${path}`;
    const token = await this._ensureToken();
    if (token) opts = { ...opts, headers: { ...opts.headers, 'X-GLP-Token': token } };
    return fetch(url, opts);
  }

  async _load() {
    try {
      const [menuRes, settingsRes, queueRes] = await Promise.all([
        this._fetch('api/orders/menu'),
        this._fetch('api/orders/settings'),
        this._fetch('api/orders/queue-eta').catch(() => null),
      ]);
      if (queueRes?.ok) this._queueEta = await queueRes.json().catch(() => null);
      if (menuRes.status === 404 && settingsRes.status === 404) {
        // Feature disabled at add-on level
        this._menu    = [];
        this._enabled = false;
      } else if (menuRes.ok && settingsRes.ok) {
        const menu     = await menuRes.json();
        const settings = await settingsRes.json();
        this._menu    = Array.isArray(menu) ? menu : [];
        this._enabled = settings?.enabled !== false;
        // Fetch active beans if any menu item uses the bean library as variants
        if (this._menu.some(m => m.useBeans)) {
          try {
            const br = await this._fetch('api/orders/active-beans');
            this._activeBeans = br.ok ? await br.json() : [];
          } catch { this._activeBeans = []; }
        }
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
    if (this._noteInteracting || this._clickBlocked) {
      this._pendingRender = true;
    } else {
      this._render();
    }
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

    // Skip redundant full re-renders (polling/hass ticks) — only rebuild the DOM
    // when something user-visible actually changed. Prevents flicker on the status view.
    const o = this._activeOrder;
    const minsLeft = o?.status === 'accepted'
      ? Math.max(0, Math.ceil((o.acceptedAt + o.eta * 60000 - Date.now()) / 60000)) : null;
    const sig = JSON.stringify([
      off, this._enabled, this._menu ? this._menu.length : -1,
      this._selected, this._selectedVariant, this._submitting,
      o && [o.id, o.status], minsLeft, this._lastShot?.id ?? null,
      this._queueEta?.positions?.[o?.id]?.position ?? null,
      title, lang, this._activeBeans?.length ?? -1,
    ]);
    if (sig === this._lastRenderSig) return;
    this._lastRenderSig = sig;

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

    // Hide useBeans items when no active beans are in stock
    const visibleMenu = this._menu.filter(m =>
      !m.useBeans || (Array.isArray(this._activeBeans) && this._activeBeans.length > 0)
    );
    if (visibleMenu.length === 0) {
      return `<div class="loading">${_s('no_menu', lang)}</div>`;
    }

    const newThreshold = (parseFloat(this._config?.new_badge_days) || NEW_BADGE_DAYS_DEFAULT) * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const renderItem = m => {
      const isNew     = m.createdAt && (now - m.createdAt) < newThreshold;
      const newBadge  = isNew     ? `<span class="menu-badge menu-badge-new">NEW</span>` : '';
      const trendBadge = m.trending ? `<span class="menu-badge menu-badge-trend">🔥</span>` : '';
      return `<div class="menu-item${this._selected === m.name ? ' selected' : ''}" data-item="${_esc(m.name)}">
        <div class="menu-item-emoji">${_esc(m.emoji)}</div>
        <div class="menu-item-name">${_esc(m.name)}${trendBadge}${newBadge}</div>
      </div>`;
    };

    const trending = visibleMenu.filter(m => m.trending);
    const regular  = visibleMenu.filter(m => !m.trending);

    const trendSection = trending.length ? `
      <p class="menu-section-title">🔥 Trending</p>
      <div class="menu-grid">${trending.map(renderItem).join('')}</div>` : '';
    const regularSection = regular.length ? `
      ${trending.length ? `<p class="menu-section-title" style="margin-top:10px">${_s('menu_all', lang)}</p>` : ''}
      <div class="menu-grid">${regular.map(renderItem).join('')}</div>` : '';

    const selectedItem = visibleMenu.find(m => m.name === this._selected);
    const variants = this._getVariants(selectedItem);
    const needsVariant = variants.length > 0 && !this._selectedVariant;
    const variantSection = (this._selected && variants.length > 0) ? `
      <p class="variant-label">${_s('variant_label', lang)}</p>
      <div class="variant-grid" id="oc-variants">
        ${variants.map(v => `<div class="variant-chip${this._selectedVariant === v ? ' selected' : ''}" data-variant="${_esc(v)}">${_esc(v)}</div>`).join('')}
      </div>` : '';
    const beanInfoSection = this._beanInfoHtml(this._getSelectedBean(), lang);
    const itemLabel = (this._selected && this._selectedVariant)
      ? `${this._selected} · ${this._selectedVariant}`
      : this._selected || null;
    const btnLabel = itemLabel ? _s('order_btn', lang, itemLabel)
      : needsVariant ? _s('variant_select', lang)
      : _s('order_btn_select', lang);
    return `
      <div class="order-form">
        ${trendSection}${regularSection}
        ${variantSection}${beanInfoSection}
        <input class="note-input" id="oc-note" placeholder="${_s('note_ph', lang)}" maxlength="200">
        <button class="order-btn" id="oc-submit" ${!this._selected || this._submitting || needsVariant ? 'disabled' : ''}>
          ${_esc(btnLabel)}
        </button>
      </div>`;
  }

  _shotChart(shot) {
    const dp = shot?.datapoints;
    if (!dp) return '';

    const series = [
      { key: 'pressure',    scale: 10, color: '#3b82f6', label: 'Druck' },
      { key: 'temperature', scale: 10, color: '#f59e0b', label: 'Temp' },
      { key: 'weightFlow',  scale: 10, color: '#22c55e', label: 'Flow' },
      { key: 'shotWeight',  scale: 10, color: '#a78bfa', label: 'Gewicht' },
    ].map(s => ({ ...s, vals: Array.isArray(dp[s.key]) ? dp[s.key].map(v => v / s.scale) : [] }))
     .filter(s => s.vals.length >= 4);

    if (!series.length) return '';

    const W = 300, H = 72, pad = 2;
    const len = Math.max(...series.map(s => s.vals.length));

    const polyline = (vals, color) => {
      const minV = Math.min(...vals), maxV = Math.max(...vals);
      const range = maxV - minV || 1;
      const pts = vals.map((v, i) => {
        const x = pad + (i / (len - 1)) * (W - pad * 2);
        const y = H - pad - ((v - minV) / range) * (H - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>`;
    };

    const svg = `<svg class="shot-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      ${series.map(s => polyline(s.vals, s.color)).join('')}
    </svg>`;

    const legend = `<div class="shot-chart-legend">
      ${series.map(s => `<div class="shot-chart-legend-item">
        <div class="shot-chart-legend-dot" style="background:${s.color}"></div>${s.label}
      </div>`).join('')}
    </div>`;

    return svg + legend;
  }

  _renderShotSummary(shot, lang) {
    if (!shot) return '';
    const profile  = shot.profile?.name || shot.profileName || '–';
    const dur      = shot.duration ? `${(shot.duration / 10).toFixed(0)} s` : null;
    const wtArr    = shot.datapoints?.shotWeight || shot.datapoints?.weight;
    const yield_g  = Array.isArray(wtArr) && wtArr.length ? `${(wtArr[wtArr.length - 1] / 10).toFixed(1)} g` : null;
    const meta     = [dur, yield_g].filter(Boolean).join(' · ');
    const chart = this._shotChart(shot);
    return `<div class="shot-summary">
      <div class="shot-summary-profile">${_esc(profile)}</div>
      ${meta ? `<div class="shot-summary-meta">${_esc(meta)}</div>` : ''}
      ${chart}
    </div>`;
  }

  _renderStatus(order, lang) {
    let content = '';
    const itemLabel = order.variant ? `${order.item} · ${order.variant}` : order.item;
    // Multi-machine (#29): only shown when the order actually carries a
    // machine name — orders placed before this feature, or on a
    // single-machine setup that never sets `machine` in config, render
    // exactly as before.
    const machineLine = order.machine
      ? `<div class="status-line status-machine">🔀 ${_esc(order.machine)}</div>` : '';

    if (order.status === 'pending') {
      const qp = this._queueEta?.positions?.[order.id];
      const queueLine = qp
        ? `<div class="status-line">${_esc(_s('queue_pos', lang, qp.position, qp.suggestedEta))}</div>`
        : '';
      content = `<div class="status-card pending">
        <div class="status-item">${_esc(_s('pending', lang, itemLabel))}</div>
        ${machineLine}
        ${queueLine}
      </div>`;
    } else if (order.status === 'accepted') {
      const etaDone   = order.acceptedAt + order.eta * 60000;
      const minsLeft  = Math.max(0, Math.ceil((etaDone - Date.now()) / 60000));
      content = `<div class="status-card accepted">
        <div class="status-item">${_esc(_s('accepted', lang, itemLabel, minsLeft))}</div>
        ${machineLine}
        <div class="status-eta">${minsLeft === 0 ? _s('almost_ready', this._lang) : `~${minsLeft} min`}</div>
      </div>`;
    } else if (order.status === 'done') {
      const shotHtml = this._renderShotSummary(this._lastShot, lang);
      content = `<div class="status-card done">
        <div class="status-done-msg">${_esc(_s('done', lang, itemLabel))}</div>
      </div>${shotHtml}`;
    } else if (order.status === 'declined') {
      content = `<div class="status-card declined">
        <div class="status-item">${_esc(_s('declined', lang, itemLabel))}</div>
        ${order.declineReason ? `<div class="status-decline">${_esc(_s('decline_reason', lang, order.declineReason))}</div>` : ''}
      </div>`;
    }

    return `${content}<button class="new-order-btn" id="oc-new-order">${_s('new_order', lang)}</button>`;
  }

  _bindEvents() {
    // Block any render for 300 ms after a pointer interaction to prevent
    // DOM replacement eating the click event before it fires
    this.shadowRoot.addEventListener('pointerdown', () => {
      this._clickBlocked = true;
      clearTimeout(this._clickBlockTimer);
      this._clickBlockTimer = setTimeout(() => {
        this._clickBlocked = false;
        if (this._pendingRender && !this._noteInteracting) {
          this._pendingRender = false;
          this._render();
        }
      }, 300);
    }, { passive: true });

    // Menu item selection — toggle CSS only, no full re-render
    this.shadowRoot.querySelectorAll('.menu-item').forEach(el => {
      el.addEventListener('click', () => {
        const prev = this._selected;
        this._selected = this._selected === el.dataset.item ? null : el.dataset.item;
        if (this._selected !== prev) this._selectedVariant = null;
        // Update selected state without replacing the DOM
        this.shadowRoot.querySelectorAll('.menu-item').forEach(m => {
          m.classList.toggle('selected', m.dataset.item === this._selected);
        });
        this._updateVariantPicker();
        this._updateSubmitBtn();
      });
    });

    // Variant chip selection
    this._bindVariantChips();

    // Note input: block re-renders while user is typing
    const noteEl = this.shadowRoot.getElementById('oc-note');
    if (noteEl) {
      noteEl.addEventListener('focus', () => { this._noteInteracting = true; });
      noteEl.addEventListener('blur',  () => {
        this._noteInteracting = false;
        if (this._pendingRender) { this._pendingRender = false; this._render(); }
      });
    }
    // Submit
    const submitBtn = this.shadowRoot.getElementById('oc-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this._placeOrder());
    }
    // New order
    const newBtn = this.shadowRoot.getElementById('oc-new-order');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        this._activeOrder     = null;
        this._selected        = null;
        this._selectedVariant = null;
        this._render();
      });
    }
  }

  _getVariants(item) {
    if (!item) return [];
    if (item.useBeans) return (this._activeBeans || []).map(b => b.decaf ? `${b.name} · Decaf` : b.name);
    return item.variants || [];
  }

  _getSelectedBean() {
    const selectedItem = this._menu?.find(m => m.name === this._selected);
    if (!selectedItem?.useBeans || !this._selectedVariant) return null;
    return (this._activeBeans || []).find(b =>
      (b.decaf ? `${b.name} · Decaf` : b.name) === this._selectedVariant
    ) || null;
  }

  _beanInfoHtml(bean, lang) {
    const origins = Array.isArray(bean?.origins) && bean.origins.length
      ? bean.origins
      : (bean?.origin ? [{ code: bean.origin }] : []);
    if (!bean || (!bean.notes && !origins.length && !bean.variety && !bean.process)) return '';
    const rows = [];
    if (bean.notes)      rows.push(`<div class="bean-info-notes">${_esc(bean.notes)}</div>`);
    if (origins.length)  rows.push(`<div class="bean-info-row"><span class="bean-info-label">${_s('bean_origin', lang)}</span><span>${_originHtml(origins, lang)}</span></div>`);
    if (bean.variety) rows.push(`<div class="bean-info-row"><span class="bean-info-label">${_s('bean_variety', lang)}</span><span>${_esc(bean.variety)}</span></div>`);
    if (bean.process) rows.push(`<div class="bean-info-row"><span class="bean-info-label">${_s('bean_process', lang)}</span><span>${_esc(bean.process)}</span></div>`);
    return `<div class="bean-info" id="oc-bean-info">${rows.join('')}</div>`;
  }

  _updateBeanInfo() {
    const container = this.shadowRoot.querySelector('.order-form');
    if (!container) return;
    const existing = this.shadowRoot.getElementById('oc-bean-info');
    const html = this._beanInfoHtml(this._getSelectedBean(), this._lang);
    if (!html) { if (existing) existing.remove(); return; }
    if (existing) { existing.outerHTML = html; return; }
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    container.insertBefore(tpl.content.firstElementChild, this.shadowRoot.getElementById('oc-note'));
  }

  _updateVariantPicker() {
    const selectedItem = this._menu?.find(m => m.name === this._selected);
    const variants = this._getVariants(selectedItem);
    const container = this.shadowRoot.querySelector('.order-form');
    if (!container) return;
    let vRow = this.shadowRoot.getElementById('oc-variants');
    const vLabel = this.shadowRoot.querySelector('.variant-label');
    if (variants.length === 0) {
      if (vRow)   vRow.remove();
      if (vLabel) vLabel.remove();
      this._updateBeanInfo();
      return;
    }
    if (!vRow) {
      const label = document.createElement('p');
      label.className = 'variant-label';
      label.textContent = _s('variant_label', this._lang);
      const grid = document.createElement('div');
      grid.className = 'variant-grid';
      grid.id = 'oc-variants';
      const noteInput = this.shadowRoot.getElementById('oc-note');
      container.insertBefore(label, noteInput);
      container.insertBefore(grid, noteInput);
      vRow = grid;
    }
    vRow.innerHTML = variants.map(v =>
      `<div class="variant-chip${this._selectedVariant === v ? ' selected' : ''}" data-variant="${_esc(v)}">${_esc(v)}</div>`
    ).join('');
    this._bindVariantChips();
    this._updateBeanInfo();
  }

  _bindVariantChips() {
    this.shadowRoot.querySelectorAll('.variant-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this._selectedVariant = this._selectedVariant === chip.dataset.variant ? null : chip.dataset.variant;
        this.shadowRoot.querySelectorAll('.variant-chip').forEach(c => {
          c.classList.toggle('selected', c.dataset.variant === this._selectedVariant);
        });
        this._updateSubmitBtn();
        this._updateBeanInfo();
      });
    });
  }

  _updateSubmitBtn() {
    const selectedItem = this._menu?.find(m => m.name === this._selected);
    const variants = this._getVariants(selectedItem);
    const needsVariant = variants.length > 0 && !this._selectedVariant;
    const btn = this.shadowRoot.getElementById('oc-submit');
    if (!btn) return;
    if (!this._selected) {
      btn.textContent = _s('order_btn_select', this._lang);
      btn.disabled = true;
    } else if (needsVariant) {
      btn.textContent = _s('variant_select', this._lang);
      btn.disabled = true;
    } else {
      const itemLabel = this._selectedVariant ? `${this._selected} · ${this._selectedVariant}` : this._selected;
      btn.textContent = _s('order_btn', this._lang, itemLabel);
      btn.disabled = !!this._submitting;
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
          variant:  this._selectedVariant || undefined,
          note,
          customer: haUser.name,
          haUserId: haUser.id,
          machine:  this._config?.machine || undefined,
        }),
      }).then(r => r.json());

      if (order.id) {
        this._activeOrder = order;
        this._selected    = null;
        this._selectedVariant = null;
      }
    } catch {}
    this._submitting = false;
    this._render();
  }

  getCardSize() { return 3; }

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

console.info(`%c GLP-ORDER-CARD %c v${GLP_ORDER_CARD_VERSION} `, 'background:#ff9f0a;color:#000;padding:2px 4px;border-radius:3px 0 0 3px', 'background:#111113;color:#ff9f0a;padding:2px 4px;border-radius:0 3px 3px 0');
