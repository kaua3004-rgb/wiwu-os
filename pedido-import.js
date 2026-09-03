// Importador de pedidos Mercos/PDF — WIWU OS V5.3
let _pedidoImportado=null;
const soDigitos=v=>String(v||'').replace(/\D/g,'');
function brNumero(v){return Number(String(v||0).replace(/R\$|\s/g,'').replace(/\./g,'').replace(',','.'))||0}
function linhaValor(t,r){return brNumero(t.match(new RegExp(r+'\\s*:?\\s*R\\$?\\s*([\\d.]+,\\d{2})','i'))?.[1])}

async function textoPdfArquivo(file){
  if(!window.pdfjsLib)throw new Error('Leitor de PDF não carregou. Atualize a página.');
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise,paginas=[];
  for(let n=1;n<=pdf.numPages;n++){
    const tc=await (await pdf.getPage(n)).getTextContent(),linhas=[];
    tc.items.forEach(item=>{const y=Math.round(item.transform[5]);let l=linhas.find(x=>Math.abs(x.y-y)<=2);if(!l){l={y,itens:[]};linhas.push(l)}l.itens.push({x:item.transform[4],s:item.str})});
    paginas.push(linhas.sort((a,b)=>b.y-a.y).map(l=>l.itens.sort((a,b)=>a.x-b.x).map(i=>i.s).join(' ').replace(/\s+/g,' ').trim()).join('\n'));
  }
  return paginas.join('\n');
}
function categoriaProduto(nome){
  const t=String(nome||'').toLowerCase();
  if(/fonte|carregador.*parede|cabo|kit.*carreg/.test(t))return'energia_basica';
  if(/power.?bank|base.*3.*1|carregador.*indu[cç]/.test(t))return'energia_avancada';
  if(/ipad|pencil/.test(t))return'ipad'; if(/macbook|mouse|hub/.test(t))return'macbook';
  if(/watch|pulseira/.test(t))return'apple_watch'; if(/mochila|backpack|osun|warrior/.test(t))return'mochilas';
  if(/necessaire/.test(t))return'necessaires'; if(/fone|headset|airbud|airpod|ows/.test(t))return'fones';
  if(/itag|flash.?drive|carteira/.test(t))return'conectividade'; if(/trip[eé]|gimbal|microfone|pesco[cç]o/.test(t))return'fotografia';
  if(/veicular|automot|carro/.test(t))return'veicular'; if(/iphone|pel[ií]cula|camera|c[aâ]mera|capa|case/.test(t))return'iphone'; return'';
}
function extrairItensPedido(texto){
  const ls=texto.split(/\n/).map(x=>x.trim()).filter(Boolean),itens=[];
  for(let i=0;i<ls.length;i++){
    const comDescricao=ls[i].match(/^(\d+)\s+(\d+)\s+(.+?\D.+?)\s+(\d+)\s+(?:UN|PC|PÇ)\b/i);
    const semDescricao=ls[i].match(/^(\d+)\s+(\d+)\s+(\d+)\s+(?:UN|PC|PÇ)\b/i);
    const m=comDescricao||semDescricao;if(!m)continue;
    const quantidade=Number(comDescricao?m[4]:m[3]);let nome=comDescricao?m[3].trim():'';
    if((!categoriaProduto(nome)||nome.length<8)&&i>0&&!/^(20W|30W|USB|#|C[oó]digo|Produto)$/i.test(ls[i-1])&&!/Preço L[ií]quido|Subtotal/i.test(ls[i-1]))nome=(ls[i-1]+' '+nome).trim();
    if(i+1<ls.length&&!/^\d+\s+\d+/.test(ls[i+1])&&!/Qtde\. Total|Total \(/i.test(ls[i+1]))nome+=' '+ls[i+1];
    itens.push({item:Number(m[1]),codigo:m[2],produto:nome.trim(),quantidade,categoria:categoriaProduto(nome)});
  }return itens;
}
function analisarPedidoMercos(texto){
  const cnpjs=[...texto.matchAll(/CNPJ:\s*([\d./-]+)/gi)].map(m=>m[1]),tels=[...texto.matchAll(/Telefone:\s*([()+\d\s-]+)/gi)].map(m=>m[1].trim()),emails=[...texto.matchAll(/E-mail:\s*([^\s]+)/gi)].map(m=>m[1]),itens=extrairItensPedido(texto),qtd={};
  itens.forEach(i=>{if(i.categoria)qtd[i.categoria]=(qtd[i.categoria]||0)+i.quantidade});
  const dt=texto.match(/Data de Emiss[aã]o:[\s\S]{0,80}?(\d{2})\/(\d{2})\/(\d{4})/i);
  return{numero:texto.match(/Pedido\s*N[º°o.]?\s*(\d+)/i)?.[1]||'',cliente:texto.match(/Cliente:\s*(.+?)(?:\s{2,}|\n|Nome Fantasia:)/i)?.[1]?.trim()||'',fantasia:texto.match(/Nome Fantasia:\s*(.+)/i)?.[1]?.split(/\n/)[0]?.trim()||'',cnpj:cnpjs.at(-1)||'',telefone:tels.at(-1)||'',email:emails.at(-1)||'',endereco:texto.match(/Endere[cç]o:\s*(.+)/i)?.[1]?.split(/\n/)[0]?.trim()||'',cidade:texto.match(/Cidade:\s*(.+?)(?:\s{2,}|\n|Estado:)/i)?.[1]?.trim()||'',estado:texto.match(/Estado:\s*(.+)/i)?.[1]?.split(/\n/)[0]?.trim()||'',data:dt?`${dt[3]}-${dt[2]}-${dt[1]}`:todayISO(),produtos:linhaValor(texto,'Valor total em produtos'),frete:linhaValor(texto,'Valor do frete'),total:linhaValor(texto,'Valor total(?! em produtos)'),itens,quantidades:qtd,categorias:CATEGORIAS.filter(c=>(qtd[c.id]||0)>=c.minimo).map(c=>c.id)};
}
function abrirImportadorPedido(){document.body.insertAdjacentHTML('beforeend',`<div id="importPedidoOverlay" class="quick-overlay" onclick="if(event.target===this)this.remove()"><div class="quick-dialog wide"><div class="modal-head"><div><h3 style="margin:0">📄 Importar pedido</h3><p class="section-note">Envie o PDF. Confira e corrija tudo antes de salvar.</p></div><button class="x" onclick="$('importPedidoOverlay').remove()">✕</button></div><input id="arquivoPedido" type="file" accept="application/pdf,.pdf" onchange="lerPedidoImportado(this.files[0])"><div id="importPedidoConteudo" class="empty" style="margin-top:16px">Nenhum arquivo selecionado.</div></div></div>`)}
async function lerPedidoImportado(file){if(!file)return;const a=$('importPedidoConteudo');a.innerHTML='⏳ Lendo o pedido...';try{_pedidoImportado=analisarPedidoMercos(await textoPdfArquivo(file));if(!_pedidoImportado.numero||!_pedidoImportado.produtos)throw new Error('Não reconheci o número ou o valor dos produtos.');mostrarRevisaoPedido()}catch(e){a.innerHTML=`<div class="empty">⚠️ ${esc(e.message)}<br><small>Você ainda pode usar “Adicionar venda”.</small></div>`}}
function mostrarRevisaoPedido(){
  const d=_pedidoImportado,existente=state.clientes.find(c=>soDigitos(c.cnpj)===soDigitos(d.cnpj));
  $('importPedidoConteudo').innerHTML=`<div style="text-align:left"><div class="formgrid"><div><label>Número do pedido</label><input id="imp_numero" value="${esc(d.numero)}"></div><div><label>Data</label><input id="imp_data" type="date" value="${d.data}"></div><div class="full"><label>Cliente</label><input id="imp_cliente" value="${esc(d.fantasia||d.cliente)}"></div><div><label>CNPJ</label><input id="imp_cnpj" value="${esc(d.cnpj)}"></div><div><label>Telefone</label><input id="imp_tel" value="${esc(d.telefone)}"></div><div><label>Produtos (R$)</label><input id="imp_produtos" type="number" step=".01" value="${d.produtos}"></div><div><label>Frete (R$)</label><input id="imp_frete" type="number" step=".01" value="${d.frete}"></div><div><label>Tipo</label><select id="imp_tipo"><option value="novo">🆕 Novo</option><option value="carteira">👥 Carteira</option></select></div><div><label>Caixas de fonte</label><input id="imp_caixas" type="number" min="0" value="0"></div></div>
  <div style="margin-top:14px"><b>${d.itens.length} itens reconhecidos</b>${d.itens.map(i=>`<div class="section-note">${i.quantidade}x ${esc(i.produto)}${i.categoria?' • '+esc(CATEGORIAS.find(c=>c.id===i.categoria)?.label||''):''}</div>`).join('')}</div>
  <label style="margin-top:14px">Categorias qualificadas</label><div class="cat-grid" style="margin-top:8px">${CATEGORIAS.map(c=>`<div class="cat-item ${d.categorias.includes(c.id)?'selected':''}" data-cat="${c.id}" onclick="this.classList.toggle('selected')"><div class="cat-icon">${c.icon}</div><div style="font-size:11px">${c.label}</div><small style="font-size:9px;color:var(--muted)">${d.quantidades[c.id]||0}/${c.minimo}</small></div>`).join('')}</div>
  <div style="margin-top:14px;padding:12px;border-radius:12px;background:rgba(34,197,94,.1)">${existente?`✅ Cliente encontrado: <b>${esc(existente.loja||existente.nome)}</b>`:'➕ O cliente será cadastrado. Instagram é opcional.'}</div><div class="actions" style="margin-top:16px"><button class="btn" onclick="salvarPedidoImportado()">💾 Confirmar e salvar</button><button class="btn ghost" onclick="$('importPedidoOverlay').remove()">Cancelar</button></div></div>`;
}
async function salvarPedidoImportado(){
  const d=_pedidoImportado;if(!d)return;const numero=$('imp_numero').value.trim(),cnpj=$('imp_cnpj').value.trim();
  if(state.pedidos.some(p=>String(detalhesPedido(p.id).numero||'')===numero&&soDigitos(state.clientes.find(c=>c.id===p.cliente_id)?.cnpj)===soDigitos(cnpj))){toast('⚠️ Este pedido já foi importado',5000);return}
  let cliente=state.clientes.find(c=>soDigitos(c.cnpj)===soDigitos(cnpj));const now=new Date().toISOString();
  if(!cliente){cliente={id:uuid(),loja:$('imp_cliente').value.trim(),nome:d.cliente,whatsapp:$('imp_tel').value,email:d.email,instagram:'',cnpj,razao_social:d.cliente,nome_fantasia:d.fantasia,endereco:d.endereco,cidade:d.cidade,estado:d.estado,tipo_cliente:$('imp_tipo').value,temperatura:'Morno',status:'❤️ Pós-venda / Recompra',categorias:[],tags:[],contatos:[],created_at:now,updated_at:now,origem:'Pedido importado'};state.clientes.unshift(cliente);await upsertRow('clientes',cliente)}
  const cats=[...document.querySelectorAll('#importPedidoConteudo .cat-item.selected')].map(e=>e.dataset.cat),valor=Math.max(0,Number($('imp_produtos').value)),frete=Math.max(0,Number($('imp_frete').value)),tipo=$('imp_tipo').value,data=$('imp_data').value||todayISO(),caixas=Math.max(0,parseInt($('imp_caixas').value||0)),com=calcComissao({tipo_cliente:tipo,valor,caixas_fonte:caixas,categorias:cats,data});
  const p={id:uuid(),cliente_id:cliente.id,tipo_cliente:tipo,valor,caixas_fonte:caixas,categorias:cats,obs:`Pedido nº ${numero}`,comissao:com.total,comissao_pct:com.pct,bonus_fonte:com.bonusFonte,data,created_at:now,updated_at:now};state.pedidos.unshift(p);state.pedidoDetalhes={...(state.pedidoDetalhes||{}),[p.id]:{numero,frete,valor_total:valor+frete,itens:d.itens,updated_at:now}};
  cliente.categorias=[...new Set([...normalizarCategorias(cliente.categorias||[]),...cats])];cliente.tipo_cliente=tipo;cliente.status='❤️ Pós-venda / Recompra';cliente.updated_at=now;await upsertRow('clientes',cliente);await upsertRow('pedidos',p);await cloudSave();$('importPedidoOverlay').remove();toast(`✅ Pedido ${numero} importado. Comissão: ${fmtMoney(com.total)}`,6000);faturamento();
}
