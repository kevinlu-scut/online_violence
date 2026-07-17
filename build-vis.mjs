import fs from "node:fs/promises";

const projectDir = "C:/Users/njulu/Documents/Playground/network-violence-law-grid";
const visualizationDir = "C:/Users/njulu/.codex/visualizations/2026/07/17/019f6f95-95ba-74b0-9901-dc397ed09304";
const templatePath = `${projectDir}/law-case-mosaic.template.html`;
const dataPath = `${projectDir}/cases.json`;
const fragmentPath = `${visualizationDir}/law-case-blue-story-insight-mosaic.html`;

const template = await fs.readFile(templatePath, "utf8");
const payload = JSON.parse(await fs.readFile(dataPath, "utf8"));
if (payload.count !== 178 || payload.cases.length !== 178) {
  throw new Error(`Expected 178 cases, received ${payload.cases.length}`);
}

const inlineData = JSON.stringify(payload.cases).replace(/</g, "\\u003c");
const fragment = template.replace("__CASE_DATA__", inlineData);
if (fragment.includes("__CASE_DATA__") || /<!doctype|<html|<head|<body/i.test(fragment)) {
  throw new Error("Fragment contract validation failed");
}

await fs.mkdir(visualizationDir, { recursive: true });
await fs.writeFile(fragmentPath, fragment, "utf8");
console.log(JSON.stringify({ fragmentPath, cases: payload.cases.length, bytes: Buffer.byteLength(fragment) }));
