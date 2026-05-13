// devidles.com/test/* 라우트로 들어오는 요청의 /test prefix를 제거한 뒤
// env.ASSETS.fetch에 위임 — Cloudflare Workers Static Assets는 URL pathname을
// 자산 경로로 그대로 사용하므로(자동 prefix strip 없음) 이 핸들러가 필요하다.
//
// assets.directory가 프로젝트 루트("./")라 worker.js·wrangler·메모/문서가
// 정적으로 노출될 수 있어 BLOCKED 목록으로 차단. 향후 site 파일들을
// public/ 같은 별도 디렉터리로 옮기면 이 블록리스트는 제거 가능.
const PREFIX = '/test';
const BLOCKED = new Set([
  '/worker.js',
  '/wrangler.jsonc',
  '/CLAUDE.md',
  '/package.json',
  '/package-lock.json',
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === PREFIX) {
      url.pathname = PREFIX + '/';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.startsWith(PREFIX + '/')) {
      const inner = url.pathname.slice(PREFIX.length) || '/';
      if (BLOCKED.has(inner)) {
        return new Response('Not Found', { status: 404 });
      }
      url.pathname = inner;
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }
    return new Response('Not Found', { status: 404 });
  },
};
