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
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type MarketFii = {
  dividendYield12m?: number;
  lastPrice?: number;
  name?: string;
  segment?: string;
  symbol: string;
};

type Position = {
  average: number;
  current: number;
  dy: number;
  income: number;
  name: string;
  quantity: number;
  result: number;
  segment: string;
  ticker: string;
};

type EquityPoint = {
  cdi: number;
  month: string;
  patrimonio: number;
};

type DividendPoint = {
  month: string;
  value: number;
};

type AllocationPoint = {
  amount: number;
  color: string;
  name: string;
  value: number;
};

type PortfolioRow = {
  allocation: string;
  average: string;
  bar: number;
  change: string;
  current: string;
  income: string;
  name: string;
  perShare: string;
  quantity: string;
  ticker: string;
};

type TransactionRow = {
  gross_amount: number;
  occurred_at: string;
  ticker: string;
  type: string;
  unit_price: number;
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const compactMoney = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});

const allocationColors = ["#0f5a35", "#2fb47c", "#f5aa2f", "#9aa1a5", "#d7dadd", "#89c99f"];

function formatYAxis(value: number) {
  if (value === 0) return "R$ 0";
  return `R$ ${Math.round(value / 1000)}k`;
}

function formatTooltipMoney(value: unknown) {
  return typeof value === "number" ? money.format(value) : String(value ?? "");
}

function formatTooltipPercent(value: unknown) {
  return typeof value === "number" ? `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : String(value ?? "");
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "/");
}

async function fetchMarketFii(ticker: string) {
  const response = await fetch(`/api/market-data/fiis/${ticker}`);
  if (!response.ok) return null;

  const payload = await response.json() as { data: MarketFii | null };
  return payload.data;
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

function Sparkline({ dataKey, data }: { data: number[]; dataKey: "growth" | "income" | "wallet" | "yield" }) {
  if (data.length < 2) return <svg className="sparkline" viewBox="0 0 64 42" aria-hidden="true" />;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const path = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 60 + 2;
      const y = 34 - (((value - min) / range) * 26);
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox="0 0 64 42" aria-hidden="true">
      <motion.path
        d={path}
        fill="none"
        stroke={dataKey === "yield" ? "#0f5a35" : "#14955d"}
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
  sparkData,
  sparkKey
}: {
  change: string;
  icon: typeof Wallet;
  label: string;
  sparkData: number[];
  sparkKey: "growth" | "income" | "wallet" | "yield";
  value: string;
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
      <Sparkline data={sparkData} dataKey={sparkKey} />
    </motion.article>
  );
}

export default function DashboardPage() {
  const [equityData, setEquityData] = useState<EquityPoint[]>([]);
  const [dividendData, setDividendData] = useState<DividendPoint[]>([]);
  const [allocationData, setAllocationData] = useState<AllocationPoint[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketNotice, setMarketNotice] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [scenario, setScenario] = useState("Base");
  const [reinvest, setReinvest] = useState(true);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase não está configurado para carregar o dashboard.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setError("Faça login para visualizar os dados reais do dashboard.");
      setIsLoading(false);
      return;
    }

    const { data: walletId, error: walletError } = await supabase.rpc("get_or_create_default_wallet");
    if (walletError || !walletId) {
      setError(walletError?.message ?? "Não foi possível carregar a carteira do dashboard.");
      setIsLoading(false);
      return;
    }

    const [{ data: positionRows, error: positionsError }, { data: transactions, error: transactionsError }] = await Promise.all([
      supabase
        .from("wallet_positions")
        .select("ticker, quantity, average_price, fiis(name, segment)")
        .eq("wallet_id", walletId)
        .order("ticker"),
      supabase
        .from("transactions")
        .select("ticker, type, occurred_at, unit_price, gross_amount")
        .eq("wallet_id", walletId)
        .order("occurred_at", { ascending: true })
    ]);

    if (positionsError || transactionsError) {
      setError(positionsError?.message ?? transactionsError?.message ?? "Não foi possível carregar os dados reais do dashboard.");
      setIsLoading(false);
      return;
    }

    const tickers = (positionRows ?? []).map((row) => String(row.ticker));
    const marketRows = await Promise.all(tickers.map(async (ticker) => [ticker, await fetchMarketFii(ticker)] as const));
    const marketByTicker = new Map(marketRows);
    const marketFallback = marketRows.some(([, market]) => !market?.lastPrice);

    const positions: Position[] = (positionRows ?? []).map((row) => {
      const ticker = String(row.ticker);
      const fii = Array.isArray(row.fiis) ? row.fiis[0] : row.fiis;
      const market = marketByTicker.get(ticker);
      const quantity = Number(row.quantity ?? 0);
      const average = Number(row.average_price ?? 0);
      const current = Number(market?.lastPrice ?? average);
      const dy = Number(market?.dividendYield12m ?? 0);
      const result = (current - average) * quantity;
      const estimatedIncome = current > 0 ? (current * quantity * dy) / 1200 : 0;

      return {
        average,
        current,
        dy,
        income: estimatedIncome,
        name: market?.name ?? fii?.name ?? ticker,
        quantity,
        result,
        segment: market?.segment ?? fii?.segment ?? "Sem segmento",
        ticker
      };
    });

    const currentEquity = positions.reduce((sum, position) => sum + position.quantity * position.current, 0);
    const invested = positions.reduce((sum, position) => sum + position.quantity * position.average, 0);
    const result = currentEquity - invested;
    const monthlyIncome = positions.reduce((sum, position) => sum + position.income, 0);
    const averageDy = currentEquity > 0 ? positions.reduce((sum, position) => sum + ((position.quantity * position.current) * position.dy), 0) / currentEquity : 0;

    const nextPortfolio = positions.map((position) => {
      const allocationAmount = position.quantity * position.current;
      const allocationValue = currentEquity > 0 ? (allocationAmount / currentEquity) * 100 : 0;
      const perShareIncome = position.quantity > 0 ? position.income / position.quantity : 0;
      const change = position.average > 0 ? ((position.current - position.average) / position.average) * 100 : 0;

      return {
        allocation: `${allocationValue.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
        average: money.format(position.average),
        bar: Math.min(allocationValue * 2.2, 100),
        change: `${change >= 0 ? "+" : ""}${change.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`,
        current: money.format(position.current),
        income: money.format(position.income),
        name: position.name,
        perShare: `${money.format(perShareIncome)}/cota`,
        quantity: position.quantity.toLocaleString("pt-BR"),
        ticker: position.ticker
      };
    });

    const segmentMap = new Map<string, number>();
    positions.forEach((position) => {
      const amount = position.quantity * position.current;
      segmentMap.set(position.segment, (segmentMap.get(position.segment) ?? 0) + amount);
    });

    const nextAllocation = Array.from(segmentMap.entries()).map(([name, amount], index) => ({
      amount,
      color: allocationColors[index % allocationColors.length],
      name,
      value: currentEquity > 0 ? (amount / currentEquity) * 100 : 0
    }));

    const buyTransactions = ((transactions ?? []) as TransactionRow[]).filter((row) => row.type === "buy");
    const currentMonth = new Date();
    const nextEquityData: EquityPoint[] = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (5 - index), 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthInvested = buyTransactions
        .filter((row) => row.occurred_at.startsWith(monthKey))
        .reduce((sum, row) => sum + Number(row.gross_amount ?? 0), 0);

      return {
        cdi: index === 0 ? 0 : 0,
        month: formatDateLabel(date),
        patrimonio: monthInvested,
      };
    }).reduce<EquityPoint[]>((acc, point, index) => {
      const prevPatrimonio = index === 0 ? 0 : acc[index - 1].patrimonio;
      const prevCdi = index === 0 ? 0 : acc[index - 1].cdi;
      acc.push({
        cdi: prevCdi + (prevPatrimonio * 0.0085),
        month: point.month,
        patrimonio: index === 5 ? currentEquity : prevPatrimonio + point.patrimonio
      });
      return acc;
    }, []);

    const dividendTransactions = ((transactions ?? []) as TransactionRow[]).filter((row) => row.type === "dividend");
    const nextDividendData: DividendPoint[] = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (11 - index), 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const value = dividendTransactions
        .filter((row) => row.occurred_at.startsWith(monthKey))
        .reduce((sum, row) => sum + Number(row.gross_amount ?? 0), 0);

      return { month: formatDateLabel(date), value };
    });

    setEquityData(nextEquityData);
    setDividendData(nextDividendData);
    setAllocationData(nextAllocation);
    setPortfolio(nextPortfolio);
    setMarketNotice(marketFallback ? "Alguns preços atuais não responderam na fonte de mercado; o dashboard usou o preço médio como fallback em parte da carteira." : null);
    setUpdatedAt(new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(new Date()));
    setIsLoading(false);
  }

  const projection = useMemo(() => {
    const baseEquity = equityData.at(-1)?.patrimonio ?? 0;
    const baseIncome = portfolio.reduce((sum, row) => sum + Number(row.income.replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", ".")), 0);
    const modifier = scenario === "Conservador" ? 0.82 : scenario === "Otimista" ? 1.18 : 1;
    const contribution = 1000;
    const years = 15;
    const futureAsset = (baseEquity + (contribution * 12 * years)) * modifier;
    const futureIncome = (baseIncome + (contribution * 0.08)) * modifier * (reinvest ? 1.1 : 1);

    return {
      asset: money.format(futureAsset),
      income: money.format(futureIncome)
    };
  }, [equityData, portfolio, reinvest, scenario]);

  const metricSpark = {
    growth: portfolio.map((row) => Number(row.change.replace("%", "").replace(".", "").replace(",", "."))).filter((value) => Number.isFinite(value)),
    income: dividendData.map((item) => item.value),
    wallet: equityData.map((item) => item.patrimonio),
    yield: allocationData.map((item) => item.value)
  };

  const dashboardSummary = useMemo(() => {
    const patrimony = equityData.at(-1)?.patrimonio ?? 0;
    const cdiReference = equityData.at(-1)?.cdi ?? 0;
    const growthValue = patrimony - cdiReference;
    const dividendValue = portfolio.reduce((sum, row) => sum + Number(row.income.replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", ".")), 0);
    const dyValue = allocationData.reduce((sum, item, index) => {
      const row = portfolio[index];
      if (!row) return sum;
      return sum;
    }, 0);
    const weightedDy = portfolio.length === 0
      ? 0
      : portfolio.reduce((sum, row) => sum + Number(row.allocation.replace("%", "").replace(",", ".")) * Number(row.change.replace("%", "").replace(".", "").replace(",", ".")), 0) / 100;

    return {
      dividendValue,
      growthValue,
      patrimony,
      weightedDy
    };
  }, [allocationData, equityData, portfolio]);

  return (
    <AppShell>
      <main className="dashboard">
        <section className="page-heading">
          <div>
            <h1>Simulador de Carteira FIIs</h1>
            <p>Monte sua carteira, acompanhe rendimentos e projete renda futura.</p>
          </div>
          <span>{updatedAt ? `Dados atualizados em ${updatedAt}` : "Sincronizando dados reais..."}</span>
        </section>

        {error && <div className="wallet-alert">{error}</div>}
        {marketNotice && <div className="wallet-alert subtle">{marketNotice}</div>}

        <section className="metrics-grid" aria-label="Resumo da carteira">
          <MetricCard
            icon={Wallet}
            label="Patrimônio total"
            value={money.format(dashboardSummary.patrimony)}
            change={money.format(dashboardSummary.growthValue)}
            sparkData={metricSpark.wallet}
            sparkKey="wallet"
          />
          <MetricCard
            icon={Package}
            label="Renda mensal"
            value={money.format(dashboardSummary.dividendValue)}
            change={`${portfolio.length} ativos com provento estimado`}
            sparkData={metricSpark.income}
            sparkKey="income"
          />
          <MetricCard
            icon={Percent}
            label="Dividend Yield"
            value={`${dashboardSummary.weightedDy.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`}
            change="Média da carteira"
            sparkData={metricSpark.yield}
            sparkKey="yield"
          />
          <MetricCard
            icon={TrendingUp}
            label="Valorização"
            value={money.format(dashboardSummary.growthValue)}
            change={dashboardSummary.patrimony > 0 ? `${((dashboardSummary.growthValue / dashboardSummary.patrimony) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%` : "0,00%"}
            sparkData={metricSpark.growth}
            sparkKey="growth"
          />
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
              {portfolio.length === 0 ? (
                <div className="wallet-empty-state">A carteira ainda não tem posições reais para exibir no dashboard.</div>
              ) : portfolio.map((item) => (
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
              {portfolio.length > 0 && (
                <div className="table-total">
                  <strong>Total</strong>
                  <span />
                  <span />
                  <span />
                  <strong>{money.format(dashboardSummary.dividendValue)}</strong>
                  <strong>100%</strong>
                  <span />
                </div>
              )}
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
                  <strong>{compactMoney.format(dashboardSummary.patrimony)}</strong>
                  <span>Total alocado</span>
                </div>
              </div>
              <div className="allocation-list">
                {allocationData.length === 0 ? (
                  <div className="wallet-empty-state">Sem alocação por segmento ainda.</div>
                ) : allocationData.map((item) => (
                  <div className="allocation-item" key={item.name}>
                    <span><i style={{ background: item.color }} />{item.name}</span>
                    <strong>{item.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong>
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
