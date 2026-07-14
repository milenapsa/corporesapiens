const KEY="gymcalc_one_state_v2";
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"_"+Math.random().toString(16).slice(2);
const today=()=>new Date().toISOString().slice(0,10);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const num=n=>Number(n||0).toLocaleString("pt-BR",{maximumFractionDigits:2});
const moneyless=n=>Number(n||0).toLocaleString("pt-BR",{maximumFractionDigits:0});
const dateBR=s=>s?new Date(s+"T12:00:00").toLocaleDateString("pt-BR"):"";
const $=id=>document.getElementById(id);
const stateDefault={
  version:1,
  plans:[],
  sessions:[],
  attendance:[],
  records:[],
  measurements:[],
  equipment:[],
  activeSession:null,
  settings:{unit:"kg",vibrate:true,sound:true}
};
let state=loadState();
let modalSave=null;
let toastId;
let calendarCursor=new Date();
function loadState(){try{return {...structuredClone(stateDefault),...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return structuredClone(stateDefault)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll()}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");clearTimeout(toastId);toastId=setTimeout(()=>$("toast").classList.remove("show"),2100)}
function openModal(title,html,onSave){$("modalTitle").textContent=title;$("modalBody").innerHTML=html;$("modal").classList.remove("hidden");modalSave=onSave}
function closeModal(){$("modal").classList.add("hidden");$("modalBody").innerHTML="";modalSave=null}
document.querySelectorAll("[data-close-modal]").forEach(x=>x.onclick=closeModal);

function nav(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.dataset.view===view));
  document.querySelectorAll(".bottom-nav [data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===view));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.nav)));
document.querySelectorAll("[data-open-tool]").forEach(b=>b.addEventListener("click",()=>{nav("tools");selectTool(b.dataset.openTool)}));

function selectTool(name){
  document.querySelectorAll("[data-tool-tab]").forEach(b=>b.classList.toggle("active",b.dataset.toolTab===name));
  document.querySelectorAll("[data-tool-panel]").forEach(p=>p.classList.toggle("active",p.dataset.toolPanel===name));
}
document.querySelectorAll("[data-tool-tab]").forEach(b=>b.onclick=()=>selectTool(b.dataset.toolTab));
function selectProgress(name){
  document.querySelectorAll("[data-progress-tab]").forEach(b=>b.classList.toggle("active",b.dataset.progressTab===name));
  document.querySelectorAll("[data-progress-panel]").forEach(p=>p.classList.toggle("active",p.dataset.progressPanel===name));
}
document.querySelectorAll("[data-progress-tab]").forEach(b=>b.onclick=()=>selectProgress(b.dataset.progressTab));

function monthSessions(){
  const now=new Date(),m=now.getMonth(),y=now.getFullYear();
  return state.sessions.filter(s=>{const d=new Date(s.finishedAt);return d.getMonth()===m&&d.getFullYear()===y});
}
function sessionVolume(s){return (s.exercises||[]).reduce((a,e)=>a+(e.sets||[]).reduce((b,x)=>b+(Number(x.weight)||0)*(Number(x.reps)||0),0),0)}
function streak(){
  const set=new Set(state.attendance);
  let d=new Date(),n=0;
  while(set.has(d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}
  return n;
}
function renderHome(){
  const active=state.activeSession;
  $("homeGreeting").textContent=active?`${active.name} em andamento`:(state.plans.length?"Pronto para o próximo treino?":"Monte sua primeira ficha");
  $("homeSub").textContent=active?"Continue registrando séries e cargas.":"Tudo fica salvo localmente neste aparelho.";
  $("homePrimaryBtn").textContent=active?"Continuar treino":state.plans.length?"Abrir meus treinos":"Criar primeiro treino";
  $("homePrimaryBtn").onclick=()=>nav("workouts");
  $("statMonth").textContent=monthSessions().length;
  $("statStreak").textContent=`${streak()} dias`;
  $("statVolume").textContent=`${moneyless(monthSessions().reduce((a,s)=>a+sessionVolume(s),0))} kg`;
  $("statRecords").textContent=state.records.length;
  const last=[...state.sessions].sort((a,b)=>b.finishedAt-a.finishedAt)[0];
  $("lastSession").innerHTML=last?`<div class="list-item"><div class="list-item-head"><div><strong>${esc(last.name)}</strong><div class="meta">${new Date(last.finishedAt).toLocaleString("pt-BR")}</div></div><b>${moneyless(sessionVolume(last))} kg</b></div><div class="chips"><span class="chip">${last.exercises.length} exercícios</span><span class="chip">${last.exercises.reduce((a,e)=>a+e.sets.length,0)} séries</span></div></div>`:`<div class="empty">Nenhum treino concluído ainda.</div>`;
}

function planModal(plan){
  const p=plan?structuredClone(plan):{id:uid(),name:"",notes:"",exercises:[]};
  openModal(plan?"Editar treino":"Novo treino",`
    <label>Nome do treino<input id="planName" value="${esc(p.name)}" placeholder="Ex.: Treino A"></label>
    <label>Observações<textarea id="planNotes" rows="2" placeholder="Opcional">${esc(p.notes)}</textarea></label>
    <div class="section-head top-gap"><h3>Exercícios</h3><button id="modalAddExercise" class="button secondary compact">+ Exercício</button></div>
    <div id="exerciseEditor"></div>
    <button id="modalSavePlan" class="button primary wide top-gap">Salvar treino</button>
  `);
  let exercises=p.exercises.length?p.exercises:[{id:uid(),name:"",sets:3,reps:"8-12",rest:90}];
  const draw=()=>{
    $("exerciseEditor").innerHTML=exercises.map((e,i)=>`<div class="exercise-editor-row">
      <label>Exercício<input data-ex-name="${i}" value="${esc(e.name)}" placeholder="Nome"></label>
      <label>Séries<input data-ex-sets="${i}" type="number" min="1" max="20" value="${e.sets}"></label>
      <label>Reps<input data-ex-reps="${i}" value="${esc(e.reps)}"></label>
      <label>Desc.<input data-ex-rest="${i}" type="number" min="0" value="${e.rest}"></label>
      <button class="remove-mini" data-remove-ex="${i}">×</button>
    </div>`).join("");
    document.querySelectorAll("[data-remove-ex]").forEach(b=>b.onclick=()=>{exercises.splice(+b.dataset.removeEx,1);draw()});
  };
  draw();
  $("modalAddExercise").onclick=()=>{sync();exercises.push({id:uid(),name:"",sets:3,reps:"8-12",rest:90});draw()};
  function sync(){
    exercises=exercises.map((e,i)=>({...e,name:document.querySelector(`[data-ex-name="${i}"]`)?.value.trim()||"",sets:+document.querySelector(`[data-ex-sets="${i}"]`)?.value||3,reps:document.querySelector(`[data-ex-reps="${i}"]`)?.value.trim()||"",rest:+document.querySelector(`[data-ex-rest="${i}"]`)?.value||0}));
  }
  $("modalSavePlan").onclick=()=>{
    sync();p.name=$("planName").value.trim();p.notes=$("planNotes").value.trim();p.exercises=exercises.filter(e=>e.name);
    if(!p.name||!p.exercises.length)return toast("Informe o nome e ao menos um exercício.");
    const idx=state.plans.findIndex(x=>x.id===p.id);if(idx>=0)state.plans[idx]=p;else state.plans.push(p);
    closeModal();save();toast("Treino salvo");
  };
}
$("newPlanBtn").onclick=()=>planModal();
function renderPlans(){
  $("plansList").innerHTML=state.plans.length?state.plans.map(p=>`<article class="list-item">
    <div class="list-item-head"><div><strong>${esc(p.name)}</strong><div class="meta">${p.exercises.length} exercícios</div></div><span class="chip">${p.exercises.reduce((a,e)=>a+Number(e.sets||0),0)} séries</span></div>
    ${p.notes?`<p class="muted top-gap">${esc(p.notes)}</p>`:""}
    <div class="chips">${p.exercises.slice(0,5).map(e=>`<span class="chip">${esc(e.name)}</span>`).join("")}${p.exercises.length>5?`<span class="chip">+${p.exercises.length-5}</span>`:""}</div>
    <div class="actions"><button class="button primary compact" data-start-plan="${p.id}">Iniciar</button><button class="button secondary compact" data-edit-plan="${p.id}">Editar</button><button class="button danger compact" data-delete-plan="${p.id}">Excluir</button></div>
  </article>`).join(""):`<div class="empty">Nenhuma ficha criada. Adicione o treino que você já utiliza.</div>`;
  document.querySelectorAll("[data-start-plan]").forEach(b=>b.onclick=()=>startPlan(b.dataset.startPlan));
  document.querySelectorAll("[data-edit-plan]").forEach(b=>b.onclick=()=>planModal(state.plans.find(p=>p.id===b.dataset.editPlan)));
  document.querySelectorAll("[data-delete-plan]").forEach(b=>b.onclick=()=>{if(confirm("Excluir este treino?")){state.plans=state.plans.filter(p=>p.id!==b.dataset.deletePlan);save()}});
}
function startPlan(id){
  if(state.activeSession&&!confirm("Já existe um treino em andamento. Substituir?"))return;
  const p=state.plans.find(x=>x.id===id);if(!p)return;
  state.activeSession={id:uid(),planId:p.id,name:p.name,startedAt:Date.now(),notes:"",exercises:p.exercises.map(e=>({id:e.id,name:e.name,targetReps:e.reps,rest:e.rest,sets:Array.from({length:e.sets},()=>({id:uid(),weight:"",reps:"",done:false}))}))};
  save();nav("workouts");toast("Treino iniciado");
}
function renderActiveWorkout(){
  const s=state.activeSession,m=$("activeWorkoutMount");
  if(!s){m.innerHTML="";return}
  m.innerHTML=`<div class="card workout-active">
    <div class="section-head"><div><p class="eyebrow">TREINO EM ANDAMENTO</p><h2>${esc(s.name)}</h2><div class="meta">Iniciado ${new Date(s.startedAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div></div><button id="cancelWorkoutBtn" class="button danger compact">Cancelar</button></div>
    <div class="session-summary"><span class="chip" id="liveSets">0 séries</span><span class="chip" id="liveVolume">0 kg</span><span class="chip" id="liveTime">0 min</span></div>
    <div id="sessionExercises">${s.exercises.map((e,ei)=>`<div class="exercise-block"><div class="list-item-head"><div><strong>${esc(e.name)}</strong><div class="meta">Meta: ${esc(e.targetReps||"-")} reps · descanso ${e.rest||0}s</div></div><button class="icon-btn" data-add-set="${ei}">+</button></div>
      <div>${e.sets.map((set,si)=>`<div class="set-row ${set.done?"completed":""}">
        <div class="set-number">${si+1}</div>
        <label>Carga<input data-set-weight="${ei}-${si}" type="number" min="0" step=".5" value="${esc(set.weight)}"></label>
        <label>Reps<input data-set-reps="${ei}-${si}" type="number" min="0" step="1" value="${esc(set.reps)}"></label>
        <input class="set-done" data-set-done="${ei}-${si}" type="checkbox" ${set.done?"checked":""}>
      </div>`).join("")}</div></div>`).join("")}</div>
    <label class="top-gap">Observações<textarea id="sessionNotes" rows="2" placeholder="Opcional">${esc(s.notes)}</textarea></label>
    <button id="finishWorkoutBtn" class="button primary wide">Concluir treino</button>
  </div>`;
  $("cancelWorkoutBtn").onclick=()=>{if(confirm("Cancelar e apagar o treino em andamento?")){state.activeSession=null;save()}};
  $("finishWorkoutBtn").onclick=finishWorkout;
  $("sessionNotes").onchange=e=>{state.activeSession.notes=e.target.value;saveSilent()};
  document.querySelectorAll("[data-add-set]").forEach(b=>b.onclick=()=>{state.activeSession.exercises[+b.dataset.addSet].sets.push({id:uid(),weight:"",reps:"",done:false});save()});
  document.querySelectorAll("[data-set-weight]").forEach(i=>i.onchange=()=>updateSet(i.dataset.setWeight,"weight",i.value));
  document.querySelectorAll("[data-set-reps]").forEach(i=>i.onchange=()=>updateSet(i.dataset.setReps,"reps",i.value));
  document.querySelectorAll("[data-set-done]").forEach(i=>i.onchange=()=>{updateSet(i.dataset.setDone,"done",i.checked);if(i.checked){const [ei]=i.dataset.setDone.split("-").map(Number);const rest=state.activeSession.exercises[ei].rest;if(rest){setTimer(rest);selectTool("timer");toast(`Descanso de ${rest}s preparado`)}}});
  updateLiveSummary();
}
function saveSilent(){localStorage.setItem(KEY,JSON.stringify(state))}
function updateSet(key,field,value){const [ei,si]=key.split("-").map(Number);state.activeSession.exercises[ei].sets[si][field]=value;saveSilent();updateLiveSummary()}
function updateLiveSummary(){if(!state.activeSession)return;const all=state.activeSession.exercises.flatMap(e=>e.sets);$("liveSets").textContent=`${all.filter(s=>s.done).length} séries`;$("liveVolume").textContent=`${moneyless(all.reduce((a,s)=>a+(+s.weight||0)*(+s.reps||0),0))} kg`;$("liveTime").textContent=`${Math.max(0,Math.round((Date.now()-state.activeSession.startedAt)/60000))} min`}
function finishWorkout(){
  const s=state.activeSession;if(!s)return;
  s.finishedAt=Date.now();s.exercises=s.exercises.map(e=>({...e,sets:e.sets.filter(x=>x.done||(+x.weight&&+x.reps)).map(x=>({...x,weight:+x.weight||0,reps:+x.reps||0}))})).filter(e=>e.sets.length);
  if(!s.exercises.length&&!confirm("Nenhuma série foi registrada. Concluir mesmo assim?"))return;
  state.sessions.push(s);if(!state.attendance.includes(today()))state.attendance.push(today());
  autoRecords(s);state.activeSession=null;save();nav("progress");selectProgress("history");toast("Treino concluído");
}
function autoRecords(s){
  s.exercises.forEach(e=>e.sets.forEach(set=>{if(!set.weight||!set.reps)return;const score=set.weight*(1+set.reps/30);const current=state.records.filter(r=>r.exercise.toLowerCase()===e.name.toLowerCase()).sort((a,b)=>b.score-a.score)[0];if(!current||score>current.score)state.records.push({id:uid(),exercise:e.name,weight:set.weight,reps:set.reps,unit:"kg",date:today(),score,source:"Treino"})}))
}

function plateCalc(target,bar,collars,inventory){
  let side=(target-bar-collars)/2;if(side<0)return{error:"O peso desejado é menor que a barra e os presilhos."};
  let remain=side,selected=[];inventory.sort((a,b)=>b-a).forEach(p=>{let q=Math.floor((remain+1e-9)/p);if(q){selected.push([p,q]);remain-=p*q;remain=Math.max(0,+remain.toFixed(6))}});
  return{selected,total:target-remain*2,remain:remain*2,side};
}
function inventory(){return $("plateInventory").value.split(",").map(x=>+x.trim()).filter(x=>x>0)}
function calculatePlates(){
  const t=+$("plateTarget").value,b=+$("plateBar").value,c=+$("plateCollars").value,u=$("plateUnit").value,r=plateCalc(t,b,c,inventory());
  if(r.error){$("plateResult").innerHTML=`<div class="notice">${r.error}</div>`;return}
  $("plateResult").innerHTML=`<p class="eyebrow">RESULTADO</p><h2>${num(r.total)} ${u} no total</h2><div class="metric-grid"><div class="metric"><span>Por lado</span><strong>${num((r.total-b-c)/2)} ${u}</strong></div><div class="metric"><span>Diferença</span><strong>${num(r.remain)} ${u}</strong></div><div class="metric"><span>Anilhas</span><strong>${r.selected.reduce((a,x)=>a+x[1],0)*2}</strong></div></div><div class="plate-rows">${r.selected.map(x=>`<div class="result-row"><span>${x[1]} × ${num(x[0])} ${u} por lado</span><b>${num(x[0]*x[1]*2)} ${u}</b></div>`).join("")||'<div class="result-row">Somente barra e presilhos</div>'}</div>${r.remain>.001?`<div class="notice">Não foi possível atingir exatamente a carga. Faltam ${num(r.remain)} ${u}.</div>`:""}`;
}
$("calcPlatesBtn").onclick=calculatePlates;
$("warmupBtn").onclick=()=>{
  const target=+$("plateTarget").value,bar=+$("plateBar").value,collars=+$("plateCollars").value,u=$("plateUnit").value;
  const ps=$("warmupPercents").value.split(",").map(Number).filter(x=>x>0&&x<=100);
  $("warmupResult").innerHTML=ps.map(p=>{const r=plateCalc(Math.max(bar+collars,target*p/100),bar,collars,inventory());return`<div class="result-row"><span>${p}%</span><b>${r.error?"—":num(r.total)+" "+u}</b></div>`}).join("");
};
let timerInitial=90,timerRemaining=90,timerId=null,timerEnd=0;
function timerDraw(){const m=Math.floor(timerRemaining/60),s=timerRemaining%60;$("timerDisplay").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;document.title=timerId?`${$("timerDisplay").textContent} · Corporesapiens`:"Corporesapiens"}
function setTimer(s){if(timerId)clearInterval(timerId);timerId=null;timerInitial=timerRemaining=s;timerDraw();$("timerStartBtn").textContent="Iniciar";document.querySelectorAll("[data-timer-seconds]").forEach(b=>b.classList.toggle("active",+b.dataset.timerSeconds===s))}
function timerToggle(){if(timerId){clearInterval(timerId);timerId=null;$("timerStartBtn").textContent="Iniciar";return}if(timerRemaining<=0)timerRemaining=timerInitial;timerEnd=Date.now()+timerRemaining*1000;$("timerStartBtn").textContent="Pausar";timerId=setInterval(()=>{timerRemaining=Math.max(0,Math.ceil((timerEnd-Date.now())/1000));timerDraw();if(timerRemaining<=0){clearInterval(timerId);timerId=null;$("timerStartBtn").textContent="Iniciar";navigator.vibrate&&navigator.vibrate([250,100,250]);beep();toast("Intervalo concluído");if($("timerRepeat").checked)setTimeout(()=>{timerRemaining=timerInitial;timerToggle()},900)}},250)}
function beep(){try{const A=window.AudioContext||window.webkitAudioContext,c=new A(),o=c.createOscillator(),g=c.createGain();o.frequency.value=860;g.gain.setValueAtTime(.18,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.35);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.35)}catch{}}
document.querySelectorAll("[data-timer-seconds]").forEach(b=>b.onclick=()=>setTimer(+b.dataset.timerSeconds));$("timerStartBtn").onclick=timerToggle;$("timerResetBtn").onclick=()=>setTimer(timerInitial);timerDraw();
$("calcRmBtn").onclick=()=>{
  const w=+$("rmWeight").value,r=+$("rmReps").value;if(!w||r<1||r>20)return toast("Revise carga e repetições.");
  const e=w*(1+r/30),b=w*36/(37-r),avg=(e+b)/2;
  $("rmResult").innerHTML=`<p class="eyebrow">ESTIMATIVA</p><h2>${num(avg)} kg</h2><div class="metric-grid"><div class="metric"><span>Epley</span><strong>${num(e)} kg</strong></div><div class="metric"><span>Brzycki</span><strong>${num(b)} kg</strong></div><div class="metric"><span>Média</span><strong>${num(avg)} kg</strong></div></div><div class="notice">Não tente uma carga máxima apenas com base neste cálculo.</div>`;
};
function parseTime(v){const p=v.split(":").map(Number);if(p.some(Number.isNaN))return 0;if(p.length===3)return p[0]*3600+p[1]*60+p[2];if(p.length===2)return p[0]*60+p[1];return p[0]}
$("calcPaceBtn").onclick=()=>{
  const d=+$("paceDistance").value,t=parseTime($("paceTime").value);if(!d||!t)return toast("Informe distância e tempo.");
  const pace=t/d,pm=Math.floor(pace/60),ps=Math.round(pace%60),speed=d/(t/3600);
  $("paceResult").innerHTML=`<p class="eyebrow">RESULTADO</p><h2>${pm}:${String(ps).padStart(2,"0")} min/km</h2><div class="metric-grid"><div class="metric"><span>Velocidade média</span><strong>${num(speed)} km/h</strong></div><div class="metric"><span>Tempo total</span><strong>${$("paceTime").value}</strong></div><div class="metric"><span>Distância</span><strong>${num(d)} km</strong></div></div>`;
};

function renderHistory(){
  const list=[...state.sessions].sort((a,b)=>b.finishedAt-a.finishedAt);
  $("historyList").innerHTML=list.length?list.map(s=>`<article class="list-item"><div class="list-item-head"><div><strong>${esc(s.name)}</strong><div class="meta">${new Date(s.finishedAt).toLocaleString("pt-BR")}</div></div><b>${moneyless(sessionVolume(s))} kg</b></div><div class="chips"><span class="chip">${s.exercises.length} exercícios</span><span class="chip">${s.exercises.reduce((a,e)=>a+e.sets.length,0)} séries</span><span class="chip">${Math.max(1,Math.round((s.finishedAt-s.startedAt)/60000))} min</span></div>${s.notes?`<p class="muted top-gap">${esc(s.notes)}</p>`:""}<div class="actions"><button class="button danger compact" data-delete-session="${s.id}">Excluir</button></div></article>`).join(""):`<div class="empty">Conclua um treino para criar seu histórico.</div>`;
  document.querySelectorAll("[data-delete-session]").forEach(b=>b.onclick=()=>{if(confirm("Excluir esta sessão?")){state.sessions=state.sessions.filter(s=>s.id!==b.dataset.deleteSession);save()}});
}
function renderCalendar(){
  const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate();
  $("calendarTitle").textContent=first.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
  const blanks=Array(first.getDay()).fill('<span class="day blank"></span>');
  const cells=Array.from({length:days},(_,i)=>{const d=`${y}-${String(m+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`;return`<button class="day ${state.attendance.includes(d)?"done":""} ${d===today()?"today":""}" data-day="${d}">${i+1}</button>`});
  $("calendar").innerHTML=[...blanks,...cells].join("");
  document.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>{const d=b.dataset.day;state.attendance=state.attendance.includes(d)?state.attendance.filter(x=>x!==d):[...state.attendance,d];save()});
}
$("calPrev").onclick=()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar()};$("calNext").onclick=()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar()};
$("markTodayBtn").onclick=()=>{if(!state.attendance.includes(today()))state.attendance.push(today());save();toast("Presença marcada")};

function recordModal(){
  openModal("Novo recorde",`<label>Exercício<input id="recExercise"></label><div class="form-grid cols-2"><label>Carga<input id="recWeight" type="number" step=".5"></label><label>Repetições<input id="recReps" type="number" value="1"></label></div><label>Data<input id="recDate" type="date" value="${today()}"></label><button id="saveRecord" class="button primary wide">Salvar</button>`);
  $("saveRecord").onclick=()=>{const e=$("recExercise").value.trim(),w=+$("recWeight").value,r=+$("recReps").value;if(!e||!w||!r)return toast("Preencha os campos.");state.records.push({id:uid(),exercise:e,weight:w,reps:r,unit:"kg",date:$("recDate").value,score:w*(1+r/30),source:"Manual"});closeModal();save()}
}
$("addRecordBtn").onclick=recordModal;
function renderRecords(){
  const list=[...state.records].sort((a,b)=>new Date(b.date)-new Date(a.date));
  $("recordsList").innerHTML=list.length?list.map(r=>`<article class="list-item"><div class="list-item-head"><div><strong>${esc(r.exercise)}</strong><div class="meta">${dateBR(r.date)} · ${esc(r.source||"Manual")}</div></div><b>${num(r.weight)} ${esc(r.unit)} × ${r.reps}</b></div><div class="actions"><button class="button danger compact" data-del-record="${r.id}">Excluir</button></div></article>`).join(""):`<div class="empty">Os recordes podem ser adicionados manualmente ou detectados nos treinos.</div>`;
  document.querySelectorAll("[data-del-record]").forEach(b=>b.onclick=()=>{state.records=state.records.filter(r=>r.id!==b.dataset.delRecord);save()});
}
function measurementModal(){
  openModal("Registrar medidas",`<label>Data<input id="mesDate" type="date" value="${today()}"></label><div class="form-grid cols-2"><label>Peso (kg)<input id="mesWeight" type="number" step=".1"></label><label>Cintura (cm)<input id="mesWaist" type="number" step=".1"></label><label>Braço (cm)<input id="mesArm" type="number" step=".1"></label><label>Coxa (cm)<input id="mesThigh" type="number" step=".1"></label></div><label>Observação<textarea id="mesNotes" rows="2"></textarea></label><button id="saveMeasurement" class="button primary wide">Salvar</button>`);
  $("saveMeasurement").onclick=()=>{const item={id:uid(),date:$("mesDate").value,weight:+$("mesWeight").value||null,waist:+$("mesWaist").value||null,arm:+$("mesArm").value||null,thigh:+$("mesThigh").value||null,notes:$("mesNotes").value.trim()};if(!item.weight&&!item.waist&&!item.arm&&!item.thigh)return toast("Informe ao menos uma medida.");state.measurements.push(item);closeModal();save()}
}
$("addMeasurementBtn").onclick=measurementModal;
function sparkline(values){
  if(values.length<2)return"";const w=300,h=65,min=Math.min(...values),max=Math.max(...values),range=max-min||1;const pts=values.map((v,i)=>`${i/(values.length-1)*w},${h-(v-min)/range*(h-10)-5}`).join(" ");return`<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}"/></svg>`
}
function renderMeasurements(){
  const list=[...state.measurements].sort((a,b)=>a.date.localeCompare(b.date)),weights=list.filter(x=>x.weight).map(x=>x.weight);
  $("measurementsList").innerHTML=list.length?`${sparkline(weights)}${[...list].reverse().map(x=>`<article class="list-item"><div class="list-item-head"><strong>${dateBR(x.date)}</strong><button class="button danger compact" data-del-measure="${x.id}">Excluir</button></div><div class="chips">${x.weight?`<span class="chip">Peso ${num(x.weight)} kg</span>`:""}${x.waist?`<span class="chip">Cintura ${num(x.waist)} cm</span>`:""}${x.arm?`<span class="chip">Braço ${num(x.arm)} cm</span>`:""}${x.thigh?`<span class="chip">Coxa ${num(x.thigh)} cm</span>`:""}</div>${x.notes?`<p class="muted top-gap">${esc(x.notes)}</p>`:""}</article>`).join("")}`:`<div class="empty">Nenhuma medida registrada.</div>`;
  document.querySelectorAll("[data-del-measure]").forEach(b=>b.onclick=()=>{state.measurements=state.measurements.filter(x=>x.id!==b.dataset.delMeasure);save()});
}
function equipmentModal(){
  openModal("Regulagem de aparelho",`<label>Nome do aparelho<input id="eqName" placeholder="Ex.: Cadeira extensora"></label><div class="form-grid cols-2"><label>Banco / assento<input id="eqSeat"></label><label>Apoio / pino<input id="eqPin"></label></div><label>Última carga<input id="eqLoad" type="number" step=".5"></label><label>Observações<textarea id="eqNotes" rows="2"></textarea></label><button id="saveEquipment" class="button primary wide">Salvar anotação</button>`);
  $("saveEquipment").onclick=()=>{const name=$("eqName").value.trim();if(!name)return toast("Informe o aparelho.");state.equipment.push({id:uid(),name,seat:$("eqSeat").value.trim(),pin:$("eqPin").value.trim(),load:+$("eqLoad").value||null,notes:$("eqNotes").value.trim()});closeModal();save()}
}
$("addEquipmentBtn").onclick=equipmentModal;
function renderEquipment(){
  $("equipmentList").innerHTML=state.equipment.length?state.equipment.map(x=>`<article class="list-item"><div class="list-item-head"><div><strong>${esc(x.name)}</strong><div class="meta">${x.load?`Última carga: ${num(x.load)} kg`:"Sem carga registrada"}</div></div><button class="button danger compact" data-del-equipment="${x.id}">Excluir</button></div><div class="chips">${x.seat?`<span class="chip">Banco: ${esc(x.seat)}</span>`:""}${x.pin?`<span class="chip">Apoio: ${esc(x.pin)}</span>`:""}</div>${x.notes?`<p class="muted top-gap">${esc(x.notes)}</p>`:""}</article>`).join(""):`<div class="empty">Salve suas próprias anotações de regulagem.</div>`;
  document.querySelectorAll("[data-del-equipment]").forEach(b=>b.onclick=()=>{state.equipment=state.equipment.filter(x=>x.id!==b.dataset.delEquipment);save()});
}
$("exportDataBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`gymcalc-backup-${today()}.json`;a.click();URL.revokeObjectURL(url)};
$("importDataInput").onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!data||typeof data!=="object")throw Error();if(!confirm("Substituir os dados atuais pelo backup?"))return;state={...structuredClone(stateDefault),...data};save();toast("Backup importado")}catch{toast("Arquivo de backup inválido")}e.target.value=""};
$("clearDataBtn").onclick=()=>{if(confirm("Apagar definitivamente todos os dados deste aparelho?")){state=structuredClone(stateDefault);localStorage.removeItem(KEY);renderAll();toast("Dados apagados")}};

function renderAll(){renderSmart();renderHome();renderPlans();renderActiveWorkout();renderHistory();renderCalendar();renderRecords();renderMeasurements();renderEquipment()}
calculatePlates();renderAll();
let deferredInstall;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").classList.remove("hidden")});
$("installBtn").onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").classList.add("hidden")};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));


