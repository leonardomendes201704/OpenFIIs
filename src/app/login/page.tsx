"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

const errorMessages: Record<string, string> = {
  Callback: "O PortalAuth retornou uma resposta invalida para o OpenFIIs.",
  Configuration: "A configuracao OIDC do OpenFIIs esta incompleta.",
  OAuthCallback: "Nao foi possivel concluir o callback do PortalAuth.",
  OAuthSignin: "Nao foi possivel iniciar o login corporativo no PortalAuth."
};

export default function LoginPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");

    if (errorParam) {
      setError(errorMessages[errorParam] ?? "Nao foi possivel iniciar o login corporativo.");
      return;
    }

    const nextPath = params.get("next");
    const callbackUrl = nextPath?.startsWith("/") ? nextPath : "/";
    void signIn("portalauth", { callbackUrl });
  }, []);

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
          <h1>Login corporativo</h1>
          <p>O acesso ao OpenFIIs e feito exclusivamente pelo PortalAuth.</p>
        </div>
        <div className="login-proof-list">
          <span><ShieldCheck size={18} /> Identidade centralizada no PortalAuth</span>
          <span><LockKeyhole size={18} /> Sessao local protegida por cookie HttpOnly</span>
        </div>
      </section>

      <section className="login-card" aria-label="Login corporativo">
        <div className="login-card-header">
          <span>SSO PortalAuth</span>
          <h2>Redirecionando...</h2>
          <p>Se o redirecionamento nao iniciar automaticamente, use o botao abaixo.</p>
        </div>

        {error && <strong className="login-error">{error}</strong>}

        <button className="login-submit" onClick={() => signIn("portalauth", { callbackUrl: "/" })} type="button">
          Entrar com PortalAuth
          <ArrowRight size={18} />
        </button>

        <div className="login-meta">
          <span>PostgreSQL local como banco oficial</span>
          <strong>Autenticacao corporativa via OpenID Connect</strong>
        </div>
      </section>
    </main>
  );
}
