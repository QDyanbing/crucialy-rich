import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicPackages = [
  {
    directory: "packages/core",
    expectedExports: ["createCompositionState", "createDocument", "executeCommand"],
  },
  {
    directory: "packages/react",
    expectedExports: ["FixedToolbar", "FloatingSlashMenu", "RichTextEditor"],
  },
];

for (const packageConfig of publicPackages) {
  const packageRoot = resolve(repositoryRoot, packageConfig.directory);
  const manifest = JSON.parse(
    await readFile(resolve(packageRoot, "package.json"), "utf8"),
  );
  const rootExport = manifest.exports?.["."];

  assert.equal(manifest.private, undefined, `${manifest.name} must be public.`);
  assert.equal(
    manifest.sideEffects,
    false,
    `${manifest.name} must be side-effect free.`,
  );
  assert.equal(rootExport?.import, manifest.main);
  assert.equal(rootExport?.default, manifest.main);
  assert.equal(rootExport?.types, manifest.types);

  const runtimePath = resolve(packageRoot, manifest.main);
  const declarationPath = resolve(packageRoot, manifest.types);

  await access(runtimePath);
  await access(declarationPath);

  const runtime = await import(pathToFileURL(runtimePath).href);
  const declarations = await readFile(declarationPath, "utf8");

  for (const exportName of packageConfig.expectedExports) {
    assert.ok(exportName in runtime, `${manifest.name} is missing ${exportName}.`);
    assert.ok(
      declarations.includes(exportName),
      `${manifest.name} declarations are missing ${exportName}.`,
    );
  }

  process.stdout.write(`Verified ${manifest.name}@${manifest.version}\n`);
}
