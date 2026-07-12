
(() => {
  "use strict";

  const V05_KEY = "corporesapiens_v05_settings";

  function v05Settings(){
    const fallback={
      goals:[],
      notifyTimer:false,
      reminderDays:3,
      lastBackupAt:null
    };
    try{return {...fallback,...JSON.parse(localStorage.getItem(V05_KEY)||"{}")}}
    catch{return fallback}
  }

  function saveV05(next){
    localStorage.setItem(V05_KEY,JSON.stringify({...v05Settings(),...next}));
  }

  function allExerciseSets(){
    const rows=[];
    state.sessions.forEach(session=>{
      (session.exercises||[]).forEach(exercise=>{
        (exercise.sets||[]).forEach(set=>{
          rows.push({
            exercise:exercise.name,
            sessionName:session.name,
            finishedAt:Number(session.finishedAt)||0,
            date:new Date(session.finishedAt),
            weight:Number(set.weight)||0,
            reps:Number(set.reps)||0,
            volume:(Number(set.weight)||0)*(Number(set.reps)||0)
          });
        });
      });
    });
    return rows;
  }

  function exerciseNames(){
    return [...new Set(allExerciseSets().map(x=>x.exercise))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
  }

  function bestFor(name,field){
    const rows=allExerciseSets().filter(x=>x.exercise===name);
    return rows.length?Math.max(...rows.map(x=>x[field]||0)):0;
  }

  function daysSinceLastSession(){
    if(!state.sessions.length) return null;
    const last=Math.max(...state.sessions.map(s=>Number(s.finishedAt)||0));
    return Math.floor((Date.now()-last)/86400000);
  }

  function nextPlanSuggestion(){
    if(!state.plans.length) return null;
    const latestByPlan={};
    state.sessions.forEach(s=>{
      const key=s.planId||s.name;
      latestByPlan[key]=Math.max(latestByPlan[key]||0,Number(s.finishedAt)||0);
    });
    return [...state.plans].sort((a,b)=>(latestByPlan[a.id]||0)-(latestByPlan[b.id]||0))[0];
  }

  function addV05UI(){
    if(document.getElementById("v05Hub")) return;
    const more=document.getElementById("moreView");
    if(!more) return;

    const card=document.createElement("div");
    card.id="v05Hub";
    card.className="card v05-card";
    card.innerHTML=`
      <div class="section-head">
        <div><p class="eyebrow">CORPORESAPIENS 0.5</p><h2>Histórico, metas e segurança</h2></div>
        <span class="chip">local</span>
      </div>
      <div class="v05-actions">
        <button id="exerciseHistoryBtn" class="button secondary">Histórico por exercício</button>
        <button id="personalGoalsBtn" class="button secondary">Metas pessoais</button>
        <button id="nextWorkoutBtn" class="button secondary">Próximo treino</button>
        <button id="dataCenterBtn" class="button secondary">Central de dados</button>
      </div>
      <div id="v05Summary" class="top-gap"></div>
    `;

    const dataCard=[...more.querySelectorAll(".card")].find(x=>x.textContent.includes("Backup"));
    more.insertBefore(card,dataCard||more.firstChild);

    document.getElementById("exerciseHistoryBtn").onclick=exerciseHistoryModal;
    document.getElementById("personalGoalsBtn").onclick=goalsModal;
    document.getElementById("nextWorkoutBtn").onclick=nextWorkoutModal;
    document.getElementById("dataCenterBtn").onclick=dataCenterModal;
    renderV05Summary();
  }

  function renderV05Summary(){
    const el=document.getElementById("v05Summary");
    if(!el) return;
    const names=exerciseNames();
    const goals=v05Settings().goals||[];
    const stale=daysSinceLastSession();
    el.innerHTML=`
      <div class="metric-grid">
        <div class="metric"><span>Exercícios com histórico</span><strong>${names.length}</strong></div>
        <div class="metric"><span>Metas pessoais</span><strong>${goals.length}</strong></div>
        <div class="metric"><span>Último treino</span><strong>${stale===null?"—":stale+"d"}</strong></div>
      </div>`;
  }

  function exerciseHistoryModal(){
    const names=exerciseNames();
    openModal("Histórico por exercício", names.length?`
      <label>Exercício<select id="historyExerciseSelect">${names.map(n=>`<option>${esc(n)}</option>`).join("")}</select></label>
      <div id="exerciseHistoryMount" class="top-gap"></div>
    `:`<div class="empty">Conclua treinos para criar histórico por exercício.</div>`);

    if(!names.length) return;

    const draw=()=>{
      const name=document.getElementById("historyExerciseSelect").value;
      const rows=allExerciseSets().filter(x=>x.exercise===name).sort((a,b)=>b.finishedAt-a.finishedAt);
      const bestWeight=bestFor(name,"weight"),bestVolume=bestFor(name,"volume"),bestReps=bestFor(name,"reps");
      document.getElementById("exerciseHistoryMount").innerHTML=`
        <div class="metric-grid">
          <div class="metric"><span>Maior carga</span><strong>${num(bestWeight)} kg</strong></div>
          <div class="metric"><span>Melhor volume</span><strong>${num(bestVolume)}</strong></div>
          <div class="metric"><span>Mais repetições</span><strong>${bestReps}</strong></div>
        </div>
        <div class="stack top-gap">${rows.slice(0,30).map(r=>`
          <article class="history-row">
            <div><strong>${r.date.toLocaleDateString("pt-BR")}</strong><div class="meta">${esc(r.sessionName)}</div></div>
            <b>${num(r.weight)} kg × ${r.reps}</b>
          </article>`).join("")}
        </div>`;
    };
    document.getElementById("historyExerciseSelect").onchange=draw;
    draw();
  }

  function goalProgress(goal){
    const field=goal.metric;
    if(field==="sessions") return state.sessions.length;
    if(field==="records") return state.records.length;
    if(field==="volume") return Math.round(state.sessions.reduce((s,x)=>s+sessionVolume(x),0));
    if(field==="weight"){
      return bestFor(goal.exercise,"weight");
    }
    return 0;
  }

  function goalsModal(){
    const settings=v05Settings();
    openModal("Metas pessoais", `
      <div id="goalsList" class="stack"></div>
      <button id="addGoalBtn" class="button primary wide top-gap">Adicionar meta</button>
    `);

    const draw=()=>{
      const goals=v05Settings().goals||[];
      document.getElementById("goalsList").innerHTML=goals.length?goals.map(g=>{
        const current=goalProgress(g);
        const pct=Math.min(100,Math.round(current/Math.max(1,Number(g.target))*100));
        return `<article class="goal-item">
          <div class="list-item-head">
            <div><strong>${esc(g.title)}</strong><div class="meta">${num(current)} de ${num(g.target)}</div></div>
            <button class="button danger compact" data-delete-goal="${g.id}">Excluir</button>
          </div>
          <div class="goal-track"><span style="width:${pct}%"></span></div>
        </article>`;
      }).join(""):`<div class="empty">Nenhuma meta criada.</div>`;

      document.querySelectorAll("[data-delete-goal]").forEach(b=>b.onclick=()=>{
        saveV05({goals:(v05Settings().goals||[]).filter(g=>g.id!==b.dataset.deleteGoal)});
        draw(); renderV05Summary();
      });
    };

    document.getElementById("addGoalBtn").onclick=()=>{
      openModal("Nova meta", `
        <label>Nome da meta<input id="goalTitle" maxlength="60" placeholder="Ex.: completar 20 treinos"></label>
        <label>Tipo
          <select id="goalMetric">
            <option value="sessions">Treinos concluídos</option>
            <option value="records">Recordes registrados</option>
            <option value="volume">Volume total em kg</option>
            <option value="weight">Maior carga em exercício</option>
          </select>
        </label>
        <label id="goalExerciseWrap" class="hidden">Exercício
          <select id="goalExercise">${exerciseNames().map(n=>`<option>${esc(n)}</option>`).join("")}</select>
        </label>
        <label>Valor-alvo<input id="goalTarget" type="number" min="1" step="1" value="10"></label>
        <button id="savePersonalGoalBtn" class="button primary wide top-gap">Salvar meta</button>
      `);
      document.getElementById("goalMetric").onchange=e=>{
        document.getElementById("goalExerciseWrap").classList.toggle("hidden",e.target.value!=="weight");
      };
      document.getElementById("savePersonalGoalBtn").onclick=()=>{
        const title=document.getElementById("goalTitle").value.trim();
        const metric=document.getElementById("goalMetric").value;
        const target=Number(document.getElementById("goalTarget").value);
        if(!title||!target) return toast("Preencha nome e valor");
        const goals=v05Settings().goals||[];
        goals.push({
          id:uid(),title,metric,target,
          exercise:metric==="weight"?document.getElementById("goalExercise").value:""
        });
        saveV05({goals}); closeModal(); goalsModal(); renderV05Summary(); toast("Meta criada");
      };
    };
    draw();
  }

  function nextWorkoutModal(){
    const plan=nextPlanSuggestion();
    const stale=daysSinceLastSession();
    openModal("Próximo treino", plan?`
      <p class="muted">Sugestão organizacional baseada apenas na ficha há mais tempo sem uso.</p>
      <article class="next-plan-card">
        <p class="eyebrow">SUGESTÃO LOCAL</p>
        <h3>${esc(plan.name)|</h3>
        <p class="muted">${plan.exercises?.length||0} exercícios · último treino ${stale===null?"não registrado":stale+" dia(s) atrás"}</p>
        <div class="chips">${(plan.exercises||[]).slice(0,6).map(e=>`<span class="chip">${esc(e.name)}</span>`).join("")}</div>
        <button id="startSuggestedPlanBtn" class="button primary wide top-gap">Iniciar esta ficha</button>
      </article>
    `:`<div class="empty">Crie uma ficha para receber uma sugestão.</div>`);
    if(plan) document.getElementById("startSuggestedPlanBtn").onclick=()=>{
      closeModal(); startPlan(plan.id); nav("workouts");
    };
  }

  async function requestTimerNotifications(){
    if(!("Notification" in window)) return toast("Notificações não disponíveis");
    const permission=await Notification.requestPermission();
    const enabled=permission==="granted";
    saveV05({notifyTimer:enabled});
    toast(enabled?"Notificações ativadas":"Permissão não concedida");
  }

  function dataCenterModal(){
    const cfg=v05Settings();
    const bytes=new Blob([JSON.stringify(state)]).size;
    openModal("Central de dados", `
      <div class="metric-grid">
        <div class="metric"><span>Treinos salvos</span><strong>${state.sessions.length}</strong></div>
        <div class="metric"><span>Tamanho local</span><strong>${Math.max(1,Math.round(bytes/1024))} KB</strong></div>
        <div class="metric"><span>Último backup</span><strong>${cfg.lastBackupAt?new Date(cfg.lastBackupAt).toLocaleDateString("pt-BR"):"Nunca"}</strong></div>
      </div>
      <div class="stack top-gap">
        <button id="safeBackupBtn" class="button primary wide">Criar backup agora</button>
        <button id="timerNotifyBtn" class="button secondary wide">${cfg.notifyTimer?"Notificações do timer ativas":"Ativar notificações do timer"}</button>
        <button id="integrityCheckBtn" class="button secondary wide">Verificar integridade dos dados</button>
      </div>
      <p class="muted top-gap">O backup é baixado para o aparelho. Nenhum dado é enviado automaticamente.</p>
    `);
    document.getElementById("safeBackupBtn").onclick=()=>{
      document.getElementById("exportDataBtn")?.click();
      saveV05({lastBackupAt:Date.now()});
      toast("Backup preparado");
    };
    document.getElementById("timerNotifyBtn").onclick=requestTimerNotifications;
    document.getElementById("integrityCheckBtn").onclick=()=>{
      const checks=[
        Array.isArray(state.plans),Array.isArray(state.sessions),Array.isArray(state.records),
        Array.isArray(state.measurements),Array.isArray(state.equipment)
      ];
      toast(checks.every(Boolean)?"Dados locais íntegros":"Estrutura local precisa de revisão");
    };
  }

  function notifyTimerEnd(){
    const cfg=v05Settings();
    if(!cfg.notifyTimer||!("Notification" in window)||Notification.permission!=="granted") return;
    try{new Notification("Corporesapiens",{body:"Seu intervalo terminou.",icon:"icon.svg"})}catch{}
  }

  // Detecta conclusão do timer observando o texto e o estado do botão.
  function bindTimerObserver(){
    const display=document.getElementById("timerDisplay");
    if(!display) return;
    let previous=display.textContent;
    new MutationObserver(()=>{
      const current=display.textContent;
      if(previous!=="00:00"&&current==="00:00") notifyTimerEnd();
      previous=current;
    }).observe(display,{childList:true,subtree:true,characterData:true});
  }

  const oldRenderAll=renderAll;
  renderAll=function(){
    oldRenderAll();
    addV05UI();
    renderV05Summary();
  };

  addV05UI();
  renderV05Summary();
  bindTimerObserver();
})();
