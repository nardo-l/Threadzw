export interface MetaTagsConfig {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}

export function updateMetaTags(config: MetaTagsConfig) {
  // Title
  document.title = config.title;

  // Helper to update or create meta tag
  const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
    let el = document.querySelector(`meta[${selector}]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // Primary Description
  setMetaTag('name="description"', 'name', 'description', config.description);

  // Open Graph
  setMetaTag('property="og:title"', 'property', 'og:title', config.title);
  setMetaTag('property="og:description"', 'property', 'og:description', config.description);
  setMetaTag('property="og:type"', 'property', 'og:type', config.type || 'website');
  if (config.image) {
    setMetaTag('property="og:image"', 'property', 'og:image', config.image);
  }
  if (config.url) {
    setMetaTag('property="og:url"', 'property', 'og:url', config.url);
  }

  // Twitter
  setMetaTag('name="twitter:card"', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('name="twitter:title"', 'name', 'twitter:title', config.title);
  setMetaTag('name="twitter:description"', 'name', 'twitter:description', config.description);
  if (config.image) {
    setMetaTag('name="twitter:image"', 'name', 'twitter:image', config.image);
  }
}
