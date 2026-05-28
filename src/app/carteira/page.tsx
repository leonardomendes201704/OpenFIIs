"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownUp,
  ChevronDown,
  Download,
  Eye,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Trash2,
  Wallet,
  X
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { InfoDialogButton } from "@/components/info-dialog-button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Position = {
  ticker: string;
  name: string;
  segment: string;
  quantity: number;
  average: number;
  price: number;
  dy: string;
  income: number;
  allocation: number;
  priceSource: "market" | "average";
};

type Movement = {
  date: string;
  status: string;
  ticker: string;
  type: "Compra" | "Venda" | "Rendimento";
  value: number;
};

type FiiOption = {
  ticker: string;
  name: string;
  segment: string;
  price?: number;
  dy?: number;
  source?: string;
};

type MarketFii = {
  dividendYield12m?: number;
  lastPrice?: number;
  name?: string;
  segment?: string;
  source?: string;
  symbol: string;
};

type WalletTab = "positions" | "operations" | "dividends";

const currency = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

function parseBrazilianNumber(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

function formatDy(value?: number) {
  if (!Number.isFinite(value)) return "-";
  return `${(value as number).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

function movementLabel(type: string): Movement["type"] {
  if (type === "sell") return "Venda";
  if (type === "dividend") return "Rendimento";
  return "Compra";
}

function movementStatus(type: Movement["type"]) {
  if (type === "Rendimento") return "Recebido";
  if (type === "Venda") return "Liquidado";
  return "Liquidado";
}

function recalculateAllocations(positions: Position[]) {
  const total = positions.reduce((sum, position) => sum + position.quantity * position.price, 0);

  return positions.map((position) => ({
    ...position,
    allocation: total > 0 ? ((position.quantity * position.price) / total) * 100 : 0
  }));
}

async function fetchMarketFii(ticker: string) {
  const response = await fetch(`/api/market-data/fiis/${ticker}`);
  if (!response.ok) return null;

  const payload = await response.json() as { data: MarketFii | null };
  return payload.data;
}

export default function CarteiraPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [fiis, setFiis] = useState<FiiOption[]>([]);
  const [activeTab, setActiveTab] = useState<WalletTab>("positions");
  const [isOperationOpen, setIsOperationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketNotice, setMarketNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("HGLG11");
  const [selectedTicker, setSelectedTicker] = useState("");
  const [quantity, setQuantity] = useState("50");
  const [quotaPrice, setQuotaPrice] = useState("");
  const [detailPosition, setDetailPosition] = useState<Position | null>(null);

  const selectedFii = useMemo(() => {
    return fiis.find((fii) => fii.ticker === selectedTicker) ?? null;
  }, [fiis, selectedTicker]);

  const operationTotal = useMemo(() => {
    return parseBrazilianNumber(quantity) * parseBrazilianNumber(quotaPrice);
  }, [quantity, quotaPrice]);

  const summary = useMemo(() => {
    const current = positions.reduce((sum, position) => sum + position.quantity * position.price, 0);
    const invested = positions.reduce((sum, position) => sum + position.quantity * position.average, 0);
    const income = positions.reduce((sum, position) => sum + position.income, 0);
    const quantitySum = positions.reduce((sum, position) => sum + position.quantity, 0);
    const averagePrice = quantitySum > 0 ? invested / quantitySum : 0;
    const result = current - invested;

    return { averagePrice, current, income, invested, result };
  }, [positions]);

  const resultPercentage = summary.invested > 0 ? (summary.result / summary.invested) * 100 : 0;
  const maxAllocation = positions.length > 0 ? Math.max(...positions.map((position) => position.allocation)) : 0;
  const dividendMovements = useMemo(() => movements.filter((movement) => movement.type === "Rendimento"), [movements]);

  useEffect(() => {
    loadWalletData();
    loadFiis("HGLG11");

    function handleOnboardingFinished() {
      loadWalletData();
    }

    window.addEventListener("openfiis:onboarding-finished", handleOnboardingFinished);
    return () => window.removeEventListener("openfiis:onboarding-finished", handleOnboardingFinished);
  }, []);

  useEffect(() => {
    if (!isOperationOpen) return;

    const timeout = window.setTimeout(() => {
      loadFiis(query);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [isOperationOpen, query]);

  async function getOrCreateWalletId(userId: string) {
    if (!supabase) throw new Error("Supabase não configurado.");

    const rpcResult = await supabase.rpc("get_or_create_default_wallet");
    if (!rpcResult.error && rpcResult.data) {
      return String(rpcResult.data);
    }

    const { data: existingWallet, error: existingError } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .order("created_at")
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingWallet?.id) return String(existingWallet.id);

    const { data: createdWallet, error: createError } = await supabase
      .from("wallets")
      .insert({ name: "Carteira principal", user_id: userId })
      .select("id")
      .single();

    if (createError) throw createError;
    return String(createdWallet.id);
  }

  async function loadWalletData() {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase não está configurado. Confira as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setError("Faça login para carregar sua carteira.");
      setIsLoading(false);
      return;
    }

    let walletId: string;
    try {
      walletId = await getOrCreateWalletId(authData.user.id);
    } catch (walletError) {
      setError(walletError instanceof Error ? walletError.message : "Não foi possível carregar sua carteira.");
      setIsLoading(false);
      return;
    }

    const [{ data: positionRows, error: positionsError }, { data: transactionRows, error: transactionsError }] = await Promise.all([
      supabase
        .from("wallet_positions")
        .select("ticker, quantity, average_price, fiis(name, segment)")
        .eq("wallet_id", walletId)
        .order("ticker"),
      supabase
        .from("transactions")
        .select("id, ticker, type, quantity, unit_price, gross_amount, occurred_at")
        .eq("wallet_id", walletId)
        .order("occurred_at", { ascending: false })
        .order("created_at", { ascending: false })
    ]);

    if (positionsError || transactionsError) {
      setError(positionsError?.message ?? transactionsError?.message ?? "Não foi possível buscar os dados da carteira.");
      setIsLoading(false);
      return;
    }

    const tickers = (positionRows ?? []).map((row) => String(row.ticker));
    const marketRows = await Promise.all(tickers.map(async (ticker) => [ticker, await fetchMarketFii(ticker)] as const));
    const marketByTicker = new Map(marketRows);
    const usedAverageAsPrice = marketRows.some(([, market]) => !market?.lastPrice);

    const nextPositions = recalculateAllocations((positionRows ?? []).map((row) => {
      const ticker = String(row.ticker);
      const market = marketByTicker.get(ticker);
      const fii = Array.isArray(row.fiis) ? row.fiis[0] : row.fiis;
      const quantityValue = Number(row.quantity ?? 0);
      const averageValue = Number(row.average_price ?? 0);
      const currentPrice = Number(market?.lastPrice ?? averageValue);

      return {
        allocation: 0,
        average: averageValue,
        dy: formatDy(market?.dividendYield12m),
        income: 0,
        name: market?.name ?? fii?.name ?? ticker,
        price: currentPrice,
        priceSource: market?.lastPrice ? "market" : "average",
        quantity: quantityValue,
        segment: market?.segment ?? fii?.segment ?? "Sem segmento",
        ticker
      };
    }));

    const nextMovements = (transactionRows ?? []).map((row) => {
      const type = movementLabel(String(row.type));

      return {
        date: formatDate(String(row.occurred_at)),
        status: movementStatus(type),
        ticker: String(row.ticker),
        type,
        value: Number(row.gross_amount ?? 0)
      };
    });

    setPositions(nextPositions);
    setMovements(nextMovements);
    setMarketNotice(usedAverageAsPrice ? "Alguns preços atuais não responderam na fonte de mercado; nesses casos a tela usa o preço médio apenas como fallback visual." : null);
    setIsLoading(false);
  }

  async function loadFiis(search: string) {
    const normalized = search.trim();

    try {
      const response = await fetch(`/api/market-data/fiis?q=${encodeURIComponent(normalized)}`);
      if (!response.ok) throw new Error("Fonte de mercado indisponível.");

      const payload = await response.json() as { data: MarketFii[] };
      const options = (payload.data ?? []).slice(0, 8).map((fii) => ({
        dy: fii.dividendYield12m,
        name: fii.name ?? fii.symbol,
        price: fii.lastPrice,
        segment: fii.segment ?? "Sem segmento",
        source: fii.source,
        ticker: fii.symbol
      }));

      setFiis(options);

      if (!selectedTicker && options[0]) {
        selectFii(options[0], options);
      }
    } catch {
      if (!supabase) return;

      const { data } = await supabase
        .from("fiis")
        .select("ticker, name, segment, source")
        .or(`ticker.ilike.%${normalized}%,name.ilike.%${normalized}%`)
        .limit(8);

      const options = (data ?? []).map((fii) => ({
        name: fii.name,
        segment: fii.segment ?? "Sem segmento",
        source: fii.source ?? "supabase",
        ticker: fii.ticker
      }));

      setFiis(options);
      if (!selectedTicker && options[0]) {
        selectFii(options[0], options);
      }
    }
  }

  async function openOperationModal() {
    setIsOperationOpen(true);
    setQuery(selectedTicker || "HGLG11");
    await loadFiis(selectedTicker || "HGLG11");
  }

  function openOnboardingWizard() {
    window.dispatchEvent(new Event("openfiis:open-onboarding"));
  }

  async function selectFii(fii: FiiOption, options = fiis) {
    setSelectedTicker(fii.ticker);
    setQuery(fii.ticker);

    let nextFii = fii;
    if (!nextFii.price) {
      const market = await fetchMarketFii(fii.ticker);
      if (market) {
        nextFii = {
          ...fii,
          dy: market.dividendYield12m,
          name: market.name ?? fii.name,
          price: market.lastPrice,
          segment: market.segment ?? fii.segment,
          source: market.source
        };
        setFiis(options.map((item) => item.ticker === nextFii.ticker ? nextFii : item));
      }
    }

    if (nextFii.price) {
      setQuotaPrice(decimal.format(nextFii.price));
    }
  }

  async function handleSaveOperation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedFii) return;

    const boughtQuantity = parseBrazilianNumber(quantity);
    const boughtPrice = parseBrazilianNumber(quotaPrice);

    if (boughtQuantity <= 0 || boughtPrice <= 0) {
      setError("Informe quantidade e valor da cota maiores que zero.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const rpcResult = await supabase.rpc("record_buy_transaction", {
      p_name: selectedFii.name,
      p_occurred_at: new Date().toISOString().slice(0, 10),
      p_quantity: boughtQuantity,
      p_segment: selectedFii.segment,
      p_ticker: selectedFii.ticker,
      p_unit_price: boughtPrice
    });

    if (rpcResult.error) {
      try {
        await recordBuyDirect(selectedFii, boughtQuantity, boughtPrice);
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar a operação.");
        setIsSaving(false);
        return;
      }
    }

    await loadWalletData();
    setActiveTab("operations");
    setIsOperationOpen(false);
    setIsSaving(false);
  }

  async function recordBuyDirect(fii: FiiOption, boughtQuantity: number, boughtPrice: number) {
    if (!supabase) throw new Error("Supabase não configurado.");

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw new Error("Faça login para salvar operações.");

    const walletId = await getOrCreateWalletId(authData.user.id);

    await supabase.from("fiis").upsert({
      name: fii.name,
      segment: fii.segment,
      source: fii.source ?? "market",
      ticker: fii.ticker
    });

    const { error: transactionError } = await supabase.from("transactions").insert({
      occurred_at: new Date().toISOString().slice(0, 10),
      quantity: boughtQuantity,
      ticker: fii.ticker,
      type: "buy",
      unit_price: boughtPrice,
      user_id: authData.user.id,
      wallet_id: walletId
    });

    if (transactionError) {
      throw new Error(transactionError.message.includes("foreign key")
        ? "Este FII ainda não existe no catálogo da base. Aplique a migration 002 para permitir cadastro automático a partir da fonte de mercado."
        : transactionError.message);
    }

    const { data: existingPosition, error: positionError } = await supabase
      .from("wallet_positions")
      .select("quantity, average_price")
      .eq("wallet_id", walletId)
      .eq("ticker", fii.ticker)
      .maybeSingle();

    if (positionError) throw positionError;

    if (!existingPosition) {
      const { error: insertPositionError } = await supabase.from("wallet_positions").insert({
        average_price: boughtPrice,
        quantity: boughtQuantity,
        ticker: fii.ticker,
        user_id: authData.user.id,
        wallet_id: walletId
      });
      if (insertPositionError) throw insertPositionError;
      return;
    }

    const currentQuantity = Number(existingPosition.quantity ?? 0);
    const currentAverage = Number(existingPosition.average_price ?? 0);
    const nextQuantity = currentQuantity + boughtQuantity;
    const nextAverage = ((currentQuantity * currentAverage) + (boughtQuantity * boughtPrice)) / nextQuantity;

    const { error: updatePositionError } = await supabase
      .from("wallet_positions")
      .update({ average_price: nextAverage, quantity: nextQuantity })
      .eq("wallet_id", walletId)
      .eq("ticker", fii.ticker);

    if (updatePositionError) throw updatePositionError;
  }

  async function deletePosition(ticker: string) {
    if (!supabase) return;

    setError(null);
    const rpcResult = await supabase.rpc("delete_wallet_position", { p_ticker: ticker });
    if (rpcResult.error) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setError("Faça login para excluir posições.");
        return;
      }

      try {
        const walletId = await getOrCreateWalletId(authData.user.id);
        const { error: deleteError } = await supabase
          .from("wallet_positions")
          .delete()
          .eq("wallet_id", walletId)
          .eq("ticker", ticker);

        if (deleteError) throw deleteError;
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : "Não foi possível excluir a posição.");
        return;
      }
    }

    setDetailPosition(null);
    await loadWalletData();
  }

  return (
    <AppShell searchPlaceholder="Buscar FIIs, posições, operações...">
      <main className="dashboard wallet-view">
        <section className="page-heading wallet-heading">
          <div>
            <h1>Carteira</h1>
            <p>Gerencie posições, acompanhe alocação e registre operações reais por usuário.</p>
          </div>
          <div className="heading-actions">
            <button className="secondary-action"><Download size={17} /> Exportar</button>
            <button className="primary-action compact" onClick={openOperationModal}><Plus size={17} /> Nova operação</button>
          </div>
        </section>

        {error && <div className="wallet-alert">{error}</div>}
        {marketNotice && <div className="wallet-alert subtle">{marketNotice}</div>}

        <section className="wallet-summary-grid">
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span><Wallet size={20} /> Valor atual<InfoDialogButton label="Entender valor atual da carteira" title="Valor atual da carteira" summary="Esse KPI mostra quanto suas posições valem hoje usando preço de mercado quando disponível." bullets={["Somamos quantidade em carteira multiplicada pelo preço atual de cada FII.","Quando a cotação não responde, o sistema usa o preço médio da posição como fallback visual.","É a leitura direta do patrimônio alocado na carteira neste momento."]} /></span>
            <strong>{currency.format(summary.current)}</strong>
            <small className={summary.result >= 0 ? "positive" : ""}>{currency.format(summary.result)} desde o início</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
            <span><TrendingUp size={20} /> Resultado<InfoDialogButton label="Entender resultado da carteira" title="Resultado consolidado" summary="Resultado compara o valor atual da carteira com o capital efetivamente investido nas posições abertas." bullets={["É a diferença entre patrimônio atual e custo médio total investido.","O percentual ajuda a ler o retorno agregado sem entrar ativo por ativo.","Não inclui posições encerradas que já saíram da carteira aberta."]} /></span>
            <strong>{resultPercentage.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</strong>
            <small className={summary.result >= 0 ? "positive" : ""}>{currency.format(summary.result)} no período</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <span><ArrowDownUp size={20} /> Preço médio<InfoDialogButton label="Entender preço médio" title="Preço médio consolidado" summary="Preço médio resume o custo médio por cota considerando todas as posições abertas da carteira." bullets={["Usa o capital investido dividido pela quantidade total de cotas mantidas.","Serve de referência para medir valorização e ponto de equilíbrio.","Novas compras ajustam esse indicador automaticamente."]} /></span>
            <strong>{currency.format(summary.averagePrice)}</strong>
            <small>{positions.length} ativos com posição aberta</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
            <span><ShieldCheck size={20} /> Risco de concentração<InfoDialogButton label="Entender risco de concentração" title="Risco de concentração" summary="Esse indicador olha o peso da maior posição para sinalizar quão dependente a carteira está de um único ativo." bullets={["Quanto maior o percentual da principal posição, maior a sensibilidade a um único FII.","A régua atual classifica como baixo, moderado ou alto com base no maior peso encontrado.","É um alerta rápido de diversificação, não uma recomendação automática."]} /></span>
            <strong>{maxAllocation > 40 ? "Alto" : maxAllocation > 25 ? "Moderado" : "Baixo"}</strong>
            <small>Maior posição em {maxAllocation.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</small>
          </motion.article>
        </section>

        <section className="wallet-layout">
          <article className="panel positions-panel">
            <div className="wallet-toolbar">
              <div className="wallet-tabs">
                <button className={activeTab === "positions" ? "active" : ""} onClick={() => setActiveTab("positions")}>Posições</button>
                <button className={activeTab === "operations" ? "active" : ""} onClick={() => setActiveTab("operations")}>Operações</button>
                <button className={activeTab === "dividends" ? "active" : ""} onClick={() => setActiveTab("dividends")}>Proventos</button>
              </div>
              <div className="wallet-tools">
                <button><SlidersHorizontal size={16} /> Filtros</button>
                <button>{activeTab === "positions" ? "Todos os segmentos" : "Todas as datas"} <ChevronDown size={15} /></button>
              </div>
            </div>

            {activeTab === "positions" && (
              <div className="wallet-table">
                <div className="wallet-table-head">
                  <span>Ativo</span>
                  <span className="wallet-head-center">Qtd.</span>
                  <span className="wallet-head-center">Preço médio</span>
                  <span className="wallet-head-center">Preço atual</span>
                  <span className="wallet-head-center">Investido</span>
                  <span className="wallet-head-center">Atual</span>
                  <span className="wallet-head-center">Resultado</span>
                  <span className="wallet-head-center">DY</span>
                  <span className="wallet-head-center">Provisão mensal</span>
                  <span className="wallet-head-center">Alocação</span>
                  <span />
                </div>
                {isLoading ? (
                  <div className="wallet-empty-state">Carregando carteira...</div>
                ) : positions.length === 0 ? (
                  <div className="wallet-empty-state">
                    <span>Nenhuma posição em carteira. Monte sua carteira inicial pelo wizard ou registre uma compra avulsa.</span>
                    <button onClick={openOnboardingWizard} type="button">Montar carteira inicial</button>
                  </div>
                ) : positions.map((item) => {
                  const invested = item.quantity * item.average;
                  const current = item.quantity * item.price;
                  const result = current - invested;

                  return (
                    <div className="wallet-row" key={item.ticker}>
                      <div className="asset-cell">
                        <span className="asset-pill">({item.segment})</span>
                        <strong>{item.ticker}</strong>
                        <small>({item.name})</small>
                      </div>
                      <span className="wallet-cell-center">{item.quantity.toLocaleString("pt-BR")}</span>
                      <span className="wallet-cell-center">{currency.format(item.average)}</span>
                      <span className="wallet-cell-center">{currency.format(item.price)}</span>
                      <span className="wallet-cell-center">{currency.format(invested)}</span>
                      <strong className="wallet-cell-center">{currency.format(current)}</strong>
                      <span className={`wallet-cell-center ${result >= 0 ? "positive" : ""}`}>{currency.format(result)}</span>
                      <span className="wallet-cell-center">{item.dy}</span>
                      <span className="wallet-cell-center">{currency.format(item.income)}</span>
                      <div className="wallet-allocation">
                        <span>{item.allocation.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>
                        <i><b style={{ width: `${Math.min(item.allocation * 2.2, 100)}%` }} /></i>
                      </div>
                      <div className="wallet-row-actions">
                        <button className="row-action-button" aria-label={`Ver detalhes de ${item.ticker}`} title="Detalhes" onClick={() => setDetailPosition(item)}>
                          <Eye size={16} />
                        </button>
                        <button className="row-action-button danger" aria-label={`Excluir ${item.ticker}`} title="Excluir" onClick={() => deletePosition(item.ticker)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "operations" && (
              <div className="wallet-table operations-table">
                <div className="wallet-table-head operations-head">
                  <span>Data</span>
                  <span>Tipo</span>
                  <span>Ativo</span>
                  <span>Valor</span>
                  <span>Status</span>
                </div>
                {movements.length === 0 ? (
                  <div className="wallet-empty-state">Nenhuma operação registrada ainda.</div>
                ) : movements.map((movement, index) => (
                  <div className="wallet-row operations-row" key={`${movement.type}-${movement.ticker}-${movement.date}-${index}`}>
                    <span>{movement.date}</span>
                    <strong>{movement.type}</strong>
                    <span>{movement.ticker}</span>
                    <span>{movement.value > 0 ? currency.format(movement.value) : "-"}</span>
                    <em>{movement.status}</em>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "dividends" && (
              <div className="wallet-table dividends-table">
                <div className="wallet-table-head dividends-head">
                  <span>Data</span>
                  <span>Ativo</span>
                  <span>Provento</span>
                  <span>Status</span>
                  <span>Origem</span>
                </div>
                {dividendMovements.length === 0 ? (
                  <div className="wallet-empty-state">Nenhum provento recebido para este usuário.</div>
                ) : dividendMovements.map((movement, index) => (
                  <div className="wallet-row dividends-row" key={`${movement.ticker}-${movement.date}-${index}`}>
                    <span>{movement.date}</span>
                    <strong>{movement.ticker}</strong>
                    <span className="positive">{currency.format(movement.value)}</span>
                    <em>{movement.status}</em>
                    <span>Transação da carteira</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="panel movement-panel">
            <h2>Últimas movimentações</h2>
            <div className="movement-list">
              {movements.length === 0 ? (
                <div className="movement-empty">Sem movimentações registradas.</div>
              ) : movements.slice(0, 6).map((movement, index) => (
                <div className="movement-item" key={`${movement.type}-${movement.ticker}-${movement.date}-${index}`}>
                  <div>
                    <strong>{movement.type}</strong>
                    <small>{movement.ticker} • {movement.date}</small>
                  </div>
                  <div>
                    <strong>{currency.format(movement.value)}</strong>
                    <small>{movement.status}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>

      {isOperationOpen && (
        <div className="operation-modal-backdrop" role="presentation">
          <form className="operation-modal" onSubmit={handleSaveOperation}>
            <div className="operation-modal-header">
              <div>
                <span>Compra de FII</span>
                <h2>Nova operação</h2>
              </div>
              <button type="button" onClick={() => setIsOperationOpen(false)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <label>
              Buscar FII
              <div className="operation-search">
                <Search size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value.toUpperCase())} placeholder="Digite ticker ou nome do fundo" />
              </div>
            </label>

            <div className="operation-fii-list">
              {fiis.length === 0 ? (
                <div className="operation-empty">Nenhum FII encontrado na fonte de mercado.</div>
              ) : fiis.map((fii) => (
                <button className={selectedTicker === fii.ticker ? "active" : ""} type="button" onClick={() => selectFii(fii)} key={fii.ticker}>
                  <div>
                    <strong>{fii.ticker}</strong>
                    <small>{fii.name}</small>
                  </div>
                  <span>{fii.price ? currency.format(fii.price) : "Consultar"}</span>
                </button>
              ))}
            </div>

            <div className="operation-modal-grid">
              <label>
                Quantidade de cotas
                <input value={quantity} onChange={(event) => setQuantity(event.target.value)} inputMode="decimal" />
              </label>
              <label>
                Valor da cota
                <input value={quotaPrice} onChange={(event) => setQuotaPrice(event.target.value)} inputMode="decimal" />
              </label>
            </div>

            <div className="operation-total-box">
              <span>Total da compra</span>
              <strong>{currency.format(operationTotal)}</strong>
            </div>

            <div className="operation-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setIsOperationOpen(false)}>Cancelar</button>
              <button className="primary-action compact" type="submit" disabled={isSaving || !selectedFii}>
                <Plus size={17} /> {isSaving ? "Salvando..." : "Salvar compra"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detailPosition && (
        <div className="operation-modal-backdrop" role="presentation">
          <div className="position-detail-modal" role="dialog" aria-modal="true" aria-labelledby="position-detail-title">
            <div className="operation-modal-header">
              <div>
                <span>Detalhes do FII</span>
                <h2 id="position-detail-title">{detailPosition.ticker}</h2>
              </div>
              <button type="button" onClick={() => setDetailPosition(null)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <div className="position-detail-summary">
              <div>
                <strong>{detailPosition.name}</strong>
                <small>{detailPosition.segment}</small>
              </div>
              <em>{detailPosition.dy} DY</em>
            </div>

            <div className="position-detail-grid">
              <div className="detail-metric">
                <span>Quantidade</span>
                <strong>{detailPosition.quantity.toLocaleString("pt-BR")}</strong>
              </div>
              <div className="detail-metric">
                <span>Preço médio</span>
                <strong>{currency.format(detailPosition.average)}</strong>
              </div>
              <div className="detail-metric">
                <span>Preço atual</span>
                <strong>{currency.format(detailPosition.price)}</strong>
              </div>
              <div className="detail-metric">
                <span>Investido</span>
                <strong>{currency.format(detailPosition.quantity * detailPosition.average)}</strong>
              </div>
              <div className="detail-metric">
                <span>Valor atual</span>
                <strong>{currency.format(detailPosition.quantity * detailPosition.price)}</strong>
              </div>
              <div className="detail-metric">
                <span>Resultado</span>
                <strong className={(detailPosition.quantity * detailPosition.price) - (detailPosition.quantity * detailPosition.average) >= 0 ? "positive" : ""}>
                  {currency.format((detailPosition.quantity * detailPosition.price) - (detailPosition.quantity * detailPosition.average))}
                </strong>
              </div>
              <div className="detail-metric">
                <span>Renda mensal</span>
                <strong>{currency.format(detailPosition.income)}</strong>
              </div>
              <div className="detail-metric">
                <span>Alocação</span>
                <strong>{detailPosition.allocation.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong>
              </div>
            </div>

            <div className="operation-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setDetailPosition(null)}>Fechar</button>
              <button className="row-detail-delete" type="button" onClick={() => deletePosition(detailPosition.ticker)}>
                <Trash2 size={17} /> Excluir posição
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
