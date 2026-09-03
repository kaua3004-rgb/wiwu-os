const ETAPA_PROSPECT = '🎯 A prospectar';
const ETAPA_AGUARDANDO = '⏳ Aguardando resposta';
const ETAPA_RESPONDEU = '✅ Respondeu';
const ETAPA_NEGOCIACAO = '💰 Negociação';
const ETAPA_PERDIDO = '❌ Perdido';
let _abaProspeccao='prospectar';
let _mesFechados=todayISO().slice(0,7);

function atividadesPeriodo(mes=todayISO().slice(0,7), dia=null){
  const tiposContato=['Ligação','WhatsApp','Reunião','E-mail'];
  const ints=(state.interacoes||[]).filter(i=>{const data=i.data||i.created_at?.slice(0,10)||'';const periodo=dia?data===dia:data.slice(0,7)===mes;return periodo&&tiposContato.some(t=>(i.tipo||'').includes(t));});
  return {total:ints.length,ligacoes:ints.filter(i=>(i.tipo||'').includes('Ligação')).length,whatsapp:ints.filter(i=>(i.tipo||'').includes('WhatsApp')).length,reunioes:ints.filter(i=>(i.tipo||'').includes('Reunião')).length};
}

function prospeccao(aba=_abaProspeccao){
  _abaProspeccao=aba;
  const mapa={prospectar:ETAPA_PROSPECT,aguardando:ETAPA_AGUARDANDO,respondeu:ETAPA_RESPONDEU,negociacao:ETAPA_NEGOCIACAO,perdidos:ETAPA_PERDIDO};
  const atividades=atividadesPeriodo(), fechados=pedidosDoMes(_mesFechados);
  const contatosMes=(state.interacoes||[]).filter(i=>{const data=i.data||i.created_at?.slice(0,10)||'';return data.slice(0,7)===todayISO().slice(0,7)&&['Ligação','WhatsApp','Reunião','E-mail'].some(t=>(i.tipo||'').includes(t));});
  const clientesContatados=new Set(contatosMes.map(i=>i.cliente_id)).size;
  const clientesFechados=new Set(pedidosDoMes(todayISO().slice(0,7)).map(p=>p.cliente_id)).size;
  const conversao=clientesContatados?Math.round(clientesFechados/clientesContatados*100):0;
  const clientesEtapa=mapa[aba]?state.clientes.filter(c=>c.status===mapa[aba]):[];
  const tabs=[['prospectar','A prospectar'],['aguardando','Aguardando resposta'],['respondeu','Respondeu'],['negociacao','Negociação'],['fechados','Pedidos fechados'],['perdidos','Perdidos']];
  $('prospeccao').innerHTML=`
    <div class="topbar"><div class="hello"><h2>🎯 Prospecção</h2><p>Do primeiro contato ao pedido fechado</p></div><div class="row"><button class="btn ghost" onclick="ativarNotificacoes()">🔔 Ativar alertas</button><button class="btn" onclick="prospectForm()">+ Novo prospect</button></div></div>
    <div class="grid cards prospect-metrics"><div class="card metric"><small>Contatos no mês</small><strong>${atividades.total}</strong></div><div class="card metric"><small>Ligações</small><strong>${atividades.ligacoes}</strong></div><div class="card metric"><small>WhatsApp</small><strong>${atividades.whatsapp}</strong></div><div class="card metric"><small>Pedidos fechados</small><strong>${pedidosDoMes(todayISO().slice(0,7)).length}</strong></div><div class="card metric"><small>Conversão no mês</small><strong>${conversao}%</strong></div></div>
    <div class="tabs stage-tabs">${tabs.map(([id,label])=>`<button class="${aba===id?'active':''}" onclick="prospeccao('${id}')">${label}</button>`).join('')}</div>
    ${aba==='fechados'?pedidosFechadosView(fechados):`<div class="client-grid">${clientesEtapa.map(c=>prospectCard(c,aba)).join('')||'<div class="empty">Nenhum cliente nesta etapa.</div>'}</div>`}`;
}

function prospectCard(c,aba){
  const ultimo=(state.interacoes||[]).find(i=>i.cliente_id===c.id), motivo=aba==='perdidos'&&ultimo?.tipo==='❌ Perdido'?ultimo.texto:'';
  return `<div class="client-card prospect-card"><div onclick="openClient('${c.id}')"><h3>${esc(c.loja||c.nome)}</h3><div class="section-note">${esc(c.nome||'')} ${c.cidade?'• '+esc(c.cidade)+'-'+esc(c.estado||''):''}</div><div class="prospect-tags">${c.cnpj?`<span class="tag">CNPJ ${esc(c.cnpj)}</span>`:''}${c.origem?`<span class="tag green">${esc(c.origem)}</span>`:''}</div>${motivo?`<div class="loss-reason">${esc(motivo)}</div>`:''}</div><div class="prospect-actions">${acoesProspect(c,aba)}</div></div>`;
}

function acoesProspect(c,aba){
  if(aba==='prospectar') return `<button class="btn small" onclick="registrarContatoProspect('${c.id}','📞 Ligação')">📞 Liguei</button><button class="btn small ghost" onclick="registrarContatoProspect('${c.id}','💬 WhatsApp')">💬 WhatsApp</button>`;
  if(aba==='aguardando') return `<button class="btn small" onclick="marcarResposta('${c.id}')">✅ Respondeu</button><button class="btn small ghost" onclick="registrarContatoProspect('${c.id}','💬 WhatsApp')">🔁 Novo contato</button><button class="btn small danger" onclick="marcarPerdido('${c.id}')">Sem interesse</button>`;
  if(aba==='respondeu') return `<button class="btn small" onclick="iniciarNegociacao('${c.id}')">Começar negociação</button><button class="btn small danger" onclick="marcarPerdido('${c.id}')">Sem interesse</button>`;
  if(aba==='negociacao') return `<button class="btn small green" onclick="novoPedido('${c.id}')">📦 Fechei o pedido</button><button class="btn small danger" onclick="marcarPerdido('${c.id}')">Perdido</button>`;
  if(aba==='perdidos') return `<button class="btn small ghost" onclick="reativarProspect('${c.id}')">🔁 Tentar novamente</button>`;
  return '';
}

function prospectForm(){
  document.body.insertAdjacentHTML('beforeend',`<div id="prospectOverlay" class="quick-overlay" onclick="if(event.target===this)this.remove()"><div class="quick-dialog wide"><div class="modal-head"><div><h3 style="margin:0">Novo prospect</h3><p class="section-note">Cadastre agora e complete os dados durante a prospecção.</p></div><button class="x" onclick="$('prospectOverlay').remove()">✕</button></div><div class="formgrid"><div><label>Nome da loja *</label><input id="pr_loja"></div><div><label>Responsável</label><input id="pr_nome"></div><div><label>WhatsApp</label><input id="pr_whatsapp" type="tel"></div><div><label>Instagram</label><input id="pr_instagram" placeholder="@loja"></div><div class="full"><label>CNPJ (opcional)</label><div class="row"><input id="pr_cnpj" placeholder="00.000.000/0001-00"><button class="btn ghost" onclick="buscarCNPJProspect()">Buscar</button></div></div><div><label>Cidade</label><input id="pr_cidade"></div><div><label>Estado</label><input id="pr_estado" maxlength="2"></div><div><label>Origem</label><select id="pr_origem"><option>Instagram</option><option>Google</option><option>Indicação</option><option>Feira</option><option>Visita</option><option>Lista própria</option><option>Outro</option></select></div><div><label>Potencial</label><select id="pr_potencial"><option>Alto</option><option selected>Médio</option><option>Baixo</option></select></div><div class="full"><label>Observações</label><textarea id="pr_obs"></textarea></div></div><div class="actions"><button class="btn" onclick="salvarProspect()">Salvar prospect</button><button class="btn ghost" onclick="$('prospectOverlay').remove()">Cancelar</button></div></div></div>`);
}

async function buscarCNPJProspect(){const d=await buscarCNPJ($('pr_cnpj')?.value||'');if(!d){toast('❌ CNPJ não encontrado');return;}$('pr_loja').value=d.nome_fantasia||d.razao_social||'';$('pr_cidade').value=d.municipio||'';$('pr_estado').value=d.uf||'';toast('✅ Dados preenchidos pelo CNPJ');}
function normalizar(v){return (v||'').toLowerCase().replace(/\D/g,'');}

async function salvarProspect(){
  const loja=$('pr_loja')?.value?.trim();if(!loja){toast('⚠️ Informe o nome da loja');return;}
  const cnpj=normalizar($('pr_cnpj')?.value),wpp=normalizar($('pr_whatsapp')?.value),insta=($('pr_instagram')?.value||'').toLowerCase().replace('@','').trim();
  const duplicado=state.clientes.find(c=>(cnpj&&normalizar(c.cnpj)===cnpj)||(wpp&&normalizar(c.whatsapp)===wpp)||(insta&&(c.instagram||'').toLowerCase().replace('@','').trim()===insta));
  if(duplicado){toast(`⚠️ ${duplicado.loja||duplicado.nome} já está cadastrado`,5000);return;}
  const now=new Date().toISOString();
  const c={id:uuid(),loja,nome:$('pr_nome')?.value||'',whatsapp:$('pr_whatsapp')?.value||'',email:'',instagram:$('pr_instagram')?.value||'',cep:'',endereco:'',cidade:$('pr_cidade')?.value||'',estado:($('pr_estado')?.value||'').toUpperCase(),tipo_cliente:'novo',temperatura:'Morno',status:ETAPA_PROSPECT,tags:[],obs:$('pr_obs')?.value||'',proxacao:'Primeiro contato',proxdata:todayISO(),aniversario:'',cnpj:$('pr_cnpj')?.value||'',razao_social:'',nome_fantasia:'',inscricao_estadual:'',situacao_cadastral:'',qtd_lojas:'1',vendedores:'',aparelhos_mes:'',potencial:$('pr_potencial')?.value||'Médio',marcas:'',cat_mais_vendida:'',categorias:[],perfil:'',hobby:'',esposa:'',filhos:'',info_pessoal:'',contatos:[],created_at:now,updated_at:now,origem:$('pr_origem')?.value||'Manual'};
  state.clientes.unshift(c);await upsertRow('clientes',c);$('prospectOverlay')?.remove();toast('✅ Prospect cadastrado');prospeccao('prospectar');
}

async function registrarContatoProspect(id,tipo){
  const c=state.clientes.find(x=>x.id===id);if(!c)return;const respondeu=confirm(`${c.loja||c.nome} respondeu ao contato?`);
  const i={id:uuid(),cliente_id:id,tipo,texto:respondeu?'Cliente respondeu ao contato':'Contato realizado, ainda sem resposta',data:todayISO(),hora:new Date().toTimeString().slice(0,5),created_at:new Date().toISOString()};
  state.interacoes.unshift(i);c.status=respondeu?ETAPA_RESPONDEU:ETAPA_AGUARDANDO;c.updated_at=new Date().toISOString();await upsertRow('interacoes',i);await upsertRow('clientes',c);
  if(!respondeu){const dias=Math.max(1,parseInt(prompt('Lembrar de enviar nova mensagem em quantos dias?','2')||'2'));const d=new Date();d.setDate(d.getDate()+dias);const l={id:uuid(),cliente_id:id,cliente:c.loja||c.nome,titulo:`Enviar nova mensagem para ${c.loja||c.nome}`,data:d.toISOString().slice(0,10),hora:'09:00',prioridade:'Alta',feito:false,created_at:new Date().toISOString()};state.lembretes.unshift(l);await upsertRow('lembretes',l);}
  toast(respondeu?'✅ Resposta registrada':'🔔 Follow-up criado');prospeccao(respondeu?'respondeu':'aguardando');
}

async function mudarEtapaProspect(id,status,tipo,texto){const c=state.clientes.find(x=>x.id===id);if(!c)return;c.status=status;c.updated_at=new Date().toISOString();const i={id:uuid(),cliente_id:id,tipo,texto,data:todayISO(),hora:new Date().toTimeString().slice(0,5),created_at:new Date().toISOString()};state.interacoes.unshift(i);await upsertRow('clientes',c);await upsertRow('interacoes',i);}
async function marcarResposta(id){await mudarEtapaProspect(id,ETAPA_RESPONDEU,'✅ Resposta','Cliente respondeu');prospeccao('respondeu');}
async function iniciarNegociacao(id){await mudarEtapaProspect(id,ETAPA_NEGOCIACAO,'💰 Negociação','Negociação iniciada');prospeccao('negociacao');}
function marcarPerdido(id){const c=state.clientes.find(x=>x.id===id);if(!c)return;const motivos=['Sem interesse','Preço','Já trabalha com outra marca','Pedido mínimo','Não respondeu','Momento inadequado','Outro'];document.body.insertAdjacentHTML('beforeend',`<div id="perdidoOverlay" class="quick-overlay" onclick="if(event.target===this)this.remove()"><div class="quick-dialog"><h3>Marcar como perdido</h3><p class="section-note">${esc(c.loja||c.nome)}</p><label>Motivo</label><select id="perdidoMotivo" onchange="$('perdidoOutro').style.display=this.value==='Outro'?'block':'none'">${motivos.map(m=>`<option>${m}</option>`).join('')}</select><input id="perdidoOutro" placeholder="Descreva o motivo" style="display:none;margin-top:10px"><div class="actions"><button class="btn danger" onclick="confirmarPerdido('${id}')">Mover para perdidos</button><button class="btn ghost" onclick="$('perdidoOverlay').remove()">Cancelar</button></div></div></div>`);}
async function confirmarPerdido(id){const selecionado=$('perdidoMotivo')?.value||'Sem interesse',motivo=selecionado==='Outro'?$('perdidoOutro')?.value?.trim():selecionado;if(!motivo){toast('⚠️ Informe o motivo');return;}await mudarEtapaProspect(id,ETAPA_PERDIDO,'❌ Perdido',motivo);$('perdidoOverlay')?.remove();prospeccao('perdidos');}
async function reativarProspect(id){await mudarEtapaProspect(id,ETAPA_PROSPECT,'🔁 Reativação','Prospect reativado');prospeccao('prospectar');}

function pedidosFechadosView(pedidos){const total=pedidos.reduce((s,p)=>s+parseFloat(p.valor||0),0);return `<div class="card"><div class="section-heading"><div><h3 class="section-title" style="margin:0">Pedidos fechados</h3><div class="section-note">${pedidos.length} pedido${pedidos.length!==1?'s':''} • ${fmtMoney(total)}</div></div><input type="month" value="${_mesFechados}" onchange="_mesFechados=this.value;prospeccao('fechados')" style="max-width:180px"></div><div class="quick-list">${pedidos.map(p=>{const c=state.clientes.find(x=>x.id===p.cliente_id);return `<button onclick="openClient('${p.cliente_id}','pedidos')"><b>${esc(c?.loja||'Cliente')}</b><small>${fmt(p.data)} • ${fmtMoney(p.valor)}</small></button>`}).join('')||'<div class="empty">Nenhum pedido fechado neste mês.</div>'}</div></div>`;}

function posvenda(){
  const pedidos=pedidosValidos(),hoje=new Date(todayISO()+'T12:00:00');
  const lista=state.clientes.map(c=>{const ps=pedidos.filter(p=>p.cliente_id===c.id).sort((a,b)=>(b.data||'').localeCompare(a.data||''));if(!ps.length)return null;const ultimo=ps[0],dias=Math.floor((hoje-new Date(ultimo.data+'T12:00:00'))/86400000);return{c,ultimo,dias}}).filter(Boolean).sort((a,b)=>b.dias-a.dias);
  $('posvenda').innerHTML=`<div class="topbar"><div class="hello"><h2>❤️ Pós-venda e recompra</h2><p>Acompanhe reposição e clientes sem comprar</p></div></div><div class="grid cards" style="margin-bottom:20px"><div class="card metric"><small>Até 29 dias</small><strong>${lista.filter(x=>x.dias<30).length}</strong></div><div class="card metric"><small>30+ dias</small><strong>${lista.filter(x=>x.dias>=30&&x.dias<45).length}</strong></div><div class="card metric"><small>45+ dias</small><strong>${lista.filter(x=>x.dias>=45&&x.dias<60).length}</strong></div><div class="card metric"><small>60+ dias</small><strong>${lista.filter(x=>x.dias>=60).length}</strong></div></div><div class="client-grid">${lista.map(x=>`<div class="client-card"><div onclick="openClient('${x.c.id}')"><h3>${esc(x.c.loja||x.c.nome)}</h3><div class="section-note">Último pedido: ${fmt(x.ultimo.data)} • ${fmtMoney(x.ultimo.valor)}</div><div class="recompra-status ${x.dias>=60?'late':x.dias>=30?'attention':'good'}">${x.dias} dias sem comprar</div></div><div class="prospect-actions"><button class="btn small ghost" onclick="registrarPosVenda('${x.c.id}')">Registrar pós-venda</button><button class="btn small" onclick="novoPedido('${x.c.id}')">+ Recompra</button></div></div>`).join('')||'<div class="empty">Nenhum pedido registrado.</div>'}</div>`;
}
async function registrarPosVenda(id){const texto=prompt('Como foi o pós-venda?','Cliente contatado para acompanhar os produtos');if(!texto)return;await mudarEtapaProspect(id,'❤️ Pós-venda / Recompra','⭐ Pós-venda',texto);toast('✅ Pós-venda registrado');posvenda();}
async function ativarNotificacoes(){if(!('Notification'in window)){toast('Este navegador não permite notificações');return;}const p=await Notification.requestPermission();toast(p==='granted'?'🔔 Alertas ativados':'⚠️ Permissão não concedida');if(p==='granted')notificarLembretes();}
function notificarLembretes(){if(!('Notification'in window)||Notification.permission!=='granted')return;const hoje=todayISO();state.lembretes.filter(l=>!l.feito&&(l.data||hoje)<=hoje).forEach(l=>{const key=`wiwu_notificado_${hoje}_${l.id}`;if(localStorage.getItem(key))return;new Notification('WIWU OS • Follow-up',{body:`${l.titulo}${l.cliente?' — '+l.cliente:''}`});localStorage.setItem(key,'1');});}
