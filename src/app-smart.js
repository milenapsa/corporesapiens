/* ===== Motor inteligente local / autoevolução ===== */
function completedSets(){
  return state.sessions.flatMap(s=>(s.exercises||[]).flatMap(e=>(e.sets||[]).map(x=>({
    exercise:e.name||"Exercício", weight:Number(x.weight)||0, reps:Number(x.reps)||0,
    date:new Date(s.finishedAt), session:s
  }))));
}
function exerciseStats(){
  const map={};
  completedSets().forEach(x=>{
    const key=x.exercise.trim().toLowerCase();
    if(!map[key]) map[key]={name:x.exercise,sets:[],bestVolume:0,bestWeight:0,last:null};
    map[key].sets.push(x);
    map[key].bestWeight=Math.max(map[key].bestWeight,x.weight);
    map[key].bestVolume=Math.max(map[key].bestVolume,x.weight*x.reps);
    if(!map[key].last||x.date>map[key].last.date) map[key].last=x;
  });
  return Object.values(map);
}
function smartData(){
  const stats=exerciseStats();
  const sessions=[...state.sessions].sort((a,b)=>b.finishedAt-a.finishedAt);
  const last30=sessions.filter(s=>Date.now()-s.finishedAt<30*86400000);
  const totalSets=last30.reduce((n,s)=>n+(s.exercises||[]).reduce((a,e)=>a+(e.sets||[]).length,0),0);
  const avgSets=last30.length?totalSets/last30.length:0;
  return {stats,sessions,last30,totalSets,avgSets};
}
function renderSmart(){
  const el=$("smartInsights"), sum=$("smartSummary");
  if(!el||!sum) return;
  const d=smartData();
  const trained=new Set(d.stats.map(x=>x.name)).size;
  sum.innerHTML=`
    <div class="smart-metric"><span>Sessões analisadas</span><strong>${d.sessions.length}</strong></div>
    <div class="smart-metric"><span>Exercícios registrados</span><strong>${trained}</strong></div>
    <div class="smart-metric"><span>Média de séries</span><strong>${num(d.avgSets)}</strong></div>`;
  const insights=[];
  if(!d.sessions.length){
    insights.push({type:"info",title:"Comece registrando",text:"Conclua pelo menos um treino para liberar comparações e sugestões locais."});
  }else{
    const recent=d.sessions[0];
    insights.push({type:"good",title:"Último treino",text:`${recent.name}: ${moneyless(sessionVolume(recent))} kg de volume registrado.`});
    if(d.last30.length<4) insights.push({type:"info",title:"Base ainda pequena",text:"Com quatro ou mais sessões no mês, as comparações ficam mais úteis."});
    const top=[...d.stats].sort((a,b)=>b.bestVolume-a.bestVolume)[0];
    if(top) insights.push({type:"good",title:"Maior série por volume",text:`${top.name}: ${num(top.bestVolume)} kg·repetições.`});
    const stale=d.stats.filter(x=>Date.now()-x.last.date.getTime()>21*86400000).slice(0,3);
    if(stale.length) insights.push({type:"warn",title:"Exercícios sem registro recente",text:stale.map(x=>x.name).join(", ")+". Isso é apenas um lembrete de organização."});
    const frequent={};
    d.sessions.forEach(s=>(s.exercises||[]).forEach(e=>frequent[e.name]=(frequent[e.name]||0)+1));
    const fav=Object.entries(frequent).sort((a,b)=>b[1]-a[1])[0];
    if(fav) insights.push({type:"info",title:"Exercício mais frequente",text:`${fav[0]} apareceu em ${fav[1]} sessões.`});
  }
  el.innerHTML=insights.map(i=>`<div class="insight ${i.type}"><strong>${esc(i.title)}</strong><span class="muted">${esc(i.text)}</span></div>`).join("");
}
function cloneBestPlan(){
  if(!state.plans.length) return toast("Crie um treino antes de clonar");
  const usage={};
  state.sessions.forEach(s=>usage[s.planId]=(usage[s.planId]||0)+1);
  const source=[...state.plans].sort((a,b)=>(usage[b.id]||0)-(usage[a.id]||0))[0];
  const copy=structuredClone(source);
  copy.id=uid(); copy.name=`${source.name} — cópia automática`;
  copy.exercises=(copy.exercises||[]).map(e=>({...e,id:uid()}));
  state.plans.push(copy); save(); toast("Treino clonado com sucesso"); nav("workouts");
}
function createVariant(){
  if(!state.plans.length) return toast("Crie um treino antes de gerar variação");
  const source=state.plans[0], copy=structuredClone(source);
  copy.id=uid(); copy.name=`${source.name} — variação`;
  copy.exercises=(copy.exercises||[]).map((e,i)=>({
    ...e,id:uid(),
    sets:Math.max(1,Number(e.sets||3)+(i%2?0:-1)),
    reps:e.reps||"8–12",
    notes:[e.notes,"Variação automática: revise antes de usar."].filter(Boolean).join(" ")
  })).reverse();
  state.plans.push(copy); save(); toast("Variação criada para revisão"); nav("workouts");
}
function buildWeek(){
  if(!state.plans.length) return toast("Crie ao menos um treino");
  const existing=state.plans.slice(0,3);
  const names=["Segunda","Quarta","Sexta"];
  const created=existing.map((p,i)=>{
    const c=structuredClone(p); c.id=uid(); c.name=`${names[i]||"Dia "+(i+1)} — ${p.name}`;
    c.exercises=(c.exercises||[]).map(e=>({...e,id:uid()})); return c;
  });
  state.plans.push(...created); save(); toast(`${created.length} treinos semanais criados`); nav("workouts");
}
function detectRecords(){
  const stats=exerciseStats(); let added=0;
  stats.forEach(s=>{
    const best=[...s.sets].sort((a,b)=>b.weight-a.weight||b.reps-a.reps)[0];
    const exists=state.records.some(r=>r.exercise?.toLowerCase()===s.name.toLowerCase()&&Number(r.weight)===best.weight&&Number(r.reps)===best.reps);
    if(best&&!exists){
      state.records.push({id:uid(),exercise:s.name,weight:best.weight,reps:best.reps,unit:state.settings.unit||"kg",date:best.date.toISOString().slice(0,10),notes:"Detectado automaticamente a partir do histórico."});
      added++;
    }
  });
  save(); toast(added?`${added} recorde(s) detectado(s)`:"Nenhum recorde novo");
}
function bindSmart(){
  const pairs=[
    ["refreshInsightsBtn",renderSmart],
    ["autoCloneBtn",cloneBestPlan],
    ["autoVariantBtn",createVariant],
    ["autoWeekBtn",buildWeek],
    ["detectPrBtn",detectRecords]
  ];
  pairs.forEach(([id,fn])=>{const el=$(id);if(el)el.onclick=fn});
}


bindSmart();renderSmart();
