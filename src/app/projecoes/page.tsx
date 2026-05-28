"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  ChevronDown,
  CircleDollarSign,
  Clock,
  Download,
  Goal,
  LineChart,
  PiggyBank,
  Plus,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Wallet
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

const projectionScenarios = [
  { name: "Conservador", income: "R$ 5.980", equity: "R$ 746.820", probability: "Alta", color: "#9aa1a5" },
  { name: "Base", income: "R$ 7.912", equity: "R$ 986.742", probability: "Provável", color: "#0f5a35" },
  { name: "Otimista", income: "R$ 9.653", equity: "R$ 1.203.825", probability: "Moderada", color: "#2fb47c" }
];

const milestones = [
  { year: "2026", title: "R$ 3 mil/mês", status: "No caminho", progress: 36 },
  { year: "2029", title: "R$ 5 mil/mês", status: "Ajustar aporte", progress: 61 },
  { year: "2033", title: "R$ 7,5 mil/mês", status: "Meta principal", progress: 84 },
  { year: "2038", title: "R$ 12 mil/mês", status: "Independência", progress: 100 }
];

const projectedSegments = [
  { name: "Logística", current: "38,4%", target: "34,0%", amount: "R$ 335.492" },
  { name: "Shoppings", current: "22,7%", target: "24,0%", amount: "R$ 236.818" },
  { name: "Papel", current: "16,8%", target: "18,0%", amount: "R$ 177.613" },
  { name: "Lajes", current: "9,4%", target: "10,5%", amount: "R$ 103.608" },
  { name: "Outros", current: "12,7%", target: "13,5%", amount: "R$ 133.211" }
];

const monthlyIncome = [
  { year: "2024", value: 2453 },
  { year: "2026", value: 3260 },
  { year: "2028", value: 4310 },
  { year: "2030", value: 5620 },
  { year: "2032", value: 6900 },
  { year: "2034", value: 7912 }
];

export default function ProjecoesPage() {
  const [goal, setGoal] = useState("R$ 7.500,00");
  const [activeScenario, setActiveScenario] = useState("Base");

  const selectedScenario = useMemo(
    () => projectionScenarios.find((scenario) => scenario.name === activeScenario) ?? projectionScenarios[1],
    [activeScenario]
  );

  return (
    <AppShell searchPlaceholder="Buscar projeções, metas, cenários...">
      <main className="dashboard projections-view">
        <section className="page-heading wallet-heading">
          <div>
            <h1>Projeções</h1>
            <p>Acompanhe metas de renda passiva, patrimônio futuro e ajustes necessários na carteira.</p>
          </div>
          <div className="heading-actions">
            <button className="secondary-action"><Download size={17} /> Exportar plano</button>
            <button className="primary-action compact"><Plus size={17} /> Nova meta</button>
          </div>
        </section>

        <section className="projection-command panel">
          <div className="projection-goal">
            <span><Goal size={19} /> Meta principal</span>
            <strong>{goal}/mês</strong>
            <p>Renda mensal desejada em valores reais, considerando reinvestimento e crescimento dos dividendos.</p>
            <div className="goal-control">
              <input value={goal} onChange={(event) => setGoal(event.target.value)} />
              <button><SlidersHorizontal size={16} /> Ajustar</button>
            </div>
          </div>

          <div className="projection-status">
            <div>
              <small>Prazo estimado</small>
              <strong>14 anos</strong>
            </div>
            <div>
              <small>Aporte recomendado</small>
              <strong>R$ 1.280/mês</strong>
            </div>
            <div>
              <small>Patrimônio necessário</small>
              <strong>{selectedScenario.equity}</strong>
            </div>
          </div>

          <div className="projection-arc" aria-label="Progresso da meta">
            <div className="arc-ring">
              <span>84%</span>
            </div>
            <p>Você está a R$ 1.520/mês da meta no cenário {activeScenario.toLowerCase()}.</p>
          </div>
        </section>

        <section className="projection-cards">
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span><CircleDollarSign size={20} /> Renda projetada</span>
            <strong>{selectedScenario.income}/mês</strong>
            <small className="positive">+222,5% vs. renda atual</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
            <span><Wallet size={20} /> Patrimônio futuro</span>
            <strong>{selectedScenario.equity}</strong>
            <small>Cenário {selectedScenario.name.toLowerCase()}</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <span><PiggyBank size={20} /> Aportes totais</span>
            <strong>R$ 464.531</strong>
            <small>Capital próprio acumulado</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
            <span><Clock size={20} /> Data alvo</span>
            <strong>Mai/2038</strong>
            <small>{selectedScenario.probability} aderência ao plano</small>
          </motion.article>
        </section>

        <section className="projections-layout">
          <article className="panel projection-roadmap-panel">
            <div className="panel-header">
              <h2>Linha do tempo da renda</h2>
              <div className="range-tabs">
                <button className="selected">Real</button>
                <button>Nominal</button>
                <button>Mensal</button>
              </div>
            </div>

            <div className="income-bars">
              {monthlyIncome.map((item) => (
                <div className="income-bar" key={item.year}>
                  <div>
                    <span style={{ height: `${Math.max(24, item.value / 85)}px` }} />
                  </div>
                  <strong>{item.year}</strong>
                  <small>R$ {(item.value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k</small>
                </div>
              ))}
            </div>

            <div className="milestone-list">
              {milestones.map((milestone) => (
                <div className="milestone-item" key={milestone.year}>
                  <div className="milestone-year">{milestone.year}</div>
                  <div>
                    <strong>{milestone.title}</strong>
                    <small>{milestone.status}</small>
                    <i><b style={{ width: `${milestone.progress}%` }} /></i>
                  </div>
                  <ArrowUpRight size={18} />
                </div>
              ))}
            </div>
          </article>

          <aside className="wallet-side">
            <article className="panel scenario-compare-panel">
              <div className="panel-header">
                <h2>Cenários</h2>
                <button className="select-button">15 anos <ChevronDown size={15} /></button>
              </div>
              <div className="scenario-card-list">
                {projectionScenarios.map((scenario) => (
                  <button className={activeScenario === scenario.name ? "active" : ""} onClick={() => setActiveScenario(scenario.name)} key={scenario.name}>
                    <span style={{ background: scenario.color }} />
                    <div>
                      <strong>{scenario.name}</strong>
                      <small>{scenario.equity}</small>
                    </div>
                    <em>{scenario.income}</em>
                  </button>
                ))}
              </div>
            </article>

            <article className="panel projection-actions-panel">
              <h2>Ações recomendadas</h2>
              <div className="action-list">
                <span><Target size={17} /> Aumentar aporte mensal para R$ 1.280.</span>
                <span><TrendingUp size={17} /> Reduzir concentração em logística para até 34%.</span>
                <span><CalendarClock size={17} /> Revisar premissas a cada trimestre.</span>
                <span><LineChart size={17} /> Rebalancear novos aportes em papel e shoppings.</span>
              </div>
            </article>
          </aside>
        </section>

        <section className="panel segment-projection-panel">
          <div className="panel-header">
            <h2>Alocação projetada por segmento</h2>
            <button className="select-button">Meta base <ChevronDown size={15} /></button>
          </div>
          <div className="segment-projection-table">
            <div className="segment-projection-head">
              <span>Segmento</span>
              <span>Atual</span>
              <span>Meta</span>
              <span>Valor projetado</span>
            </div>
            {projectedSegments.map((segment) => (
              <div className="segment-projection-row" key={segment.name}>
                <strong>{segment.name}</strong>
                <span>{segment.current}</span>
                <span className="positive">{segment.target}</span>
                <span>{segment.amount}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
