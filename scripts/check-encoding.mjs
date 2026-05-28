import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "supabase"];
const extensions = new Set([".css", ".sql", ".ts", ".tsx"]);
const mojibakePattern = /\u00c3|\u00c2|\u00e2\u20ac|\u00e2\u20ac\u00a2|\u00e2\u0152|\ufffd/u;
const suspiciousQuestionPattern = /[A-Za-zÀ-ÿ]\?{1,2}[A-Za-zÀ-ÿ]/u;
const ignoredDirectories = new Set([".git", ".next", "node_modules"]);

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return ignoredDirectories.has(entry) ? [] : walk(path);
    }

    return extensions.has(path.slice(path.lastIndexOf("."))) ? [path] : [];
  });
}

const offenders = roots
  .flatMap((root) => walk(root))
  .flatMap((path) => {
    const lines = readFileSync(path, "utf8").split(/\r?\n/);
    return lines
      .map((line, index) => ({ index: index + 1, line, path }))
      .filter(({ line }) => mojibakePattern.test(line) || (suspiciousQuestionPattern.test(line) && !line.includes("?q=")));
  });

if (offenders.length > 0) {
  console.error("Mojibake/encoding artifacts found:");
  offenders.forEach(({ index, line, path }) => {
    console.error(`${path}:${index}: ${line.trim()}`);
  });
  process.exit(1);
}
