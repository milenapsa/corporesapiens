
(() => {
  "use strict";

  const V04_KEY = "corporesapiens_v04_preferences";
  const ACHIEVEMENTS = [
    {id:"first", title:"Primeiro passo", text:"Conclua seu primeiro treino.", check:s=>s.length>=1},
    {id:"five", title:"Ritmo criado", text:"Conclua 5 treinos.", check:s=>s.length>=5},
    {id:"ten", title:"Consistência", text:"Conclua 10 treinos.", check:s=>s.length>=10},
    {id:"volume10k", title:"10 mil", text:"Registre 10.000 kg de volume.", check:s=>totalVolume(s)>=10000},
    {id:"record3", title:"Colecionador de recordes", text:"Registre 3 recordes.", check:()=>state.records.length>=3},
    {id:"weekgoal", title:"Meta semanal", text:"Atinja a meta semanal.", check:s=>sessionsThisWeek(s)>=prefs().weeklyGoal}
  ];

  function prefs(){
    const fallback={name:"",weeklyGoal:3,onboarded:false,focusMode:false};
    try{return {...fallback,...JSON.parse(localStorage.getItem(V04_KEY)||"{}")}}catch{return fallback}
  }
  function savePrefs(next){localStorage.setItem(V04_KEY,JSON.stringify({...prefs(),...next}))}

  function totalVolume(sessions){
    return sessions.reduce((sum,s)=>sum+(s.exercises||[]).reduce((a,e)=>a+(e.sets||[]).reduce((b,x)=>b+(Number(x.weight)||0)*(Number(x.reps)||0),0),0),0);
  }
  function startOfWeek(d=new Date()){
    const x=new Date(d); const day=(x.getDay()+6)%7;
    x.setHours(0,0,0,0); x.setDate(x.getDate()-day); return x;
  }
  function sessionsThisWeek(sessions=state.sessions){
    const start=startOfWeek().getTime();
    return sessions.filter(s=>Number(s.finishedAt)>=start).length;
  }
  function sessionsThisMonth(sessions=state.sessions){
    const now=new Date();
    return sessions.filter(s=>{
      const d=new Date(s.finishedAt);
      return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    });
  }
  function earnedAchievements(){
    return ACHIEVEMENTS.filter(a=>a.check(state.sessions));
  }

  function addV04UI(){
    if(document.getElementById("v04Dashboard")) return;
    const home=document.getElementById("homeView");
    if(!home) return;

    const card=document.createElement("div");
    card.id="v04Dashboard";
    card.className="card v04-card";
    card.innerHTML=`
      <div class="section-head">
        <div><p class="eyebrow">CORPORESAPIENS 0.4</p><h2>Meta e consistência</h2></div>
        <button id="editGoalBtn" class="button secondary compact">Configurar</button>
      </div>
      <div id="weeklyGoalMount"></div>
      <div class="v04-actions top-gap">
        <button id="achievementsBtn" class="button secondary">Conquistas</button>
        <button id="monthlySummaryBtn" class="button secondary">Resumo mensal</button>
        <button id="shareProgressBtn" class="button secondary">Compartilhar progresso</button>
        <button id="focusModeBtn" class="button secondary">Modo foco</button>
      </div>
    `;
    const stats=home.querySelector(".stats-grid");
    if(stats) stats.after(card); else home.prepend(card);

    document.getElementById("editGoalBtn").onclick=goalModal;
    document.getElementById("achievementsBtn").onclick=achievementsModal;
    document.getElementById("monthlySummaryBtn").onclick=monthlySummaryModal;
    document.getElementById("shareProgressBtn").onclick=shareProgress;
    document.getElementById("focusModeBtn").onclick=toggleFocusMode;
    renderV04();
  }

  function renderV04(){
    const mount=document.getElementById("weeklyGoalMount");
    if(!mount) return;
    const p=prefs(),done=sessionsThisWeek(),goal=Math.max(1,Number(p.weeklyGoal)||3);
    const percent=Math.min(100,Math.round(done/goal*100));
    const name=p.name?`, ${esc(p.name)}`:"";
    mount.innerHTML=`
      <p class="muted">Boa sequência${name}. Sua meta semanal fica salva somente neste aparelho.</p>
      <div class="goal-row">
        <div><strong>${done} de ${goal} treinos</strong><div class="meta">${percent}% concluído</div></div>
        <span class="goal-ring" style="--value:${percent}"><b>${percent}%</b></span>
      </div>
      <div class="goal-track"><span style="width:${percent}%"></span></div>
      <div class="achievement-preview">${earnedAchievements().slice(-3).map(a=>`<span class="chip">✓ ${esc(a.title)}</span>`).join("")||'<span class="chip">Primeira conquista em andamento</span>'}</div>`;
    const f=document.getElementById("focusModeBtn");
    if(f) f.textContent=p.focusMode?"Sair do modo foco":"Modo foco";
  }

  function onboarding(){
    const p=prefs();
    if(p.onboarded) return;
    openModal("Bem-vindo ao Corporesapiens", `
      <p class="muted">Configuração opcional e local. Nenhuma informação será enviada para servidor.</p>
      <label>Como quer ser chamado?<input id="onboardName" maxlength="40" placeholder="Opcional"></label>
      <label>Meta semanal de treinos
        <select id="onboardGoal">${[1,2,3,4,5,6,7].map(x=>`<option value="${x}" ${x===3?"selected":""}>${x} por semana</option>`).join("")}</select>
      </label>
      <button id="finishOnboardingBtn" class="button primary wide top-gap">Começar</button>
      <button id="skipOnboardingBtn" class="button secondary wide top-gap">Usar sem configurar</button>
    `);
    document.getElementById("finishOnboardingBtn").onclick=()=>{
      savePrefs({name:document.getElementById("onboardName").value.trim(),weeklyGoal:Number(document.getElementById("onboardGoal").value),onboarded:true});
      closeModal(); renderV04(); toast("Configuração salva neste aparelho");
    };
    document.getElementById("skipOnboardingBtn").onclick=()=>{
      savePrefs({onboarded:true}); closeModal(); renderV04();
    };
  }

  function goalModal(){
    const p=prefs();
    openModal("Meta semanal", `
      <label>Nome local<input id="goalName" maxlength="40" value="${esc(p.name)}" placeholder="Opcional"></label>
      <label>Treinos por semana
        <select id="goalValue">${[1,2,3,4,5,6,7].map(x=>`<option value="${x}" ${x===Number(p.weeklyGoal)?"selected":""}>${x}</option>`).join("")}</select>
      </label>
      <button id="saveGoalBtn" class="button primary wide top-gap">Salvar meta</button>
    `);
    document.getElementById("saveGoalBtn").onclick=()=>{
      savePrefs({name:document.getElementById("goalName").value.trim(),weeklyGoal:Number(document.getElementById("goalValue").value),onboarded:true});
      closeModal(); renderV04(); toast("Meta atualizada");
    };
  }

  function achievementsModal(){
    const earned=new Set(earnedAchievements().map(x=>x.id));
    openModal("Conquistas", `
      <div class="achievement-grid">${ACHIEVEMENTS.map(a=>`
        <article class="achievement ${earned.has(a.id)?"earned":""}">
          <span class="achievement-icon">${earned.has(a.id)?"✓":"○"}</span>
          <div><strong>${esc(a.title)}</strong><p class="meta">${esc(a.text)}</p></div>
        </article>`).join("")}</div>
    `);
  }

  function monthStats(){
    const sessions=sessionsThisMonth();
    const duration=sessions.reduce((sum,s)=>sum+Math.max(0,((Number(s.finishedAt)||0)-(Number(s.startedAt)||Number(s.finishedAt)||0))/60000),0);
    const exercises=new Set(sessions.flatMap(s=>(s.exercises||[]).map(e=>e.name)));
    return {
      sessions,volume:totalVolume(sessions),duration:Math.round(duration),
      exercises:exercises.size,records:state.records.filter(r=>{
        const d=new Date((r.date||"")+"T12:00:00"),n=new Date();
        return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()
      }).length
    };
  }

  function monthlySummaryModal(){
    const m=monthStats(),month=new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
    openModal(`Resumo de ${month}`, `
      <div class="metric-grid">
        <div class="metric"><span>Treinos</span><strong>${m.sessions.length}</strong></div>
        <div class="metric"><span>Volume</span><strong>${moneyless(m.volume)} kg</strong></div>
        <div class="metric"><span>Minutos</span><strong>${m.duration}</strong></div>
        <div class="metric"><span>Exercícios</span><strong>${m.exercises}</strong></div>
        <div class="metric"><span>Recordes</span><strong>${m.records}</strong></div>
        <div class="metric"><span>Conquistas</span><strong>${earnedAchievements().length}</strong></div>
      </div>
      <button id="modalShareMonthBtn" class="button primary wide top-gap">Compartilhar resumo</button>
    `);
    document.getElementById("modalShareMonthBtn").onclick=shareProgress;
  }

  function progressText(){
    const p=prefs(),m=monthStats(),week=sessionsThisWeek();
    return `Corporesapiens — meu progresso\n\nEsta semana: ${week}/${p.weeklyGoal} treinos\nNeste mês: ${m.sessions.length} treinos\nVolume registrado: ${Math.round(m.volume).toLocaleString("pt-BR")} kg\nRecordes no mês: ${m.records}\n\nMeu treino, minhas cargas e minha evolução.`;
  }

  async function shareProgress(){
    const text=progressText();
    try{
      if(navigator.share){await navigator.share({title:"Meu progresso no Corporesapiens",text});}
      else{await navigator.clipboard.writeText(text);toast("Resumo copiado");}
    }catch(e){
      if(e?.name!=="AbortError") toast("Não foi possível compartilhar");
    }
  }

  function toggleFocusMode(){
    const next=!prefs().focusMode;
    savePrefs({focusMode:next});
    document.body.classList.toggle("focus-mode",next);
    renderV04();
    toast(next?"Modo foco ativado":"Modo foco desativado");
  }

  function enhanceActiveWorkout(){
    const mount=document.getElementById("activeWorkoutMount");
    if(!mount) return;
    const apply=()=>{
      const active=Boolean(state.activeSession);
      document.body.classList.toggle("workout-active",active);
      if(!active) return;
      if(!mount.querySelector(".v04-session-strip")){
        const sets=(state.activeSession.exercises||[]).reduce((n,e)=>n+(e.sets||[]).filter(s=>s.done).length,0);
        const total=(state.activeSession.exercises||[]).reduce((n,e)=>n+(e.sets||[]).length,0);
        const strip=document.createElement("div");
        strip.className="v04-session-strip";
        strip.innerHTML=`<span>Séries concluídas</span><strong>${sets}/${total}</strong>`;
        mount.prepend(strip);
      }
    };
    new MutationObserver(apply).observe(mount,{childList:true,subtree:true});
    apply();
  }

  const oldRenderAll=renderAll;
  renderAll=function(){
    oldRenderAll();
    addV04UI();
    renderV04();
    enhanceActiveWorkout();
  };

  document.body.classList.toggle("focus-mode",prefs().focusMode);
  addV04UI();
  renderV04();
  enhanceActiveWorkout();
  setTimeout(onboarding,450);
})();
