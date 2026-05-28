"use client";

import { motion } from "framer-motion";
import {
  ArrowUpDown,
  Building2,
  ChevronDown,
  Download,
  Eye,
  Filter,
  Landmark,
  LineChart,
  Plus,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Wallet
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

const fiiRows = [
  { ticker: "HGLG11", name: "CSHG Logística", segment: "Logística", price: "R$ 175,40", dy: "9,46%", pvp: "1,04", liquidity: "R$ 9,8M", vacancy: "2,1%", score: 92 },
  { ticker: "KNRI11", name: "Kinea Renda Imobiliária", segment: "Híbrido", price: "R$ 158,60", dy: "8,91%", pvp: "0,98", liquidity: "R$ 7,2M", vacancy: "4,8%", score: 88 },
  { ticker: "MXRF11", name: "Maxi Renda", segment: "Papel", price: "R$ 10,48", dy: "11,84%", pvp: "1,01", liquidity: "R$ 15,4M", vacancy: "-", score: 84 },
  { ticker: "XPML11", name: "XP Malls", segment: "Shoppings", price: "R$ 106,20", dy: "8,54%", pvp: "0,92", liquidity: "R$ 6,9M", vacancy: "5,7%", score: 81 },
  { ticker: "VISC11", name: "Vinci Shopping Centers", segment: "Shoppings", price: "R$ 118,32", dy: "8,18%", pvp: "0,94", liquidity: "R$ 5,1M", vacancy: "3,6%", score: 79 },
  { ticker: "RBRR11", name: "RBR Rendimentos High Grade", segment: "Papel", price: "R$ 93,85", dy: "10,92%", pvp: "0,99", liquidity: "R$ 4,4M", vacancy: "-", score: 86 }
];

const highlights = [
  { ticker: "HGLG11", label: "Maior score", value: "92/100" },
  { ticker: "MXRF11", label: "Maior DY", value: "11,84%" },
  { ticker: "KNRI11", label: "Mais equilibrado", value: "0,98 P/VP" }
];

const segments = [
  { name: "Logística", funds: 42, dy: "9,1%", color: "#0f5a35" },
  { name: "Papel", funds: 86, dy: "11,2%", color: "#2fb47c" },
  { name: "Shoppings", funds: 31, dy: "8,4%", color: "#f5aa2f" },
  { name: "Híbridos", funds: 55, dy: "8,8%", color: "#9aa1a5" }
];

export default function FiisPage() {
  return (
    <AppShell searchPlaceholder="Buscar FIIs, tickers, segmentos...">
      <main className="dashboard fiis-view">
        <section className="page-heading wallet-heading">
          <div>
            <h1>FIIs</h1>
            <p>Explore fundos imobiliários, compare indicadores e encontre oportunidades para sua carteira.</p>
          </div>
          <div className="heading-actions">
            <button className="secondary-action"><Download size={17} /> Exportar lista</button>
            <button className="primary-action compact"><Plus size={17} /> Adicionar à carteira</button>
          </div>
        </section>

        <section className="fiis-summary-grid">
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span><Building2 size={20} /> FIIs monitorados</span>
            <strong>214</strong>
            <small>Fundos com indicadores ativos</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
            <span><TrendingUp size={20} /> DY médio</span>
            <strong>9,82%</strong>
            <small>Média dos últimos 12 meses</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <span><Landmark size={20} /> P/VP médio</span>
            <strong>0,97</strong>
            <small>Mercado negociando com desconto</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
            <span><ShieldCheck size={20} /> Score mínimo</span>
            <strong>75+</strong>
            <small>Filtro de qualidade ativo</small>
          </motion.article>
        </section>

        <section className="fiis-layout">
          <article className="panel fiis-table-panel">
            <div className="fiis-toolbar">
              <label className="fiis-search">
                <Search size={18} />
                <input placeholder="Buscar por ticker ou nome..." />
              </label>
              <div className="fiis-tools">
                <button><Filter size={16} /> Filtros</button>
                <button>Segmento <ChevronDown size={15} /></button>
                <button><ArrowUpDown size={16} /> Ordenar</button>
              </div>
            </div>

            <div className="fiis-table">
              <div className="fiis-head">
                <span>FII</span>
                <span>Segmento</span>
                <span>Preço</span>
                <span>DY 12M</span>
                <span>P/VP</span>
                <span>Liquidez</span>
                <span>Vacância</span>
                <span>Score</span>
                <span />
              </div>
              {fiiRows.map((fii) => (
                <div className="fiis-row" key={fii.ticker}>
                  <div className="fii-name">
                    <strong>{fii.ticker}</strong>
                    <small>{fii.name}</small>
                  </div>
                  <em>{fii.segment}</em>
                  <span>{fii.price}</span>
                  <span className="positive">{fii.dy}</span>
                  <span>{fii.pvp}</span>
                  <span>{fii.liquidity}</span>
                  <span>{fii.vacancy}</span>
                  <div className="score-cell">
                    <strong>{fii.score}</strong>
                    <i><b style={{ width: `${fii.score}%` }} /></i>
                  </div>
                  <button aria-label={`Ver ${fii.ticker}`}><Eye size={16} /></button>
                </div>
              ))}
            </div>
          </article>

          <aside className="wallet-side">
            <article className="panel fii-highlights-panel">
              <h2>Destaques</h2>
              <div className="highlight-list">
                {highlights.map((item) => (
                  <button className="highlight-item" key={item.ticker}>
                    <span><Star size={17} /></span>
                    <div>
                      <strong>{item.ticker}</strong>
                      <small>{item.label}</small>
                    </div>
                    <em>{item.value}</em>
                  </button>
                ))}
              </div>
            </article>

            <article className="panel segment-radar-panel">
              <div className="panel-header">
                <h2>Segmentos</h2>
                <button className="select-button">Mercado <ChevronDown size={15} /></button>
              </div>
              <div className="segment-radar-list">
                {segments.map((segment) => (
                  <div className="segment-radar-item" key={segment.name}>
                    <span style={{ background: segment.color }} />
                    <div>
                      <strong>{segment.name}</strong>
                      <small>{segment.funds} fundos</small>
                    </div>
                    <em>{segment.dy}</em>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>

        <section className="panel fii-insights">
          <div>
            <LineChart size={20} />
            <strong>Momentum</strong>
            <span>FIIs de papel lideram o ranking de DY, mas com maior sensibilidade ao ciclo de juros.</span>
          </div>
          <div>
            <Wallet size={20} />
            <strong>Preço justo</strong>
            <span>37 fundos estão abaixo do P/VP 0,95 com liquidez diária superior a R$ 1M.</span>
          </div>
          <div>
            <ShieldCheck size={20} />
            <strong>Qualidade</strong>
            <span>Logística mantém menor vacância média e maior previsibilidade contratual.</span>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
