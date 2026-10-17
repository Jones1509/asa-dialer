import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Font-vagt (Jonas 17. okt 2026: "det må aldrig ske igen").
 * Manrope overalt. Fejler hvis Fraunces eller Geist dukker op i kode, stil, HTML eller package.json.
 * Skift ALDRIG skrifttype uden Jonas' eget, udtrykkelige ja i chatten.
 */
const rod = path.resolve(__dirname, "../..");
const forbudt = /fraunces|geist/i;
const filtyper = /\.(tsx?|jsx?|css|html|json)$/;
const springOver = new Set(["node_modules", "dist", ".git"]);

function filer(mappe: string): string[] {
  return fs.readdirSync(mappe, { withFileTypes: true }).flatMap((d) => {
    if (springOver.has(d.name)) return [];
    const fuld = path.join(mappe, d.name);
    if (d.isDirectory()) return filer(fuld);
    if (!filtyper.test(d.name) || d.name.endsWith("lock.json")) return [];
    return [fuld];
  });
}

describe("font-vagt", () => {
  it("bruger kun Manrope — ingen Fraunces eller Geist", () => {
    const egenFil = path.resolve(__filename);
    const kandidater = [
      path.join(rod, "index.html"),
      path.join(rod, "package.json"),
      path.join(rod, "tailwind.config.ts"),
      ...filer(path.join(rod, "src")),
      ...filer(path.join(rod, "public")),
    ].filter((f) => fs.existsSync(f) && path.resolve(f) !== egenFil);

    const fund = kandidater.flatMap((f) =>
      fs
        .readFileSync(f, "utf8")
        .split("\n")
        .map((linje, i) => (forbudt.test(linje) ? `${path.relative(rod, f)}:${i + 1}` : null))
        .filter((x): x is string => x !== null),
    );
    expect(fund).toEqual([]);
  });

  it("indlæser Manrope", () => {
    const html = fs.readFileSync(path.join(rod, "index.html"), "utf8");
    expect(html).toMatch(/family=Manrope/);
  });
});
