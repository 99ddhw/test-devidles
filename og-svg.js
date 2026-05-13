// 결과별 OG 카드를 SVG로 즉석 합성. 1200x630, 그라데이션 배경 + 큰 이모지 +
// MBTI 코드 + 결과 이름 + 태그라인 + 브랜드 마크.
//
// SVG로 출력하는 이유: 사전 생성된 PNG 64개 없이도 동적으로 결과별 카드를
// 만들 수 있고, Workers 번들에 wasm을 포함하지 않아도 됨. Facebook·Twitter는
// 일반적으로 SVG og:image를 잘 렌더링하며, KakaoTalk은 SVG 지원이 제한적이라
// 미리보기에서 이미지 대신 텍스트만 보일 수 있음(HTMLRewriter가 og:title /
// og:description은 결과별로 채우므로 텍스트는 정상). KakaoTalk 이미지까지
// 필요해지면 satori + resvg-wasm으로 PNG 출력으로 업그레이드 가능.

import { RESULT_DATA, TEST_META } from './og-data.js';

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function darken(hex, amount = 0.4) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - amount)));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

export function generateOgSvg(testName, resultCode) {
  const data = RESULT_DATA[testName]?.[resultCode];
  const meta = TEST_META[testName];
  if (!data || !meta) return null;

  const { name, emoji, color, tagline } = data;
  const darker = darken(color, 0.5);
  // 한국어 한 글자 ≈ 약 2 ASCII 폭. 약 28자 cap.
  const taglineShort = tagline.length > 28 ? tagline.slice(0, 27) + '…' : tagline;

  // 시스템 폰트 스택 — 크롤러 렌더링 환경에 따라 fallback. emoji 폰트는 별도 스택.
  const SANS = `system-ui,-apple-system,'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif`;
  const MONO = `ui-monospace,SFMono-Regular,Menlo,Monaco,'JetBrains Mono',monospace`;
  const EMOJI = `'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji','Twemoji Mozilla',sans-serif`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${darker}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="40%" r="40%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#halo)"/>

  <!-- header strip -->
  <text x="60" y="80" font-family="${SANS}" font-size="28" font-weight="700" fill="rgba(255,255,255,0.85)">
    <tspan font-family="${EMOJI}">${escapeXml(meta.emoji)}</tspan> ${escapeXml(meta.title)}
  </text>
  <text x="60" y="112" font-family="${SANS}" font-size="18" font-weight="500" fill="rgba(255,255,255,0.55)" letter-spacing="2">devidles.com / test</text>

  <!-- main emoji -->
  <text x="600" y="320" text-anchor="middle" font-family="${EMOJI}" font-size="200">${escapeXml(emoji)}</text>

  <!-- MBTI code -->
  <text x="600" y="402" text-anchor="middle" font-family="${MONO}" font-size="36" font-weight="700" fill="rgba(255,255,255,0.78)" letter-spacing="8">${escapeXml(resultCode)}</text>

  <!-- result name -->
  <text x="600" y="486" text-anchor="middle" font-family="${SANS}" font-size="72" font-weight="800" fill="#fff">${escapeXml(name)}</text>

  <!-- tagline -->
  <text x="600" y="548" text-anchor="middle" font-family="${SANS}" font-size="26" font-weight="500" fill="rgba(255,255,255,0.88)">${escapeXml(taglineShort)}</text>

  <!-- bottom brand -->
  <text x="600" y="600" text-anchor="middle" font-family="${SANS}" font-size="16" font-weight="600" fill="rgba(255,255,255,0.5)" letter-spacing="4">✦ DEVIDLES</text>
</svg>`;
}
