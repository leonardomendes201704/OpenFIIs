"use client";

import { motion } from "framer-motion";
import {
  Banknote,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Download,
  FileText,
  Grid2X2,
  Landmark,
  Plus,
  ReceiptText,
  TrendingUp,
  WalletCards
} from "lucide-react";
import { AppShell } from "@/components/app-shell";

const dividendMonths = [
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

const payments = [
  { ticker: "HGLG11", name: "CSHG Logística", date: "14/06/2024", base: "31/05/2024", perShare: "R$ 0,8750", amount: "R$ 1.093,75", status: "Previsto" },
  { ticker: "KNRI11", name: "Kinea Renda Imobiliária", date: "17/06/2024", base: "31/05/2024", perShare: "R$ 0,7900", amount: "R$ 632,00", status: "Previsto" },
  { ticker: "MXRF11", name: "Maxi Renda", date: "14/06/2024", base: "31/05/2024", perShare: "R$ 0,5600", amount: "R$ 672,00", status: "Previsto" },
  { ticker: "XPML11", name: "XP Malls", date: "25/06/2024", base: "31/05/2024", perShare: "R$ 0,4500", amount: "R$ 270,00", status: "Previsto" }
];

const history = [
  { ticker: "HGLG11", month: "Mai/24", amount: "R$ 1.093,75", dy: "0,50%", paid: "15/05/2024" },
  { ticker: "KNRI11", month: "Mai/24", amount: "R$ 632,00", dy: "0,49%", paid: "14/05/2024" },
  { ticker: "MXRF11", month: "Mai/24", amount: "R$ 672,00", dy: "1,07%", paid: "15/05/2024" },
  { ticker: "XPML11", month: "Mai/24", amount: "R$ 270,00", dy: "0,42%", paid: "24/05/2024" }
];

const composition = [
  { ticker: "HGLG11", amount: "R$ 1.093,75", share: 44.6 },
  { ticker: "MXRF11", amount: "R$ 672,00", share: 27.4 },
  { ticker: "KNRI11", amount: "R$ 632,00", share: 25.8 },
  { ticker: "XPML11", amount: "R$ 270,00", share: 11.0 }
];

export default function DividendosPage() {
  const maxDividend = Math.max(...dividendMonths.map((item) => item.value));

  return (
    <AppShell searchPlaceholder="Buscar dividendos, pagamentos, FIIs...">
      <main className="dashboard dividends-view">
        <section className="page-heading wallet-heading">
          <div>
            <h1>Dividendos</h1>
            <p>Acompanhe rendimentos recebidos, próximos pagamentos e evolução da renda mensal.</p>
          </div>
          <div className="heading-actions">
            <button className="secondary-action"><Download size={17} /> Exportar informe</button>
            <button className="primary-action compact"><Plus size={17} /> Registrar rendimento</button>
          </div>
        </section>

        <section className="dividend-summary-grid">
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span><CircleDollarSign size={20} /> Renda do mês</span>
            <strong>R$ 2.453,18</strong>
            <small className="positive">+ R$ 198,72 vs. mês anterior</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
            <span><TrendingUp size={20} /> Yield mensal</span>
            <strong>0,86%</strong>
            <small>10,36% anualizado</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <span><Banknote size={20} /> Recebido no ano</span>
            <strong>R$ 13.821,40</strong>
            <small>6 meses acumulados</small>
          </motion.article>
          <motion.article className="wallet-summary-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
            <span><CalendarDays size={20} /> Próximo pagamento</span>
            <strong>14/06</strong>
            <small>HGLG11 e MXRF11</small>
          </motion.article>
        </section>

        <section className="dividends-layout">
          <article className="panel dividend-income-panel">
            <div className="panel-header">
              <h2>Evolução da renda mensal</h2>
              <div className="range-tabs">
                <button>6M</button>
                <button className="selected">12M</button>
                <button>24M</button>
                <button>Todos</button>
              </div>
            </div>

            <div className="dividend-bars">
              {dividendMonths.map((item) => (
                <div className="dividend-bar" key={item.month}>
                  <div>
                    <span style={{ height: `${Math.max(26, (item.value / maxDividend) * 168)}px` }} />
                  </div>
                  <strong>{item.month}</strong>
                  <small>R$ {(item.value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k</small>
                </div>
              ))}
            </div>
          </article>

          <aside className="wallet-side">
            <article className="panel dividend-calendar-panel">
              <div className="panel-header">
                <h2>Calendário</h2>
                <button className="select-button">Junho <ChevronDown size={15} /></button>
              </div>
              <div className="calendar-list">
                <div><span>14</span><strong>HGLG11</strong><small>R$ 1.093,75</small></div>
                <div><span>14</span><strong>MXRF11</strong><small>R$ 672,00</small></div>
                <div><span>17</span><strong>KNRI11</strong><small>R$ 632,00</small></div>
                <div><span>25</span><strong>XPML11</strong><small>R$ 270,00</small></div>
              </div>
            </article>

            <article className="panel dividend-composition-panel">
              <h2>Composição do mês</h2>
              <div className="composition-list">
                {composition.map((item) => (
                  <div className="composition-item" key={item.ticker}>
                    <div>
                      <strong>{item.ticker}</strong>
                      <small>{item.amount}</small>
                    </div>
                    <span>{item.share.toLocaleString("pt-BR")}%</span>
                    <i><b style={{ width: `${item.share * 2}%` }} /></i>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>

        <section className="dividend-bottom-grid">
          <article className="panel payments-panel">
            <div className="panel-header">
              <h2>Próximos pagamentos</h2>
              <button className="select-button">Todos <ChevronDown size={15} /></button>
            </div>
            <div className="payments-table">
              <div className="payments-head">
                <span>FII</span>
                <span>Data com</span>
                <span>Pagamento</span>
                <span>Valor/cota</span>
                <span>Total</span>
                <span>Status</span>
              </div>
              {payments.map((payment) => (
                <div className="payments-row" key={payment.ticker}>
                  <div><strong>{payment.ticker}</strong><small>{payment.name}</small></div>
                  <span>{payment.base}</span>
                  <span>{payment.date}</span>
                  <span>{payment.perShare}</span>
                  <strong>{payment.amount}</strong>
                  <em>{payment.status}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="panel history-panel">
            <div className="panel-header">
              <h2>Histórico recente</h2>
              <button className="icon-inline"><FileText size={16} /></button>
            </div>
            <div className="history-list">
              {history.map((item) => (
                <div className="history-item" key={`${item.ticker}-${item.month}`}>
                  <span><ReceiptText size={17} /></span>
                  <div>
                    <strong>{item.ticker}</strong>
                    <small>{item.month} • Pago em {item.paid}</small>
                  </div>
                  <div>
                    <strong>{item.amount}</strong>
                    <small>{item.dy}</small>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel dividend-insights">
          <div>
            <Grid2X2 size={20} />
            <strong>Renda recorrente</strong>
            <span>4 ativos pagaram no último mês, com maior concentração em HGLG11.</span>
          </div>
          <div>
            <Landmark size={20} />
            <strong>Previsibilidade</strong>
            <span>83% da renda vem de FIIs com pagamentos mensais consistentes.</span>
          </div>
          <div>
            <WalletCards size={20} />
            <strong>Reinvestimento</strong>
            <span>Renda atual compra aproximadamente 13 cotas adicionais por mês.</span>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
