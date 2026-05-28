"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Mail,
  Plus,
  RefreshCw,
  Settings2,
  Share2,
  TrendingUp,
  Wallet
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

const reportTemplates = [
  { title: "Resumo mensal da carteira", type: "PDF", updated: "31/05/2024", icon: FileBarChart },
  { title: "Informe de dividendos", type: "XLSX", updated: "31/05/2024", icon: FileSpreadsheet },
  { title: "Evolução patrimonial", type: "PDF", updated: "30/05/2024", icon: TrendingUp },
  { title: "Posições e preço médio", type: "CSV", updated: "29/05/2024", icon: Wallet }
];

const generatedReports = [
  { name: "Resumo mensal - Maio 2024", date: "31/05/2024 18:44", format: "PDF", status: "Pronto" },
  { name: "Dividendos - 2024 YTD", date: "31/05/2024 18:40", format: "XLSX", status: "Pronto" },
  { name: "Carteira completa", date: "30/05/2024 09:12", format: "CSV", status: "Pronto" },
  { name: "Projeção base - 15 anos", date: "28/05/2024 21:03", format: "PDF", status: "Pronto" }
];

const schedules = [
  { title: "Resumo mensal", cadence: "Todo dia 1", destination: "E-mail", active: true },
  { title: "Dividendos recebidos", cadence: "Toda sexta", destination: "E-mail", active: true },
  { title: "Rebalanceamento", cadence: "Trimestral", destination: "Dashboard", active: false }
];

export default function RelatoriosPage() {
  return (
    <AppShell searchPlaceholder="Buscar relatórios, exportações, informes...">
      <main className="dashboard reports-view">
        <section className="page-heading wallet-heading">
          <div>
            <h1>Relatórios</h1>
            <p>Gere, exporte e acompanhe documentos da carteira, dividendos e projeções.</p>
          </div>
          <div className="heading-actions">
            <button className="secondary-action"><Settings2 size={17} /> Configurar</button>
            <button className="primary-action compact"><Plus size={17} /> Novo relatório</button>
          </div>
        </section>

        <section className="reports-summary-grid">
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span><ClipboardList size={20} /> Relatórios gerados</span>
            <strong>28</strong>
            <small>Nos últimos 90 dias</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
            <span><Download size={20} /> Downloads</span>
            <strong>143</strong>
            <small>PDF, XLSX e CSV</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <span><CalendarClock size={20} /> Agendados</span>
            <strong>3</strong>
            <small>2 ativos e 1 pausado</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
            <span><CheckCircle2 size={20} /> Última geração</span>
            <strong>18:44</strong>
            <small>Resumo mensal pronto</small>
          </motion.article>
        </section>

        <section className="reports-layout">
          <article className="panel report-builder-panel">
            <div className="panel-header">
              <h2>Gerador de relatório</h2>
              <button className="select-button">Maio/2024 <ChevronDown size={15} /></button>
            </div>

            <div className="report-builder-grid">
              <label>
                Tipo de relatório
                <button>Resumo mensal da carteira <ChevronDown size={15} /></button>
              </label>
              <label>
                Formato
                <button>PDF executivo <ChevronDown size={15} /></button>
              </label>
              <label>
                Período
                <button>01/05/2024 - 31/05/2024 <ChevronDown size={15} /></button>
              </label>
              <label>
                Comparativo
                <button>CDI e IFIX <ChevronDown size={15} /></button>
              </label>
            </div>

            <div className="report-sections">
              <span><i /> Resumo patrimonial</span>
              <span><i /> Rendimentos e DY</span>
              <span><i /> Posições da carteira</span>
              <span><i /> Alocação por segmento</span>
              <span><i /> Projeção de renda</span>
              <span><i /> Movimentações</span>
            </div>

            <div className="report-actions">
              <button className="primary-action"><FileText size={17} /> Gerar relatório</button>
              <button className="secondary-action"><Mail size={17} /> Enviar por e-mail</button>
              <button className="secondary-action"><Share2 size={17} /> Compartilhar</button>
            </div>
          </article>

          <aside className="wallet-side">
            <article className="panel report-schedule-panel">
              <h2>Agendamentos</h2>
              <div className="schedule-list">
                {schedules.map((item) => (
                  <div className="schedule-item" key={item.title}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.cadence} • {item.destination}</small>
                    </div>
                    <span className={item.active ? "active" : ""}>{item.active ? "Ativo" : "Pausado"}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel report-health-panel">
              <h2>Status dos dados</h2>
              <div className="health-list">
                <span><CheckCircle2 size={17} /> Carteira sincronizada</span>
                <span><CheckCircle2 size={17} /> Dividendos atualizados</span>
                <span><RefreshCw size={17} /> Cotações aguardando fechamento</span>
              </div>
            </article>
          </aside>
        </section>

        <section className="report-template-grid">
          {reportTemplates.map((template) => (
            <article className="panel report-template-card" key={template.title}>
              <template.icon size={24} />
              <div>
                <strong>{template.title}</strong>
                <small>{template.type} • Atualizado em {template.updated}</small>
              </div>
              <button><Download size={16} /></button>
            </article>
          ))}
        </section>

        <section className="panel generated-reports-panel">
          <div className="panel-header">
            <h2>Histórico de relatórios</h2>
            <button className="select-button">Últimos 30 dias <ChevronDown size={15} /></button>
          </div>
          <div className="generated-table">
            <div className="generated-head">
              <span>Relatório</span>
              <span>Gerado em</span>
              <span>Formato</span>
              <span>Status</span>
              <span />
            </div>
            {generatedReports.map((report) => (
              <div className="generated-row" key={report.name}>
                <strong>{report.name}</strong>
                <span>{report.date}</span>
                <span>{report.format}</span>
                <em>{report.status}</em>
                <button><Download size={16} /></button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
