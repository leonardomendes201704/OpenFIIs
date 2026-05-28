"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

const MOCK_EMAIL = "carlos.silva@email.com";
const MOCK_PASSWORD = "openfiis123";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(MOCK_EMAIL);
  const [password, setPassword] = useState(MOCK_PASSWORD);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (email !== MOCK_EMAIL || password !== MOCK_PASSWORD) {
      setError("Credenciais mockadas inválidas.");
      return;
    }

    document.cookie = "openfiis_session=mock-authenticated; path=/; max-age=86400; SameSite=Lax";
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
          <h1>Entre no portal</h1>
          <p>Acompanhe carteira, dividendos, projeções e relatórios em um painel financeiro único.</p>
        </div>
        <div className="login-proof-list">
          <span><ShieldCheck size={18} /> Sessão mockada para desenvolvimento local</span>
          <span><LockKeyhole size={18} /> Rotas do portal protegidas por middleware</span>
        </div>
      </section>

      <section className="login-card" aria-label="Login">
        <div className="login-card-header">
          <span>Perfil Investidor</span>
          <h2>Acessar conta</h2>
          <p>Use as credenciais já preenchidas para entrar no ambiente mockado.</p>
        </div>

        <form onSubmit={handleSubmit}>
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

          {error && <strong className="login-error">{error}</strong>}

          <button className="login-submit" type="submit">
            Entrar no portal
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="login-meta">
          <span>Usuário mockado</span>
          <strong>{MOCK_EMAIL}</strong>
        </div>
      </section>
    </main>
  );
}
