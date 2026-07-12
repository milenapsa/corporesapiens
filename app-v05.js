
(() => {
  "use strict";

  const KEY = "corporesapiens_v05_settings";
  const defaults = { goals: [], notifyTimer: false, lastBackupAt: null };

  function cfg() {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
    catch { return { ...defaults }; }
  }
  function saveCfg(next) {
    localStorage.setItem(KEY, JSON.stringify({ ...cfg(), ...next }));
  }
  function rows() {
    const out = [];
    (state.sessions || []).forEach(session => {
      (session.exercises || []).forEach(exercise => {
        (exercise.sets || []).forEach(set => {
          const weight = Number(set.weight) || 0;
          const reps = Number(set.reps) || 0;
          out.push({
            exercise: exercise.name || "Exercício",
            session: session.name || "Treino",
            finishedAt: Number(session.finishedAt) || 0,
            weight, reps, volume: weight * reps
          });
        });
      });
    });
    return out;
  }
  function names() {
    return [...new Set(rows().map(x => x.exercise))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  }
  function best(name, field) {
    const values = rows().filter(x => x.exercise === name).map(x => x[field] || 0);
    return values.length ? Math.max(...values) : 0;
  }
  function lastDays() {
    if (!(state.sessions || []).length) return null;
    const last = Math.max(...state.sessions.map(s => Number(s.finishedAt) || 0));
    return Math.max(0, Math.floor((Date.now() - last) / 86400000));
  }
  function nextPlan() {
    if (!(state.plans || []).length) return null;
    const latest = {};
    (state.sessions || []).forEach(s => {
      const key = s.planId || s.name;
      latest[key] = Math.max(latest[key] || 0, Number(s.finishedAt) || 0);
    });
    return [...state.plans].sort((a,b)=>(latest[a.id]||0)-(latest[b.id]||0))[0];
  }
  function goalValue(goal) {
    if (goal.metric === "sessions") return (state.sessions || []).length;
    if (goal.metric === "records") return (state.records || []).length;
    if (goal.metric === "volume") return Math.round((state.sessions || []).reduce((s,x)=>s+sessionVolume(x),0));
    if (goal.metric === "weight") return best(goal.exercise, "weight");
    return 0;
  }

  function addHub() {
    if (document.getElementById("v05Hub")) return;
    const more = document.getElementById("moreView");
    if (!more) return;

    const card = document.createElement("div");
    card.id = "v05Hub";
    card.className = "card v05-card";
    card.innerHTML = `
      <div class="section-head">
        <div><p class="eyebrow">CORPORESAPIENS 0.5</p><h2>Histórico, metas e segurança</h2></div>
        <span class="chip">local</span>
      </div>
      <div class="v05-actions">
        <button id="v05History" class="button secondary">Histórico por exercício</button>
        <button id="v05Goals" class="button secondary">Metas pessoais</button>
        <button id="v05Next" class="button secondary">Próximo treino</button>
        <button id="v05Data" class="button secondary">Central de dados</button>
      </div>
      <div id="v05Summary" class="top-gap"></div>`;
    more.prepend(card);

    document.getElementById("v05History").onclick = historyModal;
    document.getElementById("v05Goals").onclick = goalsModal;
    document.getElementById("v05Next").onclick = nextModal;
    document.getElementById("v05Data").onclick = dataModal;
    renderSummary();
  }

  function renderSummary() {
    const el = document.getElementById("v05Summary");
    if (!el) return;
    const days = lastDays();
    el.innerHTML = `<div class="metric-grid">
      <div class="metric"><span>Exercícios com histórico</span><strong>${names().length}</strong></div>
      <div class="metric"><span>Metas pessoais</span><strong>${(cfg().goals||[]).length}</strong></div>
      <div class="metric"><span>Último treino</span><strong>${days===null?"—":days+"d"}</strong></div>
    </div>`;
  }

  function historyModal() {
    const list = names();
    openModal("Histórico por exercício", list.length ? `
      <label>Exercício<select id="v05Exercise">${list.map(n=>`<option>${esc(n)}</option>`).join("")}</select></label>
      <div id="v05HistoryMount" class="top-gap"></div>` :
      `<div class="empty">Conclua treinos para criar histórico.</div>`);
    if (!list.length) return;
    const draw = () => {
      const name = document.getElementById("v05Exercise").value;
      const data = rows().filter(x=>x.exercise===name).sort((a,b)=>b.finishedAt-a.finishedAt);
      document.getElementById("v05HistoryMount").innerHTML = `
        <div class="metric-grid">
          <div class="metric"><span>Maior carga</span><strong>${num(best(name,"weight"))} kg</strong></div>
          <div class="metric"><span>Melhor volume</span><strong>${num(best(name,"volume"))}</strong></div>
          <div class="metric"><span>Mais repetições</span><strong>${best(name,"reps")}</strong></div>
        </div>
        <div class="stack top-gap">${data.slice(0,30).map(r=>`
          <article class="history-row">
            <div><strong>${new Date(r.finishedAt).toLocaleDateString("pt-BR")}</strong><div class="meta">${esc(r.session)}</div></div>
            <b>${num(r.weight)} kg × ${r.reps}</b>
          </article>`).join("")}</div>`;
    };
    document.getElementById("v05Exercise").onchange = draw;
    draw();
  }

  function goalsModal() {
    openModal("Metas pessoais", `<div id="v05GoalsList" class="stack"></div>
      <button id="v05AddGoal" class="button primary wide top-gap">Adicionar meta</button>`);
    const draw = () => {
      const goals = cfg().goals || [];
      document.getElementById("v05GoalsList").innerHTML = goals.length ? goals.map(g=>{
        const current = goalValue(g);
        const pct = Math.min(100, Math.round(current / Math.max(1, Number(g.target)) * 100));
        return `<article class="goal-item">
          <div class="list-item-head">
            <div><strong>${esc(g.title)}</strong><div class="meta">${num(current)} de ${num(g.target)}</div></div>
            <button class="button danger compact" data-v05-delete="${g.id}">Excluir</button>
          </div>
          <div class="goal-track"><span style="width:${pct}%"></span></div>
        </article>`;
      }).join("") : `<div class="empty">Nenhuma meta criada.</div>`;
      document.querySelectorAll("[data-v05-delete]").forEach(btn => btn.onclick = () => {
        saveCfg({ goals: (cfg().goals || []).filter(g=>g.id!==btn.dataset.v05Delete) });
        draw(); renderSummary();
      });
    };
    document.getElementById("v05AddGoal").onclick = newGoalModal;
    draw();
  }

  function newGoalModal() {
    openModal("Nova meta", `
      <label>Nome<input id="v05GoalTitle" maxlength="60" placeholder="Ex.: completar 20 treinos"></label>
      <label>Tipo<select id="v05GoalMetric">
        <option value="sessions">Treinos concluídos</option>
        <option value="records">Recordes registrados</option>
        <option value="volume">Volume total em kg</option>
        <option value="weight">Maior carga em exercício</option>
      </select></label>
      <label id="v05GoalExerciseWrap" class="hidden">Exercício<select id="v05GoalExercise">${names().map(n=>`<option>${esc(n)}</option>`).join("")}</select></label>
      <label>Valor-alvo<input id="v05GoalTarget" type="number" min="1" step="1" value="10"></label>
      <button id="v05SaveGoal" class="button primary wide top-gap">Salvar meta</button>`);
    document.getElementById("v05GoalMetric").onchange = e =>
      document.getElementById("v05GoalExerciseWrap").classList.toggle("hidden", e.target.value !== "weight");
    document.getElementById("v05SaveGoal").onclick = () => {
      const title = document.getElementById("v05GoalTitle").value.trim();
      const metric = document.getElementById("v05GoalMetric").value;
      const target = Number(document.getElementById("v05GoalTarget").value);
      if (!title || !target) return toast("Preencha nome e valor");
      const goals = cfg().goals || [];
      goals.push({
        id: uid(), title, metric, target,
        exercise: metric === "weight" ? document.getElementById("v05GoalExercise").value : ""
      });
      saveCfg({ goals });
      closeModal(); goalsModal(); renderSummary(); toast("Meta criada");
    };
  }

  function nextModal() {
    const plan = nextPlan();
    const days = lastDays();
    openModal("Próximo treino", plan ? `
      <p class="muted">Sugestão organizacional baseada na ficha há mais tempo sem uso.</p>
      <article class="next-plan-card">
        <p class="eyebrow">SUGESTÃO LOCAL</p>
        <h3>${esc(plan.name)}</h3>
        <p class="muted">${(plan.exercises||[]).length} exercícios · último treino ${days===null?"não registrado":days+" dia(s) atrás"}</p>
        <div class="chips">${(plan.exercises||[]).slice(0,6).map(e=>`<span class="chip">${esc(e.name)}</span>`).join("")}</div>
        <button id="v05StartSuggested" class="button primary wide top-gap">Iniciar esta ficha</button>
      </article>` : `<div class="empty">Crie uma ficha para receber uma sugestão.</div>`);
    if (plan) document.getElementById("v05StartSuggested").onclick = () => {
      closeModal(); startPlan(plan.id); nav("workouts");
    };
  }

  async function requestNotifications() {
    if (!("Notification" in window)) return toast("Notificações não disponíveis");
    const permission = await Notification.requestPermission();
    const enabled = permission === "granted";
    saveCfg({ notifyTimer: enabled });
    toast(enabled ? "Notificações ativadas" : "Permissão não concedida");
  }

  function dataModal() {
    const current = cfg();
    const bytes = new Blob([JSON.stringify(state)]).size;
    openModal("Central de dados", `
      <div class="metric-grid">
        <div class="metric"><span>Treinos salvos</span><strong>${(state.sessions||[]).length}</strong></div>
        <div class="metric"><span>Tamanho local</span><strong>${Math.max(1,Math.round(bytes/1024))} KB</strong></div>
        <div class="metric"><span>Último backup</span><strong>${current.lastBackupAt?new Date(current.lastBackupAt).toLocaleDateString("pt-BR"):"Nunca"}</strong></div>
      </div>
      <div class="stack top-gap">
        <button id="v05Backup" class="button primary wide">Criar backup agora</button>
        <button id="v05Notify" class="button secondary wide">${current.notifyTimer?"Notificações ativas":"Ativar notificações do timer"}</button>
        <button id="v05Integrity" class="button secondary wide">Verificar integridade dos dados</button>
      </div>
      <p class="muted top-gap">Os dados permanecem no aparelho.</p>`);
    document.getElementById("v05Backup").onclick = () => {
      document.getElementById("exportDataBtn")?.click();
      saveCfg({ lastBackupAt: Date.now() });
      toast("Backup preparado");
    };
    document.getElementById("v05Notify").onclick = requestNotifications;
    document.getElementById("v05Integrity").onclick = () => {
      const ok = ["plans","sessions","records","measurements","equipment"].every(k=>Array.isArray(state[k]));
      toast(ok ? "Dados locais íntegros" : "Estrutura local precisa de revisão");
    };
  }

  function timerNotify() {
    const c = cfg();
    if (!c.notifyTimer || !("Notification" in window) || Notification.permission !== "granted") return;
    try { new Notification("Corporesapiens", { body:"Seu intervalo terminou.", icon:"icon.svg" }); } catch {}
  }

  function bindTimer() {
    const display = document.getElementById("timerDisplay");
    if (!display || display.dataset.v05Bound) return;
    display.dataset.v05Bound = "1";
    let previous = display.textContent;
    new MutationObserver(() => {
      const current = display.textContent;
      if (previous !== "00:00" && current === "00:00") timerNotify();
      previous = current;
    }).observe(display, { childList:true, subtree:true, characterData:true });
  }

  const originalRenderAll = renderAll;
  renderAll = function() {
    originalRenderAll();
    addHub();
    renderSummary();
    bindTimer();
  };

  addHub();
  renderSummary();
  bindTimer();
})();
