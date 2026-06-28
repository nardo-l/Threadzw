/**
 * Configuration Helper for Storefront System Redesign.
 * Handles parsing and saving metadata settings inside the existing text column `description` to prevent database schema mismatch.
 */

export interface StorefrontConfig {
  tagline?: string;
  story?: string;
  featured_products?: string[];
  best_seller_products?: string[];
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  whatsapp_number?: string;
  brand_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    button_color?: string;
    link_color?: string;
    bg_treatment?: string; // 'solid' | 'gradient' | 'minimal' | 'vintage-warm'
  };
  layout_style?: string; // 'default' | 'fashion-editorial' | 'bento-grid'
  theme_selection?: 'streetwear' | 'luxury' | 'minimalist' | 'vintage' | 'sportswear';
  suburb?: string;
  city?: string;
  google_maps_url?: string;
  pickup_available?: boolean;
  pickup_label?: string;
  landmark?: string;
  directions?: string;
  online_only?: boolean;
  delivery_info?: string;
  instagram_url?: string;
  trading_hours?: any[];
}

const CONFIG_DELIMITER = '\n\n---STOREFRONT_CONFIG---\n';

/**
 * Parses the raw description field from database.
 * Returns the plain user-facing description and the verified StorefrontConfig object.
 */
export function parseShopConfig(rawDescription: string): { 
  description: string; 
  config: StorefrontConfig;
} {
  if (!rawDescription) {
    return { description: '', config: {} };
  }

  const parts = rawDescription.split(CONFIG_DELIMITER);
  const desc = parts[0].trim();
  
  if (parts.length > 1) {
    try {
      const configObj = JSON.parse(parts[1].trim());
      return { 
        description: desc, 
        config: configObj as StorefrontConfig 
      };
    } catch (e) {
      console.warn('Failed parsing storefront config, falling back:', e);
    }
  }

  return { description: rawDescription, config: {} };
}

/**
 * Serializes the plain description and the config object into a single string for storage.
 */
export function serializeShopConfig(description: string, config: StorefrontConfig): string {
  const cleanDesc = description ? description.trim() : '';
  return `${cleanDesc}${CONFIG_DELIMITER}${JSON.stringify(config)}`;
}
