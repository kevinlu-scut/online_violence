import fs from "node:fs/promises";

const fragmentPath = "C:/Users/njulu/.codex/visualizations/2026/07/17/019f6f95-95ba-74b0-9901-dc397ed09304/law-case-blue-story-insight-mosaic.html";
const standalonePath = "C:/Users/njulu/Documents/Playground/network-violence-law-grid/index.html";
const dataPath = "C:/Users/njulu/Documents/Playground/network-violence-law-grid/cases.json";

const [fragment, standalone, payload] = await Promise.all([
  fs.readFile(fragmentPath, "utf8"),
  fs.readFile(standalonePath, "utf8"),
  fs.readFile(dataPath, "utf8").then(JSON.parse),
]);

const scriptMatch = fragment.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error("Visualization script not found");
new Function(scriptMatch[1]);

const checks = {
  cases: payload.cases.length,
  completeStories: payload.cases.filter((item) => item.story && item.caseName).length,
  completeInsights: payload.cases.filter((item) => item.insight).length,
  fragmentBytes: Buffer.byteLength(fragment),
  standaloneBytes: Buffer.byteLength(standalone),
  rootMarkupCount: (fragment.match(/id="law-case-mosaic-019f6f95"/g) || []).length,
  inlineCaseCount: (fragment.match(/"id":\d+/g) || []).length,
  inlineInsightCount: (fragment.match(/"insight":"/g) || []).length,
  hasInsightBlock: fragment.includes('id="law-popover-insight"') && fragment.includes("fields.insight.textContent = item.insight"),
  hasOnlyRequestedPopoverFields: !fragment.includes('id="law-popover-index"') && !fragment.includes('id="law-meta-') && fragment.includes('id="law-popover-title"') && fragment.includes('id="law-popover-story"') && fragment.includes('id="law-popover-insight"'),
  usesDeepBlueTiles: fragment.includes("--law-blue:") && fragment.includes("--law-blue-raised:") && fragment.includes("深蓝条款") && !fragment.includes("--law-red:"),
  hasPlaceholder: fragment.includes("__CASE_DATA__"),
  hasDocumentShell: /<!doctype|<html|<head|<body/i.test(fragment),
  usesNetworkCalls: /\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(fragment),
  hasHoverHandlers: fragment.includes("pointerenter") && fragment.includes("mouseenter"),
  hasKeyboardHandlers: fragment.includes('event.key !== "Escape"') && fragment.includes('button.addEventListener("focus"'),
  hasTransparentFragmentBackground: /html:root,\s*\n\s*body\s*\{\s*background:\s*transparent\s*!important/.test(fragment),
  hasTransparentStandaloneBackground: standalone.includes("background:transparent!important"),
  standaloneContainsFinalCase: standalone.includes("汪某王某名誉权纠纷一审民事判决书"),
};

if (
  checks.cases !== 178 || checks.completeStories !== 178 || checks.completeInsights !== 178 || checks.fragmentBytes >= 2_000_000 ||
  checks.rootMarkupCount !== 1 || checks.inlineCaseCount !== 178 || checks.inlineInsightCount !== 178 || !checks.hasInsightBlock || !checks.hasOnlyRequestedPopoverFields || !checks.usesDeepBlueTiles || checks.hasPlaceholder ||
  checks.hasDocumentShell || checks.usesNetworkCalls || !checks.hasHoverHandlers ||
  !checks.hasKeyboardHandlers || !checks.hasTransparentFragmentBackground ||
  !checks.hasTransparentStandaloneBackground || !checks.standaloneContainsFinalCase
) {
  throw new Error(`Visualization verification failed: ${JSON.stringify(checks)}`);
}

console.log(JSON.stringify(checks, null, 2));
