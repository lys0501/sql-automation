import { NextResponse } from "next/server";
import { exec } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { promisify } from "util";

const execAsync = promisify(exec);

const PYTHON_PATH = "C:\\Users\\WIN11\\AppData\\Local\\Microsoft\\WindowsApps\\python.exe";
const BUILDER_PATH = "C:\\Users\\WIN11\\Desktop\\sql-mart-builder\\builder.py";

export async function POST(request) {
  let configPath = null;

  try {
    const body = await request.json();
    const { martName, sourceTable, analysisPeriod, steps } = body;

    // 프론트 입력값 → YAML 문자열 생성
    const yaml = buildYaml({ martName, sourceTable, analysisPeriod, steps });

    // 임시 YAML 파일 작성
    configPath = join(tmpdir(), `mart_${Date.now()}.yaml`);
    await writeFile(configPath, yaml, "utf-8");

    // builder.py 실행 (--preview: 파일 저장 없이 SQL만 stdout으로 반환)
    const { stdout, stderr } = await execAsync(
      `"${PYTHON_PATH}" "${BUILDER_PATH}" --config "${configPath}" --preview`,
      { timeout: 10_000, encoding: "utf-8" }
    );

    // stdout에서 SQL 부분만 추출 (요약 헤더 제거)
    const sql = extractSql(stdout);

    return NextResponse.json({ sql, warnings: stderr || null });
  } catch (err) {
    const message = err.stderr || err.message || "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    // 임시 파일 정리
    if (configPath) {
      unlink(configPath).catch(() => {});
    }
  }
}

// ─────────────────────────────────────────
// 프론트 폼 데이터 → YAML 문자열
// ─────────────────────────────────────────
function buildYaml({ martName, sourceTable, analysisPeriod, steps }) {
  const { start, end } = parsePeriod(analysisPeriod);

  const stepLines = steps
    .map(
      (s, i) =>
        `  - step: ${i + 1}\n    name: "${s.label}"\n    event: "${s.event}"`
    )
    .join("\n");

  return `mart_name: "${martName || "my_funnel"}"
date_range:
  start: "${start}"
  end: "${end}"
user_id_col: "user_id"
event_table: "${sourceTable || "raw.app_events"}"
platform: "all"
funnel_steps:
${stepLines}
`;
}

// ─────────────────────────────────────────
// "Last N Days" / "YYYY-MM-DD ~ YYYY-MM-DD" 파싱
// ─────────────────────────────────────────
function parsePeriod(period) {
  if (!period) {
    const end = today();
    return { start: offsetDate(end, -30), end };
  }

  // "Last 30 Days" 형식
  const lastMatch = period.match(/last\s+(\d+)\s+days?/i);
  if (lastMatch) {
    const end = today();
    return { start: offsetDate(end, -parseInt(lastMatch[1])), end };
  }

  // "YYYY-MM-DD ~ YYYY-MM-DD" 형식
  const rangeMatch = period.match(/(\d{4}-\d{2}-\d{2})\s*[~\-]\s*(\d{4}-\d{2}-\d{2})/);
  if (rangeMatch) {
    return { start: rangeMatch[1], end: rangeMatch[2] };
  }

  // fallback
  const end = today();
  return { start: offsetDate(end, -30), end };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function offsetDate(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────
// stdout에서 SQL 부분만 추출
// builder.py --preview 는 요약 헤더 뒤에 "--- SQL 미리보기 ---" 를 출력함
// ─────────────────────────────────────────
function extractSql(stdout) {
  const marker = "--- SQL";
  const idx = stdout.indexOf(marker);
  if (idx === -1) return stdout.trim();
  // 마커 다음 줄부터 끝까지
  return stdout.slice(stdout.indexOf("\n", idx) + 1).trim();
}
