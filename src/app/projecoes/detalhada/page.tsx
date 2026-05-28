"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CircleDollarSign,
  Info,
  PiggyBank,
  Target,
  TrendingUp,
  Wallet
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChartFrame } from "@/components/chart-frame";
import { buildProjection, getProjectionScenarioLabel, parseProjectionScenario, ProjectionScenario } from "@/lib/projections";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type MarketFii = {
  dividendYield12m?: number;
  lastPrice?: number;
  name?: string;
  segment?: string;
  symbol: string;
};

type AllocationPoint = {
  amount: number;
  color: string;
  name: string;
  value: number;
};

type PositionRow = {
  average_price: number;
  fiis?: { name?: string; segment?: string } | { name?: string; segment?: string }[] | null;
  quantity: number;
  ticker: string;
};

type TransactionRow = {
  gross_amount: number;
  occurred_at: string;
  ticker: string;
  type: string;
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

function formatMoney(value: unknown) {
  return typeof value === "number" ? money.format(value) : String(value ?? "");
}

async function fetchMarketFii(ticker: string) {
  const response = await fetch(`/api/market-data/fiis/${ticker}`);
  if (!response.ok) return null;

  const payload = await response.json() as { data: MarketFii | null };
  return payload.data;
}

function ProjectionDetailContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [scenario, setScenario] = useState<ProjectionScenario>("base");
  const [reinvest, setReinvest] = useState(true);
  const [years, setYears] = useState(15);
  const [monthlyContribution, setMonthlyContribution] = useState(1000);

  const [currentEquity, setCurrentEquity] = useState(0);
  const [currentMonthlyIncome, setCurrentMonthlyIncome] = useState(0);
  const [weightedDividendYield, setWeightedDividendYield] = useState(0);
  const [allocationData, setAllocationData] = useState<AllocationPoint[]>([]);
  const [positionsCount, setPositionsCount] = useState(0);
  const [marketNotice, setMarketNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setScenario(parseProjectionScenario(searchParams.get("scenario")));
    setReinvest(searchParams.get("reinvest") !== "false");

    const nextYears = Number(searchParams.get("years") ?? "15");
    setYears(Number.isFinite(nextYears) && nextYears > 0 ? nextYears : 15);

    const nextContribution = Number(searchParams.get("contribution") ?? "1000");
    setMonthlyContribution(Number.isFinite(nextContribution) && nextContribution >= 0 ? nextContribution : 1000);
  }, [searchParams]);

  useEffect(() => {
    void loadProjectionData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scenario", scenario);
    params.set("reinvest", reinvest ? "true" : "false");
    params.set("years", String(years));
    params.set("contribution", String(monthlyContribution));
    const nextQuery = params.toString();

    if (nextQuery !== searchParams.toString()) {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }
  }, [monthlyContribution, pathname, reinvest, router, scenario, searchParams, years]);

  async function loadProjectionData() {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase não está configurado para carregar a projeção.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setError("Faça login para visualizar a projeção detalhada.");
      setIsLoading(false);
      return;
    }

    const { data: walletId, error: walletError } = await supabase.rpc("get_or_create_default_wallet");
    if (walletError || !walletId) {
      setError(walletError?.message ?? "Não foi possível carregar a carteira para projeção.");
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
        .select("ticker, type, occurred_at, gross_amount")
        .eq("wallet_id", walletId)
        .order("occurred_at", { ascending: true })
    ]);

    if (positionsError || transactionsError) {
      setError(positionsError?.message ?? transactionsError?.message ?? "Não foi possível carregar os dados reais da projeção.");
      setIsLoading(false);
      return;
    }

    const tickers = ((positionRows ?? []) as PositionRow[]).map((row) => String(row.ticker));
    const marketRows = await Promise.all(tickers.map(async (ticker) => [ticker, await fetchMarketFii(ticker)] as const));
    const marketByTicker = new Map(marketRows);
    const marketFallback = marketRows.some(([, market]) => !market?.lastPrice);

    let nextEquity = 0;
    let nextIncome = 0;
    let weightedDyBase = 0;
    const segmentMap = new Map<string, number>();

    ((positionRows ?? []) as PositionRow[]).forEach((row) => {
      const ticker = String(row.ticker);
      const fii = Array.isArray(row.fiis) ? row.fiis[0] : row.fiis;
      const market = marketByTicker.get(ticker);
      const quantity = Number(row.quantity ?? 0);
      const average = Number(row.average_price ?? 0);
      const current = Number(market?.lastPrice ?? average);
      const dy = Number(market?.dividendYield12m ?? 0);
      const amount = quantity * current;
      const income = current > 0 ? (current * quantity * dy) / 1200 : 0;
      const segment = market?.segment ?? fii?.segment ?? "Sem segmento";

      nextEquity += amount;
      nextIncome += income;
      weightedDyBase += amount * dy;
      segmentMap.set(segment, (segmentMap.get(segment) ?? 0) + amount);
    });

    const nextAllocation = Array.from(segmentMap.entries())
      .map(([name, amount], index) => ({
        amount,
        color: allocationColors[index % allocationColors.length],
        name,
        value: nextEquity > 0 ? (amount / nextEquity) * 100 : 0
      }))
      .sort((left, right) => right.amount - left.amount);

    const dividendTotal = ((transactions ?? []) as TransactionRow[])
      .filter((row) => row.type === "dividend")
      .reduce((sum, row) => sum + Number(row.gross_amount ?? 0), 0);

    setCurrentEquity(nextEquity);
    setCurrentMonthlyIncome(nextIncome > 0 ? nextIncome : dividendTotal / 12);
    setWeightedDividendYield(nextEquity > 0 ? weightedDyBase / nextEquity : 0);
    setAllocationData(nextAllocation);
    setPositionsCount((positionRows ?? []).length);
    setMarketNotice(
      marketFallback
        ? "Parte da projeção está usando preço médio como fallback porque alguns preços de mercado não responderam."
        : null
    );
    setIsLoading(false);
  }

  const projection = useMemo(() => buildProjection({
    currentEquity,
    currentMonthlyIncome,
    monthlyContribution,
    reinvestDividends: reinvest,
    weightedDividendYield,
    years
  }, scenario), [currentEquity, currentMonthlyIncome, monthlyContribution, reinvest, scenario, weightedDividendYield, years]);

  const activeScenario = useMemo(
    () => projection.comparison.find((item) => item.key === scenario) ?? projection.comparison[1],
    [projection.comparison, scenario]
  );

  const topSegments = useMemo(() => allocationData.slice(0, 3), [allocationData]);

  const contributionTotal = monthlyContribution * years * 12;
  const projectedGain = Math.max(0, projection.futureEquity - currentEquity - contributionTotal);
  const concentration = topSegments[0];

  return (
    <AppShell searchPlaceholder="Buscar projeções detalhadas, cenários, metas...">
      <main className="dashboard projections-view projection-detail-view">
        <section className="page-heading wallet-heading">
          <div>
            <h1>Projeção detalhada</h1>
            <p>Entenda o caminho projetado da sua carteira, as premissas usadas e o impacto de cada ajuste.</p>
          </div>
          <div className="heading-actions">
            <button className="secondary-action" onClick={() => router.push("/projecoes")} type="button">
              Ver visão geral
            </button>
            <button className="primary-action compact" onClick={() => router.push("/carteira")} type="button">
              Ajustar carteira
            </button>
          </div>
        </section>

        {error && <div className="wallet-alert">{error}</div>}
        {marketNotice && <div className="wallet-alert subtle">{marketNotice}</div>}

        {isLoading ? (
          <section className="panel">
            <div className="wallet-empty-state">Calculando projeção com base na sua carteira...</div>
          </section>
        ) : currentEquity <= 0 ? (
          <section className="panel">
            <div className="wallet-empty-state projection-empty-state">
              <strong>Sua carteira ainda está vazia.</strong>
              <span>A análise detalhada aparece assim que você criar sua posição inicial com dados reais.</span>
              <button onClick={() => router.push("/carteira")} type="button">Montar carteira agora</button>
            </div>
          </section>
        ) : (
          <>
            <section className="projection-command panel projection-detail-hero">
              <div className="projection-goal">
                <span><Target size={19} /> Cenário ativo</span>
                <strong>{getProjectionScenarioLabel(scenario)}</strong>
                <p>{projection.scenarioDescription}</p>
                <div className="projection-control-grid">
                  <label>
                    <span>Aporte mensal</span>
                    <div className="projection-stepper">
                      <button onClick={() => setMonthlyContribution((value) => Math.max(0, value - 100))} type="button">-</button>
                      <input
                        onChange={(event) => setMonthlyContribution(Math.max(0, Number(event.target.value) || 0))}
                        type="number"
                        value={monthlyContribution}
                      />
                      <button onClick={() => setMonthlyContribution((value) => value + 100)} type="button">+</button>
                    </div>
                  </label>
                  <label>
                    <span>Prazo</span>
                    <select onChange={(event) => setYears(Number(event.target.value))} value={years}>
                      {[5, 10, 15, 20, 25].map((option) => (
                        <option key={option} value={option}>{option} anos</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="projection-status">
                <div>
                  <small>Patrimônio atual</small>
                  <strong>{money.format(currentEquity)}</strong>
                </div>
                <div>
                  <small>Renda mensal atual</small>
                  <strong>{money.format(currentMonthlyIncome)}</strong>
                </div>
                <div>
                  <small>DY base da carteira</small>
                  <strong>{projection.annualYield.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</strong>
                </div>
              </div>

              <div className="projection-arc" aria-label="Impacto do reinvestimento">
                <div className="arc-ring">
                  <span>{reinvest ? "ON" : "OFF"}</span>
                </div>
                <p>
                  Reinvestimento {reinvest ? "ativado" : "desativado"}.
                  {reinvest ? " Os dividendos entram na curva de crescimento do patrimônio." : " Os dividendos ficam fora da curva patrimonial projetada."}
                </p>
                <button className={`toggle ${reinvest ? "on" : ""}`} onClick={() => setReinvest((value) => !value)} type="button">
                  <i />
                </button>
              </div>
            </section>

            <section className="projection-cards">
              <motion.article className="wallet-summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <span><Wallet size={20} /> Patrimônio futuro</span>
                <strong>{money.format(projection.futureEquity)}</strong>
                <small>{compactMoney.format(contributionTotal)} em aportes no período</small>
              </motion.article>
              <motion.article className="wallet-summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <span><CircleDollarSign size={20} /> Renda mensal futura</span>
                <strong>{money.format(projection.futureMonthlyIncome)}</strong>
                <small>Hoje a carteira gera {money.format(currentMonthlyIncome)}/mês</small>
              </motion.article>
              <motion.article className="wallet-summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <span><PiggyBank size={20} /> Crescimento projetado</span>
                <strong>{money.format(projectedGain)}</strong>
                <small>Ganhos estimados acima do patrimônio atual e dos aportes</small>
              </motion.article>
              <motion.article className="wallet-summary-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <span><TrendingUp size={20} /> Estrutura atual</span>
                <strong>{positionsCount} ativos</strong>
                <small>{concentration ? `${concentration.name} lidera com ${concentration.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "Carteira diversificada"}</small>
              </motion.article>
            </section>

            <section className="projection-detail-layout">
              <article className="panel projection-detail-chart">
                <div className="panel-header">
                  <h2>Evolução do patrimônio projetado</h2>
                  <div className="range-tabs">
                    <button className="selected" type="button">Real</button>
                    <button type="button">Base</button>
                  </div>
                </div>
                <ChartFrame className="large">
                  {({ width, height }) => (
                    <AreaChart width={width} height={height} data={projection.series} margin={{ bottom: 8, left: -6, right: 8, top: 18 }}>
                      <defs>
                        <linearGradient id="projectionEquityFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="8%" stopColor="#209865" stopOpacity={0.24} />
                          <stop offset="95%" stopColor="#209865" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e7ece9" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#d9dedb" }} tick={{ fill: "#667085", fontSize: 12 }} />
                      <YAxis tickFormatter={formatYAxis} tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                      <Tooltip formatter={formatMoney} contentStyle={{ borderColor: "#dfe5e2", borderRadius: 8 }} />
                      <Area type="monotone" dataKey="contributions" stroke="#98a2b3" strokeDasharray="5 4" strokeWidth={1.5} fill="transparent" />
                      <Area type="monotone" dataKey="equity" stroke="#14955d" strokeWidth={2.5} fill="url(#projectionEquityFill)" />
                    </AreaChart>
                  )}
                </ChartFrame>
              </article>

              <aside className="wallet-side">
                <article className="panel scenario-compare-panel">
                  <div className="panel-header">
                    <h2>Cenários</h2>
                    <span className="projection-badge">{years} anos</span>
                  </div>
                  <div className="scenario-card-list">
                    {projection.comparison.map((item) => (
                      <button className={item.key === scenario ? "active" : ""} onClick={() => setScenario(item.key)} key={item.key} type="button">
                        <span style={{ background: item.color }} />
                        <div>
                          <strong>{item.label}</strong>
                          <small>{money.format(item.futureEquity)}</small>
                        </div>
                        <em>{money.format(item.futureMonthlyIncome)}</em>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="panel projection-actions-panel">
                  <h2>Leituras rápidas</h2>
                  <div className="action-list">
                    <span><ArrowRight size={17} /> {activeScenario.description}</span>
                    <span><ArrowRight size={17} /> Cada R$ 100/mês adicionados aumentam a curva de aportes em {money.format(years * 12 * 100)} no horizonte atual.</span>
                    <span><ArrowRight size={17} /> {reinvest ? "Com reinvestimento, a renda projetada acelera junto com o patrimônio." : "Sem reinvestimento, a renda cresce mais devagar e depende mais dos aportes."}</span>
                    <span><ArrowRight size={17} /> DY base considerado: {projection.annualYield.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% ao ano.</span>
                  </div>
                </article>
              </aside>
            </section>

            <section className="projection-detail-bottom">
              <article className="panel projection-detail-income">
                <div className="panel-header">
                  <h2>Curva da renda mensal</h2>
                  <span className="projection-badge">{getProjectionScenarioLabel(scenario)}</span>
                </div>
                <div className="projection-mini-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projection.series} margin={{ bottom: 8, left: -6, right: 8, top: 18 }}>
                      <CartesianGrid stroke="#e7ece9" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#d9dedb" }} tick={{ fill: "#667085", fontSize: 12 }} />
                      <YAxis tickFormatter={formatYAxis} tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 12 }} />
                      <Tooltip formatter={formatMoney} contentStyle={{ borderColor: "#dfe5e2", borderRadius: 8 }} />
                      <Line type="monotone" dataKey="monthlyIncome" stroke="#0f5a35" strokeWidth={2.4} dot={{ fill: "#0f5a35", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="panel projection-detail-breakdown">
                <div className="panel-header">
                  <h2>Como calculamos</h2>
                  <span className="projection-badge">Metodologia</span>
                </div>
                <div className="assumption-list">
                  <span><Info size={16} /> Patrimônio atual + aportes mensais + crescimento mensal por cenário formam a base da curva.</span>
                  <span><Info size={16} /> O yield anual usado começa no DY ponderado da sua carteira e recebe ajuste conforme o cenário.</span>
                  <span><Info size={16} /> Quando o reinvestimento está ativo, os dividendos estimados voltam para o patrimônio e aumentam a próxima rodada de renda.</span>
                  <span><Info size={16} /> Se uma cotação real não responde, usamos o preço médio da posição como fallback visual para não quebrar a análise.</span>
                </div>
              </article>
            </section>

            <section className="panel segment-projection-panel">
              <div className="panel-header">
                <h2>Impacto por segmento</h2>
                <span className="projection-badge">Base atual</span>
              </div>
              <div className="segment-projection-table">
                <div className="segment-projection-head">
                  <span>Segmento</span>
                  <span>Alocação atual</span>
                  <span>Valor atual</span>
                  <span>Leitura</span>
                </div>
                {allocationData.map((segment) => (
                  <div className="segment-projection-row" key={segment.name}>
                    <strong>{segment.name}</strong>
                    <span>{segment.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
                    <span>{compactMoney.format(segment.amount)}</span>
                    <span>{segment.value >= 30 ? "Alta influência na curva" : segment.value >= 15 ? "Peso relevante" : "Peso complementar"}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel projection-detail-income-bars">
              <div className="panel-header">
                <h2>Marcos anuais de renda</h2>
                <span className="projection-badge">Renda projetada</span>
              </div>
              <div className="income-bars">
                {projection.series.slice(1).map((item) => (
                  <div className="income-bar" key={item.label}>
                    <div>
                      <span style={{ height: `${Math.max(28, item.monthlyIncome / 45)}px` }} />
                    </div>
                    <strong>{item.label}</strong>
                    <small>{money.format(item.monthlyIncome)}</small>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}

export default function ProjectionDetailPage() {
  return (
    <Suspense
      fallback={
        <AppShell searchPlaceholder="Buscar projeções detalhadas, cenários, metas...">
          <main className="dashboard projections-view projection-detail-view">
            <section className="panel">
              <div className="wallet-empty-state">Preparando análise detalhada da projeção...</div>
            </section>
          </main>
        </AppShell>
      }
    >
      <ProjectionDetailContent />
    </Suspense>
  );
}
