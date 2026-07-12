
(() => {
  "use strict";

  const VERSION = "0.9.0";
  const KEY = "corporesapiens_v09_runtime";

  function readRuntime() {
    try {
      return {
        lastOpenAt: null,
        launchCount: 0,
        dismissedUpdate: null,
        ...JSON.parse(localStorage.getItem(KEY) || "{}")
      };
    } catch {
      return { lastOpenAt: null, launchCount: 0, dismissedUpdate: null };
    }
  }

  function writeRuntime(next) {
    localStorage.setItem(KEY, JSON.stringify({ ...readRuntime(), ...next }));
  }

  function runtimeSummary() {
    const r = readRuntime();
    let localStorageOk = true;
    try {
      const probe = "__corporesapiens_v09_probe__";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
    } catch {
      localStorageOk = false;
    }

    return {
      version: VERSION,
      launchCount: r.launchCount || 0,
      lastOpenAt: r.lastOpenAt,
      online: navigator.onLine,
      standalone: window.matchMedia("(display-mode: standalone)").matches,
      serviceWorker: "serviceWorker" in navigator,
      localStorage: localStorageOk
    };
  }

  function markLaunch() {
    const r = readRuntime();
    writeRuntime({
      launchCount: (r.launchCount || 0) + 1,
      lastOpenAt: Date.now()
    });
  }

  function addHub() {
    if (document.getElementById("v09Hub")) return;
    const more = document.getElementById("moreView");
    if (!more) return;

    const card = document.createElement("div");
    card.id = "v09Hub";
    card.className = "card v09-card";
    card.innerHTML = `
      <div class="section-head">
        <div>
          <p class="eyebrow">CORPORESAPIENS 0.9</p>
          <h2>Preparação para 1.0</h2>
        </div>
        <span id="v09StatusChip" class="chip">verificando</span>
      </div>

      <p class="muted">
        Camada de estabilidade, desempenho e transparência antes da versão 1.0.
      </p>

      <div class="v09-actions">
        <button id="v09HealthBtn" class="button secondary">Resumo técnico</button>
        <button id="v09UpdateBtn" class="button secondary">Verificar atualização</button>
        <button id="v09OfflineBtn" class="button secondary">Estado offline</button>
        <button id="v09RoadmapBtn" class="button secondary">Rota para 1.0</button>
      </div>

      <div id="v09Metrics" class="top-gap"></div>
    `;

    more.prepend(card);
    document.getElementById("v09HealthBtn").onclick = healthModal;
    document.getElementById("v09UpdateBtn").onclick = checkForUpdate;
    document.getElementById("v09OfflineBtn").onclick = offlineModal;
    document.getElementById("v09RoadmapBtn").onclick = roadmapModal;
    renderMetrics();
  }

  function renderMetrics() {
    const el = document.getElementById("v09Metrics");
    const chip = document.getElementById("v09StatusChip");
    if (!el || !chip) return;

    const s = runtimeSummary();
    const ok = s.serviceWorker && s.localStorage;

    chip.textContent = ok ? "pronto" : "atenção";
    chip.classList.toggle("v09-chip-error", !ok);

    el.innerHTML = `
      <div class="metric-grid">
        <div class="metric"><span>Inicializações</span><strong>${s.launchCount}</strong></div>
        <div class="metric"><span>Conectividade</span><strong>${s.online ? "Online" : "Offline"}</strong></div>
        <div class="metric"><span>Modo instalado</span><strong>${s.standalone ? "Sim" : "Navegador"}</strong></div>
      </div>
    `;
  }

  function healthModal() {
    const s = runtimeSummary();
    openModal("Resumo técnico", `
      <div class="diagnostic-list">
        <div class="diagnostic-row"><span>Versão</span><strong>${s.version}</strong></div>
        <div class="diagnostic-row"><span>Service Worker</span><strong class="${s.serviceWorker ? "ok" : "error"}">${s.serviceWorker ? "OK" : "Indisponível"}</strong></div>
        <div class="diagnostic-row"><span>Armazenamento local</span><strong class="${s.localStorage ? "ok" : "error"}">${s.localStorage ? "OK" : "Indisponível"}</strong></div>
        <div class="diagnostic-row"><span>Conectividade</span><strong>${s.online ? "Online" : "Offline"}</strong></div>
        <div class="diagnostic-row"><span>Execução</span><strong>${s.standalone ? "Aplicativo instalado" : "Navegador"}</strong></div>
      </div>
    `);
  }

  async function checkForUpdate() {
    const button = document.getElementById("v09UpdateBtn");
    if (button) button.disabled = true;

    try {
      const registrations = await navigator.serviceWorker?.getRegistrations?.() || [];
      await Promise.all(registrations.map(registration => registration.update()));
      openModal("Atualização", `<div class="empty">Verificação concluída. Novas versões serão aplicadas com segurança pelo navegador.</div>`);
    } catch {
      openModal("Atualização", `<div class="empty">Não foi possível verificar agora. A versão instalada continuará funcionando.</div>`);
    } finally {
      if (button) button.disabled = false;
    }
  }

  function offlineModal() {
    openModal("Funcionamento offline", `
      <div class="stack">
        <article class="list-item"><strong>Dados do aparelho</strong><div class="meta">Fichas, sessões, recordes e preferências permanecem armazenados localmente.</div></article>
        <article class="list-item"><strong>Sem internet</strong><div class="meta">As telas já armazenadas em cache continuam disponíveis.</div></article>
        <article class="list-item"><strong>Reconexão</strong><div class="meta">Ao voltar a internet, o navegador poderá verificar atualizações automaticamente.</div></article>
      </div>
    `);
  }

  function roadmapModal() {
    openModal("Rota para a versão 1.0", `
      <div class="v09-roadmap">
        <div class="v09-step"><span>1</span><div><strong>Consolidar módulos</strong><p class="muted">Reduzir dependências entre versões incrementais.</p></div></div>
        <div class="v09-step"><span>2</span><div><strong>Testes de interface</strong><p class="muted">Automatizar fluxos essenciais em navegador real.</p></div></div>
        <div class="v09-step"><span>3</span><div><strong>Revisar acessibilidade</strong><p class="muted">Validar contraste, teclado e leitura de tela.</p></div></div>
        <div class="v09-step"><span>4</span><div><strong>Fechar a 1.0</strong><p class="muted">Publicar uma base estável, documentada e recuperável.</p></div></div>
      </div>
    `);
  }

  function bindNetworkEvents() {
    window.addEventListener("online", renderMetrics);
    window.addEventListener("offline", renderMetrics);
  }

  const previousRenderAll = renderAll;
  renderAll = function () {
    previousRenderAll();
    addHub();
    renderMetrics();
  };

  markLaunch();
  addHub();
  renderMetrics();
  bindNetworkEvents();
})();
