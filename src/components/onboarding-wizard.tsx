"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Plus, Search, Trash2, Wallet, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type WizardStep = 0 | 1 | 2 | 3 | 4;

type FiiOption = {
  name: string;
  price?: number;
  segment: string;
  source?: string;
  ticker: string;
};

type MarketFii = {
  lastPrice?: number;
  name?: string;
  segment?: string;
  source?: string;
  symbol: string;
};

type InitialPosition = {
  averagePrice: number;
  id: string;
  name: string;
  quantity: number;
  segment: string;
  ticker: string;
};

const currency = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

const steps = ["Bem-vindo", "Carteira", "Posições", "Revisão", "Pronto"];

function parseBrazilianNumber(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumberInput(value?: number) {
  return value ? decimal.format(value) : "";
}

async function fetchMarketFii(ticker: string) {
  const response = await fetch(`/api/market-data/fiis/${ticker}`);
  if (!response.ok) return null;

  const payload = await response.json() as { data: MarketFii | null };
  return payload.data;
}

export function OnboardingWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(0);
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [walletName, setWalletName] = useState("Carteira principal");
  const [investorProfile, setInvestorProfile] = useState("moderado");
  const [monthlyGoal, setMonthlyGoal] = useState("2.000,00");
  const [query, setQuery] = useState("HGLG11");
  const [fiis, setFiis] = useState<FiiOption[]>([]);
  const [selectedFii, setSelectedFii] = useState<FiiOption | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [averagePrice, setAveragePrice] = useState("");
  const [positions, setPositions] = useState<InitialPosition[]>([]);
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const total = useMemo(() => {
    return positions.reduce((sum, position) => sum + position.quantity * position.averagePrice, 0);
  }, [positions]);

  useEffect(() => {
    checkOnboarding();

    function openWizard() {
      setStep(0);
      setOpen(true);
    }

    window.addEventListener("openfiis:open-onboarding", openWizard);
    return () => window.removeEventListener("openfiis:open-onboarding", openWizard);
  }, []);

  useEffect(() => {
    if (!open) return;

    const timeout = window.setTimeout(() => {
      loadFiis(query);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [open, query]);

  async function checkOnboarding() {
    if (!supabase) {
      setIsChecking(false);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      setIsChecking(false);
      return;
    }

    setUserId(user.id);
    const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
    setFullName(metadataName);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, investor_profile, monthly_income_goal, onboarding_completed_at, onboarding_skipped_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileError && profile) {
      setFullName(profile.full_name ?? metadataName);
      setInvestorProfile(profile.investor_profile ?? "moderado");
      setMonthlyGoal(formatNumberInput(Number(profile.monthly_income_goal ?? 0)) || "2.000,00");
      setOpen(!profile.onboarding_completed_at && !profile.onboarding_skipped_at);
    } else {
      setOpen(true);
    }

    setIsChecking(false);
  }

  async function loadFiis(search: string) {
    const normalized = search.trim();
    if (!normalized) {
      setFiis([]);
      return;
    }

    try {
      const response = await fetch(`/api/market-data/fiis?q=${encodeURIComponent(normalized)}`);
      if (!response.ok) throw new Error("market unavailable");

      const payload = await response.json() as { data: MarketFii[] };
      setFiis((payload.data ?? []).slice(0, 6).map((fii) => ({
        name: fii.name ?? fii.symbol,
        price: fii.lastPrice,
        segment: fii.segment ?? "Sem segmento",
        source: fii.source,
        ticker: fii.symbol
      })));
    } catch {
      if (!supabase) return;

      const { data } = await supabase
        .from("fiis")
        .select("ticker, name, segment, source")
        .or(`ticker.ilike.%${normalized}%,name.ilike.%${normalized}%`)
        .limit(6);

      setFiis((data ?? []).map((fii) => ({
        name: fii.name,
        segment: fii.segment ?? "Sem segmento",
        source: fii.source ?? "supabase",
        ticker: fii.ticker
      })));
    }
  }

  async function selectFii(fii: FiiOption) {
    setSelectedFii(fii);
    setQuery(fii.ticker);
    setError("");

    if (fii.price) {
      setAveragePrice(decimal.format(fii.price));
      return;
    }

    const market = await fetchMarketFii(fii.ticker);
    if (market?.lastPrice) {
      const nextFii = {
        ...fii,
        name: market.name ?? fii.name,
        price: market.lastPrice,
        segment: market.segment ?? fii.segment,
        source: market.source
      };
      setSelectedFii(nextFii);
      setFiis((items) => items.map((item) => item.ticker === fii.ticker ? nextFii : item));
      setAveragePrice(decimal.format(market.lastPrice));
    }
  }

  function addPosition() {
    if (!selectedFii) {
      setError("Escolha um FII para adicionar.");
      return;
    }

    const parsedQuantity = parseBrazilianNumber(quantity);
    const parsedAverage = parseBrazilianNumber(averagePrice);

    if (parsedQuantity <= 0 || parsedAverage <= 0) {
      setError("Informe quantidade e preço médio maiores que zero.");
      return;
    }

    setPositions((current) => {
      const existing = current.find((position) => position.ticker === selectedFii.ticker);
      if (!existing) {
        return [
          ...current,
          {
            averagePrice: parsedAverage,
            id: `${selectedFii.ticker}-${Date.now()}`,
            name: selectedFii.name,
            quantity: parsedQuantity,
            segment: selectedFii.segment,
            ticker: selectedFii.ticker
          }
        ];
      }

      const nextQuantity = existing.quantity + parsedQuantity;
      const nextAverage = ((existing.quantity * existing.averagePrice) + (parsedQuantity * parsedAverage)) / nextQuantity;
      return current.map((position) => position.ticker === selectedFii.ticker
        ? { ...position, averagePrice: nextAverage, quantity: nextQuantity }
        : position);
    });

    setError("");
    setQuantity("100");
  }

  async function getOrCreateWalletId() {
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
      .insert({ name: walletName, user_id: userId })
      .select("id")
      .single();

    if (createError) throw createError;
    return String(createdWallet.id);
  }

  async function skipWizard() {
    if (!supabase || !userId) {
      setOpen(false);
      return;
    }

    setIsSaving(true);
    await supabase.from("profiles").upsert({
      full_name: fullName,
      id: userId,
      investor_profile: investorProfile,
      monthly_income_goal: parseBrazilianNumber(monthlyGoal),
      onboarding_skipped_at: new Date().toISOString()
    });
    setIsSaving(false);
    setOpen(false);
    window.dispatchEvent(new Event("openfiis:onboarding-finished"));
  }

  async function finishWizard() {
    if (!supabase || !userId) return;

    setIsSaving(true);
    setError("");

    try {
      const walletId = await getOrCreateWalletId();
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ name: walletName || "Carteira principal" })
        .eq("id", walletId);

      if (walletError) throw walletError;

      for (const position of positions) {
        const { error: buyError } = await supabase.rpc("record_buy_transaction", {
          p_name: position.name,
          p_occurred_at: new Date().toISOString().slice(0, 10),
          p_quantity: position.quantity,
          p_segment: position.segment,
          p_ticker: position.ticker,
          p_unit_price: position.averagePrice
        });

        if (buyError) throw buyError;
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        full_name: fullName,
        id: userId,
        investor_profile: investorProfile,
        monthly_income_goal: parseBrazilianNumber(monthlyGoal),
        onboarding_completed_at: new Date().toISOString(),
        onboarding_skipped_at: null
      });

      if (profileError) throw profileError;

      setStep(4);
      window.dispatchEvent(new Event("openfiis:onboarding-finished"));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível finalizar o onboarding.");
    } finally {
      setIsSaving(false);
    }
  }

  function nextStep() {
    if (step === 1 && !walletName.trim()) {
      setError("Dê um nome para sua carteira.");
      return;
    }

    setError("");
    setStep((current) => Math.min(current + 1, 3) as WizardStep);
  }

  if (isChecking || !open) return null;

  return (
    <div className="onboarding-backdrop" role="presentation">
      <section className="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div className="onboarding-sidebar">
          <div className="onboarding-brand">
            <span><Wallet size={20} /></span>
            <strong>OpenFIIs</strong>
          </div>
          <div className="onboarding-steps">
            {steps.map((label, index) => (
              <div className={index === step ? "active" : index < step ? "done" : ""} key={label}>
                <i>{index < step ? <CheckCircle2 size={14} /> : index + 1}</i>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <button className="onboarding-skip" disabled={isSaving} onClick={skipWizard} type="button">Pular por enquanto</button>
        </div>

        <div className="onboarding-content">
          <button className="onboarding-close" onClick={skipWizard} aria-label="Fechar onboarding" type="button">
            <X size={18} />
          </button>

          {step === 0 && (
            <div className="onboarding-hero">
              <span>Boas-vindas</span>
              <h2 id="onboarding-title">Vamos montar sua carteira inicial</h2>
              <p>Em poucos passos você cria sua carteira, registra suas primeiras posições reais e deixa o painel pronto para acompanhar patrimônio, renda e projeções.</p>
              <div className="onboarding-proof">
                <strong>Dados por usuário</strong>
                <strong>FIIs via fonte de mercado</strong>
                <strong>Persistência no Supabase</strong>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding-form">
              <span>Configuração</span>
              <h2 id="onboarding-title">Defina sua carteira</h2>
              <div className="onboarding-grid">
                <label>
                  Nome da carteira
                  <input value={walletName} onChange={(event) => setWalletName(event.target.value)} />
                </label>
                <label>
                  Perfil investidor
                  <select value={investorProfile} onChange={(event) => setInvestorProfile(event.target.value)}>
                    <option value="conservador">Conservador</option>
                    <option value="moderado">Moderado</option>
                    <option value="arrojado">Arrojado</option>
                  </select>
                </label>
                <label>
                  Objetivo de renda mensal
                  <input value={monthlyGoal} onChange={(event) => setMonthlyGoal(event.target.value)} inputMode="decimal" />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-form">
              <span>Posições iniciais</span>
              <h2 id="onboarding-title">Adicione seus FIIs</h2>
              <div className="onboarding-position-builder">
                <label className="onboarding-search">
                  Buscar FII
                  <div>
                    <Search size={18} />
                    <input value={query} onChange={(event) => setQuery(event.target.value.toUpperCase())} />
                  </div>
                </label>
                <div className="onboarding-fii-results">
                  {fiis.map((fii) => (
                    <button className={selectedFii?.ticker === fii.ticker ? "active" : ""} key={fii.ticker} onClick={() => selectFii(fii)} type="button">
                      <strong>{fii.ticker}</strong>
                      <small>{fii.name}</small>
                      <span>{fii.price ? currency.format(fii.price) : "Consultar"}</span>
                    </button>
                  ))}
                </div>
                <div className="onboarding-grid compact">
                  <label>
                    Quantidade
                    <input value={quantity} onChange={(event) => setQuantity(event.target.value)} inputMode="decimal" />
                  </label>
                  <label>
                    Preço médio
                    <input value={averagePrice} onChange={(event) => setAveragePrice(event.target.value)} inputMode="decimal" />
                  </label>
                  <button className="primary-action compact" onClick={addPosition} type="button"><Plus size={17} /> Adicionar</button>
                </div>
              </div>
              <div className="onboarding-position-list">
                {positions.length === 0 ? <small>Nenhuma posição adicionada ainda. Você também pode finalizar com a carteira vazia.</small> : positions.map((position) => (
                  <div key={position.id}>
                    <strong>{position.ticker}</strong>
                    <span>{position.quantity.toLocaleString("pt-BR")} cotas</span>
                    <span>{currency.format(position.averagePrice)}</span>
                    <button onClick={() => setPositions((current) => current.filter((item) => item.id !== position.id))} type="button" aria-label={`Remover ${position.ticker}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-review">
              <span>Revisão</span>
              <h2 id="onboarding-title">Confira antes de finalizar</h2>
              <div className="onboarding-review-grid">
                <div>
                  <small>Carteira</small>
                  <strong>{walletName || "Carteira principal"}</strong>
                </div>
                <div>
                  <small>Ativos</small>
                  <strong>{positions.length}</strong>
                </div>
                <div>
                  <small>Patrimônio inicial</small>
                  <strong>{currency.format(total)}</strong>
                </div>
                <div>
                  <small>Objetivo mensal</small>
                  <strong>{currency.format(parseBrazilianNumber(monthlyGoal))}</strong>
                </div>
              </div>
              <p>{positions.length === 0 ? "Você está finalizando com a carteira vazia. Depois poderá adicionar posições pela tela Carteira." : "Essas posições serão gravadas como compras iniciais na sua carteira."}</p>
            </div>
          )}

          {step === 4 && (
            <div className="onboarding-done">
              <CheckCircle2 size={54} />
              <h2 id="onboarding-title">Carteira pronta</h2>
              <p>Seu onboarding foi salvo. A carteira já pode ser acompanhada no portal.</p>
              <button className="primary-action compact" onClick={() => setOpen(false)} type="button">Entrar no portal</button>
            </div>
          )}

          {error && <strong className="onboarding-error">{error}</strong>}

          {step < 4 && (
            <div className="onboarding-actions">
              <button className="secondary-action" disabled={step === 0 || isSaving} onClick={() => setStep((current) => Math.max(current - 1, 0) as WizardStep)} type="button">
                <ArrowLeft size={17} /> Voltar
              </button>
              {step < 3 ? (
                <button className="primary-action compact" onClick={nextStep} type="button">
                  Continuar <ArrowRight size={17} />
                </button>
              ) : (
                <button className="primary-action compact" disabled={isSaving} onClick={finishWizard} type="button">
                  {isSaving ? "Salvando..." : "Finalizar carteira"} <CheckCircle2 size={17} />
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
