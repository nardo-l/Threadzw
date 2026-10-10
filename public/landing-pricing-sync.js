(function () {
  const OLD_FAQ = 'You can create a clothing storefront and list unlimited products. The free allowance protects 50 unique visitors and 10 customer-interest actions over your shop’s lifetime.';

  function replaceText(root, from, to) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.nodeValue && node.nodeValue.includes(from)) {
        node.nodeValue = node.nodeValue.replace(from, to);
      }
    });
  }

  function syncPricing() {
    const section = document.getElementById('pricing');
    if (!section) return;
    const grid = section.firstElementChild;
    if (!grid || grid.children.length < 2) return;

    const card = grid.children[1];
    if (card.dataset.threadzwPricingSynced === 'true') return;

    card.innerHTML = [
      '<div class="grid gap-4 sm:grid-cols-2">',
        '<div class="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">',
          '<p class="text-xs font-black uppercase tracking-[0.2em] text-[#C6FF00]">Free trial</p>',
          '<div class="mt-2 flex items-end gap-2"><h3 class="text-3xl font-black">3 days</h3><span class="pb-1 text-xs text-zinc-500">unlimited</span></div>',
          '<p class="mt-1 text-sm text-zinc-500">Try every Pro feature before paying.</p>',
          '<div class="my-5 h-px bg-white/10"></div>',
          '<div class="space-y-3 text-sm font-bold">',
            '<p class="flex items-start gap-3"><span class="mt-0.5 text-[#C6FF00]">✓</span> Unlimited products and Pro tools</p>',
            '<p class="flex items-start gap-3"><span class="mt-0.5 text-[#C6FF00]">✓</span> Your own shareable shop link</p>',
            '<p class="flex items-start gap-3"><span class="mt-0.5 text-[#C6FF00]">✓</span> WhatsApp enquiries and storefront analytics</p>',
            '<p class="flex items-start gap-3"><span class="mt-0.5 text-[#C6FF00]">✓</span> No payment needed to start</p>',
          '</div>',
        '</div>',
        '<div class="rounded-[1.5rem] border-2 border-[#C6FF00] bg-[#C6FF00] p-5 text-black">',
          '<div class="flex items-start justify-between gap-3"><div>',
            '<p class="text-xs font-black uppercase tracking-[0.2em] text-black/60">ThreadZW Pro</p>',
            '<div class="mt-2 flex items-end gap-2"><h3 class="text-3xl font-black">$1.59</h3><span class="pb-1 text-xs font-bold text-black/60">per month</span></div>',
          '</div><div class="rounded-full bg-black px-3 py-1 text-[9px] font-black uppercase tracking-wider text-[#C6FF00]">Monthly</div></div>',
          '<p class="mt-1 text-sm text-black/60">Pay monthly. Pro activates after admin verification.</p>',
          '<div class="my-5 h-px bg-black/10"></div>',
          '<div class="space-y-3 text-sm font-bold">',
            '<p class="flex items-start gap-3"><span class="mt-0.5">✓</span> Unlimited products while Pro is active</p>',
            '<p class="flex items-start gap-3"><span class="mt-0.5">✓</span> Premium storefront tools and analytics</p>',
            '<p class="flex items-start gap-3"><span class="mt-0.5">✓</span> Existing payment and admin-verification process</p>',
          '</div>',
          '<p class="mt-5 text-[11px] font-bold text-black/60">After the trial, your shop stays online in view-only mode until payment is verified.</p>',
        '</div>',
      '</div>'
    ].join('');
    card.dataset.threadzwPricingSynced = 'true';

    replaceText(section, 'Your products stay unlimited on the free clothing plan.', 'Try unlimited products for 3 days. Then Pro is $1.59/month.');
    replaceText(document.getElementById('faq') || document, OLD_FAQ, 'You get 3 days of unlimited Pro access. After the trial, your storefront remains online in view-only mode until your $1.59 monthly payment is verified.');
  }

  const observer = new MutationObserver(syncPricing);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncPricing, { once: true });
  } else {
    syncPricing();
  }
})();
