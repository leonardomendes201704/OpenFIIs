"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  ChevronDown,
  Clock3,
  Copy,
  LineChart,
  Play,
  Plus,
  RefreshCw,
  Save,
  Target,
  TrendingUp,
  Wallet
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

const scenarios = [
  { name: "Conservador", rate: 0.78, income: "R$ 5.980,40", equity: "R$ 746.820,15" },
  { name: "Base", rate: 1, income: "R$ 7.912,45", equity: "R$ 986.742,19" },
  { name: "Otimista", rate: 1.22, income: "R$ 9.653,18", equity: "R$ 1.203.825,47" }
];

const savedSimulations = [
  { title: "Aporte mensal com reinvestimento", date: "31/05/2024", horizon: "15 anos", income: "R$ 7.912,45" },
  { title: "Independência financeira", date: "24/05/2024", horizon: "20 anos", income: "R$ 12.840,10" },
  { title: "Carteira defensiva", date: "18/05/2024", horizon: "10 anos", income: "R$ 4.320,85" }
];

const projectionRows = [
  { year: "2024", invested: "R$ 296.531", equity: "R$ 312.840", income: "R$ 2.680" },
  { year: "2027", invested: "R$ 404.531", equity: "R$ 486.210", income: "R$ 3.940" },
  { year: "2030", invested: "R$ 512.531", equity: "R$ 675.980", income: "R$ 5.420" },
  { year: "2034", invested: "R$ 656.531", equity: "R$ 986.742", income: "R$ 7.912" }
];

export default function SimulacoesPage() {
  const [scenario, setScenario] = useState("Base");
  const selectedScenario = useMemo(() => scenarios.find((item) => item.name === scenario) ?? scenarios[1], [scenario]);

  return (
    <AppShell searchPlaceholder="Buscar simulações, cenários, FIIs...">
      <main className="dashboard simulations-view">
        <section className="page-heading wallet-heading">
          <div>
            <h1>Simulações</h1>
            <p>Projete aportes, reinvestimento de dividendos e metas de renda passiva com FIIs.</p>
          </div>
          <div className="heading-actions">
            <button className="secondary-action"><Copy size={17} /> Duplicar cenário</button>
            <button className="primary-action compact"><Plus size={17} /> Nova simulação</button>
          </div>
        </section>

        <section className="simulation-hero panel">
          <div className="simulation-inputs">
            <div className="panel-header">
              <h2>Parâmetros da simulação</h2>
              <button className="select-button">Carteira atual <ChevronDown size={15} /></button>
            </div>

            <div className="sim-form-grid">
              <label>
                Patrimônio inicial
                <input value="R$ 284.531,42" readOnly />
              </label>
              <label>
                Aporte mensal
                <input value="R$ 1.000,00" readOnly />
              </label>
              <label>
                Prazo
                <input value="15 anos" readOnly />
              </label>
              <label>
                Dividend Yield anual
                <input value="10,36%" readOnly />
              </label>
              <label>
                Crescimento dos dividendos
                <input value="3,5% a.a." readOnly />
              </label>
              <label>
                Inflação estimada
                <input value="4,0% a.a." readOnly />
              </label>
            </div>

            <div className="simulation-switches">
              <span><i /> Reinvestir dividendos</span>
              <span><i /> Corrigir aportes pela inflação</span>
              <span><i /> Considerar preço médio</span>
            </div>

            <button className="primary-action run-action"><Play size={17} /> Executar simulação</button>
          </div>

          <div className="simulation-result">
            <span className="result-kicker"><Target size={18} /> Resultado projetado</span>
            <strong>{selectedScenario.equity}</strong>
            <p>Patrimônio estimado ao final de 15 anos no cenário {selectedScenario.name.toLowerCase()}.</p>

            <div className="scenario-picker">
              {scenarios.map((item) => (
                <button className={scenario === item.name ? "active" : ""} onClick={() => setScenario(item.name)} key={item.name}>
                  {item.name}
                </button>
              ))}
            </div>

            <div className="result-metrics">
              <div>
                <small>Renda mensal</small>
                <strong>{selectedScenario.income}</strong>
              </div>
              <div>
                <small>Meta atingida</small>
                <strong>{scenario === "Conservador" ? "76%" : scenario === "Base" ? "100%" : "122%"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="simulation-summary-grid">
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span><Wallet size={20} /> Total aportado</span>
            <strong>R$ 464.531,42</strong>
            <small>Inclui aportes mensais por 15 anos</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
            <span><TrendingUp size={20} /> Ganho projetado</span>
            <strong>R$ 522.210,77</strong>
            <small className="positive">112,4% sobre o capital aportado</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <span><Calculator size={20} /> Renda sobre custo</span>
            <strong>20,44%</strong>
            <small>Yield mensal anualizado no ano final</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
            <span><Clock3 size={20} /> Tempo até meta</span>
            <strong>14 anos</strong>
            <small>Meta de R$ 7.500/mês</small>
          </motion.article>
        </section>

        <section className="simulation-layout">
          <article className="panel simulation-chart-panel">
            <div className="panel-header">
              <h2>Evolução projetada</h2>
              <div className="range-tabs">
                <button className="selected">Patrimônio</button>
                <button>Renda</button>
                <button>Aportes</button>
              </div>
            </div>

            <div className="projection-track" aria-label="Evolução projetada por período">
              {projectionRows.map((row, index) => (
                <div className="projection-step" key={row.year}>
                  <div className="step-marker"><span>{row.year}</span></div>
                  <div className="step-card">
                    <small>Patrimônio</small>
                    <strong>{row.equity}</strong>
                    <em>{row.income}/mês</em>
                  </div>
                  {index < projectionRows.length - 1 && <ArrowRight size={18} />}
                </div>
              ))}
            </div>

            <div className="simulation-table">
              <div className="simulation-table-head">
                <span>Ano</span>
                <span>Total aportado</span>
                <span>Patrimônio</span>
                <span>Renda mensal</span>
              </div>
              {projectionRows.map((row) => (
                <div className="simulation-row" key={row.year}>
                  <strong>{row.year}</strong>
                  <span>{row.invested}</span>
                  <span>{row.equity}</span>
                  <span className="positive">{row.income}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className="wallet-side">
            <article className="panel saved-panel">
              <div className="panel-header">
                <h2>Simulações salvas</h2>
                <button className="icon-inline"><Save size={16} /></button>
              </div>
              <div className="saved-list">
                {savedSimulations.map((item) => (
                  <button className="saved-item" key={item.title}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.date} • {item.horizon}</small>
                    </div>
                    <span>{item.income}</span>
                  </button>
                ))}
              </div>
            </article>

            <article className="panel assumptions-panel">
              <h2>Premissas</h2>
              <div className="assumption-list">
                <span><LineChart size={17} /> Dividendos crescem de forma linear no cenário escolhido.</span>
                <span><RefreshCw size={17} /> Reinvestimento compra cotas no preço projetado médio.</span>
                <span><BarChart3 size={17} /> Valores são simulações, não recomendação de investimento.</span>
              </div>
            </article>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}
