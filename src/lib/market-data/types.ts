export type MarketDataSource = "brapi" | "cvm" | "b3";

export type SourceStatus = {
  configured: boolean;
  name: MarketDataSource;
  notes: string;
};

export type FiiSummary = {
  adminName?: string;
  dividendYield12m?: number;
  equity?: number;
  lastPrice?: number;
  managerName?: string;
  name?: string;
  priceToNav?: number;
  segment?: string;
  source: MarketDataSource;
  symbol: string;
  updatedAt?: string;
};

export type FiiDividend = {
  amount: number;
  baseDate?: string;
  paymentDate?: string;
  source: MarketDataSource;
  symbol: string;
  type?: string;
};

export type FiiQuote = {
  close?: number;
  date: string;
  high?: number;
  low?: number;
  open?: number;
  source: MarketDataSource;
  symbol: string;
  volume?: number;
};

export type FiiReport = {
  cnpj?: string;
  month?: string;
  name?: string;
  patrimony?: number;
  quotaHolders?: number;
  totalInvested?: number;
  totalLiabilities?: number;
  source: MarketDataSource;
  symbol?: string;
};

export type MarketDataResult<T> = {
  data: T;
  source: MarketDataSource;
  warnings: string[];
};

export interface MarketDataAdapter {
  getStatus(): SourceStatus;
}
