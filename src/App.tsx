import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronRight, Clock3,
  CreditCard, Filter, LayoutDashboard, LogOut, Menu, MoreHorizontal, Plus, Search,
  Scissors, Settings, Sparkles, Users, Wallet, X, type LucideIcon
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import AuthScreen from "./auth/AuthScreen";

type Kind = "Barbearia" | "Estética";
type Status = "Confirmado" | "Aguardando" | "Concluído" | "Cancelado";
type Appointment = { id:number; customer:string; initials:string; service:string; professional:string; time:string; duration:string; price:number; status:Status; color:string };
type Service = { name:string; duration:string; price:number };
const money = (n:number) => n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const todayLabel = new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"2-digit",month:"long"}).format(new Date());
const demoServices:Record<Kind,Service[]> = {
  Barbearia:[
    {name:"Corte masculino",duration:"30 min",price:40},
    {name:"Corte degradê",duration:"40 min",price:45},
    {name:"Barba",duration:"25 min",price:30},
    {name:"Corte + Barba",duration:"45 min",price:65}
  ],
  Estética:[
    {name:"Limpeza de pele",duration:"60 min",price:120},
    {name:"Design de sobrancelha",duration:"30 min",price:55},
    {name:"Drenagem linfática",duration:"60 min",price:150},
    {name:"Massagem relaxante",duration:"50 min",price:130}
  ]
};
const seed:Appointment[] = [
  {id:1,customer:"Lucas Mendes",initials:"LM",service:"Corte + Barba",professional:"Rafael Costa",time:"09:00",duration:"45 min",price:65,status:"Concluído",color:"blue"},
  {id:2,customer:"Mariana Alves",initials:"MA",service:"Limpeza de pele",professional:"Camila Rocha",time:"09:30",duration:"60 min",price:120,status:"Concluído",color:"pink"},
  {id:3,customer:"Pedro Henrique",initials:"PH",service:"Corte degradê",professional:"Rafael Costa",time:"10:00",duration:"40 min",price:45,status:"Confirmado",color:"green"},
  {id:4,customer:"Juliana Martins",initials:"JM",service:"Design de sobrancelha",professional:"Ana Clara",time:"10:30",duration:"30 min",price:55,status:"Confirmado",color:"orange"},
  {id:5,customer:"Bruno Ferreira",initials:"BF",service:"Corte masculino",professional:"Mateus Lima",time:"11:00",duration:"30 min",price:40,status:"Aguardando",color:"purple"},
  {id:6,customer:"Beatriz Souza",initials:"BS",service:"Drenagem linfática",professional:"Camila Rocha",time:"13:00",duration:"60 min",price:150,status:"Confirmado",color:"pink"}
];
function IconButton({label,children,onClick}:{label:string;children:React.ReactNode;onClick?:()=>void}) { return <button className="icon-button" aria-label={label} title={label} onClick={onClick}>{children}</button>; }

export default function App(){
 const [sessionReady,setSessionReady]=useState(false),[authenticated,setAuthenticated]=useState(false);
 const [organizationName,setOrganizationName]=useState("");
 const [organizationId,setOrganizationId]=useState<string|null>(null);
 const [loadingBusiness,setLoadingBusiness]=useState(false);
 useEffect(()=>{ if(!supabase){setSessionReady(true);return;} let mounted=true;
 supabase.auth.getSession().then(({data})=>{if(mounted){setAuthenticated(Boolean(data.session));setSessionReady(true);}});
 const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setAuthenticated(Boolean(session));setSessionReady(true);setOrganizationId(null);});
 return ()=>{mounted=false;subscription.unsubscribe();};
},[]);
useEffect(()=>{if(!supabase||!authenticated)return; let mounted=true; setLoadingBusiness(true);
 (async()=>{try{
   const {data:members,error}=await supabase.from("organization_members").select("organization_id, role").limit(1).maybeSingle();
   if(error)throw error;
   if(!members){if(mounted){setOrganizationId(null);setOrganizationName("");}return;}
   const {data:org,error:orgError}=await supabase.from("organizations").select("id,name,kind").eq("id",members.organization_id).maybeSingle();
   if(orgError)throw orgError;
   if(mounted){setOrganizationId(org?.id??null);setOrganizationName(org?.name??"");if(org?.kind==="estetica")setKind("Estética");}
 }catch(error){if(mounted)setNotice(error instanceof Error?error.message:"Não foi possível carregar o estabelecimento.");}
 finally{if(mounted)setLoadingBusiness(false);}})();
 return ()=>{mounted=false;};
},[authenticated]);
 const [kind,setKind]=useState<Kind>("Barbearia"),[page,setPage]=useState("Visão geral"),[appointments,setAppointments]=useState(seed);
 const [query,setQuery]=useState(""),[showBooking,setShowBooking]=useState(false),[mobileNav,setMobileNav]=useState(false),[notice,setNotice]=useState("");
 const [customer,setCustomer]=useState(""),[service,setService]=useState(demoServices.Barbearia[0].name),[professional,setProfessional]=useState("Rafael Costa"),[time,setTime]=useState("14:00"),[filter,setFilter]=useState("Todos");
 const nav:{label:string;icon:LucideIcon;section?:string}[]=[
  {label:"Visão geral",icon:LayoutDashboard,section:"MENU PRINCIPAL"},{label:"Agendamentos",icon:CalendarDays},{label:"Clientes",icon:Users},{label:"Serviços",icon:Scissors},{label:"Equipe",icon:Activity,section:"GESTÃO"},{label:"Financeiro",icon:Wallet},{label:"Configurações",icon:Settings}
 ];
 const visible=useMemo(()=>appointments.filter(a=>(`${a.customer} ${a.service} ${a.professional}`.toLowerCase().includes(query.toLowerCase()))&&(filter==="Todos"||a.status===filter)),[appointments,query,filter]);
 const completed=appointments.filter(a=>a.status==="Concluído"),confirmed=appointments.filter(a=>a.status==="Confirmado");
 const revenue=completed.reduce((n,a)=>n+a.price,0),uniqueCustomers=new Set(appointments.map(a=>a.customer)).size;
 function selectKind(next:Kind){setKind(next);setService(demoServices[next][0].name);setProfessional(next==="Barbearia"?"Rafael Costa":"Camila Rocha");setNotice("O tipo de negócio pertence ao estabelecimento e será controlado pelas configurações.");}
 async function addAppointment(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();const s=demoServices[kind].find(v=>v.name===service)??demoServices[kind][0],name=customer.trim();if(!name)return;
  if(supabase&&organizationId){
   const startAt=new Date();const [hours,minutes]=time.split(":").map(Number);startAt.setHours(hours,minutes,0,0);
   const endAt=new Date(startAt.getTime()+Number.parseInt(s.duration,10)*60*1000);
   try{
    const {data:customerRow,error:customerError}=await supabase.from("customers").insert({organization_id:organizationId,name}).select("id").single();
    if(customerError)throw customerError;
    const {error}=await supabase.from("appointments").insert({organization_id:organizationId,customer_id:customerRow.id,customer_name:name,service_name:s.name,professional_name:professional,starts_at:startAt.toISOString(),ends_at:endAt.toISOString(),status:"confirmed",price_cents:s.price*100});
    if(error)throw error;
   }catch(error){setNotice(error instanceof Error?error.message:"Não foi possível salvar o agendamento.");return;}
  }
  const a:Appointment={id:Date.now(),customer:name,initials:name.split(/\\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase(),service:s.name,professional,time,duration:s.duration,price:s.price,status:"Confirmado",color:kind==="Barbearia"?"blue":"pink"};
  setAppointments(prev=>[...prev,a].sort((x,y)=>x.time.localeCompare(y.time)));setShowBooking(false);setCustomer("");setNotice(supabase&&organizationId?"Agendamento salvo no Supabase.":"Agendamento adicionado somente à demonstração; configure o Supabase para persistir.");
 }
 async function refreshAppointments(){
  if(!supabase||!organizationId)return;
  const today=new Date();today.setHours(0,0,0,0);const tomorrow=new Date(today);tomorrow.setDate(tomorrow.getDate()+1);
  const {data,error}=await supabase.from("appointments").select("id,customer_name,service_name,professional_name,starts_at,ends_at,status,price_cents").eq("organization_id",organizationId).gte("starts_at",today.toISOString()).lt("starts_at",tomorrow.toISOString()).order("starts_at");
  if(error){setNotice(error.message);return;}
  setAppointments((data??[]).map(row=>{const start=new Date(row.starts_at),end=new Date(row.ends_at);const duration=Math.max(5,Math.round((end.getTime()-start.getTime())/60000));const statusMap:Record<string,Status>={pending:"Aguardando",confirmed:"Confirmado",completed:"Concluído",cancelled:"Cancelado",no_show:"Cancelado"};const initials=row.customer_name.split(/\\s+/).slice(0,2).map((part:string)=>part[0]).join("").toUpperCase();return {id:row.id,customer:row.customer_name,initials,service:row.service_name,professional:row.professional_name??"Equipe",time:start.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),duration:`${duration} min`,price:Number(row.price_cents)/100,status:statusMap[row.status]??"Aguardando",color:"blue"};}));
 }
 async function updateAppointmentStatus(id:number,status:Status){
  const apiStatus:Record<Status,string>={"Aguardando":"pending","Confirmado":"confirmed","Concluído":"completed","Cancelado":"cancelled"};
  if(supabase&&organizationId){
   const {error}=await supabase.from("appointments").update({status:apiStatus[status]}).eq("id",String(id)).eq("organization_id",organizationId);
   if(error){setNotice(error.message);return;}
  }
  updateStatus(id,status);
 }
 async function signOut(){if(supabase)await supabase.auth.signOut();setNotice("Sessão Supabase encerrada, se havia uma sessão ativa.");}
 if(!sessionReady) return <div className="auth-loading">Carregando DS Agenda…</div>;
 if(supabase && !authenticated) return <AuthScreen onAuthenticated={()=>setAuthenticated(true)} />;
 if(supabase && authenticated && !loadingBusiness && !organizationId) return <div className="auth-loading">Sua conta ainda não possui um estabelecimento. Saia e crie novamente sua conta informando o nome do negócio.</div>;
 return <div className="app-shell">
 {mobileNav&&<button className="nav-backdrop" aria-label="Fechar menu" onClick={()=>setMobileNav(false)}/>}
 <aside className={`sidebar ${mobileNav?"sidebar-open":""}`}>
  <div className="brand"><div className="brand-mark"><Scissors size={22}/></div><div><span className="brand-name">ds<span>agenda</span></span><span className="brand-caption">GESTÃO INTELIGENTE</span></div><IconButton label="Fechar menu" onClick={()=>setMobileNav(false)}><X size={18}/></IconButton></div>
  <div className="workspace-switcher"><div className="workspace-avatar">{kind==="Barbearia"?"B":"E"}</div><div className="workspace-copy"><strong>{organizationName || (kind==="Barbearia"?"Barbearia Studio":"Clínica Bella")}</strong><span>Plano demonstração</span></div><ChevronDown size={15}/></div>
  <div className="nav-list">{nav.map(item=><div key={item.label}>{item.section&&<div className="nav-section">{item.section}</div>}<button className={`nav-item ${page===item.label?"active":""}`} onClick={()=>{setPage(item.label);setMobileNav(false);}}><item.icon size={18}/><span>{item.label}</span>{item.label==="Agendamentos"&&<span className="nav-count">{appointments.length}</span>}</button></div>)}</div>
  <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><strong>Desbloqueie mais</strong><p>Conheça os recursos dos planos profissionais.</p><button onClick={()=>setNotice("Planos e cobrança serão implementados em próxima etapa.")}>Conhecer planos <ChevronRight size={14}/></button></div><div className="profile-row"><div className="profile-avatar">DS</div><div className="profile-copy"><strong>Administrador</strong><span>Minha conta</span></div><IconButton label="Sair" onClick={signOut}><LogOut size={17}/></IconButton></div></div>
 </aside>
 <main className="main-area">
  <header className="topbar"><div className="topbar-left"><IconButton label="Abrir menu" onClick={()=>setMobileNav(true)}><Menu size={20}/></IconButton><div className="breadcrumb">Painel <span>/</span> <strong>{page}</strong></div></div><div className="topbar-actions"><div className="connected-pill"><span className={`status-dot ${isSupabaseConfigured?"green-dot":""}`}/>{isSupabaseConfigured?"Supabase configurado":"Modo demonstração"}</div><IconButton label="Notificações" onClick={()=>setNotice("Nenhuma notificação nova.")}><Bell size={18}/></IconButton><div className="top-avatar">DS</div></div></header>
  <div className="page-content">
   {notice&&<div className="notice-bar"><span>{notice}</span><button aria-label="Fechar aviso" onClick={()=>setNotice("")}><X size={15}/></button></div>}
   {page==="Visão geral"&&<>
    <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> SEU NEGÓCIO EM UM SÓ LUGAR</div><h1>Bom dia! <span>☀️</span></h1><p className="subtitle">Veja o que está acontecendo no seu negócio hoje.</p></div><button className="primary-button" onClick={()=>setShowBooking(true)}><Plus size={18}/> Novo agendamento</button></section>
    <section className="filter-row"><div className="date-label"><CalendarDays size={16}/><span>{todayLabel}</span></div><div className="kind-switch"><button className={kind==="Barbearia"?"selected":""} onClick={()=>selectKind("Barbearia")}><Scissors size={15}/> Barbearia</button><button className={kind==="Estética"?"selected":""} onClick={()=>selectKind("Estética")}><Sparkles size={15}/> Estética</button></div></section>
    <section className="metrics-grid"><Metric title="Agendamentos hoje" value={String(appointments.length).padStart(2,"0")} detail={`${confirmed.length} confirmados`} icon={CalendarDays} tone="indigo" note="na agenda de demonstração"/><Metric title="Receita registrada" value={money(revenue)} detail="Atendimentos concluídos" icon={Wallet} tone="mint" note="valores fictícios"/><Metric title="Clientes na agenda" value={String(uniqueCustomers).padStart(2,"0")} detail="Clientes únicos" icon={Users} tone="amber" note="nesta demonstração"/><Metric title="Taxa de conclusão" value={appointments.length?`${Math.round(completed.length/appointments.length*100)}%`:"0%"} detail={`${completed.length} concluídos`} icon={Activity} tone="rose" note="da agenda exibida"/></section>
    <section className="content-grid"><div className="panel appointments-panel"><div className="panel-heading"><div><h2>Agenda de hoje</h2><p>Acompanhe os próximos atendimentos</p></div><button className="text-button" onClick={()=>setPage("Agendamentos")}>Ver agenda completa <ChevronRight size={15}/></button></div><div className="appointment-tools"><label className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar cliente ou serviço..."/></label><label className="select-filter"><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filtrar status"><option>Todos</option><option>Confirmado</option><option>Aguardando</option><option>Concluído</option><option>Cancelado</option></select></label></div><div className="appointment-list">{visible.map(a=><AppointmentRow key={a.id} appointment={a} onStatus={updateAppointmentStatus}/>)}{visible.length===0&&<div className="empty-state">Nenhum agendamento encontrado.</div>}</div><div className="panel-footer"><span>Exibindo <strong>{visible.length}</strong> de <strong>{appointments.length}</strong> agendamentos</span><button className="text-button" onClick={()=>setPage("Agendamentos")}>Abrir agenda <ChevronRight size={14}/></button></div></div>
    <div className="right-column"><div className="panel quick-panel"><div className="panel-heading"><div><h2>Ações rápidas</h2><p>O que você precisa fazer?</p></div><MoreHorizontal size={19} className="muted-icon"/></div><QuickAction icon={CalendarDays} title="Novo agendamento" subtitle="Reserve um horário" onClick={()=>setShowBooking(true)}/><QuickAction icon={Users} title="Adicionar cliente" subtitle="Cadastre um novo cliente" onClick={()=>{setPage("Clientes");setNotice("Cadastro persistente será conectado ao Supabase na próxima etapa.");}}/><QuickAction icon={Scissors} title="Gerenciar serviços" subtitle="Preços e duração" onClick={()=>setPage("Serviços")}/><QuickAction icon={CreditCard} title="Ver financeiro" subtitle="Receitas e despesas" onClick={()=>setPage("Financeiro")}/></div><div className="panel insight-panel"><div className="insight-top"><div className="insight-icon"><Sparkles size={17}/></div><span>RESUMO DO DIA</span></div><h3>Seu negócio está em movimento!</h3><p>Você tem <strong>{appointments.length}</strong> atendimentos na agenda. <strong>{confirmed.length}</strong> estão confirmados.</p><div className="insight-progress"><div><span>Agenda concluída</span><strong>{appointments.length?Math.round(completed.length/appointments.length*100):0}%</strong></div><div className="progress-track"><span style={{width:`${appointments.length?completed.length/appointments.length*100:0}%`}}/></div></div></div></div></section>
    <section className="bottom-grid"><div className="panel"><div className="panel-heading"><div><h2>Serviços populares</h2><p>Serviços cadastrados para o segmento</p></div><button className="text-button" onClick={()=>setPage("Serviços")}>Ver serviços <ChevronRight size={14}/></button></div><div className="service-list">{demoServices[kind].slice(0,3).map((s,i)=><div className="service-item" key={s.name}><div className={`service-icon service-${i+1}`}><Scissors size={17}/></div><div className="service-info"><strong>{s.name}</strong><span>{s.duration}</span></div><strong className="service-price">{money(s.price)}</strong></div>)}</div></div><div className="panel team-panel"><div className="panel-heading"><div><h2>Equipe de hoje</h2><p>Profissionais e atendimentos</p></div><button className="text-button" onClick={()=>setPage("Equipe")}>Ver equipe <ChevronRight size={14}/></button></div>{(kind==="Barbearia"?[{name:"Rafael Costa",role:"Barbeiro",initials:"RC"},{name:"Mateus Lima",role:"Barbeiro",initials:"ML"}]:[{name:"Camila Rocha",role:"Esteticista",initials:"CR"},{name:"Ana Clara",role:"Esteticista",initials:"AC"}]).map(p=><div className="team-member" key={p.name}><div className="person-avatar blue">{p.initials}</div><div className="team-info"><strong>{p.name}</strong><span>{p.role}</span></div><span className="team-load">{appointments.filter(a=>a.professional===p.name).length} atend.</span></div>)}</div></section>
   </>}
   {page==="Agendamentos"&&<section className="page-section"><div className="section-title-row"><div><div className="eyebrow">ORGANIZAÇÃO DO DIA</div><h1>Agendamentos</h1><p className="subtitle">Consulte e acompanhe os atendimentos.</p></div><button className="primary-button" onClick={()=>setShowBooking(true)}><Plus size={18}/> Novo agendamento</button></div><div className="panel"><div className="appointment-tools"><label className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar cliente, serviço ou profissional..."/></label><label className="select-filter"><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filtrar status"><option>Todos</option><option>Confirmado</option><option>Aguardando</option><option>Concluído</option><option>Cancelado</option></select></label></div><div className="appointment-list">{visible.map(a=><AppointmentRow key={a.id} appointment={a} onStatus={updateStatus}/>)}{!visible.length&&<div className="empty-state">Nenhum resultado.</div>}</div></div></section>}
   {page==="Clientes"&&<SimplePage icon={Users} title="Clientes" subtitle="Construa relacionamentos e consulte históricos." notice="O cadastro persistente de clientes será conectado ao Supabase na próxima etapa." action="Novo cliente" onAction={()=>setNotice("Formulário de clientes será implementado na próxima etapa.")}/>}
   {page==="Serviços"&&<section className="page-section"><div className="section-title-row"><div><div className="eyebrow">CATÁLOGO DO ESTABELECIMENTO</div><h1>Serviços</h1><p className="subtitle">Preços e duração de cada atendimento.</p></div><button className="primary-button" onClick={()=>setNotice("Cadastro de serviços será conectado ao banco na próxima etapa.")}><Plus size={18}/> Adicionar serviço</button></div><div className="service-cards">{demoServices[kind].map(s=><div className="panel service-card" key={s.name}><div className="service-icon"><Scissors size={18}/></div><div><h3>{s.name}</h3><p><Clock3 size={14}/> {s.duration}</p></div><strong>{money(s.price)}</strong></div>)}</div></section>}
   {page==="Equipe"&&<SimplePage icon={Activity} title="Equipe" subtitle="Organize profissionais, horários e atendimentos." notice="A gestão de profissionais será conectada ao Supabase na próxima etapa." action="Adicionar profissional" onAction={()=>setNotice("Cadastro da equipe será implementado na próxima etapa.")}/>}
   {page==="Financeiro"&&<section className="page-section"><div className="section-title-row"><div><div className="eyebrow">CONTROLE DO NEGÓCIO</div><h1>Financeiro</h1><p className="subtitle">Resumo demonstrativo dos atendimentos concluídos.</p></div></div><div className="metrics-grid"><Metric title="Receita registrada" value={money(revenue)} detail="Atendimentos concluídos" icon={Wallet} tone="mint" note="não é um fluxo de caixa real"/><Metric title="Atendimentos concluídos" value={String(completed.length)} detail="Dados de demonstração" icon={Check} tone="indigo" note="sem transações reais"/></div><div className="panel disclaimer-panel">O módulo financeiro usa dados de demonstração. Nenhuma transação ou cobrança real é executada.</div></section>}
   {page==="Configurações"&&<SimplePage icon={Settings} title="Configurações" subtitle="Personalize estabelecimento e conta." notice={isSupabaseConfigured?"O cliente Supabase está configurado, mas login e persistência ainda serão implementados.":"Adicione variáveis públicas do Supabase para preparar a conexão."} action="Testar conexão" onAction={async()=>{if(!supabase){setNotice("Supabase não configurado. Crie .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.");return;}const {error}=await supabase.auth.getSession();setNotice(error?`Erro Supabase: ${error.message}`:"Cliente Supabase inicializado; o login ainda será construído.");}}/>}
   <footer className="page-footer"><span>© 2026 DS Agenda · Feito pela <strong>DS DevSites</strong></span><span><span className={`status-dot ${isSupabaseConfigured?"green-dot":""}`}/>{isSupabaseConfigured?"Cliente Supabase configurado":"Versão inicial · demonstração"}</span></footer>
  </div>
 </main>
 {showBooking&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowBooking(false);}}><div className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title"><div className="modal-heading"><div><span className="eyebrow">AGENDA DO ESTABELECIMENTO</span><h2 id="booking-title">Novo agendamento</h2><p>Preencha os dados para incluir um atendimento de demonstração.</p></div><IconButton label="Fechar" onClick={()=>setShowBooking(false)}><X size={19}/></IconButton></div><form onSubmit={addAppointment} className="booking-form"><label>Nome do cliente<input autoFocus value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="Ex.: Ana Souza" required maxLength={100}/></label><label>Serviço<select value={service} onChange={e=>setService(e.target.value)}>{demoServices[kind].map(s=><option key={s.name}>{s.name}</option>)}</select></label><label>Profissional<select value={professional} onChange={e=>setProfessional(e.target.value)}>{(kind==="Barbearia"?["Rafael Costa","Mateus Lima"]:["Camila Rocha","Ana Clara"]).map(p=><option key={p}>{p}</option>)}</select></label><label>Horário<input type="time" value={time} onChange={e=>setTime(e.target.value)} required/></label><div className="modal-hint"><Sparkles size={16}/><span>Este agendamento fica apenas na memória desta página e será perdido ao atualizar.</span></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setShowBooking(false)}>Cancelar</button><button type="submit" className="primary-button"><Plus size={16}/> Adicionar à agenda</button></div></form></div></div>}
 </div>;
}
function Metric({title,value,detail,icon:Icon,tone,note}:{title:string;value:string;detail:string;icon:LucideIcon;tone:string;note:string}){return <div className="metric-card"><div className="metric-top"><span>{title}</span><div className={`metric-icon ${tone}`}><Icon size={18}/></div></div><div className="metric-value">{value}</div><div className="metric-change">{detail}</div><div className="metric-note">{note}</div></div>;}
function AppointmentRow({appointment:a,onStatus}:{appointment:Appointment;onStatus:(id:number,status:Status)=>void}){const [open,setOpen]=useState(false);return <div className={`appointment-row ${a.status==="Cancelado"?"cancelled-row":""}`}><div className="time-col"><strong>{a.time}</strong><span>{a.duration}</span></div><div className={`customer-avatar ${a.color}`}>{a.initials}</div><div className="appointment-details"><strong>{a.customer}</strong><span>{a.service}</span><small>{a.professional}</small></div><strong className="appointment-price">{money(a.price)}</strong><div className="status-menu-wrap"><button className={`status-pill ${a.status.toLowerCase().replace(" ","-")}`} onClick={()=>setOpen(!open)}>{a.status}<ChevronDown size={13}/></button>{open&&<div className="status-dropdown">{(["Confirmado","Aguardando","Concluído","Cancelado"] as Status[]).map(s=><button key={s} onClick={()=>{onStatus(a.id,s);setOpen(false);}}>{s}</button>)}</div>}</div></div>;}
function QuickAction({icon:Icon,title,subtitle,onClick}:{icon:LucideIcon;title:string;subtitle:string;onClick:()=>void}){return <button className="quick-action" onClick={onClick}><div className="quick-icon"><Icon size={18}/></div><div><strong>{title}</strong><span>{subtitle}</span></div><ChevronRight size={16} className="quick-chevron"/></button>;}
function SimplePage({icon:Icon,title,subtitle,notice,action,onAction}:{icon:LucideIcon;title:string;subtitle:string;notice:string;action:string;onAction:()=>void}){return <section className="page-section"><div className="section-title-row"><div><div className="eyebrow">GESTÃO DO ESTABELECIMENTO</div><h1>{title}</h1><p className="subtitle">{subtitle}</p></div><button className="primary-button" onClick={onAction}><Plus size={18}/>{action}</button></div><div className="panel placeholder-panel"><div className="placeholder-icon"><Icon size={25}/></div><h2>{title}: próxima etapa</h2><p>{notice}</p><div className="placeholder-tags"><span>Interface preparada</span><span>Integração em desenvolvimento</span></div></div></section>;}
