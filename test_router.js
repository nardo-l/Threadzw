const reserved1 = ['login', 'signup', 'admin', 'onboarding', 'dashboard', 'inventory', 'add-product', 'settings', 'edit-shop', 'setup', 'pricing', 'setup-success', 'demo', 'product', 'api', 's', 'shop', 'store', 'checkout', 'auth', 'reset-password'];
const reserved2 = ['login', 'signup', 'admin', 'onboarding', 'dashboard', 'inventory', 'add-product', 'edit-product', 'settings', 'edit-shop', 'setup', 'pricing', 'setup-success', 'demo', 'product', 'api', 'checkout', 'auth', 'reset-password'];

function test(cleanPath) {
  const segments = cleanPath.split('/').filter(Boolean);
  let isPublic = false;
  if (cleanPath === '/demo' || cleanPath === '/shop' || cleanPath === '/store' || cleanPath === '/shops' || cleanPath.startsWith('/shop/') || cleanPath.startsWith('/store/') || cleanPath.startsWith('/s/')) {
    isPublic = true;
  } else if (segments.length > 0) {
    const firstSegment = segments[0];
    if (firstSegment.includes('--')) {
      isPublic = true;
    } else if (!reserved2.includes(firstSegment.toLowerCase())) {
      isPublic = true;
    }
  }
  
  let stage = null;
  const path = cleanPath.toLowerCase().replace(/\/$/, '');
  if (path === '/shop' || path === '/store' || path === '/shops') stage = 'shop-directory';
  else if (path === '/demo' || path === '/shop/demo' || path === '/store/demo') stage = 'shop';
  else if (path === '/admin') stage = 'admin';
  else if (path === '/onboarding' || path === '/signup') stage = 'onboarding';
  else if (path.startsWith('/dashboard') || path === '/inventory' || path === '/add-product' || path.startsWith('/edit-product') || path === '/settings' || path === '/edit-shop') stage = 'dashboard';
  else if (path === '/pricing') stage = 'pricing';
  else if (path === '/setup-success') stage = 'setup-success';
  else if (path === '/setup') stage = 'setup';
  else if (path.startsWith('/checkout')) stage = 'checkout';
  
  console.log({ path: cleanPath, isPublic, stage });
}

test('/pricing');
test('/setup');
test('/setup-success');
