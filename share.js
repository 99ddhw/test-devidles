// devidles.com/test 공유 헬퍼. 4개 심리테스트가 공통으로 사용.
//
// 사용법: 각 테스트 HTML이 head에서 이 스크립트를 로드한 뒤(외부 의존성:
// head에 Kakao SDK도 함께 로드), 테스트 IIFE의 마지막에서 setup()을 호출한다.
//
//   window.devidlesShare.setup({
//     path: 'plant-mbti',           // /test/{path}
//     label: '식물 MBTI 테스트',     // 공유 텍스트에 사용
//     results: RESULTS,             // 결과 dict (코드 → {emoji,name,tagline,...})
//     computeCode: calculateMBTI,   // 현재 점수에서 결과 코드를 산출하는 함수
//     toast,                        // 토스트 메시지 표시 함수
//   });
//
// 의존성:
//  - Kakao JS SDK 2.6.x — head에서 비동기 로드, Kakao.init() 호출은 페이지 측 책임
//  - html2canvas 1.4.x — 인스타그램 공유 클릭 시 lazy load(첫 클릭에 한 번)

(function () {
  'use strict';

  const HTML2CANVAS_SRC = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function copyLink(url, toast) {
    const ok = () => toast && toast('링크가 복사되었습니다 ✓');
    const fail = () => toast && toast('복사 실패 — URL을 직접 복사해주세요');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(ok).catch(fail);
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); ok(); } catch { fail(); }
      document.body.removeChild(ta);
    }
  }

  function shareUrl(cfg, code) { return `https://devidles.com/test/${cfg.path}/?r=${code}`; }
  function ogImage(cfg, code) { return `https://devidles.com/test/${cfg.path}/og.svg?r=${code}`; }
  function testHome(cfg)      { return `https://devidles.com/test/${cfg.path}/`; }

  function shareTwitter(cfg) {
    const code = cfg.computeCode();
    const r = cfg.results[code];
    if (!r) return;
    const text = `나는 ${r.emoji} ${r.name} (${code}) — "${r.tagline}"\n${cfg.label} 결과 보러가기`;
    const url = shareUrl(cfg, code);
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  }

  function shareKakao(cfg) {
    const code = cfg.computeCode();
    const r = cfg.results[code];
    if (!r) return;
    const url = shareUrl(cfg, code);

    // Kakao SDK가 초기화돼 있으면 공식 공유 다이얼로그를 띄움.
    // 미초기화/미로드 시 navigator.share(OS 공유 시트, 모바일 카카오톡 포함) → copyLink 순으로 fallback.
    if (window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized() && window.Kakao.Share) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: `나는 ${r.emoji} ${r.name} (${code})`,
            description: `"${r.tagline}"\n${cfg.label} 결과 보기`,
            imageUrl: ogImage(cfg, code),
            link: { mobileWebUrl: url, webUrl: url },
          },
          buttons: [{
            title: '나도 테스트하기',
            link: { mobileWebUrl: testHome(cfg), webUrl: testHome(cfg) },
          }],
        });
        return;
      } catch (e) { /* SDK 호출 실패 — fallback으로 */ }
    }

    if (navigator.share) {
      navigator.share({ title: `${r.emoji} ${r.name} (${code})`, text: r.tagline, url })
        .catch(() => copyLink(url, cfg.toast));
    } else {
      copyLink(url, cfg.toast);
    }
  }

  async function shareInstagram(cfg) {
    const code = cfg.computeCode();
    const r = cfg.results[code];
    if (!r) return;

    if (cfg.toast) cfg.toast('결과 카드 이미지 만드는 중…');

    try {
      if (!window.html2canvas) await loadScript(HTML2CANVAS_SRC);

      const card = document.getElementById('result-card');
      if (!card) throw new Error('result-card 엘리먼트 없음');

      const canvas = await window.html2canvas(card, {
        backgroundColor: null,
        scale: 2,           // 레티나 대응
        useCORS: true,
        logging: false,
      });

      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('PNG 변환 실패');

      const file = new File([blob], `devidles-${code}.png`, { type: 'image/png' });

      // Web Share API + 파일 (모바일) — OS 공유 시트에 인스타그램 직접 노출
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `${r.emoji} ${r.name}`, text: r.tagline });
          return;
        } catch (e) {
          if (e && e.name === 'AbortError') return; // 사용자 취소
          // 그 외 오류는 다운로드 폴백으로
        }
      }

      // 폴백: 다운로드 — 사용자가 인스타그램 앱에서 수동 업로드
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `devidles-${code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(dlUrl), 1500);

      if (cfg.toast) cfg.toast('이미지 다운로드 완료 📷 인스타그램에 업로드해보세요');
    } catch (e) {
      console.error('Instagram share failed:', e);
      if (cfg.toast) cfg.toast('이미지 생성 실패 · 화면을 직접 캡처해 보세요');
    }
  }

  function shareCopy(cfg) {
    const code = cfg.computeCode();
    copyLink(shareUrl(cfg, code), cfg.toast);
  }

  function setup(cfg) {
    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => fn(cfg));
    };
    bind('btn-share-x', shareTwitter);
    bind('btn-share-kakao', shareKakao);
    bind('btn-share-insta', shareInstagram);
    bind('btn-share-copy', shareCopy);
  }

  window.devidlesShare = { setup };
})();
