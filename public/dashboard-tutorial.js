(() => {
  const STORAGE_KEY = 'threadzw_dashboard_tutorial_v1_seen';
  const BUCKET = 'landing page background';
  const SUPABASE_URL = 'https://zuashdquiorcwvyvqucm.supabase.co';
  const IMAGE_NAMES = [
    'file_0000000018cc81f484c84af953e86338.png',
    'file_000000007a7881f4a37067f6e6393557.png',
    'file_00000000ad7c81f4a9ca283392e8bd37.png',
    'file_00000000b04081f4bf35206b09da3e46.png',
    'file_00000000e54c8246b0ef327984326b75.png'
  ];

  const imageUrl = (name) => `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${encodeURIComponent(name)}`;

  const styles = `
    #threadzw-tutorial-root { position: fixed; inset: 0; z-index: 99999; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    #threadzw-tutorial-root * { box-sizing: border-box; }
    .tzw-backdrop { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 18px; background: rgba(0,0,0,.68); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
    .tzw-card { width: min(440px, 100%); max-height: min(760px, calc(100dvh - 36px)); overflow: hidden; background: #fff; color: #111; border: 1px solid rgba(255,255,255,.25); border-radius: 28px; box-shadow: 0 30px 90px rgba(0,0,0,.35); animation: tzw-in .24s ease-out; }
    @keyframes tzw-in { from { opacity: 0; transform: translateY(14px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .tzw-welcome { padding: 28px; }
    .tzw-brand { display: inline-flex; align-items: center; gap: 2px; font-size: 22px; font-weight: 950; letter-spacing: -.04em; }
    .tzw-brand span { color: #b8ef00; }
    .tzw-icon { width: 52px; height: 52px; margin: 24px 0 18px; border-radius: 17px; background: #c6ff00; display: grid; place-items: center; font-size: 25px; }
    .tzw-welcome h2 { margin: 0; font-size: 29px; line-height: 1.03; letter-spacing: -.04em; }
    .tzw-welcome p { margin: 12px 0 0; color: #71717a; font-size: 14px; line-height: 1.55; }
    .tzw-actions { display: grid; gap: 9px; margin-top: 24px; }
    .tzw-btn { appearance: none; border: 0; border-radius: 15px; padding: 14px 16px; font-size: 13px; font-weight: 850; cursor: pointer; transition: transform .15s ease, opacity .15s ease; }
    .tzw-btn:active { transform: scale(.98); }
    .tzw-primary { background: #c6ff00; color: #000; }
    .tzw-secondary { background: #f4f4f5; color: #52525b; }
    .tzw-tour { display: flex; flex-direction: column; max-height: min(760px, calc(100dvh - 36px)); }
    .tzw-tour-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 17px 12px; }
    .tzw-tour-title { font-size: 15px; font-weight: 900; letter-spacing: -.02em; }
    .tzw-close { width: 34px; height: 34px; border: 0; border-radius: 50%; background: #f4f4f5; color: #18181b; font-size: 20px; line-height: 1; cursor: pointer; }
    .tzw-track { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; touch-action: pan-x; }
    .tzw-track::-webkit-scrollbar { display: none; }
    .tzw-slide { flex: 0 0 100%; scroll-snap-align: center; padding: 0 12px; }
    .tzw-slide img { display: block; width: 100%; max-height: min(61dvh, 590px); object-fit: contain; border-radius: 18px; background: #f4f4f5; user-select: none; -webkit-user-drag: none; }
    .tzw-tour-foot { padding: 12px 17px 17px; }
    .tzw-dots { display: flex; justify-content: center; gap: 6px; margin-bottom: 12px; }
    .tzw-dot { width: 7px; height: 7px; border: 0; border-radius: 999px; padding: 0; background: #d4d4d8; cursor: pointer; transition: width .2s ease, background .2s ease; }
    .tzw-dot.active { width: 22px; background: #c6ff00; }
    .tzw-nav { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .tzw-nav .tzw-btn { flex: 1; }
    .tzw-skip { border: 0; background: transparent; color: #71717a; font-size: 11px; font-weight: 750; cursor: pointer; padding: 8px; }
    @media (max-width: 480px) { .tzw-backdrop { padding: 10px; } .tzw-card { border-radius: 24px; max-height: calc(100dvh - 20px); } .tzw-welcome { padding: 24px; } .tzw-slide img { max-height: 57dvh; } }
  `;

  const mount = () => {
    if (!location.pathname.toLowerCase().startsWith('/dashboard')) return;
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    if (document.getElementById('threadzw-tutorial-root')) return;

    const root = document.createElement('div');
    root.id = 'threadzw-tutorial-root';
    const style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);
    document.body.appendChild(root);

    const markSeen = () => localStorage.setItem(STORAGE_KEY, 'true');
    const close = () => { markSeen(); root.remove(); style.remove(); };

    const showWelcome = () => {
      root.innerHTML = `
        <div class="tzw-backdrop" role="dialog" aria-modal="true" aria-labelledby="tzw-welcome-title">
          <section class="tzw-card tzw-welcome">
            <div class="tzw-brand">Thread<span>ZW</span></div>
            <div class="tzw-icon">✦</div>
            <h2 id="tzw-welcome-title">Want a quick tour?</h2>
            <p>Take a quick look at how to manage your shop, add products, share your storefront and turn visitors into customer interests.</p>
            <div class="tzw-actions">
              <button class="tzw-btn tzw-primary" data-action="start">SHOW ME HOW →</button>
              <button class="tzw-btn tzw-secondary" data-action="skip">SKIP FOR NOW</button>
            </div>
          </section>
        </div>`;

      root.querySelector('[data-action="start"]').addEventListener('click', showTour);
      root.querySelector('[data-action="skip"]').addEventListener('click', close);
    };

    const showTour = () => {
      let index = 0;
      root.innerHTML = `
        <div class="tzw-backdrop" role="dialog" aria-modal="true" aria-label="ThreadZW dashboard tutorial">
          <section class="tzw-card tzw-tour">
            <header class="tzw-tour-head">
              <div class="tzw-tour-title">ThreadZW quick tour</div>
              <button class="tzw-close" data-action="close" aria-label="Close tutorial">×</button>
            </header>
            <div class="tzw-track" data-track>
              ${IMAGE_NAMES.map((name, i) => `<div class="tzw-slide"><img src="${imageUrl(name)}" alt="ThreadZW tutorial ${i + 1}" draggable="false" /></div>`).join('')}
            </div>
            <footer class="tzw-tour-foot">
              <div class="tzw-dots" data-dots>
                ${IMAGE_NAMES.map((_, i) => `<button class="tzw-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Go to tutorial slide ${i + 1}"></button>`).join('')}
              </div>
              <div class="tzw-nav">
                <button class="tzw-skip" data-action="skip">Skip tutorial</button>
                <button class="tzw-btn tzw-primary" data-action="next">NEXT →</button>
              </div>
            </footer>
          </section>
        </div>`;

      const track = root.querySelector('[data-track]');
      const dots = [...root.querySelectorAll('[data-index]')];
      const next = root.querySelector('[data-action="next"]');

      const goTo = (nextIndex) => {
        index = Math.max(0, Math.min(IMAGE_NAMES.length - 1, nextIndex));
        track.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' });
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
        next.textContent = index === IMAGE_NAMES.length - 1 ? 'DONE ✓' : 'NEXT →';
      };

      track.addEventListener('scroll', () => {
        const width = track.clientWidth || 1;
        const nextIndex = Math.round(track.scrollLeft / width);
        if (nextIndex !== index) {
          index = Math.max(0, Math.min(IMAGE_NAMES.length - 1, nextIndex));
          dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
          next.textContent = index === IMAGE_NAMES.length - 1 ? 'DONE ✓' : 'NEXT →';
        }
      }, { passive: true });

      dots.forEach(dot => dot.addEventListener('click', () => goTo(Number(dot.dataset.index))));
      next.addEventListener('click', () => index === IMAGE_NAMES.length - 1 ? close() : goTo(index + 1));
      root.querySelector('[data-action="close"]').addEventListener('click', close);
      root.querySelector('[data-action="skip"]').addEventListener('click', close);
    };

    showWelcome();
  };

  const watch = () => {
    if (location.pathname.toLowerCase().startsWith('/dashboard')) {
      window.setTimeout(mount, 350);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch, { once: true });
  else watch();
  window.addEventListener('popstate', watch);
})();
