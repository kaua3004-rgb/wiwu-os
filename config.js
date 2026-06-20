// ── WIWU OS V5 – Config ──────────────────────────────────────────
const SUPABASE_URL  = 'https://kmhisjjhiiqsgzepfcyb.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_hmYIXAD4L7YDDqfFCmREBQ_wbTo4Y8r';
const STORE         = 'wiwu_os_v5';

// Categorias WIWU oficiais
const CATEGORIAS = [
  {id:'iphone',    icon:'📱', label:'Linha iPhone'},
  {id:'ipad',      icon:'📲', label:'Linha iPad'},
  {id:'macbook',   icon:'💻', label:'Linha MacBook'},
  {id:'fonte',     icon:'🔌', label:'Fontes / Energia'},
  {id:'inducao',   icon:'⚡', label:'Carregador Indução'},
  {id:'powerbank', icon:'🔋', label:'Power Bank'},
  {id:'cabos',     icon:'🔗', label:'Cabos'},
  {id:'pelicula',  icon:'🛡️', label:'Películas'},
  {id:'capas',     icon:'📦', label:'Cases / Capas'},
  {id:'mochila',   icon:'🎒', label:'Mochilas'},
  {id:'pasta',     icon:'💼', label:'Pastas MacBook'},
  {id:'bolsa',     icon:'👜', label:'Bolsas'},
  {id:'necessaire',icon:'🧳', label:'Nécessaire'},
  {id:'fone',      icon:'🎧', label:'Fones de Ouvido'},
  {id:'smartwatch',icon:'⌚', label:'Smart Watch'},
  {id:'foto',      icon:'📷', label:'Foto e Vídeo (Gimbal/Tripé)'},
  {id:'carro',     icon:'🚗', label:'Acessórios para Carro'},
];

// Pipeline padrão
const PIPELINE_DEFAULT = [
  '🎪 Feira','📞 Primeiro Contato','💬 WhatsApp',
  '🤝 Reunião','📄 Proposta','💰 Negociação',
  '📦 Pedido','🏆 Cliente Ativo','❤️ Pós-venda'
];

// Perfis de cliente
const PERFIS = ['Conservador','Analítico','Relacional','Dominante'];

// Tipos de interação
const INTERACAO_TIPOS = ['📞 Ligação','💬 WhatsApp','🤝 Reunião','📧 E-mail','📦 Pedido','📄 Proposta','🎪 Visita','📝 Outro'];

// Motivos RMA
const RMA_MOTIVOS = ['Defeito de fabricação','Produto errado','Avaria no transporte','Insatisfação','Troca por modelo diferente','Outro'];

// Regras de comissão
const COMISSAO = {
  novo:     [{min:0, max:4, pct:1.0},{min:5, max:6, pct:1.5},{min:7, max:99, pct:2.0}],
  carteira: [{min:0, max:3, pct:0},{min:4, max:5, pct:1.0},{min:6, max:99, pct:1.5}],
  bonusFonte: 20 // R$ por caixa
};

// State global
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
  metas: {
    contatosDia: 15,
    ligacoesDia: 10,
    contatosMes: 40,
    faturamentoMes: 50000,
  },
  registros: {},
  tags: ['VIP','Indicação','Pagamento difícil','Feira SP 2026','Potencial alto','Inativo'],
};

// ── Supabase ──────────────────────────────────────────────────────
let sb = null, cloud = false;

async function initCloud(){
  try {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    cloud = true;
    await cloudLoad();
    toast('☁️ Conectado à nuvem');
  } catch(e){ cloud = false; }
}

async function cloudLoad(){
  if(!sb) return;
  try {
    const tables = ['clientes','lembretes','scripts','interacoes','pedidos','rmas','concorrentes'];
    for(const t of tables){
      const {data} = await sb.from(t).select('*').order('created_at',{ascending:false});
      if(data) state[t] = data;
    }
    // Config
    const {data:cfg} = await sb.from('config').select('*').eq('key','state').single();
    if(cfg){
      const parsed = JSON.parse(cfg.value||'{}');
      ['pipeline','metas','registros','tags','interesses'].forEach(k=>{ if(parsed[k]) state[k]=parsed[k]; });
    }
  } catch(e){ console.warn('cloudLoad error',e); }
}

async function cloudSave(){
  localSave();
  if(!sb) return;
  try {
    const cfg = {pipeline:state.pipeline,metas:state.metas,registros:state.registros,tags:state.tags,interesses:state.interesses};
    await sb.from('config').upsert({key:'state',value:JSON.stringify(cfg)},{onConflict:'key'});
  } catch(e){ console.warn('cloudSave error',e); }
}

async function upsertRow(table, row){
  localSave();
  if(!sb) return;
  try { await sb.from(table).upsert(row,{onConflict:'id'}); } catch(e){}
}

async function deleteRow(table, id){
  localSave();
  if(!sb) return;
  try { await sb.from(table).delete().eq('id',id); } catch(e){}
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
  const cats = (pedido.categorias||[]).length;
  const valor = parseFloat(pedido.valor||0);
  const fontes = parseInt(pedido.caixas_fonte||0);
  const regras = COMISSAO[tipo] || COMISSAO.novo;
  const regra = regras.slice().reverse().find(r => cats >= r.min) || regras[0];
  const pct = regra.pct / 100;
  const comissaoBase = valor * pct;
  const bonusFonte = fontes * COMISSAO.bonusFonte;
  return { pct: regra.pct, comissaoBase, bonusFonte, total: comissaoBase + bonusFonte };
}

// Buscar CNPJ
async function buscarCNPJ(cnpj){
  const c = cnpj.replace(/\D/g,'');
  if(c.length!==14){ toast('⚠️ CNPJ inválido'); return null; }
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${c}`);
    if(!r.ok) return null;
    return await r.json();
  } catch(e){ return null; }
}

// Buscar CEP
async function buscarCEP(cep){
  const c = cep.replace(/\D/g,'');
  if(c.length!==8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
    const d = await r.json();
    return d.erro ? null : d;
  } catch(e){ return null; }
}

// IE por estado
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

// Backup
function exportBackup(){
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wiwu_os_backup_${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('💾 Backup exportado!');
}

// Abrir WhatsApp — funciona no iPhone/iPad abrindo direto no app
function abrirWhatsApp(num, textoEncoded){
  // whatsapp:// abre direto no app no iPhone
  // fallback para wa.me se não tiver o app
  const url = 'whatsapp://send?phone=' + num + '&text=' + textoEncoded;
  const fallback = 'https://wa.me/' + num + '?text=' + textoEncoded;
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  setTimeout(()=>{
    document.body.removeChild(iframe);
    // Se o app não abriu, abre no navegador
  }, 500);
  // Fallback imediato para garantir
  window.location.href = url;
  setTimeout(()=>{ window.open(fallback,'_blank'); }, 1500);
}

// Copiar texto para clipboard
function copiarTexto(texto, label=''){
  navigator.clipboard.writeText(texto)
    .then(()=>toast(`📋 ${label||'Texto'} copiado!`))
    .catch(()=>{
      // Fallback para iOS
      const el=document.createElement('textarea');
      el.value=texto; el.style.position='fixed'; el.style.opacity='0';
      document.body.appendChild(el); el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast(`📋 ${label||'Texto'} copiado!`);
    });
}

// Dias sem contato
function diasSemContato(c){
  const ref = c.updated_at || c.created_at;
  if(!ref) return 0;
  return Math.floor((new Date() - new Date(ref)) / 86400000);
}
