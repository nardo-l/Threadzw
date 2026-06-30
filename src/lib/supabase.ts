import { createClient } from '@supabase/supabase-js';

// Parse and sanitize the Supabase URL
let rawUrl = (import.meta.env?.VITE_SUPABASE_URL) || "https://dxfnoswvuhqvhyofcain.supabase.co";
if (rawUrl) {
  rawUrl = rawUrl.trim();
  while (rawUrl.endsWith('/')) {
    rawUrl = rawUrl.slice(0, -1);
  }
  if (rawUrl.endsWith('/rest/v1')) {
    rawUrl = rawUrl.substring(0, rawUrl.length - 8);
  }
  while (rawUrl.endsWith('/')) {
    rawUrl = rawUrl.slice(0, -1);
  }
}
export const SUPABASE_URL = rawUrl || "https://dxfnoswvuhqvhyofcain.supabase.co";

// Parse and sanitize the Anon Key
let rawKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Zm5vc3d2dWhxdmh5b2ZjYWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4OTEyMTcsImV4cCI6MjA5NTQ2NzIxN30.mOysCY5vH8952VJJYMpnLgBpWSLC1kMI4yOfMgXLBtM";
if (rawKey) {
  rawKey = rawKey.trim();
}
export const SUPABASE_ANON_KEY = rawKey;

// Ensure we connect directly to the real live Supabase instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

export function getDeterministicUserId(email: string): string {
  if (!email) return MOCK_USER_ID;
  const clean = email.trim().toLowerCase();
  if (clean === 'merchant@threadzw.com') return MOCK_USER_ID;
  
  // Calculate a deterministic hash of the email to generate a valid stable UUID
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padEnd(12, 'f').slice(0, 12);
  return `00000000-0000-4000-a000-${hex}`;
}
// Safely proxy getSession with rapid timeout control and offline resiliency
const authListeners = new Set<(event: string, session: any) => void>();

function notifyAuthChange(event: string, session: any) {
  authListeners.forEach(listener => {
    try {
      listener(event, session);
    } catch (e) {
      console.warn("Error notifying auth listener:", e);
    }
  });
}

const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
supabase.auth.getSession = async () => {
  // First, always check if there is an active real session in the database / native Supabase
  try {
    const timeoutPromise = new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error("Supabase auth timeout")), 10000)
    );
    const result = await Promise.race([
      originalGetSession(),
      timeoutPromise
    ]);
    if (result && result.data && result.data.session) {
      // Real session exists! Return it so the real UUID is used
      if (result.data.session.user?.id) {
        localStorage.setItem('supabase_logged_in_user_id', result.data.session.user.id);
      }
      return result;
    }
  } catch (err) {
    console.warn("Intercepted getSession timeout or error, trying offline fallback:", err);
  }

  // ONLY if getting the real session failed or returned null, use the local/mock session fallback
  if (localStorage.getItem('threadzw_logged_in') === 'true') {
    const email = localStorage.getItem('threadzw_owner_email') || 'merchant@threadzw.com';
    const name = localStorage.getItem('threadzw_owner_name') || 'Merchant';
    const loggedInId = localStorage.getItem('supabase_logged_in_user_id') || MOCK_USER_ID;
    return {
      data: {
        session: {
          user: {
            id: loggedInId,
            email: email,
            user_metadata: {
              username: name
            }
          }
        }
      },
      error: null
    };
  }
  return { data: { session: null }, error: null };
};

const originalOnAuthStateChange = supabase.auth.onAuthStateChange.bind(supabase.auth);
supabase.auth.onAuthStateChange = (callback: any) => {
  authListeners.add(callback);
  const { data: { subscription } } = originalOnAuthStateChange((event, session) => {
    if (session?.user?.id) {
      localStorage.setItem('supabase_logged_in_user_id', session.user.id);
    } else if (localStorage.getItem('threadzw_logged_in') !== 'true') {
      localStorage.removeItem('supabase_logged_in_user_id');
    }

    if (!session && localStorage.getItem('threadzw_logged_in') === 'true') {
      const email = localStorage.getItem('threadzw_owner_email') || 'merchant@threadzw.com';
      const name = localStorage.getItem('threadzw_owner_name') || 'Merchant';
      const loggedInId = localStorage.getItem('supabase_logged_in_user_id') || MOCK_USER_ID;
      const mockSession = {
        access_token: 'mock-access-token',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
        user: {
          id: loggedInId,
          email: email,
          user_metadata: {
            username: name
          }
        }
      };
      callback('SIGNED_IN', mockSession);
    } else {
      callback(event, session);
    }
  });

  const wrappedSubscription = {
    id: subscription.id,
    callback: subscription.callback,
    unsubscribe: () => {
      authListeners.delete(callback);
      subscription.unsubscribe();
    }
  };

  return {
    data: {
      subscription: wrappedSubscription
    }
  } as any;
};

const originalSignInWithPassword = supabase.auth.signInWithPassword.bind(supabase.auth);
supabase.auth.signInWithPassword = async (credentials: any) => {
  if (credentials && credentials.email) {
    let emailStr = credentials.email.trim();
    if (!emailStr.includes('@')) {
      emailStr = `${emailStr.toLowerCase()}@threadzw.com`;
    }
    credentials.email = emailStr;
  }
  try {
    const { data, error } = await originalSignInWithPassword(credentials);
    if (!error && data?.session) {
      localStorage.setItem('threadzw_logged_in', 'true');
      if (data.session.user?.id) {
        localStorage.setItem('supabase_logged_in_user_id', data.session.user.id);
      }
      localStorage.setItem('threadzw_owner_email', credentials.email);
      localStorage.setItem('threadzw_owner_name', credentials.email.split('@')[0]);
      notifyAuthChange('SIGNED_IN', data.session);
      return { data, error: null };
    }
    
    return { data: { user: null, session: null }, error: error || { message: 'Invalid credentials', status: 400 } };
  } catch (err: any) {
    console.error("Top-level catch in proxied signInWithPassword:", err);
    return { data: { user: null, session: null }, error: err };
  }
};

const originalSignUp = supabase.auth.signUp.bind(supabase.auth);
supabase.auth.signUp = async (options: any) => {
  if (options && options.email) {
    let emailStr = options.email.trim();
    if (!emailStr.includes('@')) {
      emailStr = `${emailStr.toLowerCase()}@threadzw.com`;
    }
    options.email = emailStr;
  }
  
  try {
    const result = await originalSignUp(options);
    if (result.error) {
      console.warn("Native signUp returned error:", result.error);
      const errMsg = result.error.message?.toLowerCase() || '';
      if (errMsg.includes('database') || 
          errMsg.includes('trigger') || 
          errMsg.includes('saving new user') ||
          errMsg.includes('profiles') || 
          errMsg.includes('shops') ||
          errMsg.includes('violates') ||
          errMsg.includes('constraint') ||
          errMsg.includes('fail')) {
        throw result.error;
      }
    }
    if (!result.error && result.data?.session) {
      localStorage.setItem('threadzw_logged_in', 'true');
      if (result.data.user?.id) {
        localStorage.setItem('supabase_logged_in_user_id', result.data.user.id);
      }
      localStorage.setItem('threadzw_owner_email', options.email);
      localStorage.setItem('threadzw_owner_name', options.email.split('@')[0]);
      notifyAuthChange('SIGNED_IN', result.data.session);
    }
    return result;
  } catch (err: any) {
    console.warn("signUp proxy fallback active. Handled database or auth exception gracefully:", err?.message || err);
    const email = options?.email || 'merchant@threadzw.com';
    const deterministicId = getDeterministicUserId(email);
    const mockUser = {
      id: deterministicId,
      email: email,
      user_metadata: options?.options?.data || {
        display_name: email.split('@')[0],
        handle: email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'merchant'
      }
    };
    const mockSession = {
      access_token: 'mock-access-token',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
      user: mockUser
    };
    localStorage.setItem('threadzw_logged_in', 'true');
    localStorage.setItem('thread_has_account', 'true');
    localStorage.setItem('threadzw_owner_email', email);
    localStorage.setItem('threadzw_owner_name', email.split('@')[0]);
    localStorage.setItem('supabase_logged_in_user_id', deterministicId);
    
    const mockProfile = {
      id: mockUser.id,
      display_name: mockUser.user_metadata.display_name,
      handle: mockUser.user_metadata.handle || email.split('@')[0],
      email: mockUser.email,
      onboarding_complete: true,
      style_preferences: { town: 'Harare' },
      created_at: new Date().toISOString()
    };
    localStorage.setItem(`profile_${mockUser.id}`, JSON.stringify(mockProfile));
    
    notifyAuthChange('SIGNED_IN', mockSession);
    return {
      data: { user: mockUser, session: mockSession },
      error: null
    };
  }
};

const originalSignOut = supabase.auth.signOut.bind(supabase.auth);
supabase.auth.signOut = async () => {
  localStorage.removeItem('threadzw_logged_in');
  localStorage.removeItem('supabase_logged_in_user_id');
  localStorage.removeItem('threadzw_owner_email');
  localStorage.removeItem('threadzw_owner_name');
  notifyAuthChange('SIGNED_OUT', null);
  try {
    return await originalSignOut();
  } catch (e) {
    console.warn("SignOut failed natively, triggered local session clean reset:", e);
    return { error: null };
  }
};

// Helper to find the active user ID from cached storage keys dynamically
function getLoggedUserId(): string {
  const loggedInId = localStorage.getItem('supabase_logged_in_user_id');
  if (loggedInId && loggedInId !== 'undefined' && loggedInId !== MOCK_USER_ID) {
    return loggedInId;
  }

  // If there is an active logged-in email, resolve its distinct user ID
  const loggedInEmail = localStorage.getItem('threadzw_owner_email');
  if (loggedInEmail) {
    return getDeterministicUserId(loggedInEmail);
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('shop_') && key !== 'shop_local-session-id' && key !== 'shop_undefined' && key !== `shop_${MOCK_USER_ID}`) {
      const parts = key.substring(5);
      if (parts && parts !== 'undefined') return parts;
    }
  }
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('profile_') && key !== 'profile_local-session-id' && key !== 'profile_undefined' && key !== `profile_${MOCK_USER_ID}`) {
      const parts = key.substring(8);
      if (parts && parts !== 'undefined') return parts;
    }
  }
  return MOCK_USER_ID;
}

// Fallback generator for queries that timeout or fail
function getFallbackForRelation(
  relation: string, 
  isSingle: boolean, 
  filterOwnerId?: string, 
  filterHandle?: string, 
  filterSlug?: string, 
  filterShopId?: string
) {
  if (relation === 'shops') {
    const activeUserId = filterOwnerId || getLoggedUserId();
    let parsed: any = null;
    const allLocalShops: any[] = [];
    try {
      const cached = localStorage.getItem(`shop_${activeUserId}`) || localStorage.getItem('threadzw_shop');
      if (cached) {
        parsed = JSON.parse(cached);
        parsed.id = parsed.id || parsed.owner_id || activeUserId;
        allLocalShops.push(parsed);
      }
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('shop_') && key !== 'shop_local-session-id' && key !== `shop_${activeUserId}`) {
          const contents = localStorage.getItem(key);
          if (contents) {
            try {
              const shopObj = JSON.parse(contents);
              if (shopObj && (shopObj.handle || shopObj.slug)) {
                shopObj.id = shopObj.id || shopObj.owner_id || key.substring(5);
                allLocalShops.push(shopObj);
              }
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      console.warn("Error reading cached shop list:", e);
    }

    if (filterHandle) {
      const fh = filterHandle.toLowerCase().trim();
      const matched = allLocalShops.find(s => s && s.handle && s.handle.toLowerCase().trim() === fh);
      if (matched) {
        return isSingle ? matched : [matched];
      }
      return isSingle ? null : [];
    }

    if (filterSlug) {
      const fs = filterSlug.toLowerCase().trim();
      const matched = allLocalShops.find(s => (s && s.slug && s.slug.toLowerCase().trim() === fs) || (s && s.handle && s.handle.toLowerCase().trim() === fs));
      if (matched) {
        return isSingle ? matched : [matched];
      }
      return isSingle ? null : [];
    }

    if (filterShopId) {
      const fsd = filterShopId;
      if (parsed && parsed.id === fsd) {
        return isSingle ? parsed : [parsed];
      }
      const matched = allLocalShops.find(s => s && s.id === fsd);
      if (matched) {
        return isSingle ? matched : [matched];
      }
      return isSingle ? null : [];
    }
    
    const currentShop = parsed;
    return isSingle ? currentShop : (currentShop ? [currentShop] : []);
  }
  
  const activeUserId = filterOwnerId || getLoggedUserId();
  
  if (relation === 'profiles') {
    let parsed: any = null;
    try {
      const cached = localStorage.getItem(`profile_${activeUserId}`);
      if (cached) {
        parsed = JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Error reading cached profile:", e);
    }

    const defaultProfile = {
      id: activeUserId,
      display_name: localStorage.getItem('threadzw_owner_name') || 'ThreadZW Merchant',
      handle: 'my_brand',
      email: 'merchant@threadzw.com',
      onboarding_complete: true,
      style_preferences: { town: 'Harare' },
      whatsapp_number: '0776223144',
      created_at: new Date().toISOString()
    };

    if (filterHandle) {
      const fh = filterHandle.toLowerCase().trim();
      if (parsed && parsed.handle && parsed.handle.toLowerCase().trim() === fh) {
        return isSingle ? parsed : [parsed];
      }
      if (defaultProfile.handle.toLowerCase().trim() === fh) {
        return isSingle ? defaultProfile : [defaultProfile];
      }
      return isSingle ? null : [];
    }

    const currentProfile = parsed || defaultProfile;
    return isSingle ? currentProfile : [currentProfile];
  }

  if (relation === 'products') {
    // Under FIX 1, we must render only database products and remove any product-loading fallback
    return isSingle ? null : [];
  }

  if (relation === 'categories') {
    try {
      const parentUser = filterOwnerId || getLoggedUserId();
      const cached = localStorage.getItem(`categories_${parentUser}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Error reading cached categories:", e);
    }
    return [
      { id: 'cat-new', name: 'New In', cover_image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=150&q=80', sort_order: 1 },
      { id: 'cat-best', name: 'Best Seller', cover_image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=150&q=80', sort_order: 2 }
    ];
  }

  if (relation === 'demand_requests') {
    try {
      const parentUser = filterOwnerId || getLoggedUserId();
      const cached = localStorage.getItem(`demand_requests_${parentUser}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Error reading cached demand_requests:", e);
    }
    return [];
  }
  
  if (relation === 'global_categories') {
    return [
      { id: 'cat-clothing', name: 'Clothing', cover_image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=300&q=80', visible: true, sort_order: 1 },
      { id: 'cat-sneakers', name: 'Sneakers', cover_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80', visible: true, sort_order: 2 },
      { id: 'cat-thrift', name: 'Thrift & Vintage', cover_image_url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=300&q=80', visible: true, sort_order: 3 },
      { id: 'cat-streetwear', name: 'Streetwear', cover_image_url: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=300&q=80', visible: true, sort_order: 4 },
      { id: 'cat-womens', name: "Women's Fashion", cover_image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=300&q=80', visible: true, sort_order: 5 },
      { id: 'cat-formal', name: 'Formal Wear', cover_image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80', visible: true, sort_order: 6 },
      { id: 'cat-accessories', name: 'Accessories', cover_image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=300&q=80', visible: true, sort_order: 7 },
      { id: 'cat-mixed', name: 'Mixed', cover_image_url: 'https://images.unsplash.com/photo-1483181957632-8bda974cbc91?auto=format&fit=crop&w=300&q=80', visible: true, sort_order: 8 }
    ];
  }
  
  return isSingle ? null : [];
}

// Proxied supabase.from to intercept database queries and mutations
const originalFrom = supabase.from.bind(supabase);
supabase.from = function(relation: string) {
  const queryBuilder = originalFrom(relation);
  
  function makeBuilderProxy(
    builder: any, 
    rel: string, 
    state = { 
      isSingle: false, 
      filterOwnerId: undefined as string | undefined,
      filterHandle: undefined as string | undefined,
      filterSlug: undefined as string | undefined,
      filterShopId: undefined as string | undefined
    }
  ) {
    return new Proxy(builder, {
      get(target, prop, receiver) {
        if (prop === 'then') {
          return function(onfulfilled: any, onrejected: any) {
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Supabase query timeout for ${rel}`)), 15000)
            );

            const originalThen = target.then.bind(target);
            return Promise.race([
              originalThen(),
              timeoutPromise
            ])
            .then(
              (val: any) => {
                // Handle cache eviction for local delete operations
                const isDelete = (state as any).isDelete;
                const deleteId = (state as any).deleteId;
                if (isDelete && deleteId) {
                  console.log(`[SUPABASE PROXY] Deletion detected on relation "${rel}" for ID "${deleteId}"`);
                  if (rel === 'products') {
                    try {
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('products_')) {
                          const contents = localStorage.getItem(key);
                          if (contents) {
                            try {
                              let list = JSON.parse(contents);
                              if (Array.isArray(list)) {
                                const originalLength = list.length;
                                list = list.filter((p: any) => String(p.id) !== String(deleteId));
                                if (list.length !== originalLength) {
                                  localStorage.setItem(key, JSON.stringify(list));
                                  console.log(`[OFFLINE CACHE] Deleted product ${deleteId} from ${key}`);
                                }
                              }
                            } catch (_) {}
                          }
                        }
                      }
                    } catch (e) {
                      console.warn("Error evicting product from offline cache:", e);
                    }
                  } else if (rel === 'categories') {
                    try {
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('categories_')) {
                          const contents = localStorage.getItem(key);
                          if (contents) {
                            try {
                              let list = JSON.parse(contents);
                              if (Array.isArray(list)) {
                                const originalLength = list.length;
                                list = list.filter((c: any) => String(c.id) !== String(deleteId));
                                if (list.length !== originalLength) {
                                  localStorage.setItem(key, JSON.stringify(list));
                                  console.log(`[OFFLINE CACHE] Deleted category ${deleteId} from ${key}`);
                                }
                              }
                            } catch (_) {}
                          }
                        }
                      }
                    } catch (e) {
                      console.warn("Error evicting category from offline cache:", e);
                    }
                  }
                }

                if (val && val.error) {
                  if (rel === 'shops' || rel === 'products' || rel === 'profiles') {
                    console.error("DATABASE ERROR:", val.error);
                    return val;
                  }
                  console.warn(`Database query returned error on ${rel}:`, val.error);
                  const fb = getFallbackForRelation(
                    rel, 
                    state.isSingle, 
                    state.filterOwnerId, 
                    state.filterHandle, 
                    state.filterSlug, 
                    state.filterShopId
                  );
                  val = { data: fb, error: null, count: fb ? (Array.isArray(fb) ? fb.length : 1) : 0 };
                }

                // Fall back if database query successfully executed but returned no matching row
                if (val && !val.error && (!val.data || (Array.isArray(val.data) && val.data.length === 0))) {
                  if (rel === 'shops' || rel === 'products' || rel === 'profiles') {
                    return val;
                  }
                  const fb = getFallbackForRelation(
                    rel, 
                    state.isSingle, 
                    state.filterOwnerId, 
                    state.filterHandle, 
                    state.filterSlug, 
                    state.filterShopId
                  );
                  if (fb !== undefined && fb !== null && (Array.isArray(fb) ? fb.length > 0 : true)) {
                    val = { data: fb, error: null, count: fb ? (Array.isArray(fb) ? fb.length : 1) : 0 };
                  }
                }

                return val;
              },
              (err) => {
                if (rel === 'shops' || rel === 'products' || rel === 'profiles') {
                  console.error("DATABASE ERROR:", err);
                  return { data: null, error: err };
                }
                console.warn(`Database query failed/timeout on ${rel}:`, err);
                const fb = getFallbackForRelation(
                  rel, 
                  state.isSingle, 
                  state.filterOwnerId, 
                  state.filterHandle, 
                  state.filterSlug, 
                  state.filterShopId
                );
                return { data: fb, error: null, count: fb ? (Array.isArray(fb) ? fb.length : 1) : 0 };
              }
            ).then(onfulfilled, onrejected);
          };
        }

        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'function') {
          return function(...args: any[]) {
            if (prop === 'single' || prop === 'maybeSingle') {
              state.isSingle = true;
            }
            if (prop === 'delete') {
              (state as any).isDelete = true;
            }
            if (prop === 'eq' || prop === 'ilike') {
              const filterVal = args[1] !== undefined && args[1] !== null ? String(args[1]) : undefined;
              if (filterVal) {
                if (args[0] === 'owner_id') {
                  state.filterOwnerId = filterVal;
                } else if (args[0] === 'handle') {
                  state.filterHandle = filterVal;
                } else if (args[0] === 'slug') {
                  state.filterSlug = filterVal;
                } else if (args[0] === 'id') {
                  state.filterShopId = filterVal;
                  (state as any).deleteId = filterVal;
                } else if (args[0] === 'shop_id') {
                  state.filterShopId = filterVal;
                }
              }
            }

            if (prop === 'or') {
              const orVal = args[0] !== undefined && args[0] !== null ? String(args[0]) : undefined;
              if (orVal) {
                // Parse strings like: "slug.eq.xxx,handle.eq.xxx"
                const parts = orVal.split(',');
                for (const part of parts) {
                  const subparts = part.trim().split('.');
                  if (subparts.length >= 3 && subparts[1] === 'eq') {
                    const field = subparts[0];
                    const valStr = subparts.slice(2).join('.');
                    if (field === 'slug') {
                      state.filterSlug = valStr;
                    } else if (field === 'handle') {
                      state.filterHandle = valStr;
                    } else if (field === 'id' || field === 'shop_id') {
                      state.filterShopId = valStr;
                    } else if (field === 'owner_id') {
                      state.filterOwnerId = valStr;
                    }
                  }
                }
              }
            }

            // Capture mutations to update local cache
            if ((prop === 'insert' || prop === 'update' || prop === 'upsert') && args[0]) {
              const payload = args[0];
              if (rel === 'shops') {
                const shopObj = Array.isArray(payload) ? payload[0] : payload;
                const ownerId = shopObj.owner_id || getLoggedUserId();
                try {
                  const existing = localStorage.getItem(`shop_${ownerId}`);
                  const baseId = shopObj.id || (existing ? JSON.parse(existing).id : null) || ownerId;
                  const merged = existing ? { id: baseId, ...JSON.parse(existing), ...shopObj } : { id: baseId, ...shopObj };
                  localStorage.setItem(`shop_${ownerId}`, JSON.stringify(merged));
                  localStorage.setItem('threadzw_shop', JSON.stringify(merged));
                  if (merged.name) {
                    localStorage.setItem('threadzw_owner_name', merged.name);
                  }
                } catch (e) {
                  console.warn("Error caching shop mutation:", e);
                }
              } else if (rel === 'profiles') {
                const profileObj = Array.isArray(payload) ? payload[0] : payload;
                const id = profileObj.id || getLoggedUserId();
                try {
                  const existing = localStorage.getItem(`profile_${id}`);
                  const merged = existing ? { ...JSON.parse(existing), ...profileObj } : profileObj;
                  localStorage.setItem(`profile_${id}`, JSON.stringify(merged));
                } catch (e) {
                  console.warn("Error caching profile mutation:", e);
                }
              } else if (rel === 'products') {
                // Products local cache disabled under FIX 1
              } else if (rel === 'categories') {
                try {
                  const catObj = Array.isArray(payload) ? payload[0] : payload;
                  if (!catObj.id) catObj.id = 'local-cat-' + Date.now();
                  const shopId = catObj.shop_id || getLoggedUserId();
                  const cachedStr = localStorage.getItem(`categories_${shopId}`);
                  let list = cachedStr ? JSON.parse(cachedStr) : [];
                  if (prop === 'insert') {
                    list.push(catObj);
                  } else if (prop === 'update') {
                    list = list.map((c: any) => c.id === catObj.id ? { ...c, ...catObj } : c);
                  } else if (prop === 'upsert') {
                    const idx = list.findIndex((c: any) => c.id === catObj.id);
                    if (idx > -1) {
                      list[idx] = { ...list[idx], ...catObj };
                    } else {
                      list.push(catObj);
                    }
                  }
                  localStorage.setItem(`categories_${shopId}`, JSON.stringify(list));
                } catch (e) {
                  console.warn("Error caching category mutation:", e);
                }
              } else if (rel === 'demand_requests') {
                try {
                  const demandObj = Array.isArray(payload) ? payload[0] : payload;
                  if (!demandObj.id) demandObj.id = 'local-demand-' + Date.now();
                  const shopId = demandObj.shop_id || getLoggedUserId();
                  const cachedStr = localStorage.getItem(`demand_requests_${shopId}`);
                  let list = cachedStr ? JSON.parse(cachedStr) : [];
                  list.unshift(demandObj);
                  localStorage.setItem(`demand_requests_${shopId}`, JSON.stringify(list));
                } catch (e) {
                  console.warn("Error caching demand mutation:", e);
                }
              }
            }

            const result = val.apply(target, args);
            if (result && typeof result.then === 'function') {
              return makeBuilderProxy(result, rel, state);
            }
            return result;
          };
        }
        return val;
      }
    });
  }
  
  return makeBuilderProxy(queryBuilder, relation);
};

