import JSZip from "jszip";
import { fetchBytes, parseDelimited, toNumber } from "../http";
import type { FiiReport, MarketDataAdapter, SourceStatus } from "../types";

type CvmMonthlyReportRow = {
  CNPJ_Fundo_Classe?: string;
  CNPJ_FUNDO?: string;
  CNPJ_FUNDO_CLASSE?: string;
  Data_Referencia?: string;
  DT_COMPTC?: string;
  DENOM_SOCIAL?: string;
  NR_COTST?: string;
  Total_Investido?: string;
  Total_Passivo?: string;
  VL_PATRIM_LIQ?: string;
};

export class CvmAdapter implements MarketDataAdapter {
  private readonly baseUrl = process.env.CVM_BASE_URL ?? "https://dados.cvm.gov.br/dados";

  getStatus(): SourceStatus {
    return {
      configured: Boolean(this.baseUrl),
      name: "cvm",
      notes: "Fonte oficial para informes, patrimônio, cotistas e documentos regulatórios de FIIs."
    };
  }

  async getMonthlyReports(year = new Date().getFullYear()): Promise<FiiReport[]> {
    const url = `${this.baseUrl}/FII/DOC/INF_MENSAL/DADOS/inf_mensal_fii_${year}.zip`;
    const zipBytes = await fetchBytes(url);
    const zip = await JSZip.loadAsync(zipBytes);
    const csvFile = Object.values(zip.files).find((file) => file.name.toLowerCase().endsWith(".csv"));

    if (!csvFile) {
      throw new Error(`Nenhum CSV encontrado no ZIP da CVM para ${year}.`);
    }

    const csv = await csvFile.async("string");
    const rows = parseDelimited(csv) as CvmMonthlyReportRow[];

    return rows.map((row) => ({
      cnpj: row.CNPJ_Fundo_Classe ?? row.CNPJ_FUNDO_CLASSE ?? row.CNPJ_FUNDO,
      month: row.Data_Referencia ?? row.DT_COMPTC,
      name: row.DENOM_SOCIAL,
      patrimony: toNumber(row.VL_PATRIM_LIQ),
      quotaHolders: toNumber(row.NR_COTST),
      totalInvested: toNumber(row.Total_Investido),
      totalLiabilities: toNumber(row.Total_Passivo),
      source: "cvm"
    }));
  }
}
