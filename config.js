// ── WIWU OS V5 – Config ──────────────────────────────────────────
const SUPABASE_URL  = 'https://kmhisjjhiiqsgzepfcyb.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_hmYIXAD4L7YDDqfFCmREBQ_wbTo4Y8r';
const STORE         = 'wiwu_os_v5';

// Categorias WIWU oficiais
const CATEGORIAS = [
  {id:'iphone',icon:'📱',label:'iPhone',minimo:10,itens:'Película frontal, película de câmera e capa'},
  {id:'energia_basica',icon:'🔌',label:'Energia básica',minimo:10,itens:'Fontes, kits e cabos'},
  {id:'energia_avancada',icon:'⚡',label:'Energia avançada',minimo:6,itens:'Power bank e base 3 em 1'},
  {id:'ipad',icon:'📲',label:'iPad',minimo:15,itens:'Capas, Pencil, películas, suportes, hubs e teclado'},
  {id:'macbook',icon:'💻',label:'MacBook',minimo:10,itens:'Cases, pastas, películas, mouse e hub'},
  {id:'apple_watch',icon:'⌚',label:'Apple Watch',minimo:5,itens:'Pulseiras, carregador e película'},
  {id:'mochilas',icon:'🎒',label:'Mochilas',minimo:3,itens:'Osun, Elite S, Minimalist e Warriors'},
  {id:'necessaires',icon:'🧳',label:'Necessaires',minimo:3,itens:'Minimalist, digital e sem digital'},
  {id:'fones',icon:'🎧',label:'Fones de ouvido',minimo:6,itens:'Headset, Airbuds, AirPods, com fio e OWS'},
  {id:'conectividade',icon:'📡',label:'Conectividade',minimo:5,itens:'iTag, flash drive, carteira e suporte'},
  {id:'fotografia',icon:'📷',label:'Fotografia',minimo:6,itens:'Tripés, gimbal, microfone e suporte de pescoço'},
  {id:'veicular',icon:'🚗',label:'Veicular',minimo:4,itens:'Carregadores e suportes'},
];

const CATEGORIAS_LEGADAS={fonte:'energia_basica',cabos:'energia_basica',inducao:'energia_avancada',powerbank:'energia_avancada',pelicula:'iphone',capas:'iphone',pasta:'macbook',bolsa:'mochilas',mochila:'mochilas',necessaire:'necessaires',fone:'fones',smartwatch:'apple_watch',foto:'fotografia',carro:'veicular'};
function normalizarCategorias(lista=[]){ return [...new Set(lista.map(id=>CATEGORIAS_LEGADAS[id]||id).filter(id=>CATEGORIAS.some(c=>c.id===id)))]; }

const PIPELINE_DEFAULT = [
  '🎪 Feira','📞 Primeiro Contato','💬 WhatsApp',
  '🤝 Reunião','📄 Proposta','💰 Negociação',
  '📦 Pedido','🏆 Cliente Ativo','❤️ Pós-venda'
];

const PERFIS = ['Conservador','Analítico','Relacional','Dominante'];
const INTERACAO_TIPOS = ['📞 Ligação','💬 WhatsApp','🤝 Reunião','📧 E-mail','📦 Pedido','📄 Proposta','🎪 Visita','📝 Outro'];
const RMA_MOTIVOS = ['Defeito de fabricação','Produto errado','Avaria no transporte','Insatisfação','Troca por modelo diferente','Outro'];

const COMISSAO = {
  novo:     [{min:0, max:4, pct:1.0},{min:5, max:6, pct:1.5},{min:7, max:99, pct:2.0}],
  carteira: [{min:0, max:3, pct:0},{min:4, max:5, pct:1.0},{min:6, max:99, pct:1.5}],
  bonusFonte: 20,
  pctGlobal: 1,
  globalMeses: {}
};

let state = {
  clientes: [],
  lembretes: [],
  scripts: [
    {id:'s1', titulo:'Abordagem de Feira', texto:'Prazer, sou o Kauã, representante da WIWU Brasil. Vocês já conheciam a WIWU ou é o primeiro contato?\n\nAntes de falar produto, gosto de entender a operação para ver se faz sentido para os dois lados.'},
    {id:'s2', titulo:'Objeção: Está caro', texto:'Entendo. A ideia da WIWU não é competir pelo produto mais barato da vitrine, mas pelo produto que o cliente pega na mão, percebe valor e compra. Nosso giro é maior justamente por isso.'},
    {id:'s3', titulo:'Primeiro contato WhatsApp', texto:'Olá [Nome]! Tudo bem? Aqui é o Kauã da WIWU Brasil. Foi um prazer te conhecer! Conforme conversamos, vou te enviar nosso catálogo. Qualquer dúvida estou à disposição! 🙌'},
    {id:'s4', titulo:'Follow-up pós-feira', texto:'Olá [Nome]! Passando para saber se teve chance de ver o catálogo. Tem alguma linha que chamou atenção? Posso montar uma proposta personalizada para sua loja. 🎯'},
    {id:'s5', titulo:'Script pós-reunião', texto:'Olá [Nome]! Foi ótimo conversar hoje. Conforme alinhado, vou preparar a proposta com [produto] e envio até [data]. Qualquer dúvida pode me chamar!'},
  ],
  interacoes: [],
  pedidos: [],
  rmas: [],
  concorrentes: [],
  pipeline: [...PIPELINE_DEFAULT],
  interesses: ['iPhone','iPad','MacBook','Energia','Áudio','Pencil','Apple Watch','Cases','Películas'],
  metas: { contatosDia:15, ligacoesDia:10, contatosMes:40, faturamentoMes:50000 },
  comissao: JSON.parse(JSON.stringify(COMISSAO)),
  pedidoDetalhes: {},
  registros: {},
  tags: ['VIP','Indicação','Pagamento difícil','Feira SP 2026','Potencial alto','Inativo'],
};

// ── Supabase ──────────────────────────────────────────────────────
let sb = null, cloud = false;

async function cloudLoad(){
  if(!sb) return;
  let ok = true;
  try {
    const tables = ['clientes','lembretes','scripts','interacoes','pedidos','rmas','concorrentes'];
    for(const t of tables){
      const locais = Array.isArray(state[t]) ? [...state[t]] : [];
      const {data, error} = await sb.from(t).select('*').order('created_at',{ascending:false});
      if(error){ ok=false; console.warn('cloudLoad erro em '+t, error.message); continue; }
      if(data && t==='pedidos'){
        const remotosPorId=new Map(data.map(item=>[item.id,item]));
        const recuperar=[];
        locais.forEach(item=>{
          if(!remotosPorId.has(item.id) || item.updated_at){
            remotosPorId.set(item.id,item);
            recuperar.push(item);
          }
        });
        state[t]=[...remotosPorId.values()].sort((a,b)=>(b.created_at||b.data||'').localeCompare(a.created_at||a.data||''));
        if(recuperar.length){
          const {error:recError}=await sb.from('pedidos').upsert(recuperar.map(pedidoParaNuvem),{onConflict:'id'});
          if(recError){ ok=false; console.warn('Falha ao recuperar pedidos locais:',recError.message); }
          else toast(`✅ ${recuperar.length} pedido${recuperar.length!==1?'s':''} recuperado${recuperar.length!==1?'s':''} e salvo${recuperar.length!==1?'s':''} na nuvem`,6000);
        }
      }else if(data) state[t] = data;
    }
    const {data:cfg,error:cfgError} = await sb.from('config').select('*').eq('key','state').maybeSingle();
    if(cfgError) ok=false;
    if(cfg && cfg.value){
      const parsed = JSON.parse(cfg.value||'{}');
      ['pipeline','metas','comissao','pedidoDetalhes','registros','tags','interesses'].forEach(k=>{ if(parsed[k]) state[k]=parsed[k]; });
    }
  } catch(e){ ok=false; console.warn('cloudLoad error',e); }
  localSave();
  cloud=ok;
  return ok;
}

async function cloudSave(){
  localSave();
  if(!sb) return;
  try {
    const cfg = {pipeline:state.pipeline,metas:state.metas,comissao:state.comissao,pedidoDetalhes:state.pedidoDetalhes||{},registros:state.registros,tags:state.tags,interesses:state.interesses};
    const {error} = await sb.from('config').upsert({key:'state',value:JSON.stringify(cfg)},{onConflict:'key'});
    if(error) console.warn('cloudSave erro config:', error.message);
  } catch(e){ console.warn('cloudSave error',e); }
}

async function upsertRow(table, row){
  localSave();
  if(!sb) return;
  try {
    const payload=table==='pedidos'?pedidoParaNuvem(row):row;
    const {error} = await sb.from(table).upsert(payload,{onConflict:'id'});
    if(error){ cloud=false; console.warn('upsertRow erro em '+table+':', error.message); toast('⚠️ Salvo neste aparelho, mas a nuvem falhou',5000); return false; }
    console.log('✅ Salvo em '+table+':', row.id); return true;
  } catch(e){ cloud=false; console.warn('upsertRow error',e); toast('⚠️ Salvo neste aparelho, mas a nuvem falhou',5000); return false; }
}

function pedidoParaNuvem(p){
  return {
    id:p.id,cliente_id:p.cliente_id,tipo_cliente:p.tipo_cliente,valor:p.valor,
    caixas_fonte:p.caixas_fonte,categorias:p.categorias||[],obs:p.obs||'',
    comissao:p.comissao,comissao_pct:p.comissao_pct,bonus_fonte:p.bonus_fonte,
    data:p.data,created_at:p.created_at||new Date().toISOString()
  };
}

async function deleteRow(table, id){
  localSave();
  if(!sb) return;
  try {
    const {error} = await sb.from(table).delete().eq('id',id);
    if(error) console.warn('deleteRow erro:', error.message);
  } catch(e){}
}

// ── Local Storage ─────────────────────────────────────────────────
function localSave(){
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch(e){}
}
function localLoad(){
  try {
    const d = JSON.parse(localStorage.getItem(STORE)||'{}');
    Object.keys(state).forEach(k=>{ if(d[k]!==undefined) state[k]=d[k]; });
  } catch(e){}
}

// ── Utils ─────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const uuid = () => crypto.randomUUID();
const todayISO = () => new Date().toISOString().slice(0,10);
const fmt = d => d ? new Date(d+'T12:00:00').toLocaleDateString('pt-BR') : '';
const fmtMoney = v => 'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2});
const esc = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function tempTag(t){ return t==='Quente'?'hot':t==='Morno'?'warm':'cold'; }

let _toastTimer;
function toast(msg, dur=3000){
  const el=$('toast'); if(!el) return;
  el.textContent=msg; el.className='toast show';
  clearTimeout(_toastTimer);
  _toastTimer=setTimeout(()=>el.className='toast',dur);
}

function calcComissao(pedido){
  const tipo = pedido.tipo_cliente || 'novo';
  const cats = normalizarCategorias(pedido.categorias||[]).length;
  const valor = parseFloat(pedido.valor||0);
  const fontes = parseInt(pedido.caixas_fonte||0);
  const tabela = state.comissao || COMISSAO;
  const regras = tabela[tipo] || tabela.novo || COMISSAO.novo;
  const regra = regras.slice().reverse().find(r => cats >= r.min) || regras[0];
  const percentual = Number(regra.pct||0);
  const pct = percentual / 100;
  const bonusUnitario = Number(tabela.bonusFonte ?? COMISSAO.bonusFonte);
  return { pct: percentual, comissaoBase: valor*pct, bonusFonte: fontes*bonusUnitario, total: valor*pct + fontes*bonusUnitario };
}

function detalhesPedido(id){ return state.pedidoDetalhes?.[id]||{}; }
function fretePedido(p){ return Math.max(0,Number(detalhesPedido(p.id).frete||0)); }
function valorMetaPedido(p){ return Number(p.valor||0)+fretePedido(p); }

async function buscarCNPJ(cnpj){
  const c = cnpj.replace(/\D/g,'');
  if(c.length!==14){ toast('⚠️ CNPJ inválido'); return null; }
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${c}`);
    if(!r.ok) return null;
    return await r.json();
  } catch(e){ return null; }
}

async function buscarCEP(cep){
  const c = cep.replace(/\D/g,'');
  if(c.length!==8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
    const d = await r.json();
    return d.erro ? null : d;
  } catch(e){ return null; }
}

const IE_SITES = {
  SP:'https://www.sefaz.sp.gov.br/CCICMS/ConsultaCadastro',
  MG:'https://www.fazenda.mg.gov.br/empresas/cadastro_de_contribuintes',
  RJ:'https://www.fazenda.rj.gov.br/sefaz/content/conn/UCMServer/uuid/dDocName%3AWCC190076',
  RS:'https://www.sefaz.rs.gov.br/Site/MontaDuvidas.aspx?al=l_rsfaqirs_pesqcad',
  PR:'https://www.fazenda.pr.gov.br/Pagina/Cadastro-de-Contribuintes',
  SC:'https://www.sef.sc.gov.br/servicos/servico/38',
  BA:'https://www.sefaz.ba.gov.br/contribuinte/cad_icms/',
  GO:'https://www.sefaz.go.gov.br/CCICMS/',
  PE:'https://www.sefaz.pe.gov.br/Servicos/Contribuintes/',
  CE:'https://cagece.com.br/',
};
function abrirConsultaIE(estado, cnpj){
  const url = IE_SITES[estado] || 'https://www.sintegra.gov.br/';
  window.open(url, '_blank');
  toast(`🔍 Abrindo consulta de IE para ${estado}`);
}

function exportBackup(){
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `wiwu_os_backup_${todayISO()}.json`;
  a.click(); URL.revokeObjectURL(url);
  toast('💾 Backup exportado!');
}

function abrirWhatsApp(num, textoEncoded){
  const url = 'whatsapp://send?phone=' + num + '&text=' + textoEncoded;
  const fallback = 'https://wa.me/' + num + '?text=' + textoEncoded;
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  setTimeout(()=>{ document.body.removeChild(iframe); }, 500);
  window.location.href = url;
  setTimeout(()=>{ window.open(fallback,'_blank'); }, 1500);
}

function copiarTexto(texto, label=''){
  navigator.clipboard.writeText(texto)
    .then(()=>toast(`📋 ${label||'Texto'} copiado!`))
    .catch(()=>{
      const el=document.createElement('textarea');
      el.value=texto; el.style.position='fixed'; el.style.opacity='0';
      document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
      toast(`📋 ${label||'Texto'} copiado!`);
    });
}

function diasSemContato(c){
  const ref = c.updated_at || c.created_at;
  if(!ref) return 0;
  return Math.floor((new Date() - new Date(ref)) / 86400000);
}
