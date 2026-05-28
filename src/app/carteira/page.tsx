"use client";

import { motion } from "framer-motion";
import {
  ArrowDownUp,
  ChevronDown,
  Download,
  MoreVertical,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Wallet
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

const positions = [
  {
    ticker: "HGLG11",
    name: "CSHG Logística",
    segment: "Logística",
    quantity: "1.250",
    average: "R$ 160,23",
    price: "R$ 175,40",
    invested: "R$ 200.287,50",
    current: "R$ 219.250,00",
    result: "+ R$ 18.962,50",
    dy: "9,46%",
    income: "R$ 1.093,75",
    allocation: 38.4
  },
  {
    ticker: "KNRI11",
    name: "Kinea Renda Imobiliária",
    segment: "Híbrido",
    quantity: "800",
    average: "R$ 150,75",
    price: "R$ 158,60",
    invested: "R$ 120.600,00",
    current: "R$ 126.880,00",
    result: "+ R$ 6.280,00",
    dy: "8,91%",
    income: "R$ 632,00",
    allocation: 22.7
  },
  {
    ticker: "MXRF11",
    name: "Maxi Renda",
    segment: "Papel",
    quantity: "1.000",
    average: "R$ 10,25",
    price: "R$ 10,48",
    invested: "R$ 10.250,00",
    current: "R$ 10.480,00",
    result: "+ R$ 230,00",
    dy: "11,84%",
    income: "R$ 672,00",
    allocation: 16.8
  },
  {
    ticker: "XPML11",
    name: "XP Malls",
    segment: "Shoppings",
    quantity: "600",
    average: "R$ 103,50",
    price: "R$ 106,20",
    invested: "R$ 62.100,00",
    current: "R$ 63.720,00",
    result: "+ R$ 1.620,00",
    dy: "8,54%",
    income: "R$ 270,00",
    allocation: 9.4
  }
];

const movements = [
  { type: "Compra", ticker: "HGLG11", date: "28/05/2024", value: "R$ 8.770,00", status: "Liquidado" },
  { type: "Rendimento", ticker: "KNRI11", date: "15/05/2024", value: "R$ 632,00", status: "Recebido" },
  { type: "Compra", ticker: "MXRF11", date: "10/05/2024", value: "R$ 2.096,00", status: "Liquidado" },
  { type: "Rendimento", ticker: "XPML11", date: "08/05/2024", value: "R$ 270,00", status: "Recebido" }
];

export default function CarteiraPage() {
  return (
    <AppShell searchPlaceholder="Buscar FIIs, posições, operações...">
      <main className="dashboard wallet-view">
        <section className="page-heading wallet-heading">
          <div>
            <h1>Carteira</h1>
            <p>Gerencie posições, acompanhe alocação e registre operações da sua carteira de FIIs.</p>
          </div>
          <div className="heading-actions">
            <button className="secondary-action"><Download size={17} /> Exportar</button>
            <button className="primary-action compact"><Plus size={17} /> Nova operação</button>
          </div>
        </section>

        <section className="wallet-summary-grid">
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span><Wallet size={20} /> Valor atual</span>
            <strong>R$ 284.531,42</strong>
            <small className="positive">+ R$ 27.092,50 desde o início</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
            <span><TrendingUp size={20} /> Resultado</span>
            <strong>+10,53%</strong>
            <small className="positive">+ R$ 24.631,22 no período</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <span><ArrowDownUp size={20} /> Preço médio</span>
            <strong>R$ 92,18</strong>
            <small>4 ativos com posição aberta</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
            <span><ShieldCheck size={20} /> Risco de concentração</span>
            <strong>Moderado</strong>
            <small>Maior posição em 38,4%</small>
          </motion.article>
        </section>

        <section className="wallet-layout">
          <article className="panel positions-panel">
            <div className="wallet-toolbar">
              <div className="wallet-tabs">
                <button className="active">Posições</button>
                <button>Operações</button>
                <button>Proventos</button>
              </div>
              <div className="wallet-tools">
                <button><SlidersHorizontal size={16} /> Filtros</button>
                <button>Todos os segmentos <ChevronDown size={15} /></button>
              </div>
            </div>

            <div className="wallet-table">
              <div className="wallet-table-head">
                <span>Ativo</span>
                <span>Qtd.</span>
                <span>Preço médio</span>
                <span>Preço atual</span>
                <span>Investido</span>
                <span>Atual</span>
                <span>Resultado</span>
                <span>DY</span>
                <span>Alocação</span>
                <span />
              </div>
              {positions.map((item) => (
                <div className="wallet-row" key={item.ticker}>
                  <div className="asset-cell">
                    <strong>{item.ticker}</strong>
                    <small>{item.name}</small>
                    <em>{item.segment}</em>
                  </div>
                  <span>{item.quantity}</span>
                  <span>{item.average}</span>
                  <span>{item.price}</span>
                  <span>{item.invested}</span>
                  <strong>{item.current}</strong>
                  <span className="positive">{item.result}</span>
                  <span>{item.dy}</span>
                  <div className="wallet-allocation">
                    <span>{item.allocation.toLocaleString("pt-BR")}%</span>
                    <i><b style={{ width: `${item.allocation * 2.2}%` }} /></i>
                  </div>
                  <button aria-label={`Mais opções para ${item.ticker}`}><MoreVertical size={16} /></button>
                </div>
              ))}
            </div>
          </article>

          <aside className="wallet-side">
            <article className="panel operation-panel">
              <h2>Registrar operação</h2>
              <div className="operation-type">
                <button className="active">Compra</button>
                <button>Venda</button>
                <button>Rendimento</button>
              </div>
              <label>Ticker</label>
              <input value="HGLG11" readOnly />
              <div className="form-grid">
                <div>
                  <label>Quantidade</label>
                  <input value="50" readOnly />
                </div>
                <div>
                  <label>Preço</label>
                  <input value="175,40" readOnly />
                </div>
              </div>
              <label>Data</label>
              <input value="31/05/2024" readOnly />
              <button className="primary-action">Salvar operação</button>
            </article>

            <article className="panel movement-panel">
              <h2>Últimas movimentações</h2>
              <div className="movement-list">
                {movements.map((movement) => (
                  <div className="movement-item" key={`${movement.type}-${movement.ticker}-${movement.date}`}>
                    <div>
                      <strong>{movement.type}</strong>
                      <small>{movement.ticker} • {movement.date}</small>
                    </div>
                    <div>
                      <strong>{movement.value}</strong>
                      <small>{movement.status}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}
