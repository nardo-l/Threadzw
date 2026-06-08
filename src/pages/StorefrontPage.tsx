// src/pages/StorefrontPage.tsx
import React, { 
  useState, 
  useEffect, 
  useMemo,
  useCallback
} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  ShopLogo, 
  ShopBanner, 
  ProductImage,
  resolveImageUrl
} from '../components/ui/ShopImage'
import { toast } from 'sonner'

// Simple Toast abstraction for compatibility
const showToast = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg)
};

interface ProductDetailPageProps {
  product: any;
  shop: any;
  onBack: () => void;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, shop, onBack }) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const images = Array.isArray(product?.images)
    ? product.images
    : product?.images
      ? [product.images]
      : [];

  const handleOrderWhatsApp = () => {
    const cleanPhone = (shop.whatsapp_number || shop.whatsapp || '').replace(/\D/g, '');
    const message = `Halo ${shop.name}! I would like to order "${product.name}" ($${product.price})\nLink: ${window.location.href}`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div style={{
      minHeight: '100svh',
      background: '#ffffff',
      maxWidth: 430,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #eeeeee',
        padding: '0 16px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 100
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#000' }}>
          Back to Shop
        </span>
      </div>

      {/* Main image */}
      <ProductImage product={product} index={activeImageIdx} height={400} />

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '12px 16px',
          overflowX: 'auto'
        }}>
          {images.map((img: string, idx: number) => (
            <button
              key={idx}
              onClick={() => setActiveImageIdx(idx)}
              style={{
                width: 60,
                height: 60,
                border: activeImageIdx === idx ? '2px solid #000' : '2px solid #eeeeee',
                borderRadius: 8,
                padding: 0,
                overflow: 'hidden',
                cursor: 'pointer'
              }}
            >
              <ProductImage product={product} index={idx} height="100%" width="100%" />
            </button>
          ))}
        </div>
      )}

      {/* Info and action */}
      <div style={{ padding: 20, flex: 1 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px', color: '#000' }}>
          {product.name}
        </h1>
        
        <p style={{ fontSize: 22, fontWeight: 900, color: '#000', margin: '0 0 16px' }}>
          ${product.price}
          {product.original_price && (
            <span style={{
              fontSize: 16,
              fontWeight: 500,
              color: '#999',
              textDecoration: 'line-through',
              marginLeft: 8
            }}>
              ${product.original_price}
            </span>
          )}
        </p>

        {product.description && (
          <>
            <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#999', margin: '0 0 6px' }}>
              Description
            </h3>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, margin: '0 0 24px' }}>
              {product.description}
            </p>
          </>
        )}

        {/* Sizes */}
        {product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#999', margin: '0 0 8px' }}>
              Available Sizes
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.sizes.map((szObj: any, idx: number) => {
                const sz = typeof szObj === 'string' ? szObj : szObj?.size || szObj || '';
                return sz ? (
                  <span key={idx} style={{
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#333'
                  }}>
                    {sz}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        <button
          onClick={handleOrderWhatsApp}
          style={{
            width: '100%',
            background: '#25D366',
            color: '#ffffff',
            borderRadius: 12,
            padding: '16px 0',
            fontWeight: 800,
            fontSize: 16,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)',
            marginTop: 32
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Send WhatsApp Order
        </button>
      </div>
    </div>
  );
};

export const StorefrontPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [shop, setShop] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // null | 'not_found' | 'offline'
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const cleanSlug = useMemo(() => {
    const activeSlug = slug || (window.location.pathname.toLowerCase().replace(/\/$/, '').endsWith('/demo') ? 'demo' : null);
    if (!activeSlug) return null;
    return decodeURIComponent(activeSlug)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }, [slug])

  const loadStorefront = useCallback(
    async () => {
      if (!cleanSlug) {
        setError('not_found')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // NO AUTH CHECK HERE
        // This is a public page
        // Use anon key only

        const { data: shopData, error: shopErr } =
          await supabase
            .from('shops')
            .select('*')
            .eq('slug', cleanSlug)
            .maybeSingle()

        if (shopErr) {
          console.error('Shop query error:', shopErr)
          setError('not_found')
          return
        }

        if (!shopData) {
          setError('not_found')
          return
        }

        // Only manual_lock hides storefront
        if (shopData.manual_lock === true) {
          setError('offline')
          return
        }

        setShop(shopData)

        // Fetch visible products
        const { data: productsData } = 
          await supabase
            .from('products')
            .select('*')
            .eq('shop_id', shopData.id)
            .eq('visible', true)
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false })

        const productList = productsData || []
        setProducts(productList)

        // Build categories from products
        const catIds = [
          ...new Set(
            productList
              .map(p => p.category_id)
              .filter(Boolean)
          )
        ]

        if (catIds.length > 0) {
          const { data: catData } = 
            await supabase
              .from('categories')
              .select('*')
              .in('id', catIds)
              .order('sort_order', { ascending: true })
          
          setCategories(catData || [])
        }

      } catch (err) {
        console.error('Storefront load failed:', err)
        setError('not_found')
      } finally {
        setLoading(false)
      }
    },
    [cleanSlug]
  )

  useEffect(() => {
    loadStorefront()
  }, [loadStorefront])

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') 
      return products
    return products.filter(
      p => p.category_id === activeCategory
    )
  }, [products, activeCategory])

  // Loading
  if (loading) {
    return (
      <div style={{
        minHeight: '100svh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid #eeeeee',
          borderTop: '3px solid #000000',
          animation: 'spin 0.7s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg) }
          }
        `}</style>
      </div>
    )
  }

  // Not found
  if (error === 'not_found') {
    return (
      <div style={{
        minHeight: '100svh',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        maxWidth: 430,
        margin: '0 auto'
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}>
          <svg width="32" height="32"
            viewBox="0 0 24 24" fill="none"
            stroke="#cccccc" strokeWidth="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <h2 style={{
          fontSize: 22,
          fontWeight: 900,
          color: '#000000',
          margin: '0 0 8px',
          fontStyle: 'normal'
        }}>
          Shop not found
        </h2>
        <p style={{
          fontSize: 14,
          color: '#888888',
          margin: 0,
          fontStyle: 'normal'
        }}>
          This link may have moved or the shop does not exist.
        </p>
        <p style={{
          fontSize: 12,
          color: '#cccccc',
          fontFamily: 'monospace',
          marginTop: 8,
          fontStyle: 'normal'
        }}>
          /shop/{slug}
        </p>
      </div>
    )
  }

  // Offline (admin locked)
  if (error === 'offline') {
    return (
      <div style={{
        minHeight: '100svh',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        maxWidth: 430,
        margin: '0 auto'
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}>
          <svg width="32" height="32"
            viewBox="0 0 24 24" fill="none"
            stroke="#cccccc" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <h2 style={{
          fontSize: 22,
          fontWeight: 900,
          color: '#000000',
          margin: '0 0 8px',
          fontStyle: 'normal'
        }}>
          This shop is temporarily offline
        </h2>
        <p style={{
          fontSize: 14,
          color: '#888888',
          margin: 0,
          fontStyle: 'normal'
        }}>
          Check back soon.
        </p>
      </div>
    )
  }

  // Product detail view
  if (selectedProduct) {
    return (
      <ProductDetailPage
        product={selectedProduct}
        shop={shop}
        onBack={() => setSelectedProduct(null)}
      />
    )
  }

  // Full storefront
  return (
    <div style={{
      minHeight: '100svh',
      background: '#ffffff',
      maxWidth: 430,
      margin: '0 auto'
    }}>
      
      {/* Sticky header */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #eeeeee',
        padding: '0 16px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100
      }}>
        <span style={{
          fontSize: 17,
          fontWeight: 900,
          color: '#000000',
          fontStyle: 'normal'
        }}>
          {shop.name}
        </span>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: shop.name,
                url: window.location.href
              }).catch(() => {})
            } else {
              navigator.clipboard.writeText(window.location.href)
              showToast.success('Link copied')
            }
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#f5f5f5',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <svg width="16" height="16"
            viewBox="0 0 24 24" fill="none"
            stroke="#000" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>

      {/* Banner */}
      <ShopBanner shop={shop} height={200} />

      {/* Shop info */}
      <div style={{ padding: '0 16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
          marginTop: -28,
          marginBottom: 12
        }}>
          <ShopLogo
            shop={shop}
            size={64}
            style={{
              border: '3px solid #ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          />
        </div>
        
        <h1 style={{
          fontSize: 22,
          fontWeight: 900,
          color: '#000000',
          margin: '0 0 4px',
          fontStyle: 'normal'
        }}>
          {shop.name}
        </h1>
        
        {shop.description && (
          <p style={{
            fontSize: 14,
            color: '#555555',
            lineHeight: 1.5,
            margin: '0 0 16px',
            fontStyle: 'normal'
          }}>
            {shop.description}
          </p>
        )}

        {/* Info pills */}
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 16
        }}>
          {shop.city && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#f5f5f5',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
              color: '#555555',
              fontStyle: 'normal'
            }}>
              <svg width="12" height="12"
                viewBox="0 0 24 24" fill="none"
                stroke="currentColor" 
                strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {shop.suburb 
                ? `${shop.suburb}, ${shop.city}`
                : shop.city
              }
            </span>
          )}
          {shop.opening_hours && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#f5f5f5',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
              color: '#555555',
              fontStyle: 'normal'
            }}>
              <svg width="12" height="12"
                viewBox="0 0 24 24" fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {shop.opening_hours}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 24
        }}>
          <a
            href={`https://wa.me/${
              (shop.whatsapp_number || shop.whatsapp || '')
                ?.replace(/\D/g, '')
            }`}
            target="_blank"
            rel="noreferrer"
            style={{
              background: '#25D366',
              color: '#ffffff',
              borderRadius: 10,
              padding: '13px 0',
              fontWeight: 800,
              fontSize: 14,
              textAlign: 'center',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontStyle: 'normal'
            }}
          >
            <svg width="16" height="16"
              viewBox="0 0 24 24"
              fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          
          {shop.google_maps_link && (
            <a
              href={shop.google_maps_link}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#f5f5f5',
                color: '#000000',
                borderRadius: 10,
                padding: '13px 0',
                fontWeight: 700,
                fontSize: 14,
                textAlign: 'center',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontStyle: 'normal'
              }}
            >
              <svg width="14" height="14"
                viewBox="0 0 24 24" fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Visit Shop
            </a>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: 8,
        background: '#f5f5f5'
      }} />

      {/* Categories */}
      {categories.length > 0 && (
        <div style={{ padding: '20px 0 0' }}>
          <div style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            padding: '0 16px 16px',
            scrollbarWidth: 'none'
          }}>
            {[
              { id: 'all', name: 'All', cover_image_url: null },
              ...categories
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: activeCategory === cat.id
                    ? '3px solid #c8ff00'
                    : '3px solid #eeeeee',
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {cat.cover_image_url ? (
                    <img
                      src={resolveImageUrl(cat.cover_image_url) || undefined}
                      alt={cat.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <span style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: activeCategory === cat.id ? '#000000' : '#aaaaaa'
                    }}>
                      {cat.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#000000',
                  maxWidth: 64,
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontStyle: 'normal'
                }}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
          <div style={{
            height: 8,
            background: '#f5f5f5'
          }} />
        </div>
      )}

      {/* Products */}
      <div style={{ padding: '16px' }}>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#000000',
            margin: 0,
            fontStyle: 'normal'
          }}>
            {activeCategory === 'all'
              ? 'All Products'
              : categories.find(c => c.id === activeCategory)?.name || 'Products'
            }
          </h2>
          <span style={{
            fontSize: 13,
            color: '#aaaaaa',
            fontStyle: 'normal'
          }}>
            {filteredProducts.length} items
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 0',
            color: '#cccccc'
          }}>
            <svg width="40" height="40"
              viewBox="0 0 24 24" fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ margin: '0 auto 12px' }}>
              <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
              <line x1="12" y1="12" x2="12" y2="12"/>
            </svg>
            <p style={{
              fontSize: 14,
              fontStyle: 'normal'
            }}>
              No products yet
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16
          }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#f9f9f9',
                  border: '1px solid #eee',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ width: '100%', height: 180, overflow: 'hidden' }}>
                  <ProductImage product={product} index={0} height="100%" width="100%" />
                </div>
                <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <p style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#000000',
                    margin: '0 0 4px',
                    fontStyle: 'normal',
                    lineHeight: 1.2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {product.name}
                  </p>
                  <p style={{
                    fontSize: 14,
                    fontWeight: 900,
                    color: '#000000',
                    margin: 'auto 0 0',
                    fontStyle: 'normal'
                  }}>
                    ${product.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
