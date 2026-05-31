"use client";

import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Database,
  Download,
  KeyRound,
  Mail,
  Palette,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  ToggleRight,
  Trash2,
  UserRound,
  Wallet
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

const integrations = [
  { name: "PostgreSQL local", detail: "Banco de dados oficial do OpenFIIs", status: "Preparado" },
  { name: "Vercel", detail: "Deploy e preview environments", status: "Pendente" },
  { name: "GitHub", detail: "Repositório e versionamento", status: "Pendente" },
  { name: "API de mercado", detail: "Cotações e dividendos reais", status: "Não conectada" }
];

const preferences = [
  { title: "Reinvestir dividendos por padrão", description: "Usado em simulações e projeções futuras.", enabled: true },
  { title: "Corrigir metas pela inflação", description: "Mantém valores projetados em termos reais.", enabled: true },
  { title: "Alertas de concentração", description: "Notifica quando um ativo passa do limite definido.", enabled: true },
  { title: "Modo compacto de tabelas", description: "Mostra mais linhas em telas operacionais.", enabled: false }
];

export default function ConfiguracoesPage() {
  return (
    <AppShell searchPlaceholder="Buscar configurações, integrações, preferências...">
      <main className="dashboard settings-view">
        <section className="page-heading wallet-heading">
          <div>
            <h1>Configurações</h1>
            <p>Gerencie perfil, preferências, integrações e parâmetros gerais do OpenFIIs.</p>
          </div>
          <div className="heading-actions">
            <button className="secondary-action"><Download size={17} /> Exportar dados</button>
            <button className="primary-action compact"><Save size={17} /> Salvar alterações</button>
          </div>
        </section>

        <section className="settings-summary-grid">
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span><UserRound size={20} /> Perfil</span>
            <strong>Carlos Silva</strong>
            <small>Investidor moderado</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
            <span><ShieldCheck size={20} /> Segurança</span>
            <strong>Ativa</strong>
            <small>2FA recomendado</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <span><Database size={20} /> Dados</span>
            <strong>Mock</strong>
            <small>PostgreSQL local</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
            <span><Bell size={20} /> Alertas</span>
            <strong>3 ativos</strong>
            <small>Dividendos e concentração</small>
          </motion.article>
        </section>

        <section className="settings-layout">
          <article className="panel settings-profile-panel">
            <div className="panel-header">
              <h2>Perfil do investidor</h2>
              <button className="select-button">Pessoa física <ChevronDown size={15} /></button>
            </div>

            <div className="settings-form-grid">
              <label>
                Nome
                <input value="Carlos Silva" readOnly />
              </label>
              <label>
                E-mail
                <input value="carlos.silva@email.com" readOnly />
              </label>
              <label>
                Perfil de risco
                <button>Moderado <ChevronDown size={15} /></button>
              </label>
              <label>
                Moeda
                <button>Real brasileiro (BRL) <ChevronDown size={15} /></button>
              </label>
              <label>
                Meta de renda mensal
                <input value="R$ 7.500,00" readOnly />
              </label>
              <label>
                Limite por ativo
                <input value="20%" readOnly />
              </label>
            </div>
          </article>

          <aside className="wallet-side">
            <article className="panel settings-security-panel">
              <h2>Segurança</h2>
              <div className="security-list">
                <div>
                  <KeyRound size={18} />
                  <span>
                    <strong>Senha</strong>
                    <small>Atualizada há 42 dias</small>
                  </span>
                  <button>Alterar</button>
                </div>
                <div>
                  <ShieldCheck size={18} />
                  <span>
                    <strong>Autenticação 2FA</strong>
                    <small>Não configurada</small>
                  </span>
                  <button>Ativar</button>
                </div>
                <div>
                  <Mail size={18} />
                  <span>
                    <strong>E-mail verificado</strong>
                    <small>carlos.silva@email.com</small>
                  </span>
                  <CheckCircle2 size={18} />
                </div>
              </div>
            </article>

            <article className="panel danger-panel">
              <h2>Zona sensível</h2>
              <p>Exportar ou limpar dados altera o histórico local de simulações e preferências.</p>
              <button><Trash2 size={17} /> Limpar dados mockados</button>
            </article>
          </aside>
        </section>

        <section className="settings-bottom-grid">
          <article className="panel settings-preferences-panel">
            <div className="panel-header">
              <h2>Preferências</h2>
              <button className="select-button"><SlidersHorizontal size={15} /> Avançado</button>
            </div>
            <div className="preferences-list">
              {preferences.map((item) => (
                <div className="preference-item" key={item.title}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </div>
                  <button className={`toggle ${item.enabled ? "on" : ""}`} aria-pressed={item.enabled}>
                    <i />
                  </button>
                </div>
              ))}
            </div>
          </article>

          <article className="panel integrations-panel">
            <div className="panel-header">
              <h2>Integrações</h2>
              <button className="select-button">Ambiente dev <ChevronDown size={15} /></button>
            </div>
            <div className="integrations-list">
              {integrations.map((item) => (
                <div className="integration-item" key={item.name}>
                  <span><Database size={17} /></span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.detail}</small>
                  </div>
                  <em>{item.status}</em>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel settings-appearance-panel">
          <div>
            <Palette size={20} />
            <strong>Aparência</strong>
            <span>Tema claro com paleta financeira verde, componentes densos e menu recolhível.</span>
          </div>
          <div>
            <Wallet size={20} />
            <strong>Padrões da carteira</strong>
            <span>Aportes mensais, reinvestimento e metas são usados como base nas novas simulações.</span>
          </div>
          <div>
            <ToggleRight size={20} />
            <strong>Preferências globais</strong>
            <span>Configurações serão persistidas no PostgreSQL local usando a identidade do PortalAuth.</span>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
