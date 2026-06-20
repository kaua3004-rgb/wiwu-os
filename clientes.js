// ── CLIENTES ──────────────────────────────────────────────────────

function clientes(q=''){
  const list = q
    ? state.clientes.filter(c=>[c.loja,c.nome,c.cidade,c.whatsapp,c.cnpj].join(' ').toLowerCase().includes(q.toLowerCase()))
    : state.clientes;

  $('clientes').innerHTML=`
    <div class="topbar">
      <div class="hello"><h2>👥 Clientes <span style="font-size:18px;color:var(--muted)">(${list.length})</span></h2></div>
      <div class="row">
        <button class="btn" onclick="clientForm()">+ Novo cliente</button>
        <button class="btn ghost" onclick="exportClientes()">⬇️ Exportar</button>
      </div>
    </div>
    <div class="toolbar">
      <input placeholder="🔍 Buscar por nome, loja, cidade, CNPJ..." oninput="clientes(this.value)" value="${esc(q)}">
      <select onchange="clientesFiltro(this.value)" id="filtro_status">
        <option value="">Todos os status</option>
        ${state.pipeline.map(s=>`<option>${esc(s)}</option>`).join('')}
      </select>
      <select onchange="clientesFiltroTipo(this.value)">
        <option value="">Novo + Carteira</option>
        <option value="novo">🆕 Novos</option>
        <option value="carteira">👥 Carteira</option>
      </select>
    </div>
    <div class="client-grid">
      ${list.map(c=>clientCard(c)).join('')||'<div class="empty">Nenhum cliente encontrado.</div>'}
    </div>`;
}

function clientCard(c){
  const dias = diasSemContato(c);
  const alerta = dias>=30?'🔴':dias>=15?'🟠':dias>=7?'🟡':'';
  const cats = (c.categorias||[]).length;
  return `
    <div class="client-card" onclick="openClient('${c.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <h3>${esc(c.loja||c.nome)}</h3>
        ${alerta?`<span title="${dias} dias sem contato">${alerta}</span>`:''}
      </div>
      <div style="font-size:13px;color:var(--muted);margin-bottom:10px">
        ${esc(c.nome||'')}${c.cidade?` • ${esc(c.cidade)}-${esc(c.estado||'')}`:''} 
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">
        <span class="tag ${tempTag(c.temperatura)}">${esc(c.temperatura||'Morno')}</span>
        <span class="tag ${c.tipo_cliente==='carteira'?'carteira':'novo'}">${c.tipo_cliente==='carteira'?'👥 Carteira':'🆕 Novo'}</span>
        ${c.status?`<span class="tag">${esc(c.status)}</span>`:''}
        ${(c.tags||[]).slice(0,2).map(t=>`<span class="tag green">${esc(t)}</span>`).join('')}
      </div>
      <div style="font-size:12px;color:var(--muted);display:flex;gap:14px">
        <span>📦 ${cats} categoria${cats!==1?'s':''}</span>
        ${c.whatsapp?`<span>📱 ${esc(c.whatsapp)}</span>`:''}
      </div>
    </div>`;
}

function clientesFiltro(status){
  const list = status ? state.clientes.filter(c=>c.status===status) : state.clientes;
  const grid = document.querySelector('.client-grid');
  if(grid) grid.innerHTML = list.map(c=>clientCard(c)).join('')||'<div class="empty">Nenhum cliente.</div>';
}
function clientesFiltroTipo(tipo){
  const list = tipo ? state.clientes.filter(c=>(c.tipo_cliente||'novo')===tipo) : state.clientes;
  const grid = document.querySelector('.client-grid');
  if(grid) grid.innerHTML = list.map(c=>clientCard(c)).join('')||'<div class="empty">Nenhum cliente.</div>';
}

// ── FORMULÁRIO DE CLIENTE ─────────────────────────────────────────
function clientForm(id=null){
  const c = id ? state.clientes.find(x=>x.id===id) : {};
  const title = id ? 'Editar cliente' : 'Novo cliente';
  $('clientModal').innerHTML=`
    <div class="modal-card">
      <div class="modal-head">
        <h2>${title}</h2>
        <button class="x" onclick="closeModal()">✕</button>
      </div>
      <div class="tabs">
        <button class="active" onclick="cfTab(this,'basico','${id||''}')">🏢 Básico</button>
        <button onclick="cfTab(this,'fiscal','${id||''}')">📋 Fiscal</button>
        <button onclick="cfTab(this,'comercial','${id||''}')">💼 Comercial</button>
        <button onclick="cfTab(this,'relacionamento','${id||''}')">❤️ Relacionamento</button>
      </div>
      <div id="cfBody">${cfBasico(c)}</div>
      <div class="actions" style="margin-top:16px">
        <button class="btn" onclick="saveClient('${id||''}')">💾 Salvar</button>
        ${id?`<button class="btn danger" onclick="deleteClient('${id}')">🗑️ Excluir</button>`:''}
      </div>
    </div>`;
  $('clientModal').className='modal show';
}

function cfTab(btn, tab, id){
  btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const c = id ? (state.clientes.find(x=>x.id===id)||{}) : {};
  $('cfBody').innerHTML = tab==='basico'?cfBasico(c):tab==='fiscal'?cfFiscal(c):tab==='comercial'?cfComercial(c):cfRelacionamento(c);
}

function cfBasico(c={}){
  const cache = typeof _cnpjCache !== 'undefined' ? _cnpjCache : {};
  return `
  <div class="formgrid">
    <div><label>Tipo de cliente *</label>
      <select id="cf_tipo">
        <option value="novo" ${(c.tipo_cliente||'novo')==='novo'?'selected':''}>🆕 Novo cliente</option>
        <option value="carteira" ${c.tipo_cliente==='carteira'?'selected':''}>👥 Carteira</option>
      </select>
    </div>
    <div><label>Temperatura</label>
      <select id="cf_temp">
        ${['Quente','Morno','Frio'].map(t=>`<option ${c.temperatura===t?'selected':''}>${t}</option>`).join('')}
      </select>
    </div>
    <div><label>Nome da loja *</label><input id="cf_loja" value="${esc(c.loja||cache.loja||'')}"></div>
    <div><label>Nome do comprador *</label><input id="cf_nome" value="${esc(c.nome||'')}"></div>
    <div><label>WhatsApp</label><input id="cf_whatsapp" value="${esc(c.whatsapp||'')}" type="tel"></div>
    <div><label>E-mail</label><input id="cf_email" value="${esc(c.email||'')}" type="email" placeholder="email@loja.com.br"></div>
    <div><label>Instagram</label><input id="cf_instagram" value="${esc(c.instagram||'')}" placeholder="@loja"></div>
    <div><label>CEP</label><input id="cf_cep" value="${esc(c.cep||cache.cep||'')}" oninput="cfBuscaCep(this.value)" placeholder="00000-000"></div>
    <div><label>Status no pipeline</label>
      <select id="cf_status">
        ${state.pipeline.map(s=>`<option ${c.status===s?'selected':''}>${esc(s)}</option>`).join('')}
      </select>
    </div>
    <div class="full"><label>Endereço</label><input id="cf_endereco" value="${esc(c.endereco||cache.endereco||'')}"></div>
    <div><label>Cidade</label><input id="cf_cidade" value="${esc(c.cidade||cache.cidade||'')}"></div>
    <div><label>Estado</label><input id="cf_estado" value="${esc(c.estado||cache.estado||'SP')}"></div>
    <div class="full"><label>Tags</label><input id="cf_tags" value="${esc((c.tags||[]).join(', '))}" placeholder="VIP, Indicação, Feira SP..."></div>
    <div class="full"><label>Observações gerais</label><textarea id="cf_obs">${esc(c.obs||'')}</textarea></div>
    <div><label>Próxima ação</label><input id="cf_proxacao" value="${esc(c.proxacao||'')}"></div>
    <div><label>Data da próxima ação</label><input id="cf_proxdata" type="date" value="${esc(c.proxdata||'')}"></div>
    <div><label>Aniversário</label><input id="cf_aniversario" type="date" value="${esc(c.aniversario||'')}"></div>
  </div>`;}

function cfFiscal(c={}){return `
  <div class="formgrid">
    <div class="full"><label>CNPJ</label>
      <div style="display:flex;gap:8px">
        <input id="cf_cnpj" value="${esc(c.cnpj||'')}" placeholder="00.000.000/0001-00" style="flex:1">
        <button class="btn small ghost" onclick="cfBuscaCNPJ()">🔍 Buscar</button>
      </div>
    </div>
    <div id="cnpj_preview" class="full"></div>
    <div><label>Razão Social</label><input id="cf_razao" value="${esc(c.razao_social||'')}"></div>
    <div><label>Nome Fantasia</label><input id="cf_fantasia" value="${esc(c.nome_fantasia||'')}"></div>
    <div><label>Inscrição Estadual</label>
      <div style="display:flex;gap:8px">
        <input id="cf_ie" value="${esc(c.inscricao_estadual||'')}" placeholder="Número da IE" style="flex:1">
        <button class="btn small ghost" onclick="abrirConsultaIE(document.getElementById('cf_estado2')?.value||'SP', document.getElementById('cf_cnpj')?.value)" title="Consultar no site do estado">🌐</button>
      </div>
    </div>
    <div><label>Estado (para IE)</label><input id="cf_estado2" value="${esc(c.estado||'SP')}" placeholder="SP"></div>
    <div><label>Situação Cadastral</label><input id="cf_situacao" value="${esc(c.situacao_cadastral||'')}" readonly style="color:var(--muted)"></div>
    <div><label>Site</label><input id="cf_site" value="${esc(c.site||'')}" placeholder="www.loja.com.br"></div>
  </div>`;}

function cfComercial(c={}){return `
  <div class="formgrid">
    <div><label>Qtd de lojas</label><input id="cf_lojas" type="number" value="${esc(c.qtd_lojas||'1')}" min="1"></div>
    <div><label>Vendedores</label>
      <select id="cf_vendedores">
        ${['Não informado','Só o dono','1 vendedor','2 vendedores','3 a 5 vendedores','Mais de 5'].map(v=>`<option ${c.vendedores===v?'selected':''}>${v}</option>`).join('')}
      </select>
    </div>
    <div><label>Aparelhos vendidos/mês</label><input id="cf_aparelhos" value="${esc(c.aparelhos_mes||'')}"></div>
    <div><label>Potencial de compra</label>
      <select id="cf_potencial">
        ${['Baixo','Médio','Alto','Muito alto'].map(v=>`<option ${c.potencial===v?'selected':''}>${v}</option>`).join('')}
      </select>
    </div>
    <div class="full"><label>Marcas que já trabalha</label><input id="cf_marcas" value="${esc(c.marcas||'')}" placeholder="Baseus, GShield, X-One..."></div>
    <div class="full"><label>Categoria mais vendida</label><input id="cf_catmais" value="${esc(c.cat_mais_vendida||'')}"></div>
  </div>
  <div style="margin-top:16px">
    <label>Categorias WIWU que este cliente compra</label>
    <div class="cat-grid" style="margin-top:8px">
      ${CATEGORIAS.map(cat=>`
        <div class="cat-item ${(c.categorias||[]).includes(cat.id)?'selected':''}" onclick="toggleCatForm('${cat.id}',this)" data-cat="${cat.id}">
          <div class="cat-icon">${cat.icon}</div>
          <div style="font-size:12px">${cat.label}</div>
        </div>`).join('')}
    </div>
  </div>`;}

function cfRelacionamento(c={}){return `
  <div class="formgrid">
    <div><label>Perfil do cliente</label>
      <select id="cf_perfil">
        ${PERFIS.map(v=>`<option ${c.perfil===v?'selected':''}>${v}</option>`).join('')}
      </select>
    </div>
    <div><label>Hobby</label><input id="cf_hobby" value="${esc(c.hobby||'')}"></div>
    <div><label>Esposa / relacionamento</label><input id="cf_esposa" value="${esc(c.esposa||'')}"></div>
    <div><label>Filhos</label><input id="cf_filhos" value="${esc(c.filhos||'')}"></div>
    <div class="full"><label>Informações pessoais importantes</label><textarea id="cf_pessoal">${esc(c.info_pessoal||'')}</textarea></div>
  </div>
  <div style="margin-top:16px">
    <label>Múltiplos contatos da loja</label>
    <div id="cf_contatos">
      ${(c.contatos||[{nome:'',cargo:'',whatsapp:''}]).map((ct,i)=>`
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:end">
          <div><label>Nome</label><input class="ct_nome" value="${esc(ct.nome||'')}"></div>
          <div><label>Cargo</label><input class="ct_cargo" value="${esc(ct.cargo||'')}"></div>
          <div><label>WhatsApp</label><input class="ct_wpp" value="${esc(ct.whatsapp||'')}"></div>
          <button class="btn small ghost" onclick="this.closest('div').parentElement.remove()" style="margin-bottom:0">✕</button>
        </div>`).join('')}
    </div>
    <button class="btn small ghost" onclick="addContato()" style="margin-top:8px">+ Contato</button>
  </div>`;}

function addContato(){
  $('cf_contatos').insertAdjacentHTML('beforeend',`
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:end">
      <div><label>Nome</label><input class="ct_nome"></div>
      <div><label>Cargo</label><input class="ct_cargo"></div>
      <div><label>WhatsApp</label><input class="ct_wpp"></div>
      <button class="btn small ghost" onclick="this.closest('div').parentElement.remove()">✕</button>
    </div>`);
}

function toggleCatForm(id, el){ el.classList.toggle('selected'); }

// Cache temporário dos dados do CNPJ para preencher outras abas
let _cnpjCache = {};

async function cfBuscaCNPJ(){
  const cnpj = $('cf_cnpj')?.value;
  if(!cnpj){ toast('⚠️ Digite o CNPJ primeiro'); return; }
  toast('🔍 Buscando CNPJ...');
  const d = await buscarCNPJ(cnpj);
  if(!d){ toast('❌ CNPJ não encontrado na Receita Federal'); return; }

  // Preencher campos da aba Fiscal (visíveis agora)
  if($('cf_razao'))    $('cf_razao').value    = d.razao_social||'';
  if($('cf_fantasia')) $('cf_fantasia').value  = d.nome_fantasia||'';
  if($('cf_situacao')) $('cf_situacao').value  = d.descricao_situacao_cadastral||'Ativa';

  // Guardar no cache para preencher aba Básico quando abrir
  const end = [d.logradouro,d.numero,d.complemento,d.bairro].filter(Boolean).join(', ');
  _cnpjCache = {
    loja:     d.nome_fantasia || d.razao_social || '',
    cep:      (d.cep||'').replace(/\D/g,''),
    endereco: end,
    cidade:   d.municipio||'',
    estado:   d.uf||'',
  };

  // Preencher campos da aba Básico SE estiverem visíveis
  if($('cf_loja')&&!$('cf_loja').value)    $('cf_loja').value    = _cnpjCache.loja;
  if($('cf_cep'))     $('cf_cep').value     = _cnpjCache.cep;
  if($('cf_endereco')) $('cf_endereco').value = _cnpjCache.endereco;
  if($('cf_cidade'))  $('cf_cidade').value  = _cnpjCache.cidade;
  if($('cf_estado'))  $('cf_estado').value  = _cnpjCache.estado;

  // Mostrar resumo na aba fiscal
  const preview = document.getElementById('cnpj_preview');
  if(preview) preview.innerHTML = `
    <div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);border-radius:14px;padding:12px;margin-top:12px;font-size:13px">
      ✅ <strong>${d.razao_social}</strong><br>
      <span style="color:var(--muted)">
        ${d.nome_fantasia?`Nome fantasia: ${d.nome_fantasia}<br>`:''}
        📍 ${end}${d.municipio?`, ${d.municipio}-${d.uf}`:''}<br>
        CEP: ${d.cep||''} • Situação: ${d.descricao_situacao_cadastral||'Ativa'}<br>
        ${d.email?`📧 ${d.email}<br>`:''}
        ${d.ddd_telefone_1?`📞 (${d.ddd_telefone_1}) ${d.telefone_1||''}`:''}
      </span>
      <div style="margin-top:8px;color:#fde68a;font-size:12px">⚠️ Inscrição Estadual: clique em 🌐 para consultar no site do estado</div>
    </div>`;

  toast('✅ CNPJ encontrado! Dados preenchidos.');
}

async function cfBuscaCep(val){
  const cep = (val||'').replace(/\D/g,'');
  if(cep.length<8) return;
  const d = await buscarCEP(cep);
  if(!d) return;
  if($('cf_endereco')&&!$('cf_endereco').value) $('cf_endereco').value=[d.logradouro,d.bairro].filter(Boolean).join(', ');
  if($('cf_cidade')) $('cf_cidade').value=d.localidade||'';
  if($('cf_estado')) $('cf_estado').value=d.uf||'';
  toast('📍 Endereço preenchido!');
}

async function saveClient(id){
  const loja=$('cf_loja')?.value?.trim();
  const nome=$('cf_nome')?.value?.trim();
  if(!loja&&!nome){ toast('⚠️ Preencha o nome da loja'); return; }

  // Coletar categorias selecionadas
  const cats=[...document.querySelectorAll('.cat-item.selected')].map(el=>el.dataset.cat);

  // Coletar contatos
  const ctNomes=[...document.querySelectorAll('.ct_nome')].map(el=>el.value);
  const ctCargos=[...document.querySelectorAll('.ct_cargo')].map(el=>el.value);
  const ctWpps=[...document.querySelectorAll('.ct_wpp')].map(el=>el.value);
  const contatos=ctNomes.map((n,i)=>({nome:n,cargo:ctCargos[i],whatsapp:ctWpps[i]})).filter(c=>c.nome||c.whatsapp);

  const now = new Date().toISOString();
  const existing = id ? state.clientes.find(x=>x.id===id) : null;
  const cats_anterior = existing?.categorias||[];

  const c = {
    id: id||uuid(),
    loja: $('cf_loja')?.value||'', nome: $('cf_nome')?.value||'',
    whatsapp:$('cf_whatsapp')?.value||'', email:$('cf_email')?.value||'', instagram:$('cf_instagram')?.value||'',
    cep:$('cf_cep')?.value||'', endereco:$('cf_endereco')?.value||'',
    cidade:$('cf_cidade')?.value||'', estado:$('cf_estado')?.value||'',
    tipo_cliente:$('cf_tipo')?.value||'novo', temperatura:$('cf_temp')?.value||'Morno',
    status:$('cf_status')?.value||state.pipeline[0],
    tags:($('cf_tags')?.value||'').split(',').map(t=>t.trim()).filter(Boolean),
    obs:$('cf_obs')?.value||'', proxacao:$('cf_proxacao')?.value||'',
    proxdata:$('cf_proxdata')?.value||'', aniversario:$('cf_aniversario')?.value||'',
    // Fiscal
    cnpj:$('cf_cnpj')?.value||'', razao_social:$('cf_razao')?.value||'',
    nome_fantasia:$('cf_fantasia')?.value||'', inscricao_estadual:$('cf_ie')?.value||'',
    situacao_cadastral:$('cf_situacao')?.value||'', site:$('cf_site')?.value||'',
    // Comercial
    qtd_lojas:$('cf_lojas')?.value||'1', vendedores:$('cf_vendedores')?.value||'',
    aparelhos_mes:$('cf_aparelhos')?.value||'', potencial:$('cf_potencial')?.value||'',
    marcas:$('cf_marcas')?.value||'', cat_mais_vendida:$('cf_catmais')?.value||'',
    categorias: cats, cats_anterior,
    // Relacionamento
    perfil:$('cf_perfil')?.value||'', hobby:$('cf_hobby')?.value||'',
    esposa:$('cf_esposa')?.value||'', filhos:$('cf_filhos')?.value||'',
    info_pessoal:$('cf_pessoal')?.value||'', contatos,
    created_at: existing?.created_at||now, updated_at: now,
    origem: existing?.origem||'Manual',
  };

  if(id){ const i=state.clientes.findIndex(x=>x.id===id); state.clientes[i]=c; }
  else state.clientes.unshift(c);

  await upsertRow('clientes',c);
  toast('✅ Cliente salvo!');
  closeModal();
  clientes();
}

async function deleteClient(id){
  const c = state.clientes.find(x=>x.id===id);
  const nome = c?.loja || c?.nome || 'este cliente';
  if(!confirm(`Excluir ${nome}?

Também serão removidos pedidos, lembretes, histórico e RMA vinculados a ele.`)) return;

  const pedidos = state.pedidos.filter(x=>x.cliente_id===id).map(x=>x.id);
  const lembretes = state.lembretes.filter(x=>x.cliente_id===id || x.cliente===nome).map(x=>x.id);
  const interacoes = state.interacoes.filter(x=>x.cliente_id===id).map(x=>x.id);
  const rmas = state.rmas.filter(x=>x.cliente_id===id).map(x=>x.id);

  state.clientes = state.clientes.filter(x=>x.id!==id);
  state.pedidos = state.pedidos.filter(x=>x.cliente_id!==id);
  state.lembretes = state.lembretes.filter(x=>x.cliente_id!==id && x.cliente!==nome);
  state.interacoes = state.interacoes.filter(x=>x.cliente_id!==id);
  state.rmas = state.rmas.filter(x=>x.cliente_id!==id);

  await deleteRow('clientes', id);
  for(const pid of pedidos) await deleteRow('pedidos', pid);
  for(const lid of lembretes) await deleteRow('lembretes', lid);
  for(const iid of interacoes) await deleteRow('interacoes', iid);
  for(const rid of rmas) await deleteRow('rmas', rid);
  await cloudSave();

  toast('🗑️ Cliente e vínculos excluídos');
  closeModal();
  clientes();
}

function exportClientes(){
  const csv=['Loja,Nome,WhatsApp,Cidade,Estado,Status,Temperatura,Tipo,Categorias,CNPJ']
    .concat(state.clientes.map(c=>[
      c.loja,c.nome,c.whatsapp,c.cidade,c.estado,
      c.status,c.temperatura,c.tipo_cliente,
      (c.categorias||[]).join('|'),c.cnpj
    ].map(v=>`"${(v||'').replace(/"/g,'""')}"`).join(','))).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`clientes_wiwu_${todayISO()}.csv`;
  a.click();
  toast('⬇️ Exportado!');
}
