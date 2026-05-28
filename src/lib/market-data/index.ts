import { B3Adapter } from "./adapters/b3";
import { BrapiAdapter } from "./adapters/brapi";
import { CvmAdapter } from "./adapters/cvm";

export const marketData = {
  b3: new B3Adapter(),
  brapi: new BrapiAdapter(),
  cvm: new CvmAdapter()
};

export type { FiiDividend, FiiQuote, FiiReport, FiiSummary, MarketDataResult, SourceStatus } from "./types";
