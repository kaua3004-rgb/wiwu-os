// ── GESTÃO DE CAIXAS FECHADAS ─────────────────────────────────────
// Torna o card "Caixas fechadas" clicável e permite editar a quantidade
// de caixas em cada pedido do mês, salvando no Supabase e no aparelho.

function abrirCaixasFechadas(mes){
  const pedidos=pedidosDoMes(mes).sort((a,b)=>(b.data||'').localeCompare(a.data||''));
  const total=pedidos.reduce((s,p)=>s+parseInt(p.caixas_fonte||0,10),0);
  const nomeMes=new Date(mes+'-02T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});

  document.body.insertAdjacentHTML('beforeend',`
    <div id="caixasFechadasOverlay" class="quick-overlay" onclick="if(event.target===this)this.remove()">
      <div class="quick-dialog wide">
        <div class="modal-head">
          <div>
            <h3 style="margin:0">📦 Caixas fechadas</h3>
            <p class="section-note">${nomeMes} • <strong id="caixasTotalModal">${total}</strong> caixa${total!==1?'s':''}</p>
          </div>
          <button class="x" onclick="$('caixasFechadasOverlay').remove()">✕</button>
        </div>

        <div style="padding:12px 14px;margin-bottom:12px;border-radius:14px;background:rgba(124,58,237,.10);border:1px solid rgba(168,85,247,.22);font-size:13px;color:var(--muted)">
          Altere a quantidade de caixas de fonte de cada pedido. O bônus será recalculado automaticamente.
        </div>

        <div class="quick-list" style="gap:10px">
          ${pedidos.map(p=>{
            const c=state.clientes.find(x=>x.id===p.cliente_id);
            const qtd=parseInt(p.caixas_fonte||0,10);
            return `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.025)">
              <div style="min-width:0">
                <b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c?.loja||c?.nome||'Cliente')}</b>
                <small style="display:block;color:var(--muted);margin-top:3px">${fmt(p.data)} • ${fmtMoney(p.valor)}</small>
              </div>
              <div style="display:flex;align-items:center;gap:7px">
                <button class="btn ghost small" style="width:34px;height:34px;padding:0" onclick="ajustarQtdCaixa('${p.id}',-1)">−</button>
                <input class="caixa-qtd-input" data-pedido-id="${p.id}" type="number" min="0" step="1" value="${qtd}" oninput="atualizarTotalCaixasModal()" style="width:72px;text-align:center;font-weight:800;font-size:16px;padding:8px 6px">
                <button class="btn ghost small" style="width:34px;height:34px;padding:0" onclick="ajustarQtdCaixa('${p.id}',1)">+</button>
              </div>
            </div>`;
          }).join('')||'<div class="empty">Nenhum pedido registrado neste mês.</div>'}
        </div>

        <div class="actions" style="margin-top:16px">
          ${pedidos.length?`<button class="btn" onclick="salvarCaixasFechadas('${mes}')">💾 Salvar quantidades</button>`:''}
          <button class="btn ghost" onclick="$('caixasFechadasOverlay').remove()">Fechar</button>
        </div>
      </div>
    </div>`);
}

function ajustarQtdCaixa(pedidoId,delta){
  const input=document.querySelector(`.caixa-qtd-input[data-pedido-id="${pedidoId}"]`);
  if(!input) return;
  const atual=Math.max(0,parseInt(input.value||0,10));
  input.value=Math.max(0,atual+delta);
// ── GESTÃO DE CAIXAS FECHADAS ─────────────────────────────────────
// Torna o card "Caixas fechadas" clicável e permite editar a quantidade
// de caixas em cada pedido do mês, salvando no Supabase e no aparelho.


function abrirCaixasFechadas(mes){
  const pedidos=pedidosDoMes(mes).sort((a,b)=>(b.data||'').localeCompare(a.data||''));
  const total=pedidos.reduce((s,p)=>s+parseInt(p.caixas_fonte||0,10),0);
  const nomeMes=new Date(mes+'-02T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'});


  document.body.insertAdjacentHTML('beforeend',`
    <div id="caixasFechadasOverlay" class="quick-overlay" onclick="if(event.target===this)this.remove()">
      <div class="quick-dialog wide">
        <div class="modal-head">
          <div>
            <h3 style="margin:0">📦 Caixas fechadas</h3>
            <p class="section-note">${nomeMes} • <strong id="caixasTotalModal">${total}</strong> caixa${total!==1?'s':''}</p>
          </div>
          <button class="x" onclick="$('caixasFechadasOverlay').remove()">✕</button>
        </div>
        <div style="padding:12px 14px;margin-bottom:12px;border-radius:14px;background:rgba(124,58,237,.10);border:1px solid rgba(168,85,247,.22);font-size:13px;color:var(--muted)">
          Altere a quantidade de caixas de fonte de cada pedido. O bônus será recalculado automaticamente.
        </div>
        <div class="quick-list" style="gap:10px">
          ${pedidos.map(p=>{
            const c=state.clientes.find(x=>x.id===p.cliente_id);
            const qtd=parseInt(p.caixas_fonte||0,10);
            return `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.025)">
              <div style="min-width:0">
                <b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c?.loja||c?.nome||'Cliente')}${p.obs?` — Pedido ${esc(p.obs)}`:''}</b>
                <small style="display:block;color:var(--muted);margin-top:3px">${fmt(p.data)} • ${fmtMoney(p.valor)}</small>
              </div>
              <div style="display:flex;align-items:center;gap:7px">
                <button class="btn ghost small" style="width:34px;height:34px;padding:0" onclick="ajustarQtdCaixa('${p.id}',-1)">−</button>
                <input class="caixa-qtd-input" data-pedido-id="${p.id}" type="number" min="0" step="1" value="${qtd}" oninput="atualizarTotalCaixasModal()" style="width:72px;text-align:center;font-weight:800;font-size:16px;padding:8px 6px">
                <button class="btn ghost small" style="width:34px;height:34px;padding:0" onclick="ajustarQtdCaixa('${p.id}',1)">+</button>
              </div>
            </div>`;
          }).join('')||'<div class="empty">Nenhum pedido registrado neste mês.</div>'}
        </div>
        <div class="actions" style="margin-top:16px">
          ${pedidos.length?`<button class="btn" onclick="salvarCaixasFechadas('${mes}')">💾 Salvar quantidades</button>`:''}
          <button class="btn ghost" onclick="$('caixasFechadasOverlay').remove()">Fechar</button>
        </div>
      </div>
    </div>`);
}


function ajustarQtdCaixa(pedidoId,delta){
  const input=document.querySelector(`.caixa-qtd-input[data-pedido-id="${pedidoId}"]`);
  if(!input) return;
  const atual=Math.max(0,parseInt(input.value||0,10));
  input.value=Math.max(0,atual+delta);
  atualizarTotalCaixasModal();
}


function atualizarTotalCaixasModal(){
  const total=[...document.querySelectorAll('.caixa-qtd-input')]
    .reduce((s,input)=>s+Math.max(0,parseInt(input.value||0,10)),0);
  const el=$('caixasTotalModal');
  if(el) el.textContent=total;
}


async function salvarCaixasFechadas(mes){
  const inputs=[...document.querySelectorAll('.caixa-qtd-input')];
  let alterados=0;


  for(const input of inputs){
    const pedido=state.pedidos.find(p=>p.id===input.dataset.pedidoId);
    if(!pedido) continue;
    const novaQtd=Math.max(0,parseInt(input.value||0,10));
    const atual=Math.max(0,parseInt(pedido.caixas_fonte||0,10));
    if(novaQtd===atual) continue;


    pedido.caixas_fonte=novaQtd;
    pedido.updated_at=new Date().toISOString();
    const calculo=calcComissao(pedido);
    pedido.bonus_fonte=calculo.bonusFonte;
    pedido.comissao=calculo.total;
    pedido.comissao_pct=calculo.pct;
    await upsertRow('pedidos',pedido);
    alterados++;
  }


  localSave();
  await cloudSave();
  $('caixasFechadasOverlay')?.remove();
  faturamento();
  toast(alterados?`✅ ${alterados} pedido${alterados!==1?'s':''} atualizado${alterados!==1?'s':''}`:'✅ Nenhuma alteração necessária');
}


// Aplica o comportamento clicável ao card depois que a tela de faturamento renderiza.
const _faturamentoComCaixasBase = faturamento;
faturamento = function(){
  _faturamentoComCaixasBase();
  const mes=_mesFaturamento||todayISO().slice(0,7);
  const cards=[...document.querySelectorAll('#faturamento .card.metric')];
  const card=cards.find(el=>el.querySelector('small')?.textContent?.includes('Caixas fechadas'));
  if(card){
    card.classList.add('metric-button');
    card.style.cursor='pointer';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.onclick=()=>abrirCaixasFechadas(mes);
    card.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();abrirCaixasFechadas(mes);} };
    const hint=card.querySelector('.metric-hint');
    if(hint) hint.textContent='Clique para visualizar e editar';
  }
};  atualizarTotalCaixasModal();
}

function atualizarTotalCaixasModal(){
  const total=[...document.querySelectorAll('.caixa-qtd-input')]
    .reduce((s,input)=>s+Math.max(0,parseInt(input.value||0,10)),0);
  const el=$('caixasTotalModal');
  if(el) el.textContent=total;
}

async function salvarCaixasFechadas(mes){
  const inputs=[...document.querySelectorAll('.caixa-qtd-input')];
  let alterados=0;

  for(const input of inputs){
    const pedido=state.pedidos.find(p=>p.id===input.dataset.pedidoId);
    if(!pedido) continue;
    const novaQtd=Math.max(0,parseInt(input.value||0,10));
    const atual=Math.max(0,parseInt(pedido.caixas_fonte||0,10));
    if(novaQtd===atual) continue;

    pedido.caixas_fonte=novaQtd;
    pedido.updated_at=new Date().toISOString();
    const calculo=calcComissao(pedido);
    pedido.bonus_fonte=calculo.bonusFonte;
    pedido.comissao=calculo.total;
    pedido.comissao_pct=calculo.pct;
    await upsertRow('pedidos',pedido);
    alterados++;
  }

  localSave();
  await cloudSave();
  $('caixasFechadasOverlay')?.remove();
  faturamento();
  toast(alterados?`✅ ${alterados} pedido${alterados!==1?'s':''} atualizado${alterados!==1?'s':''}`:'✅ Nenhuma alteração necessária');
}

// Aplica o comportamento clicável ao card depois que a tela de faturamento renderiza.
const _faturamentoComCaixasBase = faturamento;
faturamento = function(){
  _faturamentoComCaixasBase();
  const mes=_mesFaturamento||todayISO().slice(0,7);
  const cards=[...document.querySelectorAll('#faturamento .card.metric')];
  const card=cards.find(el=>el.querySelector('small')?.textContent?.includes('Caixas fechadas'));
  if(card){
    card.classList.add('metric-button');
    card.style.cursor='pointer';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.onclick=()=>abrirCaixasFechadas(mes);
    card.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();abrirCaixasFechadas(mes);} };
    const hint=card.querySelector('.metric-hint');
    if(hint) hint.textContent='Clique para visualizar e editar';
  }
};
