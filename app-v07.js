
(() => {
  "use strict";

  const KEY = "corporesapiens_v07_runtime";
  const MAX_ERRORS = 20;

  function runtime() {
    const fallback = {
      safeMode: false,
      errors: [],
      lastHealthyAt: null,
      lastVersion: "0.7.0",
      migrations: []
    };
    try {
      return { ...fallback, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
      return fallback;
    }
  }

  function saveRuntime(next) {
    localStorage.setItem(KEY, JSON.stringify({ ...runtime(), ...next }));
  }

  function serializeError(error, source = "runtime") {
    return {
      id: (crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`),
      source,
      message: String(error?.message || error || "Erro desconhecido").slice(0, 500),
      stack: String(error?.stack || "").slice(0, 2500),
      href: location.href,
      userAgent: navigator.userAgent.slice(0, 500),
      at: Date.now()
    };
  }

  function recordError(error, source) {
    const r = runtime();
    const errors = [...(r.errors || []), serializeError(error, source)].slice(-MAX_ERRORS);
    saveRuntime({ errors });
    renderRuntimeStatus();
  }

  function stateShapeOk() {
    return ["plans", "sessions", "records", "measurements", "equipment"]
      .every(key => Array.isArray(state?.[key]));
  }

  function storageAvailable() {
    try {
      const probe = "__corporesapiens_probe__";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }

  function runHealthCheck() {
    const checks = [
      { name: "Armazenamento local", ok: storageAvailable() },
      { name: "Estrutura principal", ok: stateShapeOk() },
      { name: "Service Worker", ok: "serviceWorker" in navigator },
      { name: "Manifesto PWA", ok: !!document.querySelector('link[rel="manifest"]') },
      { name: "Módulo 0.7", ok: true }
    ];
    const ok = checks.every(x => x.ok);
    if (ok) saveRuntime({ lastHealthyAt: Date.now(), lastVersion: "0.7.0" });
    return { ok, checks };
  }

  function migrationCheck() {
    const r = runtime();
    const migrations = new Set(r.migrations || []);

    if (!migrations.has("v07-runtime-init")) {
      migrations.add("v07-runtime-init");
    }

    if (!localStorage.getItem("corporesapiens_v06_preferences")) {
      localStorage.setItem("corporesapiens_v06_preferences", JSON.stringify({
        fontScale: "normal",
        contrast: false,
        reducedMotion: false,
        compact: false,
        haptics: false
      }));
      migrations.add("v06-preferences-default");
    }

    saveRuntime({
      migrations: [...migrations],
      lastVersion: "0.7.0"
    });
  }

  function applySafeMode() {
    const enabled = !!runtime().safeMode;
    document.body.classList.toggle("v07-safe-mode", enabled);

    if (!enabled) return;

    document.querySelectorAll("#v03Hub,#v04Dashboard,#v05Hub,#v06Hub")
      .forEach(el => el.classList.add("v07-disabled-module"));
  }

  function addRecoveryHub() {
    if (document.getElementById("v07Hub")) return;

    const more = document.getElementById("moreView");
    if (!more) return;

    const card = document.createElement("div");
    card.id = "v07Hub";
    card.className = "card v07-card";
    card.innerHTML = `
      <div class="section-head">
        <div>
          <p class="eyebrow">CORPORESAPIENS 0.7</p>
          <h2>Recuperação e proteção</h2>
        </div>
        <span id="v07HealthChip" class="chip">verificando</span>
      </div>

      <p class="muted">
        Diagnóstico e recuperação executados no aparelho, sem envio automático de dados.
      </p>

      <div class="v07-actions">
        <button id="v07HealthBtn" class="button secondary">Verificar saúde</button>
        <button id="v07ErrorsBtn" class="button secondary">Registro de erros</button>
        <button id="v07SafeModeBtn" class="button secondary">Modo seguro</button>
        <button id="v07RecoveryBtn" class="button secondary">Central de recuperação</button>
      </div>

      <div id="v07Status" class="top-gap"></div>
    `;

    more.prepend(card);

    document.getElementById("v07HealthBtn").onclick = healthModal;
    document.getElementById("v07ErrorsBtn").onclick = errorsModal;
    document.getElementById("v07SafeModeBtn").onclick = toggleSafeMode;
    document.getElementById("v07RecoveryBtn").onclick = recoveryModal;

    renderRuntimeStatus();
  }

  function renderRuntimeStatus() {
    const card = document.getElementById("v07Status");
    const chip = document.getElementById("v07HealthChip");
    if (!card || !chip) return;

    const health = runHealthCheck();
    const r = runtime();
    const errorCount = (r.errors || []).length;

    chip.textContent = health.ok ? "íntegro" : "atenção";
    chip.classList.toggle("v07-chip-error", !health.ok);

    card.innerHTML = `
      <div class="metric-grid">
        <div class="metric">
          <span>Estado local</span>
          <strong>${health.ok ? "Íntegro" : "Atenção"}</strong>
        </div>
        <div class="metric">
          <span>Erros registrados</span>
          <strong>${errorCount}</strong>
        </div>
        <div class="metric">
          <span>Modo seguro</span>
          <strong>${r.safeMode ? "Ativo" : "Desativado"}</strong>
        </div>
      </div>
    `;

    const safeButton = document.getElementById("v07SafeModeBtn");
    if (safeButton) safeButton.textContent = r.safeMode ? "Sair do modo seguro" : "Modo seguro";
  }

  function healthModal() {
    const result = runHealthCheck();

    openModal("Saúde do aplicativo", `
      <div class="diagnostic-list">
        ${result.checks.map(item => `
          <div class="diagnostic-row">
            <span>${esc(item.name)}</span>
            <strong class="${item.ok ? "ok" : "error"}">${item.ok ? "OK" : "Verificar"}</strong>
          </div>
        `).join("")}
      </div>

      <p class="muted top-gap">
        Última verificação: ${new Date().toLocaleString("pt-BR")}
      </p>
    `);
  }

  function errorsModal() {
    const errors = [...(runtime().errors || [])].reverse();

    openModal("Registro de erros", `
      ${errors.length ? `
        <div class="stack">
          ${errors.map(item => `
            <article class="v07-error-item">
              <div class="list-item-head">
                <div>
                  <strong>${esc(item.source)}</strong>
                  <div class="meta">${new Date(item.at).toLocaleString("pt-BR")}</div>
                </div>
              </div>
              <p>${esc(item.message)}</p>
            </article>
          `).join("")}
        </div>
        <button id="v07CopyErrors" class="button secondary wide top-gap">Copiar relatório</button>
        <button id="v07ClearErrors" class="button danger wide top-gap">Limpar registro local</button>
      ` : `<div class="empty">Nenhum erro registrado neste aparelho.</div>`}
    `);

    if (!errors.length) return;

    document.getElementById("v07CopyErrors").onclick = async () => {
      const report = errors.map(item =>
        `[${new Date(item.at).toISOString()}] ${item.source}: ${item.message}`
      ).join("\n");

      try {
        await navigator.clipboard.writeText(report);
        toast("Relatório copiado");
      } catch {
        toast("Não foi possível copiar");
      }
    };

    document.getElementById("v07ClearErrors").onclick = () => {
      saveRuntime({ errors: [] });
      closeModal();
      renderRuntimeStatus();
      toast("Registro local limpo");
    };
  }

  function toggleSafeMode() {
    const enabled = !runtime().safeMode;
    saveRuntime({ safeMode: enabled });
    applySafeMode();
    renderRuntimeStatus();
    toast(enabled ? "Modo seguro ativado" : "Modo seguro desativado");
  }

  function recoveryModal() {
    const health = runHealthCheck();
    const r = runtime();

    openModal("Central de recuperação", `
      <div class="stack">
        <article class="list-item">
          <strong>1. Criar backup</strong>
          <div class="meta">Exporte os dados antes de uma restauração.</div>
          <button id="v07BackupBtn" class="button secondary compact top-gap">Criar backup</button>
        </article>

        <article class="list-item">
          <strong>2. Modo seguro</strong>
          <div class="meta">Desativa módulos adicionais para facilitar diagnóstico.</div>
          <button id="v07RecoverySafeBtn" class="button secondary compact top-gap">
            ${r.safeMode ? "Desativar" : "Ativar"}
          </button>
        </article>

        <article class="list-item">
          <strong>3. Limpar somente preferências visuais</strong>
          <div class="meta">Não remove fichas, sessões ou histórico.</div>
          <button id="v07ResetPrefsBtn" class="button secondary compact top-gap">
            Restaurar preferências
          </button>
        </article>

        <article class="list-item">
          <strong>Estado atual</strong>
          <div class="meta">${health.ok ? "Estrutura local íntegra." : "Há itens que precisam de atenção."}</div>
        </article>
      </div>
    `);

    document.getElementById("v07BackupBtn").onclick = () => {
      document.getElementById("exportDataBtn")?.click();
      toast("Backup preparado");
    };

    document.getElementById("v07RecoverySafeBtn").onclick = () => {
      toggleSafeMode();
      closeModal();
    };

    document.getElementById("v07ResetPrefsBtn").onclick = () => {
      [
        "corporesapiens_v04_preferences",
        "corporesapiens_v05_settings",
        "corporesapiens_v06_preferences"
      ].forEach(key => localStorage.removeItem(key));

      location.reload();
    };
  }

  window.addEventListener("error", event => {
    recordError(event.error || event.message, "window.error");
  });

  window.addEventListener("unhandledrejection", event => {
    recordError(event.reason, "unhandledrejection");
  });

  const originalRenderAll = renderAll;
  renderAll = function () {
    try {
      originalRenderAll();
      addRecoveryHub();
      applySafeMode();
      renderRuntimeStatus();
    } catch (error) {
      recordError(error, "renderAll");
      throw error;
    }
  };

  migrationCheck();
  addRecoveryHub();
  applySafeMode();
  renderRuntimeStatus();
})();
