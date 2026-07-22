import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// 1. Product Description Generator
router.post('/generate-product', async (req: Request, res: Response) => {
  try {
    const { name, category, price, keywords } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const ai = getAIClient();
    if (!ai) {
      // Graceful fallback
      return res.json({
        title: name,
        description: `${name} - High quality ${category || 'item'}. Available now for $${price || '0.00'}. ${keywords || ''}`,
        sellingPoints: ['Premium quality materials', 'Fast local delivery', 'Authentic design'],
        hashtags: ['#ThreadZW', '#Streetwear', '#LocalFashion', '#ShopLocal']
      });
    }

    const prompt = `Generate a high-converting product listing for a streetwear/fashion store in Southern Africa called ThreadZW.
Product Details:
- Name: ${name}
- Category: ${category || 'Fashion'}
- Price: $${price || 'N/A'}
- Keywords: ${keywords || 'trendy, durable, authentic'}

Return JSON format with exact keys:
- title: catchy refined product title
- description: 2-3 engaging sentences describing style, fit, and appeal
- sellingPoints: array of 3 bullet points highlighting key features
- hashtags: array of 4-6 relevant hashtags`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    console.error('AI Product Description error:', err);
    res.status(500).json({
      error: 'Failed to generate product details',
      fallback: {
        title: req.body.name,
        description: `Premium ${req.body.name} available now. Clean design, exceptional comfort.`,
        sellingPoints: ['Quality guaranteed', 'Authentic apparel', 'Order via WhatsApp'],
        hashtags: ['#ThreadZW', '#Fashion']
      }
    });
  }
});

// 2. Shop Profile Assistant
router.post('/generate-shop-profile', async (req: Request, res: Response) => {
  try {
    const { shopName, category, location, keywords } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.json({
        description: `Welcome to ${shopName || 'our shop'}! We offer the finest ${category || 'fashion items'} in ${location || 'Zimbabwe'}.`,
        welcomeMessage: `Hi there! Thanks for visiting ${shopName || 'our shop'}. How can we help you today?`,
        bio: `Premier ${category || 'apparel'} boutique based in ${location || 'Harare'}. Quality guaranteed.`,
        promoText: `🔥 Check out our latest collection on ThreadZW! Free delivery on selected items.`
      });
    }

    const prompt = `Generate shop profile marketing copy for a merchant on ThreadZW.
Shop Details:
- Name: ${shopName || 'Fashion Hub'}
- Category: ${category || 'Streetwear & Sneakers'}
- Location: ${location || 'Harare, Zimbabwe'}
- Style Keywords: ${keywords || 'authentic, stylish, fast delivery'}

Return JSON format with exact keys:
- description: 2-3 sentences introducing the store brand and values
- welcomeMessage: 1 sentence greeting for storefront visitors
- bio: concise 1-sentence bio for Instagram or WhatsApp profile
- promoText: attractive 1-line promotional announcement banner text`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    console.error('AI Shop Profile error:', err);
    res.status(500).json({ error: 'Failed to generate shop profile' });
  }
});

// 3. Marketing Content Generator
router.post('/generate-marketing', async (req: Request, res: Response) => {
  try {
    const { shopName, productName, category, type } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.json({
        caption: `🔥 Just dropped! Check out ${productName || 'our latest collection'} at ${shopName || 'our store'}. Tap the link in bio to order directly on WhatsApp!`,
        statusUpdate: `New arrival alert at ${shopName || 'ThreadZW'}! 🛍️ ${productName || 'Available now'}. Order via WhatsApp today.`,
        hashtags: ['#ThreadZW', '#ZimStreetwear', '#FreshKicks', '#HarareShopping'],
        carouselIdeas: ['Slide 1: Front view photo', 'Slide 2: Detail closeup', 'Slide 3: Size chart & WhatsApp order call-to-action']
      });
    }

    const prompt = `Generate social media marketing content for a merchant on ThreadZW.
Details:
- Store: ${shopName || 'Boutique'}
- Featured Product: ${productName || 'New Arrival'}
- Category: ${category || 'Apparel'}
- Content Goal: ${type || 'general promotion'}

Return JSON format with exact keys:
- caption: engaging Instagram/Facebook caption with emoji and CTA
- statusUpdate: short 2-line WhatsApp status / SMS post
- hashtags: array of 5 trending hashtags
- carouselIdeas: array of 3 ideas for Instagram post slides`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    console.error('AI Marketing error:', err);
    res.status(500).json({ error: 'Failed to generate marketing content' });
  }
});

// 4. In-App Merchant Assistant (Q&A Knowledge Base)
router.post('/assistant', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const ai = getAIClient();

    const systemInstruction = `You are the ThreadZW AI Merchant Assistant. ThreadZW is a WhatsApp-first storefront builder for merchants in Zimbabwe and Southern Africa.
Knowledge Base Rules:
1. Adding products: Merchants go to Dashboard -> 'Add Product' or 'Inventory' tab -> fill in title, price, images, stock, and click Save.
2. Storefront visibility: Storefronts are published instantly at /shop/[slug]. Ensure shop status is active and trial/subscription is valid.
3. Sharing shop: Copy the shop link from the Dashboard or Storefront header and paste on WhatsApp, Instagram, or Facebook.
4. Subscriptions & Trial: All new shops receive a 14-day free trial. Afterwards, subscription is $10/month managed via the Subscription screen or NardoPay/WhatsApp admin.
5. WhatsApp orders: When customers click 'Order on WhatsApp' on the storefront, a pre-filled WhatsApp message with order details and product images opens directly to the merchant's WhatsApp number.
Keep answers friendly, clear, concise (maximum 3 bullet points or short paragraphs), and focused on ThreadZW merchant success.`;

    if (!ai) {
      // Fallback answers for common questions
      const q = query.toLowerCase();
      let answer = "ThreadZW helps you run a clean online store and receive orders directly on WhatsApp. You can add products in the 'Inventory' tab and share your custom link on social media.";
      let suggestedActions = [{ label: 'Go to Inventory', route: '/inventory' }, { label: 'Edit Store', route: '/edit-shop' }];

      if (q.includes('product') || q.includes('add')) {
        answer = "To add a new product: 1) Tap 'Add Product' on your Dashboard. 2) Upload product photos and fill in title, price, and stock. 3) Tap 'Publish Product' to make it live instantly.";
        suggestedActions = [{ label: 'Add Product', route: '/add-product' }];
      } else if (q.includes('share') || q.includes('link') || q.includes('whatsapp')) {
        answer = "To share your shop: Tap 'Copy Link' on your Dashboard or open your storefront and share the URL directly in your WhatsApp Status or Instagram Bio.";
        suggestedActions = [{ label: 'Copy Link', route: 'copy' }];
      } else if (q.includes('trial') || q.includes('subscr') || q.includes('pay')) {
        answer = "Every new shop receives a 14-day free trial. You can check your remaining days and manage your subscription under 'Settings' -> 'Subscription'.";
        suggestedActions = [{ label: 'Manage Subscription', route: '/subscription' }];
      }

      return res.json({ answer, suggestedActions });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: query,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            suggestedActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  route: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    console.error('AI Assistant error:', err);
    res.status(500).json({
      answer: "I'm here to help you manage your ThreadZW storefront. You can add products, update your store settings, and share your shop link with customers on WhatsApp.",
      suggestedActions: [{ label: 'View Dashboard', route: '/dashboard' }]
    });
  }
});

// 5. Smart Catalog Audit & Suggestions
router.post('/catalog-suggestions', async (req: Request, res: Response) => {
  try {
    const { products, shop } = req.body;
    const ai = getAIClient();

    // Perform structured heuristic analysis
    const missingPhotos = (products || []).filter((p: any) => !p.image_url && (!p.images || p.images.length === 0));
    const missingDescriptions = (products || []).filter((p: any) => !p.description || p.description.trim().length < 15);
    const zeroPrice = (products || []).filter((p: any) => !p.price || p.price <= 0);

    const issuesCount = missingPhotos.length + missingDescriptions.length + zeroPrice.length;

    if (!ai || issuesCount === 0) {
      const suggestions = [];
      if (missingPhotos.length > 0) {
        suggestions.push({
          type: 'warning',
          title: `${missingPhotos.length} product(s) missing photos`,
          message: 'Listings with clear photos get 3x more WhatsApp order clicks.',
          actionLabel: 'Edit Products',
          targetProductIds: missingPhotos.map((p: any) => p.id)
        });
      }
      if (missingDescriptions.length > 0) {
        suggestions.push({
          type: 'info',
          title: `${missingDescriptions.length} product(s) need detailed descriptions`,
          message: 'Add size, material, and fit details so customers can order with confidence.',
          actionLabel: 'Use AI Generator',
          targetProductIds: missingDescriptions.map((p: any) => p.id)
        });
      }
      if (zeroPrice.length > 0) {
        suggestions.push({
          type: 'error',
          title: `${zeroPrice.length} product(s) have zero price`,
          message: 'Set valid prices so buyers know what to expect before opening WhatsApp.',
          actionLabel: 'Fix Prices',
          targetProductIds: zeroPrice.map((p: any) => p.id)
        });
      }
      if (suggestions.length === 0) {
        suggestions.push({
          type: 'success',
          title: 'Catalog Health Excellent! 🎉',
          message: 'All your products have images, descriptions, and valid prices. Keep up the great work!',
          actionLabel: 'Add New Item'
        });
      }
      return res.json({ suggestions, score: Math.max(20, 100 - (issuesCount * 15)) });
    }

    const prompt = `Analyze this merchant catalog and generate 2-3 prioritized optimization recommendations.
Shop: ${shop?.name || 'Store'}
Catalog size: ${products?.length || 0}
Products missing photos: ${missingPhotos.length}
Products missing descriptions: ${missingDescriptions.length}
Products with 0 price: ${zeroPrice.length}

Return JSON with format:
{
  "score": number (0-100),
  "suggestions": [
    {
      "type": "warning" | "info" | "error" | "success",
      "title": "short title",
      "message": "actionable advice for the merchant",
      "actionLabel": "button label"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    console.error('Catalog Suggestions error:', err);
    res.status(500).json({ error: 'Failed to generate catalog suggestions' });
  }
});

export default router;
