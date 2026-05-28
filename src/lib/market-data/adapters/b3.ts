import { fetchJson } from "../http";
import type { FiiSummary, MarketDataAdapter, SourceStatus } from "../types";

type B3ListedFund = {
  acronym?: string;
  name?: string;
  segment?: string;
  symbol?: string;
  ticker?: string;
};

type B3ListedFundsResponse = {
  results?: B3ListedFund[];
};

export class B3Adapter implements MarketDataAdapter {
  private readonly baseUrl = process.env.B3_BASE_URL ?? "https://sistemaswebb3-listados.b3.com.br";

  getStatus(): SourceStatus {
    return {
      configured: Boolean(this.baseUrl),
      name: "b3",
      notes: "Fonte pública para listagem oficial, dados de negociação e índices. Alguns endpoints podem mudar sem aviso."
    };
  }

  async listListedFiis(): Promise<FiiSummary[]> {
    const url = new URL(`${this.baseUrl}/fundsProxy/fundsCall/GetListedFundsSIG`);
    url.searchParams.set("typeFund", "7");
    url.searchParams.set("pageNumber", "1");
    url.searchParams.set("pageSize", "500");
    url.searchParams.set("language", "pt-br");

    const response = await fetchJson<B3ListedFundsResponse>(url.toString());

    return (response.results ?? []).map<FiiSummary>((fund) => ({
      name: fund.name,
      segment: fund.segment,
      source: "b3",
      symbol: fund.ticker ?? fund.symbol ?? fund.acronym ?? ""
    })).filter((fund) => fund.symbol);
  }
}
