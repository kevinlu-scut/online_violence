import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/njulu/Documents/Playground/outputs/network_violence_response_insights_20260717/北大法宝及威科先行的网络暴力案件完整数据集+数据新闻故事+网暴应对启示.xlsx";
const outputPath = "C:/Users/njulu/Documents/Playground/network-violence-law-grid/cases.json";

const clean = (value) => String(value ?? "")
  .replace(/\r\n?/g, "\n")
  .replace(/[\t\u00a0]+/g, " ")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

function simpleCause(value) {
  const s = clean(value);
  const candidates = [
    "网络侵权责任纠纷", "名誉权纠纷", "隐私权、个人信息保护纠纷",
    "人格权纠纷", "侵权责任纠纷", "行政复议", "敲诈勒索罪",
    "诽谤罪", "侮辱罪", "劳动争议", "治安管理",
  ];
  return candidates.find((item) => s.includes(item)) || s.replace(/[>;★☆]/g, "").slice(0, 36) || "未标注";
}

function formatDate(value) {
  const s = clean(value);
  const match = s.match(/(\d{4})[.\-/年](\d{1,2})[.\-/月](\d{1,2})/);
  return match ? `${match[1]}-${String(match[2]).padStart(2, "0")}-${String(match[3]).padStart(2, "0")}` : s;
}

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const overview = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 5000,
  tableMaxRows: 4,
  tableMaxCols: 19,
  tableMaxCellChars: 80,
});
console.log(overview.ndjson);

const sheet = workbook.worksheets.getItem("Worksheet");
const rows = sheet.getRange("A1:T179").values;
const data = rows.slice(1).filter((row) => row[0] != null && clean(row[18]) && clean(row[19]));

const cases = data.map((row) => ({
  id: Number(row[0]),
  caseName: clean(row[1]),
  province: clean(row[2]) || "未标注",
  date: formatDate(row[3]),
  caseType: clean(row[4]) || "未标注",
  cause: simpleCause(row[5]),
  purpose: clean(row[11]) || "未标注",
  method: clean(row[12]).replace(/[;；]/g, "、") || "未标注",
  format: clean(row[13]).replace(/[;；,，]/g, "、") || "未标注",
  platform: clean(row[14]).replace(/[;；]/g, "、") || "未标注",
  visibility: clean(row[15]) || "未标注",
  relation: (clean(row[17]) || clean(row[16]) || "未标注").replace(/关系关系/g, "关系"),
  story: clean(row[18]).replace(/\n+/g, " "),
  insight: clean(row[19]).replace(/\n+/g, " "),
}));

const payload = {
  source: "北大法宝及威科先行的网络暴力案件完整数据集+数据新闻故事.xlsx",
  count: cases.length,
  generatedAt: "2026-07-17",
  cases,
};

if (cases.length !== 178 || cases.some((item) => !item.caseName || !item.story || !item.insight)) {
  throw new Error(`Dataset validation failed: ${JSON.stringify({ count: cases.length, emptyStories: cases.filter((item) => !item.story).length, emptyInsights: cases.filter((item) => !item.insight).length })}`);
}

await fs.writeFile(outputPath, JSON.stringify(payload), "utf8");
console.log(JSON.stringify({ count: cases.length, firstId: cases[0].id, lastId: cases.at(-1).id, bytes: Buffer.byteLength(JSON.stringify(payload)) }));
