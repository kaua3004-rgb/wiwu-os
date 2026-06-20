// ── FICHA DO CLIENTE (MODAL) ──────────────────────────────────────
let _clientTab = 'resumo';

function openClient(id, tab='resumo'){
  const c = state.clientes.find(x=>x.id===id);
  if(!c) return;
  _clientTab = tab;
  const tabs = ['resumo','fiscal','categorias','pedidos','rma','histórico','lembretes','relacionamento'];
  const dias = diasSemContato(c);
  const cats = (c.categorias||[]).length;
  const pedidosCliente = state.pedidos.filter(p=>p.cliente_id===id);
  const faturamento = pedidosCliente.reduce((s,p)=>s+parseFloat(p.valor||0),0);
  const rmasCliente = state.rmas.filter(r=>r.cliente_id===id&&!r.resolvido);

  $('clientModal').innerHTML=`
    <div class="modal-card">
      <div class="modal-head">
        <div>
          <h2 style="margin:0">${esc(c.loja||c.nome)}</h2>
          <p style="color:var(--muted);margin:4px 0 8px;font-size:14px">${esc(c.nome||'')} ${c.cidade?`• ${esc(c.cidade)}-${esc(c.estado||'')}`:''}</p>
          <div>
            <span class="tag ${tempTag(c.temperatura)}">${esc(c.temperatura||'')}</span>
            <span class="tag ${c.tipo_cliente==='carteira'?'carteira':'novo'}">${c.tipo_cliente==='carteira'?'👥 Carteira':'🆕 Novo'}</span>
            <span class="tag">${esc(c.status||'')}</span>
            ${rmasCliente.length>0?`<span class="tag hot">⚠️ ${rmasCliente.length} RMA pendente${rmasCliente.length>1?'s':''}</span>`:''}
            ${dias>=7?`<span class="tag warn">⏰ ${dias}d sem contato</span>`:''}
          </div>
        </div>
        <button class="x" onclick="closeModal()">✕</button>
      </div>

      <div class="actions">
        <button class="btn green" onclick="openWaMsgs('${id}')">💬 WhatsApp</button>
        ${c.instagram?`<a class="btn ghost" href="https://instagram.com/${(c.instagram||'').replace('@','')}" target="_blank">📸 Instagram</a>`:''}
        ${c.whatsapp?`<a class="btn ghost" href="tel:${(c.whatsapp||'').replace(/\D/g,'')}">📞 Ligar</a>`:''}
        <button class="btn ghost" onclick="novaInteracao('${id}')">+ Histórico</button>
        <button class="btn ghost" onclick="closeModal();newReminder('${id}','${esc(c.loja||c.nome)}')">+ Lembrete</button>
        <button class="btn ghost" onclick="novoPedido('${id}')">💰 Pedido</button>
        <button class="btn ghost" onclick="closeModal();clientForm('${id}')">✏️ Editar</button>
        <button class="btn ghost" onclick="openMercos('${id}')">📋 Mercos</button>
      </div>

      <div class="tabs">
        ${tabs.map(t=>`<button onclick="openClient('${id}','${t}')" class="${_clientTab===t?'active':''}">${t.charAt(0).toUpperCase()+t.slice(1)}</button>`).join('')}
      </div>

      <div id="modalBody">${clientTabContent(c, tab)}</div>
    </div>`;
  $('clientModal').className='modal show';
}

function clientTabContent(c, tab){
  if(tab==='resumo') return tabResumo(c);
  if(tab==='fiscal') return tabFiscal(c);
  if(tab==='categorias') return tabCategorias(c);
  if(tab==='pedidos') return tabPedidos(c);
  if(tab==='rma') return tabRma(c);
  if(tab==='histórico') return tabHistorico(c);
  if(tab==='lembretes') return tabLembretes(c);
  if(tab==='relacionamento') return tabRelacionamento(c);
  return '';
}

function tabResumo(c){
  const pedidos = state.pedidos.filter(p=>p.cliente_id===c.id);
  const faturamento = pedidos.reduce((s,p)=>s+parseFloat(p.valor||0),0);
  const cats = (c.categorias||[]).length;
  const ultimoPedido = pedidos[0];
  return `
    <div class="grid two" style="margin-bottom:16px">
      <div>
        ${c.cnpj?`<div style="margin-bottom:10px"><small style="color:var(--muted)">CNPJ</small><div>${esc(c.cnpj)}</div></div>`:''}
        ${c.whatsapp?`<div style="margin-bottom:10px"><small style="color:var(--muted)">WhatsApp</small><div>${esc(c.whatsapp)}</div></div>`:''}
        ${c.instagram?`<div style="margin-bottom:10px"><small style="color:var(--muted)">Instagram</small><div>${esc(c.instagram)}</div></div>`:''}
        ${c.endereco?`<div style="margin-bottom:10px"><small style="color:var(--muted)">Endereço</small><div>${esc(c.endereco)}, ${esc(c.cidade)}-${esc(c.estado)} ${esc(c.cep||'')}</div></div>`:''}
        ${c.marcas?`<div style="margin-bottom:10px"><small style="color:var(--muted)">Marcas concorrentes</small><div>${esc(c.marcas)}</div></div>`:''}
        ${c.proxacao?`<div style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);border-radius:14px;padding:12px;margin-top:8px"><small style="color:var(--muted)">📅 Próxima ação</small><div style="font-weight:600;margin-top:4px">${esc(c.proxacao)}</div>${c.proxdata?`<div style="font-size:12px;color:var(--muted)">${fmt(c.proxdata)}</div>`:''}</div>`:''}
      </div>
      <div>
        <div class="card" style="margin-bottom:12px">
          <div class="grid cards-3" style="gap:10px">
            <div class="metric"><small>Pedidos</small><strong>${pedidos.length}</strong></div>
            <div class="metric"><small>Categorias</small><strong>${cats}</strong></div>
            <div class="metric"><small>Faturado</small><strong style="font-size:16px">${fmtMoney(faturamento)}</strong></div>
          </div>
        </div>
        ${c.obs?`<div style="background:rgba(255,255,255,.04);border-radius:16px;padding:14px"><small style="color:var(--muted)">📝 Observações</small><p style="margin:6px 0 0;line-height:1.7;font-size:14px">${esc(c.obs)}</p></div>`:''}
        ${(c.tags||[]).length?`<div style="margin-top:10px">${(c.tags||[]).map(t=>`<span class="tag green">${esc(t)}</span>`).join('')}</div>`:''}
      </div>
    </div>
    ${(c.contatos||[]).filter(ct=>ct.nome||ct.whatsapp).length?`
    <div class="card" style="margin-top:8px">
      <h3 class="section-title">👥 Contatos da loja</h3>
      <div class="list">
        ${(c.contatos||[]).filter(ct=>ct.nome||ct.whatsapp).map(ct=>`
          <div class="item">
            <div><b>${esc(ct.nome||'')}</b><span>${esc(ct.cargo||'')}</span></div>
            ${ct.whatsapp?`<a class="btn small ghost" href="https://wa.me/55${(ct.whatsapp||'').replace(/\D/g,'')}" target="_blank">💬</a>`:''}
          </div>`).join('')}
      </div>
    </div>`:''}`;
}

function tabFiscal(c){
  return `
    <div class="card">
      <h3 class="section-title">📋 Dados Fiscais</h3>
      <div class="formgrid">
        <div class="full"><label>CNPJ</label>
          <div style="display:flex;gap:8px">
            <input id="fis_cnpj" value="${esc(c.cnpj||'')}" placeholder="00.000.000/0001-00" style="flex:1">
            <button class="btn small ghost" onclick="buscarCNPJFicha('${c.id}')">🔍 Buscar</button>
          </div>
        </div>
        <div id="fis_preview" class="full"></div>
        <div><label>Razão Social</label><input id="fis_razao" value="${esc(c.razao_social||'')}"></div>
        <div><label>Nome Fantasia</label><input id="fis_fantasia" value="${esc(c.nome_fantasia||'')}"></div>
        <div><label>Inscrição Estadual</label>
          <div style="display:flex;gap:8px">
            <input id="fis_ie" value="${esc(c.inscricao_estadual||'')}" placeholder="Digite a IE ou 000000" style="flex:1">
            <button class="btn small ghost" onclick="consultarIE('${c.id}')" title="Consultar no site do estado">🌐</button>
          </div>
        </div>
        <div><label>Situação Cadastral</label><input id="fis_situacao" value="${esc(c.situacao_cadastral||'')}" readonly style="color:var(--muted)"></div>
        <div><label>CEP</label><input id="fis_cep" value="${esc(c.cep||'')}" placeholder="00000-000"></div>
        <div><label>Endereço</label><input id="fis_endereco" value="${esc(c.endereco||'')}"></div>
        <div><label>Cidade</label><input id="fis_cidade" value="${esc(c.cidade||'')}"></div>
        <div><label>Estado</label><input id="fis_estado" value="${esc(c.estado||'')}"></div>
      </div>
      <div class="actions" style="margin-top:14px">
        <button class="btn" onclick="salvarFiscal('${c.id}')">💾 Salvar dados fiscais</button>
        <button class="btn ghost" onclick="openMercos('${c.id}')">📋 Exportar p/ Mercos</button>
      </div>
    </div>`;
}

async function buscarCNPJFicha(id){
  const cnpj = document.getElementById('fis_cnpj').value;
  if(!cnpj){ toast('⚠️ Digite o CNPJ'); return; }
  toast('🔍 Buscando CNPJ...');
  const d = await buscarCNPJ(cnpj);
  if(!d){ toast('❌ CNPJ não encontrado'); return; }
  document.getElementById('fis_razao').value = d.razao_social||'';
  document.getElementById('fis_fantasia').value = d.nome_fantasia||'';
  document.getElementById('fis_situacao').value = d.descricao_situacao_cadastral||'Ativa';
  const end = [d.logradouro,d.numero,d.complemento,d.bairro].filter(Boolean).join(', ');
  document.getElementById('fis_endereco').value = end;
  document.getElementById('fis_cidade').value = d.municipio||'';
  document.getElementById('fis_estado').value = d.uf||'';
  document.getElementById('fis_cep').value = (d.cep||'').replace(/\D/g,'');
  const prev = document.getElementById('fis_preview');
  if(prev) prev.innerHTML = '<div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);border-radius:14px;padding:12px;font-size:13px;color:#86efac">✅ ' + esc(d.razao_social) + '<br><span style="color:var(--muted)">⚠️ IE: consulte pelo botão 🌐</span></div>';
  toast('✅ CNPJ preenchido!');
}

function consultarIE(id){
  const estado = document.getElementById('fis_estado').value || 'SP';
  abrirConsultaIE(estado, document.getElementById('fis_cnpj').value);
}

async function salvarFiscal(id){
  const c = state.clientes.find(x=>x.id===id);
  if(!c) return;
  c.cnpj = document.getElementById('fis_cnpj').value;
  c.razao_social = document.getElementById('fis_razao').value;
  c.nome_fantasia = document.getElementById('fis_fantasia').value;
  c.inscricao_estadual = document.getElementById('fis_ie').value;
  c.situacao_cadastral = document.getElementById('fis_situacao').value;
  c.cep = document.getElementById('fis_cep').value;
  c.endereco = document.getElementById('fis_endereco').value;
  c.cidade = document.getElementById('fis_cidade').value;
  c.estado = document.getElementById('fis_estado').value;
  c.updated_at = new Date().toISOString();
  await upsertRow('clientes', c);
  toast('✅ Dados fiscais salvos!');
  openClient(id, 'fiscal');
}

function tabCategorias(c){
  const cats = c.categorias||[];
  const pedidos = state.pedidos.filter(p=>p.cliente_id===c.id);
  const catsPorPedido = {};
  pedidos.forEach(p=>(p.categorias||[]).forEach(cat=>{catsPorPedido[cat]=(catsPorPedido[cat]||0)+1;}));

  // Comissão correta conforme tipo de cliente
  const tipoC = c.tipo_cliente||'novo';
  const comInfo = calcComissao({tipo_cliente:tipoC, valor:100, categorias:cats, caixas_fonte:0});
  const pctLabel = comInfo.pct>0 ? ('Comissão '+String(comInfo.pct).replace('.',',')+'%') : 'Sem comissão (mín. 4 cat.)';
  const corPct = comInfo.pct>=2?'#22c55e':comInfo.pct>=1.5?'#f59e0b':comInfo.pct>=1?'#818cf8':'#a8a8b8';

  return `
    <div style="margin-bottom:16px">
      <p style="color:var(--muted);font-size:14px">${cats.length} de ${CATEGORIAS.length} categorias • <strong style="color:${corPct}">${pctLabel}</strong> <span style="font-size:12px">(${tipoC==='carteira'?'👥 Carteira':'🆕 Novo'})</span></p>
      <div class="progress"><div class="progress-bar" style="width:${Math.round(cats.length/CATEGORIAS.length*100)}%;background:${corPct}"></div></div>
    </div>
    <div class="cat-grid">
      ${CATEGORIAS.map(cat=>{
        const tem = cats.includes(cat.id);
        const vezes = catsPorPedido[cat.id]||0;
        return `<div class="cat-item ${tem?'selected':''}" style="${tem?'':'opacity:.45'}">
          <div class="cat-icon">${cat.icon}</div>
          <div style="font-size:11px;font-weight:600">${cat.label}</div>
          ${tem?`<div style="font-size:10px;color:var(--muted);margin-top:4px">${vezes} pedido${vezes!==1?'s':''}</div>`:'<div style="font-size:10px;color:var(--muted);margin-top:4px">Não vende</div>'}
        </div>`;
      }).join('')}
    </div>
    <div style="margin-top:16px">
      <button class="btn ghost" onclick="closeModal();clientForm('${c.id}');setTimeout(()=>document.querySelector('.tabs button:nth-child(3)')?.click(),300)">✏️ Editar categorias</button>
    </div>`;
}

function tabPedidos(c){
  const pedidos = state.pedidos.filter(p=>p.cliente_id===c.id);
  return `
    <div class="toolbar">
      <h3 class="section-title" style="margin:0">Pedidos (${pedidos.length})</h3>
      <button class="btn" onclick="novoPedido('${c.id}')">+ Novo pedido</button>
    </div>
    ${pedidos.length?pedidos.map(p=>{
      const com = calcComissao(p);
      return `<div class="item" style="margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <div style="flex:1">
          <b>${fmt(p.data)} — ${fmtMoney(p.valor)}</b>
          <span>${(p.categorias||[]).map(id=>CATEGORIAS.find(c=>c.id===id)?.icon||id).join(' ')} ${p.caixas_fonte?`• ${p.caixas_fonte} cx fonte`:''}</span>
          <span style="color:#a78bfa">Comissão: ${fmtMoney(com.total)} (${com.pct}% + bônus fonte)</span>
        </div>
        <span class="tag ${p.tipo_cliente==='carteira'?'carteira':'novo'}">${p.tipo_cliente==='carteira'?'Carteira':'Novo'}</span>
        <button class="btn small ghost danger" onclick="deletePedido('${p.id}','${c.id}')">🗑️</button>
      </div>`;}).join('')
    :`<div class="empty">Nenhum pedido registrado.</div>`}`;
}

function tabRma(c){
  const rmas = state.rmas.filter(r=>r.cliente_id===c.id);
  const pendentes = rmas.filter(r=>!r.resolvido);
  const resolvidos = rmas.filter(r=>r.resolvido);
  return `
    <div class="toolbar">
      <h3 class="section-title" style="margin:0">RMA — Trocas/Devoluções</h3>
      <button class="btn" onclick="novoRma('${c.id}')">+ Registrar RMA</button>
    </div>
    ${pendentes.length?`
    <h4 style="color:var(--red);margin:0 0 10px">⚠️ Pendentes (${pendentes.length})</h4>
    ${pendentes.map(r=>`
      <div class="rma-item" style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <b>${esc(r.produto)}</b>
            <div style="font-size:12px;color:var(--muted)">${fmt(r.data)} • Qtd: ${r.qtd||1} • ${esc(r.motivo)}</div>
            ${r.obs?`<div style="font-size:12px;margin-top:4px">${esc(r.obs)}</div>`:''}
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn small green" onclick="resolverRma('${r.id}','${c.id}')">✅ Resolver</button>
            <button class="btn small ghost danger" onclick="deleteRma('${r.id}','${c.id}')">🗑️</button>
          </div>
        </div>
      </div>`).join('')}`:''}
    ${resolvidos.length?`
    <h4 style="color:var(--green);margin:16px 0 10px">✅ Resolvidos</h4>
    ${resolvidos.map(r=>`
      <div class="rma-item resolved" style="margin-bottom:8px">
        <b>${esc(r.produto)}</b>
        <div style="font-size:12px;color:var(--muted)">${fmt(r.data)} • Qtd: ${r.qtd||1} • ${esc(r.motivo)}</div>
      </div>`).join('')}`:''}
    ${!rmas.length?'<div class="empty">Nenhum RMA registrado.</div>':''}`;
}

function tabHistorico(c){
  const ints = state.interacoes.filter(i=>i.cliente_id===c.id);
  return `
    <div class="toolbar">
      <h3 class="section-title" style="margin:0">Histórico de interações</h3>
      <button class="btn" onclick="novaInteracao('${c.id}')">+ Registrar</button>
    </div>
    ${ints.length?`<div class="timeline">${ints.map(i=>`
      <div class="event">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <b>${esc(i.tipo)}</b>
            <div style="font-size:12px;color:var(--muted)">${fmt(i.data||i.created_at?.slice(0,10))} ${i.hora||''}</div>
            ${i.texto?`<p style="margin:6px 0 0;font-size:14px;line-height:1.6">${esc(i.texto)}</p>`:''}
          </div>
          <button class="btn small ghost danger" onclick="deleteInteracao('${i.id}','${c.id}')">🗑️</button>
        </div>
      </div>`).join('')}</div>`
    :'<div class="empty">Nenhuma interação registrada.</div>'}`;
}

function tabLembretes(c){
  const lems = state.lembretes.filter(l=>l.cliente_id===c.id||l.cliente===c.loja||l.cliente===c.nome);
  const pend = lems.filter(l=>!l.feito);
  const done = lems.filter(l=>l.feito);
  return `
    <div class="toolbar">
      <h3 class="section-title" style="margin:0">Lembretes</h3>
      <button class="btn" onclick="closeModal();newReminder('${c.id}','${esc(c.loja||c.nome)}')">+ Novo lembrete</button>
    </div>
    <h4 style="margin:0 0 10px;color:var(--muted)">Pendentes</h4>
    ${pend.map(l=>`
      <div class="item" style="margin-bottom:8px">
        <div><b>${esc(l.titulo)}</b><span>${fmt(l.data)} ${l.hora||''} • ${esc(l.prioridade||'')}</span></div>
        <div style="display:flex;gap:6px">
          <button class="btn small ghost" onclick="downloadICS('${l.id}')">📅</button>
          <button class="btn small ghost" onclick="doneReminder('${l.id}');openClient('${c.id}','lembretes')">✓</button>
        </div>
      </div>`).join('')||'<div class="empty">Nenhum pendente.</div>'}
    ${done.length?`<h4 style="margin:14px 0 10px;color:var(--muted)">Concluídos</h4>${done.slice(0,5).map(l=>`<div class="item" style="margin-bottom:6px;opacity:.6"><div><b>${esc(l.titulo)}</b><span>${fmt(l.data)}</span></div><span style="color:var(--green)">✓</span></div>`).join('')}`:''}`;
}

function tabRelacionamento(c){
  return `
    <div class="grid two">
      <div>
        ${c.perfil?`<div style="margin-bottom:12px"><small style="color:var(--muted)">Perfil</small><div class="tag" style="margin-top:4px">${esc(c.perfil)}</div></div>`:''}
        ${c.hobby?`<div style="margin-bottom:12px"><small style="color:var(--muted)">Hobby</small><div>${esc(c.hobby)}</div></div>`:''}
        ${c.esposa?`<div style="margin-bottom:12px"><small style="color:var(--muted)">Relacionamento</small><div>${esc(c.esposa)}</div></div>`:''}
        ${c.filhos?`<div style="margin-bottom:12px"><small style="color:var(--muted)">Filhos</small><div>${esc(c.filhos)}</div></div>`:''}
        ${c.aniversario?`<div style="margin-bottom:12px"><small style="color:var(--muted)">🎂 Aniversário</small><div>${fmt(c.aniversario)}</div></div>`:''}
      </div>
      <div>
        ${c.info_pessoal?`<div style="background:rgba(255,255,255,.04);border-radius:16px;padding:14px"><small style="color:var(--muted)">📝 Informações pessoais</small><p style="margin:6px 0 0;line-height:1.7;font-size:14px">${esc(c.info_pessoal)}</p></div>`:'<div class="empty">Nenhuma info pessoal.</div>'}
      </div>
    </div>`;
}

// ── INTERAÇÕES ────────────────────────────────────────────────────
function novaInteracao(clienteId){
  const c = state.clientes.find(x=>x.id===clienteId);
  const html=`
    <div style="background:rgba(0,0,0,.5);backdrop-filter:blur(8px);position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px" id="intOverlay" onclick="if(event.target===this)this.remove()">
      <div style="background:var(--panel);border-radius:24px;padding:24px;width:min(480px,100%);border:1px solid var(--line)">
        <h3 style="margin:0 0 16px">📝 Nova interação — ${esc(c?.loja||'')}</h3>
        <div class="formgrid">
          <div class="full"><label>Tipo</label>
            <select id="int_tipo">${INTERACAO_TIPOS.map(t=>`<option>${t}</option>`).join('')}</select>
          </div>
          <div><label>Data</label><input type="date" id="int_data" value="${todayISO()}"></div>
          <div><label>Hora</label><input type="time" id="int_hora" value="${new Date().toTimeString().slice(0,5)}"></div>
          <div class="full"><label>Descrição</label><textarea id="int_texto" placeholder="O que aconteceu?"></textarea></div>
        </div>
        <div class="actions">
          <button class="btn" onclick="saveInteracao('${clienteId}')">💾 Salvar</button>
          <button class="btn ghost" onclick="$('intOverlay').remove()">Cancelar</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
  setTimeout(()=>$('int_texto')?.focus(),50);
}

async function saveInteracao(clienteId){
  const tipo=$('int_tipo')?.value;
  const texto=$('int_texto')?.value?.trim();
  if(!texto){ toast('⚠️ Descreva o que aconteceu'); return; }
  const i={id:uuid(),cliente_id:clienteId,tipo,texto,data:$('int_data')?.value,hora:$('int_hora')?.value,created_at:new Date().toISOString()};
  state.interacoes.unshift(i);
  // Atualizar updated_at do cliente
  const c=state.clientes.find(x=>x.id===clienteId);
  if(c){ c.updated_at=new Date().toISOString(); await upsertRow('clientes',c); }
  await upsertRow('interacoes',i);
  toast('✅ Interação registrada!');
  $('intOverlay')?.remove();
  openClient(clienteId,'histórico');
}

async function deleteInteracao(id, clienteId){
  state.interacoes=state.interacoes.filter(x=>x.id!==id);
  await deleteRow('interacoes',id);
  openClient(clienteId,'histórico');
}

// ── RMA ───────────────────────────────────────────────────────────
function novoRma(clienteId){
  const c=state.clientes.find(x=>x.id===clienteId);
  const html=`
    <div style="background:rgba(0,0,0,.5);backdrop-filter:blur(8px);position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px" id="rmaOverlay" onclick="if(event.target===this)this.remove()">
      <div style="background:var(--panel);border-radius:24px;padding:24px;width:min(480px,100%);border:1px solid rgba(239,68,68,.3)">
        <h3 style="margin:0 0 16px">⚠️ Registrar RMA — ${esc(c?.loja||'')}</h3>
        <div class="formgrid">
          <div class="full"><label>Produto / Modelo *</label><input id="rma_produto" placeholder="Ex: Carregador 65W GaN modelo X1"></div>
          <div><label>Quantidade</label><input type="number" id="rma_qtd" value="1" min="1"></div>
          <div><label>Data</label><input type="date" id="rma_data" value="${todayISO()}"></div>
          <div class="full"><label>Motivo</label>
            <select id="rma_motivo">${RMA_MOTIVOS.map(m=>`<option>${m}</option>`).join('')}</select>
          </div>
          <div class="full"><label>Observações</label><textarea id="rma_obs" placeholder="Detalhes do problema, NF, etc..."></textarea></div>
        </div>
        <div class="actions">
          <button class="btn danger" onclick="saveRma('${clienteId}')">⚠️ Registrar RMA</button>
          <button class="btn ghost" onclick="$('rmaOverlay').remove()">Cancelar</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
}

async function saveRma(clienteId){
  const produto=$('rma_produto')?.value?.trim();
  if(!produto){ toast('⚠️ Informe o produto'); return; }
  const r={id:uuid(),cliente_id:clienteId,produto,qtd:$('rma_qtd')?.value||1,motivo:$('rma_motivo')?.value,obs:$('rma_obs')?.value,data:$('rma_data')?.value,resolvido:false,created_at:new Date().toISOString()};
  state.rmas.unshift(r);
  await upsertRow('rmas',r);
  toast('⚠️ RMA registrado!');
  $('rmaOverlay')?.remove();
  openClient(clienteId,'rma');
}

async function resolverRma(id, clienteId){
  const r=state.rmas.find(x=>x.id===id);
  if(r){ r.resolvido=true; r.data_resolucao=new Date().toISOString(); await upsertRow('rmas',r); }
  toast('✅ RMA resolvido!');
  openClient(clienteId,'rma');
}

async function deleteRma(id, clienteId){
  state.rmas=state.rmas.filter(x=>x.id!==id);
  await deleteRow('rmas',id);
  openClient(clienteId,'rma');
}

// ── PEDIDOS ───────────────────────────────────────────────────────
function novoPedido(clienteId){
  const c=state.clientes.find(x=>x.id===clienteId);
  const rmasPend=state.rmas.filter(r=>r.cliente_id===clienteId&&!r.resolvido);
  const html=`
    <div style="background:rgba(0,0,0,.5);backdrop-filter:blur(8px);position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:20px" id="pedidoOverlay" onclick="if(event.target===this)this.remove()">
      <div style="background:var(--panel);border-radius:24px;padding:24px;width:min(560px,100%);border:1px solid var(--line);max-height:90vh;overflow-y:auto">
        <h3 style="margin:0 0 4px">💰 Novo pedido — ${esc(c?.loja||'')}</h3>
        ${rmasPend.length?`<div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:14px;padding:12px;margin-bottom:16px"><b style="color:#fca5a5">⚠️ ${rmasPend.length} RMA pendente${rmasPend.length>1?'s':''}:</b> ${rmasPend.map(r=>`${esc(r.produto)} (${r.qtd}x)`).join(', ')}</div>`:''}
        <div class="formgrid">
          <div><label>Tipo de cliente</label>
            <select id="ped_tipo">
              <option value="novo" ${(c?.tipo_cliente||'novo')==='novo'?'selected':''}>🆕 Novo</option>
              <option value="carteira" ${c?.tipo_cliente==='carteira'?'selected':''}>👥 Carteira</option>
            </select>
          </div>
          <div><label>Data do pedido</label><input type="date" id="ped_data" value="${todayISO()}"></div>
          <div><label>Valor total (R$) *</label><input type="number" id="ped_valor" placeholder="0.00" oninput="calcPreviewComissao()"></div>
          <div><label>Caixas de fonte fechadas</label><input type="number" id="ped_fontes" value="0" min="0" oninput="calcPreviewComissao()"></div>
          <div class="full"><label>Observações</label><input id="ped_obs" placeholder="Número do pedido, observações..."></div>
        </div>
        <label style="margin-top:16px">Categorias deste pedido</label>
        <div class="cat-grid" style="margin-top:8px">
          ${CATEGORIAS.map(cat=>`
            <div class="cat-item ${(c?.categorias||[]).includes(cat.id)?'selected':''}" onclick="this.classList.toggle('selected');calcPreviewComissao()" data-cat="${cat.id}">
              <div class="cat-icon">${cat.icon}</div>
              <div style="font-size:11px">${cat.label}</div>
            </div>`).join('')}
        </div>
        <div id="comissaoPreview" style="background:rgba(124,58,237,.12);border:1px solid rgba(168,85,247,.3);border-radius:16px;padding:16px;margin-top:16px">
          <div style="color:var(--muted);font-size:13px">Selecione categorias e valor para ver a comissão</div>
        </div>
        <div class="actions" style="margin-top:16px">
          <button class="btn" onclick="savePedido('${clienteId}')">💾 Salvar pedido</button>
          <button class="btn ghost" onclick="$('pedidoOverlay').remove()">Cancelar</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend',html);
  calcPreviewComissao();
}

function calcPreviewComissao(){
  const valor=parseFloat($('ped_valor')?.value||0);
  const fontes=parseInt($('ped_fontes')?.value||0);
  const tipo=$('ped_tipo')?.value||'novo';
  const cats=[...document.querySelectorAll('#pedidoOverlay .cat-item.selected')].map(el=>el.dataset.cat);
  const prev=$('comissaoPreview');
  if(!prev) return;
  if(!valor){ prev.innerHTML='<div style="color:var(--muted);font-size:13px">Informe o valor do pedido</div>'; return; }
  const com=calcComissao({tipo_cliente:tipo,valor,caixas_fonte:fontes,categorias:cats});
  prev.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
      <div class="metric"><small>Categorias</small><strong style="font-size:22px">${cats.length}</strong></div>
      <div class="metric"><small>% Comissão</small><strong style="font-size:22px">${com.pct}%</strong></div>
      <div class="metric"><small>Bônus fonte</small><strong style="font-size:22px">${fmtMoney(com.bonusFonte)}</strong></div>
    </div>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">
      <span style="color:var(--muted)">Comissão total estimada</span>
      <strong style="font-size:22px;color:#a78bfa">${fmtMoney(com.total)}</strong>
    </div>`;
}

async function savePedido(clienteId){
  const valor=parseFloat($('ped_valor')?.value||0);
  if(!valor){ toast('⚠️ Informe o valor do pedido'); return; }
  const cats=[...document.querySelectorAll('#pedidoOverlay .cat-item.selected')].map(el=>el.dataset.cat);
  const tipo=$('ped_tipo')?.value||'novo';
  const com=calcComissao({tipo_cliente:tipo,valor,caixas_fonte:parseInt($('ped_fontes')?.value||0),categorias:cats});
  const p={id:uuid(),cliente_id:clienteId,tipo_cliente:tipo,valor,caixas_fonte:$('ped_fontes')?.value||0,categorias:cats,obs:$('ped_obs')?.value||'',comissao:com.total,comissao_pct:com.pct,bonus_fonte:com.bonusFonte,data:$('ped_data')?.value||todayISO(),created_at:new Date().toISOString()};
  state.pedidos.unshift(p);
  // Atualizar categorias do cliente
  const c=state.clientes.find(x=>x.id===clienteId);
  if(c){ c.categorias=[...new Set([...(c.categorias||[]),...cats])]; c.tipo_cliente=tipo; c.updated_at=new Date().toISOString(); await upsertRow('clientes',c); }
  await upsertRow('pedidos',p);
  toast(`✅ Pedido salvo! Comissão: ${fmtMoney(com.total)}`);
  $('pedidoOverlay')?.remove();
  openClient(clienteId,'pedidos');
}

async function deletePedido(id, clienteId){
  state.pedidos=state.pedidos.filter(x=>x.id!==id);
  await deleteRow('pedidos',id);
  openClient(clienteId,'pedidos');
}

// ── WA MENSAGENS RÁPIDAS ──────────────────────────────────────────
function openWaMsgs(clienteId){
  const c=state.clientes.find(x=>x.id===clienteId);
  if(!c){ toast('Cliente não encontrado'); return; }
  const n=(c.whatsapp||'').replace(/\D/g,'');
  if(!n){ toast('⚠️ Cliente sem WhatsApp'); return; }
  const num=n.startsWith('55')?n:'55'+n;
  const msgs=[
    {label:'👋 Primeiro contato', texto:`Olá ${c.nome||''}! Tudo bem? Aqui é o Kauã da WIWU Brasil. Foi um prazer te conhecer! 🙌`},
    {label:'📦 Enviar catálogo', texto:`Olá ${c.nome||''}! Seguindo nossa conversa, estou enviando nosso catálogo WIWU com as principais linhas. Qualquer dúvida estou aqui! 📦`},
    {label:'🎯 Follow-up', texto:`Olá ${c.nome||''}! Passando para saber se teve chance de ver o catálogo. Tem alguma linha que chamou atenção? Posso montar uma proposta! 🎯`},
    {label:'📄 Proposta pronta', texto:`Olá ${c.nome||''}! Conforme conversamos, preparei uma proposta personalizada para sua loja. Podemos alinhar? 📄`},
    {label:'⭐ Pós-venda', texto:`Olá ${c.nome||''}! Como está sendo a experiência com os produtos WIWU? Estou à disposição para qualquer suporte! ⭐`},
    {label:'🎂 Aniversário', texto:`Olá ${c.nome||''}! Tudo bem? Passando para desejar um Feliz Aniversário! 🎂🎉 Que seja um ano incrível!`},
  ];
  document.body.insertAdjacentHTML('beforeend',`
    <div id="waMsgOverlay" style="position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center" onclick="if(event.target===this)this.remove()">
      <div style="background:var(--panel);border-radius:24px 24px 0 0;padding:24px;width:100%;max-width:480px;border-top:1px solid var(--line)">
        <h3 style="margin:0 0 16px">💬 Mensagem rápida — ${esc(c.loja||c.nome)}</h3>
        <div style="display:grid;gap:8px">
          ${msgs.map(m=>`<button class="btn ghost" style="text-align:left;padding:14px 16px" onclick="abrirWhatsApp('${num}','${encodeURIComponent(m.texto)}');$('waMsgOverlay').remove()">${m.label}</button>`).join('')}
        </div>
        <button class="btn ghost" style="width:100%;margin-top:10px" onclick="$('waMsgOverlay').remove()">✕ Fechar</button>
      </div>
    </div>`);
}

// ── MERCOS EXPORT ─────────────────────────────────────────────────
function openMercos(id){
  var c = state.clientes.find(function(x){return x.id===id});
  if(!c) return;
  var campos = [
    ['CNPJ *', c.cnpj||''],
    ['Razao Social *', c.razao_social||c.loja||''],
    ['Nome Fantasia', c.nome_fantasia||c.loja||''],
    ['Telefone *', c.whatsapp||''],
    ['E-mail *', c.email||''],
    ['Inscricao Estadual *', c.inscricao_estadual||'000000'],
    ['Instagram', c.instagram||''],
    ['CEP', c.cep||''],
    ['Endereco', c.endereco||''],
    ['Cidade', c.cidade||''],
    ['Estado', c.estado||''],
    ['Contato', c.nome||'']
  ];
  var faltando = campos.filter(function(f){return f[0].indexOf('*')>-1 && !f[1]}).map(function(f){return f[0].replace(' *','')});
  var html = '';
  html += '<div id="mercosOverlay" style="position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px">';
  html += '<div style="background:#12121b;border-radius:24px;padding:24px;width:100%;max-width:500px;border:1px solid rgba(255,255,255,.1);max-height:90vh;overflow-y:auto">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
  html += '<h3 style="margin:0;color:#fff">Exportar para Mercos</h3>';
  html += '<button onclick="this.parentNode.parentNode.parentNode.remove()" style="background:rgba(255,255,255,.1);border:0;color:#fff;border-radius:12px;width:36px;height:36px;cursor:pointer;font-size:16px">x</button>';
  html += '</div>';
  html += '<p style="color:#a8a8b8;font-size:13px;margin:0 0 14px">Toque no campo para copiar</p>';
  if(faltando.length){
    html += '<div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:14px;padding:12px;margin-bottom:14px;font-size:13px;color:#fca5a5">Faltando: ' + faltando.join(', ') + '</div>';
  } else {
    html += '<div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);border-radius:14px;padding:10px 14px;margin-bottom:14px;font-size:13px;color:#86efac">Todos os campos obrigatorios preenchidos!</div>';
  }
  for(var i=0;i<campos.length;i++){
    var label = campos[i][0];
    var valor = campos[i][1];
    var border = label.indexOf('*')>-1 ? 'rgba(168,85,247,.4)' : 'rgba(255,255,255,.1)';
    html += '<div onclick="copMercos(this)" data-val="' + String(valor).replace(/"/g,'&quot;') + '" style="background:rgba(255,255,255,.05);border:1px solid ' + border + ';border-radius:14px;padding:12px 14px;margin-bottom:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">';
    html += '<div><div style="font-size:11px;color:#a8a8b8">' + label + '</div>';
    html += '<div style="font-weight:600;color:#fff;margin-top:2px">' + (valor || '<span style="color:#6b7280;font-weight:400">nao preenchido</span>') + '</div></div>';
    if(valor) html += '<span style="color:#a8a8b8">copiar</span>';
    html += '</div>';
  }
  html += '</div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

function copMercos(el){
  var txt = el.getAttribute('data-val');
  if(!txt) return;
  if(navigator.clipboard){
    navigator.clipboard.writeText(txt).then(function(){toast('Copiado!')});
  } else {
    var t = document.createElement('textarea');
    t.value = txt; t.style.position='fixed'; t.style.opacity='0';
    document.body.appendChild(t); t.select();
    document.execCommand('copy'); document.body.removeChild(t);
    toast('Copiado!');
  }
}

// ── MODAL UTILS ───────────────────────────────────────────────────

function closeModal(){
  $('clientModal').className='modal';
  $('clientModal').innerHTML='';
}
