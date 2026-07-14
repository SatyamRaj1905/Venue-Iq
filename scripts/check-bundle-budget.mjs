import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const KIBIBYTE = 1_024;
const BUILD_DIRECTORY = join(process.cwd(), ".next");

const ROUTES = [
  { route: "/", artifacts: ["server/app/index.html"] },
  { route: "/fan", artifacts: ["server/app/fan.html", "server/app/fan/index.html"] },
  {
    route: "/operations",
    artifacts: ["server/app/operations.html", "server/app/operations/index.html"],
  },
  {
    route: "/volunteer",
    artifacts: ["server/app/volunteer.html", "server/app/volunteer/index.html"],
  },
  { route: "/impact", artifacts: ["server/app/impact.html", "server/app/impact/index.html"] },
];

const BUDGETS_KIB = {
  jsRaw: 850,
  jsGzip: 260,
  cssRaw: 40,
  cssGzip: 11,
  totalGzip: 280,
};

function findArtifact(candidates) {
  const artifact = candidates.map((candidate) => join(BUILD_DIRECTORY, candidate)).find(existsSync);
  if (artifact === undefined) {
    throw new Error(`Missing route artifact. Checked: ${candidates.join(", ")}`);
  }
  return artifact;
}

function referencedAssets(html) {
  const pattern = /\/_next\/(static\/chunks\/[^"'?]+\.(?:css|js))/g;
  return [...new Set([...html.matchAll(pattern)].map((match) => match[1]))];
}

function measureRoute(route) {
  const artifact = findArtifact(route.artifacts);
  const assets = referencedAssets(readFileSync(artifact, "utf8"));
  if (assets.length === 0) {
    throw new Error(`No initial JS or CSS assets were found for ${route.route}.`);
  }

  const totals = { jsRaw: 0, jsGzip: 0, cssRaw: 0, cssGzip: 0 };
  for (const asset of assets) {
    const assetPath = join(BUILD_DIRECTORY, asset);
    if (!existsSync(assetPath)) {
      throw new Error(`Referenced asset does not exist: ${asset}`);
    }
    const content = readFileSync(assetPath);
    const kind = asset.endsWith(".js") ? "js" : "css";
    totals[`${kind}Raw`] += content.byteLength;
    totals[`${kind}Gzip`] += gzipSync(content).byteLength;
  }

  return {
    route: route.route,
    ...totals,
    totalGzip: totals.jsGzip + totals.cssGzip,
  };
}

function toKibibytes(bytes) {
  return bytes / KIBIBYTE;
}

function display(bytes) {
  return `${toKibibytes(bytes).toFixed(1)} KiB`;
}

function budgetFailures(measurement) {
  return Object.entries(BUDGETS_KIB)
    .filter(([metric, maximum]) => toKibibytes(measurement[metric]) > maximum)
    .map(
      ([metric, maximum]) =>
        `${measurement.route} ${metric}: ${display(measurement[metric])} exceeds ${maximum} KiB`,
    );
}

try {
  const measurements = ROUTES.map(measureRoute);
  const failures = measurements.flatMap(budgetFailures);

  console.log("Production initial-asset budget");
  console.log("| Route | JS raw | JS gzip | CSS raw | CSS gzip | Total gzip | Status |");
  console.log("| --- | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const measurement of measurements) {
    const status = budgetFailures(measurement).length === 0 ? "PASS" : "FAIL";
    console.log(
      `| ${measurement.route} | ${display(measurement.jsRaw)} | ${display(measurement.jsGzip)} | ${display(measurement.cssRaw)} | ${display(measurement.cssGzip)} | ${display(measurement.totalGzip)} | ${status} |`,
    );
  }

  if (failures.length > 0) {
    console.error("\nBundle budget failures:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log("\nAll monitored routes are within budget.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
