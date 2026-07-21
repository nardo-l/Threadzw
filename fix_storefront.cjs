const fs = require('fs');
let code = fs.readFileSync('src/pages/StorefrontPage.tsx', 'utf8');

const target = `      if (!shopResult) {
        // Fallback search by ID
        const { data: shopById, error: shopErr3 } = await supabase
          .from('shops')
          .select('*')
          .eq('id', slug)
          .maybeSingle();

        if (shopErr3) {
          console.error("Supabase Error querying shops by ID:", shopErr3);
          throw shopErr3;
        }
        shopResult = shopById;
      }`;

const replace = `      if (!shopResult) {
        // Fallback search by ID (only if slug is a valid UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(slug)) {
          const { data: shopById, error: shopErr3 } = await supabase
            .from('shops')
            .select('*')
            .eq('id', slug)
            .maybeSingle();

          if (shopErr3) {
            console.error("Supabase Error querying shops by ID:", shopErr3);
          } else {
            shopResult = shopById;
          }
        }
      }`;

if (code.includes(target)) {
  fs.writeFileSync('src/pages/StorefrontPage.tsx', code.replace(target, replace));
  console.log('Fixed StorefrontPage.tsx');
} else {
  console.log('Target not found in StorefrontPage.tsx');
}
