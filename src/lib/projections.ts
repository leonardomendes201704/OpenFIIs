export type ProjectionScenario = "conservador" | "base" | "otimista";

export type ProjectionInput = {
  currentEquity: number;
  currentMonthlyIncome: number;
  monthlyContribution: number;
  reinvestDividends: boolean;
  weightedDividendYield: number;
  years: number;
};

export type ProjectionSeriesPoint = {
  contributions: number;
  equity: number;
  label: string;
  month: number;
  monthlyIncome: number;
  year: number;
};

export type ScenarioComparisonPoint = {
  color: string;
  description: string;
  futureEquity: number;
  futureMonthlyIncome: number;
  key: ProjectionScenario;
  label: string;
};

export type ProjectionResult = {
  annualYield: number;
  comparison: ScenarioComparisonPoint[];
  currentMonthlyIncome: number;
  futureEquity: number;
  futureMonthlyIncome: number;
  monthlyPriceGrowthRate: number;
  scenario: ProjectionScenario;
  scenarioDescription: string;
  scenarioFactor: number;
  series: ProjectionSeriesPoint[];
};

const SCENARIO_CONFIG = {
  conservador: {
    color: "#98a2b3",
    description: "Premissa mais cautelosa para crescimento de preços e estabilidade do yield.",
    label: "Conservador",
    monthlyPriceGrowthRate: 0.0016,
    yieldFactor: 0.92
  },
  base: {
    color: "#0f5a35",
    description: "Equilíbrio entre reinvestimento, valorização patrimonial e yield da carteira.",
    label: "Base",
    monthlyPriceGrowthRate: 0.0024,
    yieldFactor: 1
  },
  otimista: {
    color: "#2fb47c",
    description: "Premissa mais forte para crescimento da carteira e manutenção do patamar de dividendos.",
    label: "Otimista",
    monthlyPriceGrowthRate: 0.0032,
    yieldFactor: 1.1
  }
} satisfies Record<ProjectionScenario, {
  color: string;
  description: string;
  label: string;
  monthlyPriceGrowthRate: number;
  yieldFactor: number;
}>;

function resolveAnnualYield(input: ProjectionInput) {
  const fromIncome = input.currentEquity > 0
    ? (input.currentMonthlyIncome * 12 / input.currentEquity) * 100
    : 0;

  return Math.max(input.weightedDividendYield, fromIncome, 0);
}

function runScenario(input: ProjectionInput, scenario: ProjectionScenario): ProjectionResult {
  const config = SCENARIO_CONFIG[scenario];
  const annualYield = resolveAnnualYield(input) * config.yieldFactor;
  const monthlyYieldRate = annualYield / 100 / 12;
  const months = Math.max(1, Math.round(input.years * 12));
  let equity = Math.max(0, input.currentEquity);
  let contributions = 0;
  let monthlyIncome = Math.max(0, input.currentMonthlyIncome);

  const series: ProjectionSeriesPoint[] = [{
    contributions: 0,
    equity,
    label: "Hoje",
    month: 0,
    monthlyIncome,
    year: 0
  }];

  for (let month = 1; month <= months; month += 1) {
    const dividendIncome = equity * monthlyYieldRate;
    const priceGrowth = equity * config.monthlyPriceGrowthRate;

    contributions += input.monthlyContribution;
    equity += input.monthlyContribution + priceGrowth + (input.reinvestDividends ? dividendIncome : 0);
    monthlyIncome = equity * monthlyYieldRate;

    if (month % 12 === 0 || month === months) {
      const year = Math.ceil(month / 12);
      series.push({
        contributions,
        equity,
        label: `${year}a`,
        month,
        monthlyIncome,
        year
      });
    }
  }

  return {
    annualYield,
    comparison: [],
    currentMonthlyIncome: input.currentMonthlyIncome,
    futureEquity: equity,
    futureMonthlyIncome: monthlyIncome,
    monthlyPriceGrowthRate: config.monthlyPriceGrowthRate,
    scenario,
    scenarioDescription: config.description,
    scenarioFactor: config.yieldFactor,
    series
  };
}

export function buildProjection(input: ProjectionInput, scenario: ProjectionScenario): ProjectionResult {
  const baseResult = runScenario(input, scenario);
  const comparison = (Object.keys(SCENARIO_CONFIG) as ProjectionScenario[]).map((key) => {
    const result = runScenario(input, key);
    const config = SCENARIO_CONFIG[key];

    return {
      color: config.color,
      description: config.description,
      futureEquity: result.futureEquity,
      futureMonthlyIncome: result.futureMonthlyIncome,
      key,
      label: config.label
    };
  });

  return {
    ...baseResult,
    comparison
  };
}

export function parseProjectionScenario(value: string | null | undefined): ProjectionScenario {
  if (value === "conservador" || value === "otimista" || value === "base") {
    return value;
  }

  return "base";
}

export function getProjectionScenarioLabel(scenario: ProjectionScenario) {
  return SCENARIO_CONFIG[scenario].label;
}
