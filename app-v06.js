
(() => {
  "use strict";

  const KEY = "corporesapiens_v06_preferences";
  const defaults = {
    fontScale: "normal",
    contrast: false,
    reducedMotion: false,
    compact: false,
    haptics: false
  };

  function prefs() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
    } catch {
      return { ...defaults };
    }
  }

  function savePrefs(next) {
    localStorage.setItem(KEY, JSON.stringify({ ...prefs(), ...next }));
    applyPrefs();
  }

  function applyPrefs() {
    const p = prefs();
    document.documentElement.dataset.fontScale = p.fontScale;
    document.body.classList.toggle("v06-high-contrast", !!p.contrast);
    document.body.classList.toggle("v06-reduced-motion", !!p.reducedMotion);
    document.body.classList.toggle("v06-compact", !!p.compact);
  }

  function vibrate(ms = 35) {
    if (prefs().haptics && navigator.vibrate) navigator.vibrate(ms);
  }

  function addV06Hub() {
    if (document.getElementById("v06Hub")) return;
    const more = document.getElementById("moreView");
    if (!more) return;

    const card = document.createElement("div");
    card.id = "v06Hub";
    card.className = "card v06-card";
    card.innerHTML = `
      <div class="section-head">
        <div>
          <p class="eyebrow">CORPORESAPIENS 0.6</p>
          <h2>Acessibilidade e estabilidade</h2>
        </div>
        <span class="chip">local</span>
      </div>

      <div class="v06-actions">
        <button id="v06AccessibilityBtn" class="button secondary">Acessibilidade</button>
        <button id="v06DiagnosticsBtn" class="button secondary">Diagnóstico local</button>
        <button id="v06InstallBtn" class="button secondary">Como instalar</button>
        <button id="v06ReleaseBtn" class="button secondary">Sobre esta versão</button>
      </div>

      <div id="v06Status" class="top-gap"></div>
    `;

    more.prepend(card);

    document.getElementById("v06AccessibilityBtn").onclick = accessibilityModal;
    document.getElementById("v06DiagnosticsBtn").onclick = diagnosticsModal;
    document.getElementById("v06InstallBtn").onclick = installModal;
    document.getElementById("v06ReleaseBtn").onclick = releaseModal;

    renderStatus();
  }

  function renderStatus() {
    const el = document.getElementById("v06Status");
    if (!el) return;
    const p = prefs();

    const active = [
      p.fontScale !== "normal" ? "texto ampliado" : "",
      p.contrast ? "alto contraste" : "",
      p.reducedMotion ? "movimento reduzido" : "",
      p.compact ? "modo compacto" : "",
      p.haptics ? "vibração" : ""
    ].filter(Boolean);

    el.innerHTML = active.length
      ? `<div class="chips">${active.map(x => `<span class="chip">✓ ${esc(x)}</span>`).join("")}</div>`
      : `<p class="muted">Nenhum ajuste de acessibilidade ativo.</p>`;
  }

  function accessibilityModal() {
    const p = prefs();
    openModal("Acessibilidade", `
      <label>Tamanho do texto
        <select id="v06FontScale">
          <option value="normal" ${p.fontScale === "normal" ? "selected" : ""}>Normal</option>
          <option value="large" ${p.fontScale === "large" ? "selected" : ""}>Grande</option>
          <option value="xlarge" ${p.fontScale === "xlarge" ? "selected" : ""}>Muito grande</option>
        </select>
      </label>

      <label class="v06-check">
        <input id="v06Contrast" type="checkbox" ${p.contrast ? "checked" : ""}>
        <span>Alto contraste</span>
      </label>

      <label class="v06-check">
        <input id="v06ReducedMotion" type="checkbox" ${p.reducedMotion ? "checked" : ""}>
        <span>Reduzir animações</span>
      </label>

      <label class="v06-check">
        <input id="v06Compact" type="checkbox" ${p.compact ? "checked" : ""}>
        <span>Modo compacto</span>
      </label>

      <label class="v06-check">
        <input id="v06Haptics" type="checkbox" ${p.haptics ? "checked" : ""}>
        <span>Vibração em ações importantes</span>
      </label>

      <button id="v06SaveAccessibility" class="button primary wide top-gap">Salvar ajustes</button>
      <button id="v06ResetAccessibility" class="button secondary wide top-gap">Restaurar padrão visual</button>
    `);

    document.getElementById("v06SaveAccessibility").onclick = () => {
      savePrefs({
        fontScale: document.getElementById("v06FontScale").value,
        contrast: document.getElementById("v06Contrast").checked,
        reducedMotion: document.getElementById("v06ReducedMotion").checked,
        compact: document.getElementById("v06Compact").checked,
        haptics: document.getElementById("v06Haptics").checked
      });
      vibrate();
      closeModal();
      renderStatus();
      toast("Ajustes visuais salvos");
    };

    document.getElementById("v06ResetAccessibility").onclick = () => {
      localStorage.removeItem(KEY);
      applyPrefs();
      closeModal();
      renderStatus();
      toast("Visual restaurado");
    };
  }

  function localStateHealth() {
    const checks = [
      ["Fichas", Array.isArray(state.plans)],
      ["Sessões", Array.isArray(state.sessions)],
      ["Recordes", Array.isArray(state.records)],
      ["Medidas", Array.isArray(state.measurements)],
      ["Aparelhos", Array.isArray(state.equipment)]
    ];

    return checks;
  }

  function diagnosticsModal() {
    const checks = localStateHealth();
    const allOk = checks.every(x => x[1]);
    const storageBytes = new Blob([
      JSON.stringify({
        state,
        v04: localStorage.getItem("corporesapiens_v04_preferences"),
        v05: localStorage.getItem("corporesapiens_v05_settings"),
        v06: localStorage.getItem(KEY)
      })
    ]).size;

    openModal("Diagnóstico local", `
      <div class="diagnostic-list">
        ${checks.map(([name, ok]) => `
          <div class="diagnostic-row">
            <span>${esc(name)}</span>
            <strong class="${ok ? "ok" : "error"}">${ok ? "OK" : "Verificar"}</strong>
          </div>
        `).join("")}
      </div>

      <div class="metric-grid top-gap">
        <div class="metric">
          <span>Armazenamento estimado</span>
          <strong>${Math.max(1, Math.round(storageBytes / 1024))} KB</strong>
        </div>
        <div class="metric">
          <span>Estado geral</span>
          <strong>${allOk ? "Íntegro" : "Atenção"}</strong>
        </div>
      </div>

      <button id="v06ExportDiagnostics" class="button secondary wide top-gap">Copiar diagnóstico</button>
    `);

    document.getElementById("v06ExportDiagnostics").onclick = async () => {
      const text = [
        "Corporesapiens — diagnóstico local",
        ...checks.map(([name, ok]) => `${name}: ${ok ? "OK" : "verificar"}`),
        `Armazenamento: ${Math.max(1, Math.round(storageBytes / 1024))} KB`,
        `Data: ${new Date().toLocaleString("pt-BR")}`
      ].join("\n");

      try {
        await navigator.clipboard.writeText(text);
        toast("Diagnóstico copiado");
      } catch {
        toast("Não foi possível copiar");
      }
    };
  }

  function installModal() {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;

    openModal("Instalar Corporesapiens", standalone ? `
      <div class="empty">O Corporesapiens já está aberto como aplicativo instalado.</div>
    ` : `
      <div class="stack">
        <article class="install-step">
          <strong>Android / Chrome</strong>
          <p class="muted">Abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.</p>
        </article>
        <article class="install-step">
          <strong>iPhone / Safari</strong>
          <p class="muted">Toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p>
        </article>
        <article class="install-step">
          <strong>Computador</strong>
          <p class="muted">Use o ícone de instalação disponível na barra de endereços do navegador.</p>
        </article>
      </div>
    `);
  }

  function releaseModal() {
    openModal("Corporesapiens 0.6", `
      <p class="muted">Versão de estabilidade, acessibilidade e diagnóstico local.</p>

      <div class="stack">
        <article class="list-item"><strong>Acessibilidade</strong><div class="meta">Texto ampliado, contraste, movimento reduzido e modo compacto.</div></article>
        <article class="list-item"><strong>Diagnóstico local</strong><div class="meta">Confere a estrutura dos dados sem enviar informações.</div></article>
        <article class="list-item"><strong>Instalação orientada</strong><div class="meta">Instruções para celular e computador.</div></article>
        <article class="list-item"><strong>Privacidade</strong><div class="meta">Preferências continuam armazenadas somente no aparelho.</div></article>
      </div>
    `);
  }

  function bindHaptics() {
    if (document.body.dataset.v06HapticsBound) return;
    document.body.dataset.v06HapticsBound = "1";

    document.addEventListener("click", event => {
      const target = event.target.closest("button");
      if (!target) return;

      const important =
        target.classList.contains("primary") ||
        /concluir|salvar|iniciar|registrar/i.test(target.textContent || "");

      if (important) vibrate();
    });
  }

  const previousRenderAll = renderAll;
  renderAll = function () {
    previousRenderAll();
    addV06Hub();
    renderStatus();
    applyPrefs();
  };

  applyPrefs();
  addV06Hub();
  renderStatus();
  bindHaptics();
})();
