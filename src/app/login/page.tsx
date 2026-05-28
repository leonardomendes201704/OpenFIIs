"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await handleRegister();
        return;
      }

      await handleLogin();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogin() {
    if (!supabase) {
      setError("Supabase não está configurado. Configure o .env.local para entrar.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    completeLogin();
  }

  async function handleRegister() {
    if (!supabase) {
      setError("Supabase não está configurado. Configure o .env.local para criar usuários reais.");
      return;
    }

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("A confirmação de senha não confere.");
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      if (data.user?.id) {
        await supabase.from("profiles").upsert({
          full_name: name,
          id: data.user.id,
          investor_profile: "moderado"
        });
      }

      completeLogin();
      return;
    }

    setSuccess("Cadastro criado. Verifique seu e-mail para confirmar a conta antes de entrar.");
    setMode("login");
  }

  function completeLogin() {
    const nextPath = new URLSearchParams(window.location.search).get("next") || "/";
    router.push(nextPath);
    router.refresh();
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>
          <strong>OpenFIIs</strong>
        </div>
        <div>
          <h1>{mode === "login" ? "Entre no portal" : "Crie sua conta"}</h1>
          <p>Acompanhe carteira, dividendos, projeções e relatórios em um painel financeiro único.</p>
        </div>
        <div className="login-proof-list">
          <span><ShieldCheck size={18} /> Cadastro real via Supabase Auth</span>
          <span><LockKeyhole size={18} /> Rotas do portal protegidas por sessão</span>
        </div>
      </section>

      <section className="login-card" aria-label={mode === "login" ? "Login" : "Cadastro"}>
        <div className="login-mode-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">Entrar</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">Criar conta</button>
        </div>

        <div className="login-card-header">
          <span>{mode === "login" ? "Perfil Investidor" : "Novo usuário"}</span>
          <h2>{mode === "login" ? "Acessar conta" : "Cadastrar acesso"}</h2>
          <p>
            {mode === "login"
              ? "Entre com seu e-mail e senha cadastrados no Supabase."
              : "Crie um usuário com nome, e-mail e senha para acessar o portal."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              Nome
              <div className="login-input">
                <UserRound size={18} />
                <input value={name} onChange={(event) => setName(event.target.value)} type="text" />
              </div>
            </label>
          )}

          <label>
            E-mail
            <div className="login-input">
              <Mail size={18} />
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
            </div>
          </label>

          <label>
            Senha
            <div className="login-input">
              <LockKeyhole size={18} />
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
              <Eye size={18} />
            </div>
          </label>

          {mode === "register" && (
            <label>
              Confirmar senha
              <div className="login-input">
                <LockKeyhole size={18} />
                <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" />
              </div>
            </label>
          )}

          {error && <strong className="login-error">{error}</strong>}
          {success && <strong className="login-success">{success}</strong>}

          <button className="login-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Processando..." : mode === "login" ? "Entrar no portal" : "Criar conta"}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="login-meta">
          <span>{isSupabaseConfigured ? "Supabase configurado" : "Supabase não configurado"}</span>
          <strong>Autenticação real por e-mail e senha</strong>
        </div>
      </section>
    </main>
  );
}
