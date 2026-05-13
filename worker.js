// devidles.com/test/* 라우트로 들어오는 요청의 /test prefix를 제거한 뒤
// env.ASSETS.fetch에 위임 — Cloudflare Workers Static Assets는 URL pathname을
// 자산 경로로 그대로 사용하므로(자동 prefix strip 없음) 이 핸들러가 필요하다.
//
// assets.directory가 프로젝트 루트("./")라 worker.js·wrangler·메모/문서가
// 정적으로 노출될 수 있어 BLOCKED 목록으로 차단.
//
// 정책 페이지는 devidles.com 루트로 통합됨 — /test/about, /test/privacy 등은
// 301로 루트(/about, /privacy 등)로 영구 redirect.
//
// SNS 결과별 OG:
//   - `/test/{name}/og.svg?r=XXXX` → 결과별 OG SVG 즉석 생성
//   - `/test/{name}/?r=XXXX` → 정적 HTML에 HTMLRewriter로 og:image/title/description를
//     결과별 값으로 교체. 사용자 브라우저에서는 JS가 ?r=을 읽어 결과 화면을 표시.

import { RESULT_DATA, TEST_META } from './og-data.js';
import { generateOgSvg } from './og-svg.js';

const PREFIX = '/test';
const BLOCKED = new Set([
  '/worker.js',
  '/wrangler.jsonc',
  '/CLAUDE.md',
  '/package.json',
  '/package-lock.json',
  '/og-data.js',
  '/og-svg.js',
]);
const REDIRECT_TO_ROOT = new Set([
  '/about', '/about/',
  '/contact', '/contact/',
  '/privacy', '/privacy/',
  '/terms', '/terms/',
]);

class OgRewriter {
  constructor(testName, resultCode) {
    this.data = RESULT_DATA[testName]?.[resultCode];
    this.meta = TEST_META[testName];
    this.testName = testName;
    this.resultCode = resultCode;
  }
  element(el) {
    if (!this.data || !this.meta) return;
    const { name, emoji, tagline } = this.data;
    const ogTitle = `나는 ${emoji} ${name} (${this.resultCode}) — ${this.meta.title}`;
    const ogDesc = `"${tagline}" — ${name} (${this.resultCode})`;
    const ogImage = `https://devidles.com/test/${this.testName}/og.svg?r=${this.resultCode}`;

    const property = el.getAttribute('property');
    const nameAttr = el.getAttribute('name');

    if (property === 'og:image' || nameAttr === 'twitter:image') {
      el.setAttribute('content', ogImage);
    } else if (property === 'og:title' || nameAttr === 'twitter:title') {
      el.setAttribute('content', ogTitle);
    } else if (property === 'og:description' || nameAttr === 'twitter:description') {
      el.setAttribute('content', ogDesc);
    } else if (property === 'og:url') {
      el.setAttribute('content', `https://devidles.com/test/${this.testName}/?r=${this.resultCode}`);
    }
  }
}

class TitleRewriter {
  constructor(testName, resultCode) {
    this.data = RESULT_DATA[testName]?.[resultCode];
    this.meta = TEST_META[testName];
    this.resultCode = resultCode;
  }
  element(el) {
    if (!this.data || !this.meta) return;
    el.setInnerContent(`나는 ${this.data.emoji} ${this.data.name} (${this.resultCode}) — ${this.meta.title}`);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === PREFIX) {
      url.pathname = PREFIX + '/';
      return Response.redirect(url.toString(), 301);
    }

    if (!url.pathname.startsWith(PREFIX + '/')) {
      return new Response('Not Found', { status: 404 });
    }

    const inner = url.pathname.slice(PREFIX.length) || '/';

    if (BLOCKED.has(inner)) {
      return new Response('Not Found', { status: 404 });
    }

    if (REDIRECT_TO_ROOT.has(inner)) {
      const target = inner.endsWith('/') ? inner : inner + '/';
      return Response.redirect(`https://devidles.com${target}`, 301);
    }

    // OG SVG 엔드포인트: /test/{name}/og.svg?r=CODE
    const ogMatch = inner.match(/^\/([^/]+)\/og\.svg$/);
    if (ogMatch) {
      const testName = ogMatch[1];
      const resultCode = (url.searchParams.get('r') || '').toUpperCase();
      const svg = generateOgSvg(testName, resultCode);
      if (svg) {
        return new Response(svg, {
          headers: {
            'content-type': 'image/svg+xml; charset=utf-8',
            'cache-control': 'public, max-age=86400, s-maxage=604800',
          },
        });
      }
      return new Response('Not Found', { status: 404 });
    }

    // 결과 공유 페이지: /test/{name}/?r=CODE → HTMLRewriter로 OG 메타 교체
    const testPathMatch = inner.match(/^\/([^/]+)\/$/);
    if (testPathMatch) {
      const testName = testPathMatch[1];
      const resultCode = (url.searchParams.get('r') || '').toUpperCase();
      if (resultCode && RESULT_DATA[testName]?.[resultCode]) {
        const assetUrl = new URL(url);
        assetUrl.pathname = inner;
        assetUrl.search = '';
        const assetResp = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
        return new HTMLRewriter()
          .on('meta', new OgRewriter(testName, resultCode))
          .on('title', new TitleRewriter(testName, resultCode))
          .transform(assetResp);
      }
    }

    // 기본: 정적 자산 위임
    url.pathname = inner;
    return env.ASSETS.fetch(new Request(url.toString(), request));
  },
};
