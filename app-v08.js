
(() => {
  "use strict";
  const KEY = "corporesapiens_v08_settings";
  const VERSION = "0.8.0";

  function cfg(){
    try { return { lastExportAt:null, lastImportAt:null, ...JSON.parse(localStorage.getItem(KEY)||"{}") }; }
    catch { return { lastExportAt:null, lastImportAt:null }; }
  }
  function saveCfg(next){ localStorage.setItem(KEY, JSON.stringify({...cfg(),...next})); }

  function snapshot(){
    return {
      schema:"corporesapiens.backup.v1",
      version:VERSION,
      exportedAt:new Date().toISOString(),
      state,
      preferences:{
        v04:localStorage.getItem("corporesapiens_v04_preferences"),
        v05:localStorage.getItem("corporesapiens_v05_settings"),
        v06:localStorage.getItem("corporesapiens_v06_preferences"),
        v07:localStorage.getItem("corporesapiens_v07_runtime")
      }
    };
  }

  function validateBackup(data){
    const errors=[];
    if(!data || typeof data!=="object") errors.push("Arquivo inválido");
    if(data?.schema!=="corporesapiens.backup.v1") errors.push("Formato de backup não reconhecido");
    const s=data?.state;
    ["plans","sessions","records","measurements","equipment"].forEach(k=>{
      if(!Array.isArray(s?.[k])) errors.push(`Campo ${k} ausente ou inválido`);
    });
    return {ok:errors.length===0,errors};
  }

  function downloadJson(){
    const data=snapshot();
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`corporesapiens-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    saveCfg({lastExportAt:Date.now()});
    renderV08Status();
    toast("Backup versionado criado");
  }

  function addHub(){
    if(document.getElementById("v08Hub")) return;
    const more=document.getElementById("moreView");
    if(!more) return;
    const card=document.createElement("div");
    card.id="v08Hub";
    card.className="card v08-card";
    card.innerHTML=`
      <div class="section-head">
        <div><p class="eyebrow">CORPORESAPIENS 0.8</p><h2>Portabilidade e atualização</h2></div>
        <span class="chip">backup v1</span>
      </div>
      <p class="muted">Exporte, confira e restaure seus dados com validação antes da gravação.</p>
      <div class="v08-actions">
        <button id="v08ExportBtn" class="button secondary">Backup versionado</button>
        <button id="v08ImportBtn" class="button secondary">Importar com prévia</button>
        <button id="v08IntegrityBtn" class="button secondary">Verificar integridade</button>
        <button id="v08UpdateBtn" class="button secondary">Central de atualização</button>
      </div>
      <input id="v08FileInput" type="file" accept="application/json,.json" hidden>
      <div id="v08Status" class="top-gap"></div>`;
    more.prepend(card);

    document.getElementById("v08ExportBtn").onclick=downloadJson;
    document.getElementById("v08ImportBtn").onclick=()=>document.getElementById("v08FileInput").click();
    document.getElementById("v08FileInput").onchange=handleFile;
    document.getElementById("v08IntegrityBtn").onclick=integrityModal;
    document.getElementById("v08UpdateBtn").onclick=updateModal;
    renderV08Status();
  }

  function renderV08Status(){
    const el=document.getElementById("v08Status");
    if(!el) return;
    const c=cfg();
    el.innerHTML=`<div class="metric-grid">
      <div class="metric"><span>Último backup</span><strong>${c.lastExportAt?new Date(c.lastExportAt).toLocaleDateString("pt-BR"):"Nunca"}</strong></div>
      <div class="metric"><span>Última restauração</span><strong>${c.lastImportAt?new Date(c.lastImportAt).toLocaleDateString("pt-BR"):"Nunca"}</strong></div>
      <div class="metric"><span>Formato</span><strong>v1</strong></div>
    </div>`;
  }

  async function handleFile(event){
    const file=event.target.files?.[0];
    event.target.value="";
    if(!file) return;
    try{
      const text=await file.text();
      const data=JSON.parse(text);
      const check=validateBackup(data);
      if(!check.ok){
        openModal("Backup inválido",`<div class="empty">${check.errors.map(esc).join("<br>")}</div>`);
        return;
      }
      previewImport(data,file.name);
    }catch(error){
      openModal("Não foi possível ler o arquivo",`<div class="empty">${esc(error.message)}</div>`);
    }
  }

  function previewImport(data,fileName){
    const s=data.state;
    openModal("Prévia da restauração",`
      <p class="muted">Arquivo: ${esc(fileName)}</p>
      <div class="metric-grid">
        <div class="metric"><span>Fichas</span><strong>${s.plans.length}</strong></div>
        <div class="metric"><span>Sessões</span><strong>${s.sessions.length}</strong></div>
        <div class="metric"><span>Recordes</span><strong>${s.records.length}</strong></div>
        <div class="metric"><span>Medidas</span><strong>${s.measurements.length}</strong></div>
        <div class="metric"><span>Aparelhos</span><strong>${s.equipment.length}</strong></div>
        <div class="metric"><span>Versão do backup</span><strong>${esc(data.version||"—")}</strong></div>
      </div>
      <p class="v08-warning top-gap">A restauração substituirá os dados atuais somente após sua confirmação.</p>
      <button id="v08ConfirmImport" class="button primary wide top-gap">Confirmar restauração</button>
      <button id="v08CancelImport" class="button secondary wide top-gap">Cancelar</button>`);

    document.getElementById("v08CancelImport").onclick=closeModal;
    document.getElementById("v08ConfirmImport").onclick=()=>{
      const safety=snapshot();
      localStorage.setItem("corporesapiens_v08_preimport_backup",JSON.stringify(safety));
      localStorage.setItem("corporesapiens_state_v02",JSON.stringify(data.state));
      const p=data.preferences||{};
      if(p.v04!==null && p.v04!==undefined) localStorage.setItem("corporesapiens_v04_preferences",p.v04);
      if(p.v05!==null && p.v05!==undefined) localStorage.setItem("corporesapiens_v05_settings",p.v05);
      if(p.v06!==null && p.v06!==undefined) localStorage.setItem("corporesapiens_v06_preferences",p.v06);
      if(p.v07!==null && p.v07!==undefined) localStorage.setItem("corporesapiens_v07_runtime",p.v07);
      saveCfg({lastImportAt:Date.now()});
      location.reload();
    };
  }

  function integrityModal(){
    const data=snapshot();
    const check=validateBackup(data);
    const size=new Blob([JSON.stringify(data)]).size;
    openModal("Integridade e portabilidade",`
      <div class="diagnostic-list">
        <div class="diagnostic-row"><span>Estrutura do backup</span><strong class="${check.ok?"ok":"error"}">${check.ok?"OK":"Verificar"}</strong></div>
        <div class="diagnostic-row"><span>Esquema</span><strong>${esc(data.schema)}</strong></div>
        <div class="diagnostic-row"><span>Tamanho estimado</span><strong>${Math.max(1,Math.round(size/1024))} KB</strong></div>
        <div class="diagnostic-row"><span>Backup pré-importação</span><strong>${localStorage.getItem("corporesapiens_v08_preimport_backup")?"Disponível":"Não criado"}</strong></div>
      </div>`);
  }

  function updateModal(){
    openModal("Central de atualização",`
      <div class="stack">
        <article class="list-item"><strong>Versão instalada</strong><div class="meta">Corporesapiens ${VERSION}</div></article>
        <article class="list-item"><strong>Cache offline</strong><div class="meta">Atualizado automaticamente pelo Service Worker.</div></article>
        <article class="list-item"><strong>Dados locais</strong><div class="meta">Preservados entre atualizações.</div></article>
        <article class="list-item"><strong>Antes de atualizar</strong><div class="meta">Crie um backup versionado para maior segurança.</div></article>
      </div>
      <button id="v08RefreshBtn" class="button primary wide top-gap">Verificar atualização agora</button>`);
    document.getElementById("v08RefreshBtn").onclick=async()=>{
      try{
        const regs=await navigator.serviceWorker?.getRegistrations?.();
        await Promise.all((regs||[]).map(r=>r.update()));
        toast("Verificação de atualização concluída");
      }catch{
        toast("Não foi possível verificar agora");
      }
    };
  }

  const previousRenderAll=renderAll;
  renderAll=function(){
    previousRenderAll();
    addHub();
    renderV08Status();
  };

  addHub();
  renderV08Status();
})();
