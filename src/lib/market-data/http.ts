export class MarketDataError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "MarketDataError";
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {})
    },
    next: { revalidate: 60 * 60 }
  });

  if (!response.ok) {
    throw new MarketDataError(`Market data request failed: ${url}`, response.status);
  }

  return response.json() as Promise<T>;
}

export async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "text/plain,text/csv,*/*",
      ...(init?.headers ?? {})
    },
    next: { revalidate: 60 * 60 * 24 }
  });

  if (!response.ok) {
    throw new MarketDataError(`Market data request failed: ${url}`, response.status);
  }

  return response.text();
}

export async function fetchBytes(url: string, init?: RequestInit): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/zip,application/octet-stream,*/*",
      ...(init?.headers ?? {})
    },
    next: { revalidate: 60 * 60 * 24 }
  });

  if (!response.ok) {
    throw new MarketDataError(`Market data request failed: ${url}`, response.status);
  }

  return response.arrayBuffer();
}

export function parseDelimited(text: string, delimiter = ";"): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitLine(lines.shift() ?? "", delimiter);

  return lines
    .filter(Boolean)
    .map((line) => {
      const values = splitLine(line, delimiter);
      return headers.reduce<Record<string, string>>((row, header, index) => {
        row[header] = values[index] ?? "";
        return row;
      }, {});
    });
}

function splitLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === "\"") {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return undefined;

  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}
