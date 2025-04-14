/**
 * Custom image loader for Cloudflare Pages deployment
 * This file is used when NEXT_PUBLIC_DEPLOY_ENV is set to 'cloudflare'
 */

export default function cloudflareImageLoader({ src, width, quality }) {
  // For absolute URLs (external images), use them directly
  if (src.startsWith('http') || src.startsWith('https')) {
    // Add Cloudflare Image Resizing parameters if the URL is from a supported source
    if (src.includes('cloudflare-') || src.includes('imagedelivery.net')) {
      const url = new URL(src);
      url.searchParams.set('width', width.toString());
      
      if (quality) {
        url.searchParams.set('quality', quality.toString());
      }
      
      return url.href;
    }
    
    // Otherwise just return the original URL
    return src;
  }
  
  // For relative URLs (local images), prepend the base URL
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '';
  
  // Return the full URL with width and quality parameters
  return `${baseUrl}${src}?width=${width}&quality=${quality || 75}`;
} 