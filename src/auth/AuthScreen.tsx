import { type FormEvent, useState } from "react";
import { CalendarDays, Eye, EyeOff, Scissors, Sparkles } from "lucide-react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [kind, setKind] = useState<"barbearia" | "estetica">("barbearia");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!supabase) {
      setMessage("O Supabase ainda não está configurado. Adicione as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onAuthenticated();
      } else {
        if (!businessName.trim()) throw new Error("Informe o nome do estabelecimento.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { business_name: businessName.trim(), business_kind: kind } },
        });
        if (error) throw error;
        if (data.session) onAuthenticated();
        else {
          setMessage("Cadastro criado. Confirme o e-mail e depois entre para concluir o cadastro do estabelecimento.");
          setMode("login");
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir a operação.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-shell">
    <section className="auth-showcase">
      <div className="auth-brand"><div className="brand-mark"><Scissors size={22}/></div><div><span className="brand-name">ds<span>agenda</span></span><span className="brand-caption">GESTÃO INTELIGENTE</span></div></div>
      <div className="auth-marketing"><div className="auth-pill"><Sparkles size={14}/> SUA ROTINA, MAIS SIMPLES</div><h1>Seu negócio<br/>no <span>próximo nível.</span></h1><p>Agenda, clientes e gestão em um só lugar. Mais organização para você cuidar do que realmente importa.</p><div className="auth-benefit"><span><CalendarDays size={18}/></span><div><strong>Agenda organizada</strong><small>Visualize seus atendimentos de forma clara.</small></div></div><div className="auth-benefit"><span><Sparkles size={18}/></span><div><strong>Feito para seu segmento</strong><small>Para barbearias e clínicas de estética.</small></div></div></div>
      <div className="auth-showcase-footer">© 2026 DS Agenda · DS DevSites</div>
    </section>
    <section className="auth-form-side"><div className="auth-form-box"><div className="auth-mobile-brand"><div className="brand-mark"><Scissors size={20}/></div><span className="brand-name">ds<span>agenda</span></span></div><div className="auth-heading"><span className="eyebrow">{mode === "login" ? "BEM-VINDO DE VOLTA" : "COMECE POR AQUI"}</span><h2>{mode === "login" ? "Acesse sua conta" : "Crie seu espaço"}</h2><p>{mode === "login" ? "Entre para gerenciar seu estabelecimento." : "Configure o acesso do seu estabelecimento."}</p></div>
    <form onSubmit={submit} className="auth-form">
      {mode === "signup" && <><label>Nome do estabelecimento<input value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="Ex.: Studio Bella" maxLength={100} required/></label><label>Tipo de estabelecimento<select value={kind} onChange={e=>setKind(e.target.value as "barbearia"|"estetica")}><option value="barbearia">Barbearia</option><option value="estetica">Clínica de estética</option></select></label></>}
      <label>E-mail<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@empresa.com" required/></label>
      <label>Senha<div className="password-field"><input type={showPassword?"text":"password"} autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" minLength={8} required/><button type="button" aria-label={showPassword?"Ocultar senha":"Mostrar senha"} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
      {message && <div className="auth-message" role="status">{message}</div>}
      <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy?"Aguarde…":mode==="login"?"Entrar na plataforma":"Criar conta"}</button>
    </form>
    {mode==="login"&&<button className="auth-link" onClick={async()=>{setMessage("");if(!supabase||!email.trim()){setMessage("Informe seu e-mail e confira se o Supabase está configurado.");return;}const {error}=await supabase.auth.resetPasswordForEmail(email.trim());setMessage(error?error.message:"Se houver uma conta para este e-mail, você receberá instruções para redefinir a senha.");}}>Esqueci minha senha</button>}
    <div className="auth-switch">{mode==="login"?"Ainda não tem conta?":"Já possui uma conta?"} <button onClick={()=>{setMode(mode==="login"?"signup":"login");setMessage("");}}>{mode==="login"?"Criar conta":"Fazer login"}</button></div>
    {!isSupabaseConfigured&&<div className="demo-warning">Modo de preparação: conecte o Supabase para ativar o acesso.</div>}
    <p className="auth-terms">Ao continuar, você concorda com os termos de uso e a política de privacidade.</p></div></section>
  </div>;
}