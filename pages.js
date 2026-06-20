// ── HELPERS DE FATURAMENTO / MÊS ─────────────────────────────────
let _mesFaturamento = todayISO().slice(0,7);
function pedidosValidos(){
  const ids = new Set((state.clientes||[]).map(c=>c.id));
  return (state.pedidos||[]).filter(p=>ids.has(p.cliente_id));
}
function pedidosDoMes(mes){
  return pedidosValidos().filter(p=>p.data && p.data.slice(0,7)===mes);
}
async function limparPedidosOrfaos(){
  const ids = new Set((state.clientes||[]).map(c=>c.id));
  const orfaos = (state.pedidos||[]).filter(p=>!ids.has(p.cliente_id));
  if(!orfaos.length){ toast('✅ Nenhum pedido órfão encontrado'); return; }
  if(!confirm(`Encontramos ${orfaos.length} pedido(s) sem cliente. Deseja remover para corrigir o faturamento?`)) return;
  state.pedidos = state.pedidos.filter(p=>ids.has(p.cliente_id));
  for(const p of orfaos) await deleteRow('pedidos', p.id);
  await cloudSave();
  toast('🧹 Pedidos órfãos removidos');
  showPage(document.querySelector('.page.active')?.id || 'dashboard');
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function dashboard(){
  const today=todayISO();
  const pend=state.lembretes.filter(l=>!l.feito);
  const due=pend.filter(l=>(l.data||today)<=today);
  const hot=state.clientes.filter(c=>c.temperatura==='Quente');
  const m=state.metas||{};
  const reg=(state.registros&&state.registros[today])||{ligacoes:0,contatos:0};
  const pedidosMes=pedidosDoMes(today.slice(0,7));
  const fatTotal=pedidosMes.reduce((s,p)=>s+parseFloat(p.valor||0),0);
  const fatNovo=pedidosMes.filter(p=>p.tipo_cliente==='novo').reduce((s,p)=>s+parseFloat(p.valor||0),0);
  const fatCart=pedidosMes.filter(p=>p.tipo_cliente==='carteira').reduce((s,p)=>s+parseFloat(p.valor||0),0);
  const comissaoMes=pedidosMes.reduce((s,p)=>s+parseFloat(p.comissao||0),0);
  const emProposta=state.clientes.filter(c=>c.status==='📄 Proposta').length;
  const emNeg=state.clientes.filter(c=>c.status==='💰 Negociação').length;
  const pctFat=Math.min(100,Math.round(fatTotal/(m.faturamentoMes||50000)*100));
  const pctLig=Math.min(100,Math.round(reg.ligacoes/(m.ligacoesDia||10)*100));
  const pctCon=Math.min(100,Math.round(reg.contatos/(m.contatosDia||15)*100));
  const alertas=alertasInteligentes().slice(0,4);
  const aniversarios=aniversariosHoje();

  $('dashboard').innerHTML=`
    <div class="topbar">
      <div class="hello">
        <h2>🏠 Dashboard</h2>
        <p>${new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
      </div>
      <div class="row">
        <button class="btn ghost" onclick="exportBackup()">💾 Backup</button><button class="btn ghost" onclick="limparPedidosOrfaos()">🧹 Corrigir faturamento</button>
      </div>
    </div>

    ${aniversarios.length?`<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:20px;padding:16px;margin-bottom:16px">
      🎂 <strong>Aniversário hoje:</strong> ${aniversarios.map(c=>`${esc(c.nome||c.loja)}`).join(', ')}
      ${aniversarios.map(c=>`<a class="btn small green" href="https://wa.me/55${(c.whatsapp||'').replace(/\D/g,'')}" target="_blank" style="margin-left:8px">💬 Parabenizar</a>`).join('')}
    </div>`:''}

    ${alertas.length?`<div class="card" style="margin-bottom:16px;border-color:rgba(239,68,68,.3)">
      <h3 class="section-title">⚠️ Clientes parados</h3>
      <div class="list">${alertas.map(a=>`
        <div class="item" onclick="openClient('${a.c.id}')" style="cursor:pointer">
          <div><b>${esc(a.c.loja)}</b><span>${esc(a.c.status||'')} • ${esc(a.c.cidade||'')}</span></div>
          <span style="background:${a.cor}22;color:${a.cor};padding:4px 10px;border-radius:99px;font-size:12px;font-weight:600">⏰ ${a.dias}d</span>
        </div>`).join('')}
      </div>
    </div>`:''}

    <h3 class="section-title">📅 Hoje</h3>
    <div class="grid cards" style="margin-bottom:20px">
      <div class="card metric">
        <small>📞 Ligações</small>
        <strong>${reg.ligacoes}<span style="font-size:16px;color:var(--muted)">/${m.ligacoesDia||10}</span></strong>
        <div class="progress"><div class="progress-bar" style="width:${pctLig}%;background:#34d399"></div></div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn" style="flex:1;font-size:18px;padding:8px" onclick="registrarAcao('ligacoes')">+1</button>
          <button class="btn ghost" style="font-size:11px;padding:7px" onclick="editMeta('ligacoesDia')">✏️</button>
        </div>
      </div>
      <div class="card metric">
        <small>🤝 Contatos</small>
        <strong>${reg.contatos}<span style="font-size:16px;color:var(--muted)">/${m.contatosDia||15}</span></strong>
        <div class="progress"><div class="progress-bar" style="width:${pctCon}%;background:#818cf8"></div></div>
        <div style="display:flex;gap:6px;margin-top:8px">
          <button class="btn" style="flex:1;font-size:18px;padding:8px" onclick="registrarAcao('contatos')">+1</button>
          <button class="btn ghost" style="font-size:11px;padding:7px" onclick="editMeta('contatosDia')">✏️</button>
        </div>
      </div>
      <div class="card metric">
        <small>🔥 Follow-ups</small>
        <strong>${due.length}</strong>
        <div style="margin-top:8px"><span style="font-size:12px;color:var(--muted)">${due.length>0?due.length+' pendente'+(due.length>1?'s':''):'Em dia ✅'}</span></div>
        <button class="btn ghost" style="width:100%;margin-top:8px;font-size:12px" onclick="showPage('lembretes')">Ver lembretes</button>
      </div>
      <div class="card metric" onclick="editMeta('contatosMes')" style="cursor:pointer">
        <small>🎯 Meta mensal</small>
        <strong>${state.clientes.length}<span style="font-size:16px;color:var(--muted)">/${m.contatosMes||40}</span></strong>
        <div class="progress"><div class="progress-bar" style="width:${Math.min(100,Math.round(state.clientes.length/(m.contatosMes||40)*100))}%;background:#f97316"></div></div>
        <span style="font-size:11px;color:var(--muted)">✏️ editar meta</span>
      </div>
    </div>

    <h3 class="section-title">💰 Faturamento do mês</h3>
    <div class="grid cards" style="margin-bottom:20px">
      <div class="card metric" onclick="editMeta('faturamentoMes')" style="cursor:pointer;grid-column:span 2">
        <small>📊 Total vs meta</small>
        <strong style="font-size:26px">${fmtMoney(fatTotal)}<span style="font-size:15px;color:var(--muted)"> / ${fmtMoney(m.faturamentoMes||50000)}</span></strong>
        <div class="progress" style="height:8px;margin:12px 0"><div class="progress-bar" style="width:${pctFat}%;background:linear-gradient(90deg,#7c3aed,#a855f7)"></div></div>
        <div style="display:flex;gap:16px;font-size:13px">
          <span>🆕 Novos: <strong>${fmtMoney(fatNovo)}</strong></span>
          <span>👥 Carteira: <strong>${fmtMoney(fatCart)}</strong></span>
        </div>
      </div>
      <div class="card metric">
        <small>💸 Comissão do mês</small>
        <strong style="font-size:22px;color:#a78bfa">${fmtMoney(comissaoMes)}</strong>
        <div style="font-size:12px;color:var(--muted);margin-top:8px">${pedidosMes.length} pedido${pedidosMes.length!==1?'s':''}</div>
      </div>
      <div class="card metric">
        <small>📦 Pedidos ativos</small>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div><div style="font-size:11px;color:var(--muted)">📄 Proposta</div><div style="font-size:20px;font-weight:700">${emProposta}</div></div>
          <div><div style="font-size:11px;color:var(--muted)">💰 Negoc.</div><div style="font-size:20px;font-weight:700">${emNeg}</div></div>
        </div>
      </div>
    </div>

    <div class="grid two">
      <div class="card">
        <h3 class="section-title">Próximas ações <button class="btn small ghost" onclick="showPage('lembretes')">Ver todos</button></h3>
        <div class="list">${due.slice(0,5).map(l=>`
          <div class="item">
            <div><b>${esc(l.hora||'')} ${esc(l.titulo)}</b><span>${esc(l.cliente||'')} • ${fmt(l.data)} • ${esc(l.prioridade||'')}</span></div>
            <button class="btn small ghost" onclick="doneReminder('${l.id}');dashboard()">✓</button>
          </div>`).join('')||'<div class="empty">Nenhuma ação pendente 🎉</div>'}
        </div>
      </div>
      <div class="card">
        <h3 class="section-title">Clientes quentes 🔥</h3>
        <div class="list">${hot.slice(0,5).map(c=>`
          <div class="item" onclick="openClient('${c.id}')" style="cursor:pointer">
            <div><b>${esc(c.loja)}</b><span>${esc(c.nome||'')} • ${esc(c.status||'')}</span></div>
            <span class="tag ${tempTag(c.temperatura)}">${esc(c.temperatura)}</span>
          </div>`).join('')||'<div class="empty">Nenhum cliente quente ainda.</div>'}
        </div>
      </div>
    </div>`;
}

function registrarAcao(tipo){
  const key=todayISO();
  if(!state.registros) state.registros={};
  if(!state.registros[key]) state.registros[key]={ligacoes:0,contatos:0};
  state.registros[key][tipo]=(state.registros[key][tipo]||0)+1;
  cloudSave(); dashboard();
  toast(tipo==='ligacoes'?'📞 Ligação registrada!':'🤝 Contato registrado!');
}

function editMeta(campo){
  const nomes={contatosDia:'Meta diária de contatos',ligacoesDia:'Meta diária de ligações',contatosMes:'Meta mensal de clientes',faturamentoMes:'Meta de faturamento mensal (R$)'};
  const atual=(state.metas||{})[campo]||0;
  const novo=prompt(`${nomes[campo]||campo}:`,atual);
  if(novo===null) return;
  const val=parseFloat(novo.replace(',','.'));
  if(!val||val<1){toast('Valor inválido');return;}
  if(!state.metas) state.metas={};
  state.metas[campo]=val;
  cloudSave(); dashboard();
  toast('✅ Meta atualizada!');
}

function alertasInteligentes(){
  return state.clientes
    .map(c=>({c,dias:diasSemContato(c)}))
    .filter(({dias})=>dias>=7)
    .sort((a,b)=>b.dias-a.dias)
    .map(({c,dias})=>({c,dias,cor:dias>=30?'#f87171':dias>=15?'#fb923c':'#facc15'}));
}

function aniversariosHoje(){
  const hoje=todayISO().slice(5);
  return state.clientes.filter(c=>c.aniversario&&c.aniversario.slice(5)===hoje);
}

// ── PIPELINE ──────────────────────────────────────────────────────
function pipeline(){
  $('pipeline').innerHTML=`
    <div class="topbar">
      <div class="hello"><h2>📊 Pipeline</h2></div>
      <div class="row">
        <button class="btn ghost" onclick="showPipelineConfig()">⚙️ Etapas</button>
      </div>
    </div>
    <div class="kanban">
      ${state.pipeline.map(s=>{
        const cs=state.clientes.filter(c=>c.status===s);
        return `<div class="col">
          <h3>${esc(s)} <span class="badge">${cs.length}</span></h3>
          ${cs.map(c=>{
            const dias=diasSemContato(c);
            return `<div class="lead" onclick="openClient('${c.id}')">
              <b style="font-size:14px">${esc(c.loja)}</b>
              <div style="font-size:12px;color:var(--muted);margin:3px 0">${esc(c.nome||'')} ${c.cidade?`• ${esc(c.cidade)}`:''}</div>
              <div style="display:flex;flex-wrap:wrap;gap:3px;margin:6px 0">
                <span class="tag ${tempTag(c.temperatura)}" style="font-size:10px">${esc(c.temperatura||'')}</span>
                <span class="tag ${c.tipo_cliente==='carteira'?'carteira':'novo'}" style="font-size:10px">${c.tipo_cliente==='carteira'?'Carteira':'Novo'}</span>
                ${dias>=7?`<span class="tag warn" style="font-size:10px">⏰${dias}d</span>`:''}
              </div>
              ${c.cnpj||c.inscricao_estadual?`
              <div style="background:rgba(255,255,255,.04);border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px">
                ${c.cnpj?`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${c.inscricao_estadual?'4px':'0'}">
                  <span style="color:var(--muted)">CNPJ</span>
                  <span style="font-weight:600;cursor:pointer" onclick="event.stopPropagation();copiarTexto('${c.cnpj}','CNPJ')" title="Clique para copiar">${esc(c.cnpj)} 📋</span>
                </div>`:''}
                ${c.inscricao_estadual?`<div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="color:var(--muted)">IE</span>
                  <span style="font-weight:600;cursor:pointer" onclick="event.stopPropagation();copiarTexto('${c.inscricao_estadual}','Inscrição Estadual')" title="Clique para copiar">${esc(c.inscricao_estadual)} 📋</span>
                </div>`:``}
              </div>`:''}
              <select onclick="event.stopPropagation()" onchange="moveClient('${c.id}',this.value)" style="font-size:12px;padding:8px">
                ${state.pipeline.map(st=>`<option ${st===s?'selected':''}>${esc(st)}</option>`).join('')}
              </select>
            </div>`;}).join('')}
        </div>`;}).join('')}
    </div>`;
}

async function moveClient(id,status){
  const c=state.clientes.find(x=>x.id===id);
  if(c){ c.status=status; c.updated_at=new Date().toISOString(); await upsertRow('clientes',c); }
  pipeline();
}

function showPipelineConfig(){
  document.body.insertAdjacentHTML('beforeend',`
    <div id="pipeOverlay" style="position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px" onclick="if(event.target===this)this.remove()">
      <div style="background:var(--panel);border-radius:24px;padding:24px;width:min(440px,100%);border:1px solid var(--line)">
        <h3 style="margin:0 0 16px">⚙️ Etapas do pipeline</h3>
        <div id="pipeStages">${state.pipeline.map((s,i)=>`
          <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
            <span style="color:var(--muted);font-size:13px;width:20px">${i+1}</span>
            <input class="pipe-stage" value="${esc(s)}" style="flex:1">
            <button class="btn small ghost danger" onclick="this.closest('div').remove()">✕</button>
          </div>`).join('')}</div>
        <button class="btn small ghost" onclick="$('pipeStages').insertAdjacentHTML('beforeend','<div style=\\'display:flex;gap:8px;margin-bottom:8px;align-items:center\\'><span style=\\'color:var(--muted);font-size:13px;width:20px\\'>+</span><input class=\\'pipe-stage\\' placeholder=\\'Nova etapa...\\'><button class=\\'btn small ghost danger\\' onclick=\\'this.closest(\\'div\\').remove()\\'>✕</button></div>')">+ Etapa</button>
        <div class="actions" style="margin-top:16px">
          <button class="btn" onclick="savePipelineConfig()">💾 Salvar</button>
          <button class="btn ghost" onclick="$('pipeOverlay').remove()">Cancelar</button>
        </div>
      </div>
    </div>`);
}

async function savePipelineConfig(){
  const stages=[...document.querySelectorAll('.pipe-stage')].map(i=>i.value.trim()).filter(Boolean);
  if(!stages.length){toast('⚠️ Mínimo 1 etapa');return;}
  state.pipeline=stages;
  await cloudSave();
  $('pipeOverlay')?.remove();
  toast('✅ Pipeline atualizado!');
  pipeline();
}

// ── LEMBRETES ─────────────────────────────────────────────────────
let _showLembreteForm=false, _lembreteClienteId='', _lembreteClienteNome='';

function lembretes(){
  const pend=state.lembretes.filter(l=>!l.feito);
  const done=state.lembretes.filter(l=>l.feito);
  const form=_showLembreteForm?`
    <div class="card" style="margin-bottom:16px;border-color:rgba(124,58,237,.4)">
      <h3 class="section-title">➕ Novo lembrete
        <button class="btn ghost small" onclick="_showLembreteForm=false;lembretes()">✕</button>
      </h3>
      <div class="formgrid">
        <div><label>Cliente</label><input id="r_cliente" value="${esc(_lembreteClienteNome)}" placeholder="Nome da loja"></div>
        <div><label>Título *</label><input id="r_titulo" placeholder="Ligar, enviar catálogo, visitar..."></div>
        <div><label>Data *</label><input type="date" id="r_data" value="${todayISO()}"></div>
        <div><label>Hora</label><input type="time" id="r_hora" value="${new Date().toTimeString().slice(0,5)}"></div>
        <div><label>Prioridade</label><select id="r_prioridade"><option>Alta</option><option selected>Média</option><option>Baixa</option></select></div>
        <div><label>Tipo</label><select id="r_tipo"><option>Ligação</option><option>WhatsApp</option><option>Reunião</option><option>Visita</option><option>Follow-up</option><option>Outro</option></select></div>
      </div>
      <div class="actions" style="margin-top:14px">
        <button class="btn" onclick="saveReminder()">💾 Salvar lembrete</button>
      </div>
    </div>`:'';

  $('lembretes').innerHTML=`
    <div class="topbar">
      <div class="hello"><h2>⏰ Lembretes</h2></div>
      <button class="btn" onclick="_showLembreteForm=true;_lembreteClienteNome='';lembretes()">+ Novo</button>
    </div>
    ${form}
    <div class="grid two">
      <div class="card">
        <h3 class="section-title">Pendentes <span class="badge">${pend.length}</span></h3>
        <div class="list">${pend.map(l=>`
          <div class="item">
            <div><b>${esc(l.titulo)}</b><span>${esc(l.cliente||'')} • ${fmt(l.data)} ${l.hora||''} • ${esc(l.prioridade||'')}</span></div>
            <div style="display:flex;gap:6px">
              <button class="btn small ghost" title="Adicionar ao calendário" onclick="downloadICS('${l.id}')">📅</button>
              <button class="btn small ghost" onclick="doneReminder('${l.id}')">✓</button>
            </div>
          </div>`).join('')||'<div class="empty">Nenhum lembrete pendente 🎉</div>'}
        </div>
      </div>
      <div class="card">
        <h3 class="section-title">Concluídos</h3>
        <div class="list">${done.slice(0,8).map(l=>`
          <div class="item" style="opacity:.6">
            <div><b>${esc(l.titulo)}</b><span>${esc(l.cliente||'')} • ${fmt(l.data)}</span></div>
            <span style="color:var(--green)">✓</span>
          </div>`).join('')||'<div class="empty">Nenhum concluído ainda.</div>'}
        </div>
      </div>
    </div>`;
  if(_showLembreteForm) setTimeout(()=>$('r_titulo')?.focus(),50);
}

function newReminder(clienteId='', clienteNome=''){
  _lembreteClienteId=clienteId;
  _lembreteClienteNome=clienteNome;
  _showLembreteForm=true;
  showPage('lembretes');
}

async function saveReminder(){
  const titulo=$('r_titulo')?.value?.trim();
  const data=$('r_data')?.value;
  if(!titulo){toast('⚠️ Preencha o título');return;}
  if(!data){toast('⚠️ Selecione uma data');return;}
  const l={id:uuid(),cliente_id:_lembreteClienteId||'',cliente:$('r_cliente')?.value||_lembreteClienteNome||'',titulo,data,hora:$('r_hora')?.value||'',prioridade:$('r_prioridade')?.value||'Média',tipo:$('r_tipo')?.value||'',feito:false,created_at:new Date().toISOString()};
  state.lembretes.unshift(l);
  await upsertRow('lembretes',l);
  _showLembreteForm=false; _lembreteClienteId=''; _lembreteClienteNome='';
  toast('✅ Lembrete salvo!');
  lembretes();
}

async function doneReminder(id){
  const l=state.lembretes.find(x=>x.id===id);
  if(l){l.feito=true;l.data_conclusao=new Date().toISOString(); await upsertRow('lembretes',l);}
  lembretes();
}

function downloadICS(id){
  const l=state.lembretes.find(x=>x.id===id);
  if(!l) return;
  const [y,m,d]=(l.data||todayISO()).split('-');
  const h=(l.hora||'09:00').replace(':','');
  const hFim=`${String(parseInt(h.slice(0,2))+1).padStart(2,'0')}${h.slice(2)}`;
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//WIWU OS//PT','BEGIN:VEVENT',
    `UID:${l.id}@wiwuos`,`DTSTART:${y}${m}${d}T${h}00`,`DTEND:${y}${m}${d}T${hFim}00`,
    `SUMMARY:${l.titulo}${l.cliente?' - '+l.cliente:''}`,
    `DESCRIPTION:Cliente: ${l.cliente||''}\\nPrioridade: ${l.prioridade||''}`,
    'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));
  a.download=`lembrete_${l.titulo.replace(/\s+/g,'_')}.ics`;
  a.click();
  toast('📅 Abrindo no calendário...');
}

// ── MODO FEIRA ────────────────────────────────────────────────────
let _fairStep=1, _fairTemp={};

function feira(){
  const fairLeads=state.clientes.filter(c=>c.origem==='Feira');
  const placar=`
    <div class="card" style="margin-bottom:16px">
      <h3 class="section-title">🎪 Placar da feira</h3>
      <div class="grid cards" style="gap:10px">
        <div class="metric"><small>Total leads</small><strong>${fairLeads.length}</strong></div>
        <div class="metric"><small>🔥 Quentes</small><strong>${fairLeads.filter(c=>c.temperatura==='Quente').length}</strong></div>
        <div class="metric"><small>🌡️ Mornos</small><strong>${fairLeads.filter(c=>c.temperatura==='Morno').length}</strong></div>
        <div class="metric"><small>Meta</small><strong>${fairLeads.length}/40</strong></div>
      </div>
    </div>`;

  if(_fairStep===1){
    $('feira').innerHTML=`${placar}
      <div class="card">
        <div class="fair-hero" style="padding:16px 0 20px">
          <div class="plus">+</div>
          <h2>Novo lead</h2>
          <p style="color:var(--muted)">Etapa 1 de 2 — Identificação</p>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:18px">
          <div style="flex:1;height:4px;border-radius:99px;background:var(--purple)"></div>
          <div style="flex:1;height:4px;border-radius:99px;background:var(--line)"></div>
        </div>
        <div class="formgrid">
          <div><label>Nome da loja *</label><input id="fl_loja" placeholder="Smart Store SP"></div>
          <div><label>Comprador *</label><input id="fl_nome" placeholder="Nome completo"></div>
          <div><label>WhatsApp *</label><input id="fl_wpp" type="tel" placeholder="11 99999-9999"></div>
          <div><label>Instagram</label><input id="fl_insta" placeholder="@loja"></div>
          <div><label>CEP</label><input id="fl_cep" placeholder="00000-000" oninput="fairBuscaCep(this.value)"></div>
          <div><label>CNPJ</label><input id="fl_cnpj" placeholder="00.000.000/0001-00" oninput="fairBuscaCnpj(this.value)"></div>
          <div class="full"><label>Endereço</label><input id="fl_end" placeholder="Preenchido pelo CEP..."></div>
          <div><label>Cidade</label><input id="fl_cidade"></div>
          <div><label>Estado</label><input id="fl_estado" value="SP"></div>
        </div>
        <div class="actions" style="margin-top:16px">
          <button class="btn" onclick="fairStep2()">Próximo: Perfil comercial →</button>
        </div>
      </div>`;
  } else {
    $('feira').innerHTML=`${placar}
      <div class="card">
        <div style="text-align:center;padding:8px 0 16px">
          <h2 style="margin:0">📋 Perfil comercial</h2>
          <p style="color:var(--muted);margin:4px 0 0">Etapa 2 de 2 — <strong>${esc(_fairTemp.loja)}</strong></p>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:18px">
          <div style="flex:1;height:4px;border-radius:99px;background:var(--purple)"></div>
          <div style="flex:1;height:4px;border-radius:99px;background:var(--purple)"></div>
        </div>
        <div class="formgrid">
          <div><label>Marcas que trabalha</label><input id="fl_marcas" placeholder="Baseus, GShield..."></div>
          <div><label>Aparelhos/mês</label><input id="fl_aparelhos" placeholder="Ex: 150"></div>
          <div><label>Qtd de lojas</label><input id="fl_lojas" type="number" value="1" min="1"></div>
          <div><label>Vendedores</label>
            <select id="fl_vendedores"><option>Só o dono</option><option>1 vendedor</option><option>2 vendedores</option><option>3 a 5 vendedores</option><option>Mais de 5</option></select>
          </div>
          <div><label>Temperatura</label>
            <select id="fl_temp"><option>Quente</option><option selected>Morno</option><option>Frio</option></select>
          </div>
          <div><label>Interesse principal</label><input id="fl_interesse" placeholder="Fonte, iPad, iPhone..."></div>
          <div class="full"><label>Perfil / Observações</label><textarea id="fl_obs" placeholder="Como é o cliente, o que chamou atenção..."></textarea></div>
        </div>
        <div class="actions" style="margin-top:16px">
          <button class="btn ghost" onclick="_fairStep=1;feira()">← Voltar</button>
          <button class="btn" onclick="saveFairLead()">💾 Salvar lead</button>
        </div>
      </div>`;
  }
}

async function fairBuscaCep(val){
  const cep=(val||'').replace(/\D/g,'');
  if(cep.length<8) return;
  const d=await buscarCEP(cep);
  if(!d) return;
  if($('fl_end')&&!$('fl_end').value) $('fl_end').value=[d.logradouro,d.bairro].filter(Boolean).join(', ');
  if($('fl_cidade')) $('fl_cidade').value=d.localidade||'';
  if($('fl_estado')) $('fl_estado').value=d.uf||'';
  toast('📍 Endereço preenchido!');
}

async function fairBuscaCnpj(val){
  const cnpj = (val||'').replace(/\D/g,'');
  if(cnpj.length < 14) return;
  toast('🔍 Buscando CNPJ...');
  const d = await buscarCNPJ(cnpj);
  if(!d){ toast('❌ CNPJ não encontrado'); return; }
  // Preencher nome da loja se vazio
  const loja = d.nome_fantasia || d.razao_social || '';
  if($('fl_loja') && !$('fl_loja').value) $('fl_loja').value = loja;
  // Preencher endereço
  const end = [d.logradouro, d.numero, d.complemento, d.bairro].filter(Boolean).join(', ');
  if($('fl_end')) $('fl_end').value = end;
  if($('fl_cidade')) $('fl_cidade').value = d.municipio || '';
  if($('fl_estado')) $('fl_estado').value = d.uf || 'SP';
  // Preencher CEP
  const cep = (d.cep||'').replace(/\D/g,'');
  if($('fl_cep')) $('fl_cep').value = cep;
  toast('✅ CNPJ encontrado! Dados preenchidos.');
}

function fairStep2(){
  const loja=$('fl_loja')?.value?.trim();
  const nome=$('fl_nome')?.value?.trim();
  const wpp=$('fl_wpp')?.value?.trim();
  if(!loja||!nome||!wpp){toast('⚠️ Preencha loja, nome e WhatsApp');return;}
  _fairTemp={loja,nome,wpp,instagram:$('fl_insta')?.value||'',cep:$('fl_cep')?.value||'',cnpj:$('fl_cnpj')?.value||'',endereco:$('fl_end')?.value||'',cidade:$('fl_cidade')?.value||'',estado:$('fl_estado')?.value||'SP'};
  _fairStep=2; feira();
}

async function saveFairLead(){
  const temp=_fairTemp;
  const obs=[$('fl_obs')?.value,$('fl_aparelhos')?.value?`Vende: ${$('fl_aparelhos').value}/mês`:''].filter(Boolean).join(' | ');
  const c={id:uuid(),loja:temp.loja,nome:temp.nome,whatsapp:temp.wpp,instagram:temp.instagram,cep:temp.cep,cnpj:temp.cnpj,endereco:temp.endereco,cidade:temp.cidade,estado:temp.estado,marcas:$('fl_marcas')?.value||'',qtd_lojas:$('fl_lojas')?.value||'1',vendedores:$('fl_vendedores')?.value||'',interesse:$('fl_interesse')?.value||'',obs,temperatura:$('fl_temp')?.value||'Morno',status:state.pipeline[0]||'🎪 Feira',tipo_cliente:'novo',origem:'Feira',categorias:[],created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
  state.clientes.unshift(c);
  // Follow-up automático em 2 dias
  const followDate=new Date(); followDate.setDate(followDate.getDate()+2);
  const lembrete={id:uuid(),cliente_id:c.id,cliente:c.loja,titulo:`Follow-up feira — ${c.loja}`,data:followDate.toISOString().slice(0,10),hora:'09:00',prioridade:'Alta',feito:false,created_at:new Date().toISOString()};
  state.lembretes.unshift(lembrete);
  await upsertRow('clientes',c);
  await upsertRow('lembretes',lembrete);
  _fairStep=1; _fairTemp={};
  toast('✅ Lead salvo! Follow-up criado para 2 dias.');
  feira();
}

// ── SCRIPTS ───────────────────────────────────────────────────────
let _scriptFormId=null;

function scripts(){
  const form=_scriptFormId!==undefined&&_scriptFormId!==false?`
    <div class="card" style="margin-bottom:16px;border-color:rgba(124,58,237,.4)">
      <h3 class="section-title">${_scriptFormId===null?'➕ Novo script':'✏️ Editar script'}
        <button class="btn ghost small" onclick="_scriptFormId=false;scripts()">✕</button>
      </h3>
      <div style="display:grid;gap:12px">
        <div><label>Título</label><input id="sc_titulo" value="${esc(_scriptFormId?state.scripts.find(s=>s.id===_scriptFormId)?.titulo||'':'')}"></div>
        <div><label>Texto</label><textarea id="sc_texto" style="min-height:140px">${esc(_scriptFormId?state.scripts.find(s=>s.id===_scriptFormId)?.texto||'':'')}</textarea></div>
      </div>
      <div class="actions" style="margin-top:14px">
        <button class="btn" onclick="saveScript()">💾 Salvar</button>
        ${_scriptFormId?`<button class="btn danger" onclick="deleteScript('${_scriptFormId}')">🗑️ Excluir</button>`:''}
      </div>
    </div>`:'';

  $('scripts').innerHTML=`
    <div class="topbar">
      <div class="hello"><h2>📝 Scripts de vendas</h2></div>
      <button class="btn" onclick="_scriptFormId=null;scripts()">+ Novo script</button>
    </div>
    ${form}
    <div class="grid two">
      ${(state.scripts||[]).map(s=>`
        <div class="card">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px">
            <h3 style="margin:0;font-size:16px">${esc(s.titulo)}</h3>
            <button class="btn small ghost" onclick="_scriptFormId='${s.id}';scripts()">✏️</button>
          </div>
          <p style="color:var(--muted);line-height:1.7;white-space:pre-line;font-size:14px;margin:0">${esc(s.texto)}</p>
          <button class="btn ghost" style="width:100%;margin-top:12px;font-size:13px" onclick="copyText('${s.id}')">📋 Copiar</button>
        </div>`).join('')||'<div class="empty">Nenhum script cadastrado.</div>'}
    </div>`;
  if(_scriptFormId!==undefined&&_scriptFormId!==false) setTimeout(()=>$('sc_titulo')?.focus(),50);
}

async function saveScript(){
  const titulo=$('sc_titulo')?.value?.trim();
  const texto=$('sc_texto')?.value?.trim();
  if(!titulo||!texto){toast('⚠️ Preencha título e texto');return;}
  if(!state.scripts) state.scripts=[];
  if(_scriptFormId===null) state.scripts.push({id:uuid(),titulo,texto});
  else { const s=state.scripts.find(x=>x.id===_scriptFormId); if(s){s.titulo=titulo;s.texto=texto;} }
  _scriptFormId=false;
  await cloudSave();
  toast('✅ Script salvo!'); scripts();
}

async function deleteScript(id){
  if(!confirm('Excluir este script?')) return;
  state.scripts=state.scripts.filter(s=>s.id!==id);
  _scriptFormId=false;
  await cloudSave();
  toast('🗑️ Script excluído'); scripts();
}

function copyText(id){
  const s=state.scripts?.find(x=>x.id===id);
  if(!s) return;
  navigator.clipboard.writeText(s.texto).then(()=>toast('📋 Copiado!')).catch(()=>toast('Erro ao copiar'));
}

// ── RANKING ───────────────────────────────────────────────────────
function ranking(){
  const pedidosPorCliente={};
  pedidosValidos().forEach(p=>{
    if(!pedidosPorCliente[p.cliente_id]) pedidosPorCliente[p.cliente_id]={fat:0,pedidos:0,comissao:0};
    pedidosPorCliente[p.cliente_id].fat+=parseFloat(p.valor||0);
    pedidosPorCliente[p.cliente_id].pedidos++;
    pedidosPorCliente[p.cliente_id].comissao+=parseFloat(p.comissao||0);
  });
  const ranked=state.clientes
    .map(c=>({...c,_fat:pedidosPorCliente[c.id]?.fat||0,_pedidos:pedidosPorCliente[c.id]?.pedidos||0,_cats:(c.categorias||[]).length}))
    .sort((a,b)=>b._fat-a._fat)
    .slice(0,15);

  $('ranking').innerHTML=`
    <div class="topbar"><div class="hello"><h2>🏆 Ranking de clientes</h2></div></div>
    <div class="grid two">
      <div class="card">
        <h3 class="section-title">Por faturamento</h3>
        ${ranked.map((c,i)=>`
          <div class="rank-item" onclick="openClient('${c.id}')" style="cursor:pointer">
            <div class="rank-num" style="${i===0?'background:linear-gradient(135deg,#f59e0b,#fbbf24)':i===1?'background:linear-gradient(135deg,#6b7280,#9ca3af)':i===2?'background:linear-gradient(135deg,#b45309,#d97706)':''}">${i+1}</div>
            <div style="flex:1"><b>${esc(c.loja)}</b><div style="font-size:12px;color:var(--muted)">${c._cats} cat. • ${c._pedidos} pedido${c._pedidos!==1?'s':''}</div></div>
            <div style="text-align:right"><div style="font-weight:700;color:#a78bfa">${fmtMoney(c._fat)}</div><div style="font-size:11px;color:var(--muted)">${c.tipo_cliente==='carteira'?'Carteira':'Novo'}</div></div>
          </div>`).join('')||'<div class="empty">Nenhum pedido registrado ainda.</div>'}
      </div>
      <div class="card">
        <h3 class="section-title">Por categorias</h3>
        ${[...state.clientes].sort((a,b)=>(b.categorias||[]).length-(a.categorias||[]).length).slice(0,15).map((c,i)=>`
          <div class="rank-item" onclick="openClient('${c.id}')" style="cursor:pointer">
            <div class="rank-num">${i+1}</div>
            <div style="flex:1"><b>${esc(c.loja)}</b><div style="font-size:12px;color:var(--muted)">${(c.categorias||[]).map(id=>CATEGORIAS.find(x=>x.id===id)?.icon||'').join(' ')}</div></div>
            <div style="font-weight:700;font-size:20px">${(c.categorias||[]).length}</div>
          </div>`).join('')||'<div class="empty">Nenhuma categoria cadastrada ainda.</div>'}
      </div>
    </div>`;
}

// ── FATURAMENTO ───────────────────────────────────────────────────
function faturamento(){
  const mes=_mesFaturamento||todayISO().slice(0,7);
  const pedMes=pedidosDoMes(mes);
  const fatTotal=pedMes.reduce((s,p)=>s+parseFloat(p.valor||0),0);
  const fatNovo=pedMes.filter(p=>p.tipo_cliente==='novo').reduce((s,p)=>s+parseFloat(p.valor||0),0);
  const fatCart=pedMes.filter(p=>p.tipo_cliente==='carteira').reduce((s,p)=>s+parseFloat(p.valor||0),0);
  const comTotal=pedMes.reduce((s,p)=>s+parseFloat(p.comissao||0),0);
  const meta=state.metas?.faturamentoMes||50000;
  const pct=Math.min(100,Math.round(fatTotal/meta*100));

  // Por categoria
  const catFat={};
  pedMes.forEach(p=>(p.categorias||[]).forEach(cat=>{catFat[cat]=(catFat[cat]||0)+parseFloat(p.valor||0)/Math.max(1,(p.categorias||[]).length);}));

  $('faturamento').innerHTML=`
    <div class="topbar">
      <div class="hello"><h2>💰 Faturamento</h2><p>${new Date(mes+'-02T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</p></div>
      <div class="row">
        <input type="month" value="${mes}" onchange="_mesFaturamento=this.value;faturamento()" style="max-width:170px">
        <button class="btn ghost" onclick="editMeta('faturamentoMes')">✏️ Editar meta</button>
        <button class="btn ghost" onclick="limparPedidosOrfaos()">🧹 Corrigir</button>
      </div>
    </div>
    <div class="commission-card" style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px">
        <div><small style="color:var(--muted)">Total faturado</small><div style="font-size:32px;font-weight:800;margin-top:4px">${fmtMoney(fatTotal)}</div></div>
        <div style="text-align:right"><small style="color:var(--muted)">Meta</small><div style="font-size:20px;font-weight:700">${fmtMoney(meta)}</div></div>
      </div>
      <div class="progress" style="height:10px"><div class="progress-bar" style="width:${pct}%;background:linear-gradient(90deg,var(--purple),var(--purple2))"></div></div>
      <div style="text-align:right;font-size:13px;color:var(--muted);margin-top:6px">${pct}% da meta</div>
    </div>
    <div class="grid cards" style="margin-bottom:20px">
      <div class="card metric"><small>🆕 Novos</small><strong>${fmtMoney(fatNovo)}</strong></div>
      <div class="card metric"><small>👥 Carteira</small><strong>${fmtMoney(fatCart)}</strong></div>
      <div class="card metric"><small>💸 Comissão</small><strong style="color:#a78bfa">${fmtMoney(comTotal)}</strong></div>
      <div class="card metric"><small>📦 Pedidos</small><strong>${pedMes.length}</strong></div>
    </div>
    <div class="card">
      <h3 class="section-title">Por categoria</h3>
      ${Object.entries(catFat).sort((a,b)=>b[1]-a[1]).map(([id,val])=>{
        const cat=CATEGORIAS.find(c=>c.id===id);
        const pctCat=Math.round(val/fatTotal*100)||0;
        return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <span style="font-size:20px;width:28px">${cat?.icon||'📦'}</span>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
              <span>${cat?.label||id}</span><span>${fmtMoney(val)} (${pctCat}%)</span>
            </div>
            <div class="progress" style="height:4px"><div class="progress-bar" style="width:${pctCat}%;background:var(--purple2)"></div></div>
          </div>
        </div>`;}).join('')||'<div class="empty">Nenhum pedido neste mês.</div>'}
    </div>`;
}

// ── CONCORRENTES ──────────────────────────────────────────────────
let _compFormId=false;

function concorrentes(){
  $('concorrentes').innerHTML=`
    <div class="topbar">
      <div class="hello"><h2>⚔️ Concorrentes</h2></div>
      <button class="btn" onclick="_compFormId=null;concorrentes()">+ Adicionar</button>
    </div>
    ${_compFormId!==false?`
    <div class="card" style="margin-bottom:16px;border-color:rgba(124,58,237,.4)">
      <h3 class="section-title">${_compFormId===null?'➕ Novo concorrente':'✏️ Editar'}
        <button class="btn ghost small" onclick="_compFormId=false;concorrentes()">✕</button>
      </h3>
      <div class="formgrid">
        <div><label>Nome</label><input id="comp_nome" value="${esc(_compFormId?state.concorrentes.find(c=>c.id===_compFormId)?.nome||'':'')}"></div>
        <div><label>Posicionamento</label><input id="comp_pos" value="${esc(_compFormId?state.concorrentes.find(c=>c.id===_compFormId)?.posicao||'':'')}"></div>
        <div class="full"><label>Forças</label><textarea id="comp_forca">${esc(_compFormId?state.concorrentes.find(c=>c.id===_compFormId)?.forca||'':'')}</textarea></div>
        <div class="full"><label>Como vencer</label><textarea id="comp_como">${esc(_compFormId?state.concorrentes.find(c=>c.id===_compFormId)?.como||'':'')}</textarea></div>
      </div>
      <div class="actions" style="margin-top:14px">
        <button class="btn" onclick="saveCompetidor()">💾 Salvar</button>
        ${_compFormId?`<button class="btn danger" onclick="deleteCompetidor('${_compFormId}')">🗑️</button>`:''}
      </div>
    </div>`:''}
    <div class="grid two">
      ${(state.concorrentes||[]).map(c=>`
        <div class="card">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px">
            <h3 style="margin:0">${esc(c.nome)}</h3>
            <button class="btn small ghost" onclick="_compFormId='${c.id}';concorrentes()">✏️</button>
          </div>
          ${c.posicao?`<div class="tag" style="margin-bottom:10px">${esc(c.posicao)}</div>`:''}
          ${c.forca?`<p style="color:var(--muted);font-size:13px;margin:0 0 8px"><strong>Forças:</strong> ${esc(c.forca)}</p>`:''}
          ${c.como?`<p style="color:#a78bfa;font-size:13px;margin:0"><strong>Como vencer:</strong> ${esc(c.como)}</p>`:''}
        </div>`).join('')||'<div class="empty">Nenhum concorrente cadastrado.</div>'}
    </div>`;
}

async function saveCompetidor(){
  const nome=$('comp_nome')?.value?.trim();
  if(!nome){toast('⚠️ Informe o nome');return;}
  if(!state.concorrentes) state.concorrentes=[];
  if(_compFormId===null) state.concorrentes.push({id:uuid(),nome,posicao:$('comp_pos')?.value||'',forca:$('comp_forca')?.value||'',como:$('comp_como')?.value||''});
  else{const c=state.concorrentes.find(x=>x.id===_compFormId);if(c){c.nome=nome;c.posicao=$('comp_pos')?.value||'';c.forca=$('comp_forca')?.value||'';c.como=$('comp_como')?.value||'';}}
  _compFormId=false;
  await cloudSave();
  toast('✅ Salvo!'); concorrentes();
}

async function deleteCompetidor(id){
  state.concorrentes=state.concorrentes.filter(x=>x.id!==id);
  _compFormId=false;
  await cloudSave();
  toast('🗑️ Excluído'); concorrentes();
}
