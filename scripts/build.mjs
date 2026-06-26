import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const outdir = new URL("../dist/", import.meta.url);

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

try {
  const { build } = await import("esbuild");
  await build({
    entryPoints: {
      content: new URL("../src/content.ts", import.meta.url).pathname,
      "chatgpt-copy": new URL("../src/chatgpt-copy.ts", import.meta.url).pathname
    },
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "chrome120",
    outdir: outdir.pathname,
    sourcemap: true,
    legalComments: "none"
  });
} catch (error) {
  if (!canBuildWithoutDependencies(error)) {
    throw error;
  }
  await buildWithoutDependencies();
}

await cp(new URL("../manifest.json", import.meta.url), new URL("manifest.json", outdir));

async function buildWithoutDependencies() {
  const normalizerSource = await readFile(new URL("../src/latex-normalizer.ts", import.meta.url), "utf8");
  const segmenterSource = await readFile(new URL("../src/notion-paste-segments.ts", import.meta.url), "utf8");
  const contentSource = await readFile(new URL("../src/content.ts", import.meta.url), "utf8");
  const chatgptSource = await readFile(new URL("../src/chatgpt-copy.ts", import.meta.url), "utf8");

  const normalizer = stripTypeScriptTypes(normalizerSource, { mode: "strip" })
    .replace(/^export\s+/gm, "");
  const segmenter = stripTypeScriptTypes(segmenterSource, { mode: "strip" })
    .replace(/^export\s+/gm, "");
  const content = stripTypeScriptTypes(
    contentSource.replace(/^import\s+.*?;\s*$/gm, ""),
    { mode: "strip" }
  );
  const chatgpt = stripTypeScriptTypes(
    chatgptSource.replace(/^import\s+.*?;\s*$/m, ""),
    { mode: "strip" }
  );

  await writeFile(new URL("content.js", outdir), `(() => {\n${normalizer}\n${segmenter}\n${content}\n})();\n`);
  await writeFile(new URL("chatgpt-copy.js", outdir), `(() => {\n${normalizer}\n${chatgpt}\n})();\n`);
}

function canBuildWithoutDependencies(error) {
  return (
    error?.code === "ERR_MODULE_NOT_FOUND" ||
    error?.code === "EFTYPE" ||
    error?.code === "ENOENT" ||
    error?.code === "EACCES"
  );
}
