import { fetchJson } from "../http";
import type { FiiDividend, FiiQuote, FiiSummary, MarketDataAdapter, SourceStatus } from "../types";

type BrapiFii = {
  adminName?: string;
  asOfDate?: string;
  dividendYield12m?: number;
  equity?: number;
  managerName?: string;
  navPerShare?: number;
  price?: number;
  priceToNav?: number;
  segmentType?: string;
  segmentoAtuacao?: string;
  symbol: string;
};

type BrapiIndicatorsResponse = {
  fiis?: BrapiFii[];
};

type BrapiListResponse = {
  fiis?: Array<{
    adminName?: string;
    managerName?: string;
    name?: string;
    segmentType?: string;
    segmentoAtuacao?: string;
    symbol: string;
  }>;
};

type BrapiDividendsResponse = {
  dividends?: Array<{
    amount?: number;
    baseDate?: string;
    paymentDate?: string;
    symbol?: string;
    type?: string;
  }>;
};

type BrapiHistoricalResponse = {
  historical?: Array<{
    close?: number;
    date?: string;
    high?: number;
    low?: number;
    open?: number;
    volume?: number;
  }>;
};

export class BrapiAdapter implements MarketDataAdapter {
  private readonly baseUrl = process.env.BRAPI_BASE_URL ?? "https://brapi.dev/api";
  private readonly token = process.env.BRAPI_TOKEN;

  getStatus(): SourceStatus {
    return {
      configured: Boolean(this.baseUrl),
      name: "brapi",
      notes: this.token ? "Token configurado para endpoints completos." : "Sem token: use apenas endpoints/sandbox disponíveis pela brapi."
    };
  }

  async listFiis(query?: string): Promise<FiiSummary[]> {
    const response = await fetchJson<BrapiListResponse>(this.buildUrl("/v2/fii/list", query ? { search: query } : undefined));

    return (response.fiis ?? []).map((fii) => ({
      adminName: fii.adminName,
      managerName: fii.managerName,
      name: fii.name ?? fii.managerName,
      segment: fii.segmentoAtuacao ?? fii.segmentType,
      source: "brapi",
      symbol: fii.symbol
    }));
  }

  async getIndicators(symbols: string[]): Promise<FiiSummary[]> {
    const response = await fetchJson<BrapiIndicatorsResponse>(
      this.buildUrl("/v2/fii/indicators", { symbols: symbols.join(",") })
    );

    return (response.fiis ?? []).map((fii) => ({
      adminName: fii.adminName,
      dividendYield12m: fii.dividendYield12m,
      equity: fii.equity,
      lastPrice: fii.price,
      managerName: fii.managerName,
      name: fii.managerName,
      priceToNav: fii.priceToNav,
      segment: fii.segmentoAtuacao ?? fii.segmentType,
      source: "brapi",
      symbol: fii.symbol,
      updatedAt: fii.asOfDate
    }));
  }

  async getDividends(symbol: string): Promise<FiiDividend[]> {
    const response = await fetchJson<BrapiDividendsResponse>(this.buildUrl("/v2/fii/dividends", { symbols: symbol }));

    return (response.dividends ?? []).map((dividend) => ({
      amount: dividend.amount ?? 0,
      baseDate: dividend.baseDate,
      paymentDate: dividend.paymentDate,
      source: "brapi",
      symbol: dividend.symbol ?? symbol,
      type: dividend.type
    }));
  }

  async getHistorical(symbol: string): Promise<FiiQuote[]> {
    const response = await fetchJson<BrapiHistoricalResponse>(this.buildUrl("/v2/fii/historical", { symbol }));

    return (response.historical ?? [])
      .filter((quote) => quote.date)
      .map((quote) => ({
        close: quote.close,
        date: quote.date as string,
        high: quote.high,
        low: quote.low,
        open: quote.open,
        source: "brapi",
        symbol,
        volume: quote.volume
      }));
  }

  private buildUrl(path: string, params: Record<string, string> = {}) {
    const url = new URL(`${this.baseUrl}${path}`);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    if (this.token) {
      url.searchParams.set("token", this.token);
    }

    return url.toString();
  }
}
