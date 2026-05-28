"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { motion } from "framer-motion";
import {
  BarChart3,
  ChevronDown,
  Info,
  MoreVertical,
  Package,
  Percent,
  TrendingUp,
  Wallet
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const compactMoney = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});

const equityData = [
  { month: "Dez/23", patrimonio: 89000, cdi: 82000 },
  { month: "", patrimonio: 112000, cdi: 87000 },
  { month: "Jan/24", patrimonio: 128000, cdi: 92000 },
  { month: "", patrimonio: 151000, cdi: 97500 },
  { month: "Fev/24", patrimonio: 167000, cdi: 103000 },
  { month: "", patrimonio: 183000, cdi: 109000 },
  { month: "Mar/24", patrimonio: 193500, cdi: 116000 },
  { month: "", patrimonio: 205000, cdi: 122500 },
  { month: "Abr/24", patrimonio: 198000, cdi: 130000 },
  { month: "", patrimonio: 229000, cdi: 137000 },
  { month: "Mai/24", patrimonio: 241000, cdi: 145000 },
  { month: "", patrimonio: 284531, cdi: 153000 }
];

const dividendData = [
  { month: "Jun/23", value: 1600 },
  { month: "Jul/23", value: 1880 },
  { month: "Ago/23", value: 1810 },
  { month: "Set/23", value: 1720 },
  { month: "Out/23", value: 2350 },
  { month: "Nov/23", value: 2050 },
  { month: "Dez/23", value: 2420 },
  { month: "Jan/24", value: 2090 },
  { month: "Fev/24", value: 2320 },
  { month: "Mar/24", value: 1990 },
  { month: "Abr/24", value: 2460 },
  { month: "Mai/24", value: 2540 }
];

const allocationData = [
  { name: "Logística", value: 38.4, amount: 95353.68, color: "#0f5a35" },
  { name: "Shoppings", value: 22.7, amount: 56360.12, color: "#2fb47c" },
  { name: "Papel", value: 16.8, amount: 41799.2, color: "#f5aa2f" },
  { name: "Lajes Corporativas", value: 9.4, amount: 23333.45, color: "#9aa1a5" },
  { name: "Outros", value: 12.7, amount: 31653.9, color: "#d7dadd" }
];

const portfolio = [
  {
    ticker: "HGLG11",
    name: "CSHG Logística",
    quantity: "1.250",
    average: "R$ 160,23",
    current: "R$ 175,40",
    change: "+9,46%",
    income: "R$ 1.093,75",
    perShare: "R$ 0,8750/cota",
    allocation: "38,4%",
    bar: 84
  },
  {
    ticker: "KNRI11",
    name: "Kinea Renda Imobiliária",
    quantity: "800",
    average: "R$ 150,75",
    current: "R$ 158,60",
    change: "+5,20%",
    income: "R$ 632,00",
    perShare: "R$ 0,7900/cota",
    allocation: "22,7%",
    bar: 50
  },
  {
    ticker: "MXRF11",
    name: "Maxi Renda",
    quantity: "1.000",
    average: "R$ 10,25",
    current: "R$ 10,48",
    change: "+2,24%",
    income: "R$ 672,00",
    perShare: "R$ 0,5600/cota",
    allocation: "16,8%",
    bar: 34
  },
  {
    ticker: "XPML11",
    name: "XP Malls",
    quantity: "600",
    average: "R$ 103,50",
    current: "R$ 106,20",
    change: "+2,61%",
    income: "R$ 270,00",
    perShare: "R$ 0,4500/cota",
    allocation: "9,4%",
    bar: 18
  }
];

function formatYAxis(value: number) {
  if (value === 0) return "R$ 0";
  return `R$ ${Math.round(value / 1000)}k`;
}

function formatTooltipMoney(value: unknown) {
  return typeof value === "number" ? money.format(value) : String(value ?? "");
}

function formatTooltipPercent(value: unknown) {
  return typeof value === "number" ? `${value.toLocaleString("pt-BR")}%` : String(value ?? "");
}

function ChartFrame({
  className = "",
  children
}: {
  className?: string;
  children: (size: { width: number; height: number }) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`chart-box ${className}`} ref={ref}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
}

function Sparkline({ type }: { type: "wallet" | "income" | "yield" | "growth" }) {
  const points = {
    wallet: "M2 34 C10 32 9 20 18 24 C25 27 25 20 33 22 C39 24 42 18 48 20 C55 21 55 10 62 8",
    income: "M2 36 C8 31 12 33 18 25 C23 17 27 29 32 21 C37 12 42 22 47 14 C52 5 56 18 62 10",
    yield: "M2 15 C10 7 12 20 19 18 C26 17 29 23 36 24 C44 26 49 27 62 21",
    growth: "M2 34 C11 33 13 22 21 25 C29 28 28 12 36 18 C45 25 44 9 51 13 C56 16 57 8 62 6"
  };

  return (
    <svg className="sparkline" viewBox="0 0 64 42" aria-hidden="true">
      <motion.path
        d={points[type]}
        fill="none"
        stroke="#14955d"
        strokeLinecap="round"
        strokeWidth="2.2"
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
    </svg>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  spark
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  change: string;
  spark: "wallet" | "income" | "yield" | "growth";
}) {
  return (
    <motion.article
      className="metric-card"
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div className="metric-icon">
        <Icon size={26} />
      </div>
      <div className="metric-copy">
        <span>
          {label}
          <Info size={14} />
        </span>
        <strong>{value}</strong>
        <small>{change} <em>no período</em></small>
      </div>
      <Sparkline type={spark} />
    </motion.article>
  );
}

export default function DashboardPage() {
  const [scenario, setScenario] = useState("Base");
  const [reinvest, setReinvest] = useState(true);

  const projection = useMemo(() => {
    const modifier = scenario === "Conservador" ? 0.82 : scenario === "Otimista" ? 1.18 : 1;
    return {
      asset: money.format(986742.19 * modifier),
      income: money.format(7912.45 * modifier)
    };
  }, [scenario]);

  return (
    <AppShell>
      <main className="dashboard">
        <section className="page-heading">
          <div>
            <h1>Simulador de Carteira FIIs</h1>
            <p>Monte sua carteira, acompanhe rendimentos e projete renda futura.</p>
          </div>
          <span>Dados atualizados em 31/05/2024 às 18:40</span>
        </section>

        <section className="metrics-grid" aria-label="Resumo da carteira">
          <MetricCard icon={Wallet} label="Patrimônio total" value="R$ 284.531,42" change="+ R$ 12.384,21 (4,54%)" spark="wallet" />
          <MetricCard icon={Package} label="Renda mensal" value="R$ 2.453,18" change="+ R$ 198,72 (8,81%)" spark="income" />
          <MetricCard icon={Percent} label="Dividend Yield" value="10,36%" change="+ 0,58 p.p." spark="yield" />
          <MetricCard icon={TrendingUp} label="Valorização" value="R$ 24.631,22" change="+ 9,46%" spark="growth" />
        </section>

        <section className="main-grid">
          <article className="panel equity-panel">
            <div className="panel-header">
              <h2>Evolução do patrimônio</h2>
              <div className="range-tabs">
                {["7D", "30D", "6M", "YTD", "1A", "Todos"].map((item) => (
                  <button className={item === "6M" ? "selected" : ""} key={item}>{item}</button>
                ))}
                <button aria-label="Mais opções"><MoreVertical size={16} /></button>
              </div>
            </div>
            <div className="legend-row">
              <span><i className="solid" />Patrimônio</span>
              <span><i className="dashed" />CDI</span>
            </div>
            <ChartFrame className="large">
              {({ width, height }) => (
                  <AreaChart width={width} height={height} data={equityData} margin={{ top: 16, right: 8, left: -6, bottom: 8 }}>
                    <defs>
                      <linearGradient id="equityFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="8%" stopColor="#209865" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#209865" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e7ece9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "#d9dedb" }} tick={{ fill: "#667085", fontSize: 12 }} />
                    <YAxis tickFormatter={formatYAxis} tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                    <Tooltip formatter={formatTooltipMoney} contentStyle={{ borderRadius: 8, borderColor: "#dfe5e2" }} />
                    <Area type="monotone" dataKey="cdi" stroke="#9aa6a1" strokeDasharray="5 4" strokeWidth={1.6} fill="transparent" animationDuration={1400} />
                    <Area type="monotone" dataKey="patrimonio" stroke="#14955d" strokeWidth={2.5} fill="url(#equityFill)" animationDuration={1700} />
                  </AreaChart>
              )}
            </ChartFrame>
          </article>

          <article className="panel dividends-panel">
            <div className="panel-header">
              <h2>Renda mensal de dividendos</h2>
              <button className="select-button">12 meses <ChevronDown size={15} /></button>
            </div>
            <ChartFrame>
              {({ width, height }) => (
                  <BarChart width={width} height={height} data={dividendData} margin={{ top: 18, right: 0, left: -12, bottom: 8 }}>
                    <CartesianGrid stroke="#e7ece9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} interval={1} />
                    <YAxis tickFormatter={formatYAxis} tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                    <Tooltip formatter={formatTooltipMoney} contentStyle={{ borderRadius: 8, borderColor: "#dfe5e2" }} />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]} animationDuration={1300}>
                      {dividendData.map((entry, index) => (
                        <Cell key={entry.month + index} fill={index % 2 ? "#0f5a35" : "#144b31"} />
                      ))}
                    </Bar>
                  </BarChart>
              )}
            </ChartFrame>
            <div className="chart-caption"><span />Renda de Dividendos</div>
          </article>

          <article className="panel projection-panel">
            <h2>Projeção de renda futura</h2>
            <label>Aporte mensal</label>
            <div className="amount-control">
              <span>R$</span>
              <input value="1.000,00" readOnly />
              <button>-</button>
              <button>+</button>
            </div>

            <div className="toggle-row">
              <span>Reinvestir dividendos <Info size={14} /></span>
              <button className={`toggle ${reinvest ? "on" : ""}`} onClick={() => setReinvest((value) => !value)} aria-pressed={reinvest}>
                <i />
              </button>
            </div>

            <label>Prazo</label>
            <button className="wide-select">15 anos <ChevronDown size={16} /></button>

            <label>Cenário <Info size={14} /></label>
            <div className="scenario-tabs">
              {["Conservador", "Base", "Otimista"].map((item) => (
                <button className={scenario === item ? "active" : ""} onClick={() => setScenario(item)} key={item}>{item}</button>
              ))}
            </div>

            <div className="projection-result">
              <div>
                <small>Em 15 anos, seu patrimônio pode atingir</small>
                <strong>{projection.asset}</strong>
              </div>
              <div>
                <small>Renda mensal projetada</small>
                <strong>{projection.income}</strong>
              </div>
            </div>

            <button className="primary-action">Ver projeção detalhada <BarChart3 size={16} /></button>
          </article>
        </section>

        <section className="bottom-grid">
          <article className="panel table-panel">
            <h2>Posições na carteira</h2>
            <div className="portfolio-table">
              <div className="table-head">
                <span>Ticker</span>
                <span>Quantidade</span>
                <span>Preço médio</span>
                <span>Preço atual</span>
                <span>Renda mensal</span>
                <span>Alocação</span>
                <span />
              </div>
              {portfolio.map((item) => (
                <div className="table-row" key={item.ticker}>
                  <div><strong>{item.ticker}</strong><small>{item.name}</small></div>
                  <span>{item.quantity}</span>
                  <span>{item.average}</span>
                  <div><strong>{item.current}</strong><small className="positive">{item.change}</small></div>
                  <div><strong>{item.income}</strong><small>{item.perShare}</small></div>
                  <div className="allocation-cell">
                    <span>{item.allocation}</span>
                    <i><b style={{ width: `${item.bar}%` }} /></i>
                  </div>
                  <button aria-label={`Mais opções para ${item.ticker}`}><MoreVertical size={16} /></button>
                </div>
              ))}
              <div className="table-total">
                <strong>Total</strong>
                <span />
                <span />
                <span />
                <strong>R$ 2.453,75</strong>
                <strong>87,3%</strong>
                <span />
              </div>
            </div>
          </article>

          <article className="panel allocation-panel">
            <h2>Alocação por segmento</h2>
            <div className="allocation-content">
              <div className="donut-wrap">
                <ChartFrame className="donut-chart">
                  {({ width, height }) => (
                    <PieChart width={width} height={height}>
                      <Pie
                        data={allocationData}
                        dataKey="value"
                        innerRadius="58%"
                        outerRadius="88%"
                        paddingAngle={1}
                        animationDuration={1400}
                      >
                        {allocationData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip formatter={formatTooltipPercent} />
                    </PieChart>
                  )}
                </ChartFrame>
                <div className="donut-center">
                  <strong>R$ 248,5k</strong>
                  <span>Total alocado</span>
                </div>
              </div>
              <div className="allocation-list">
                {allocationData.map((item) => (
                  <div className="allocation-item" key={item.name}>
                    <span><i style={{ background: item.color }} />{item.name}</span>
                    <strong>{item.value.toLocaleString("pt-BR")}%</strong>
                    <small>{compactMoney.format(item.amount)}</small>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>
      </main>
    </AppShell>
  );
}
