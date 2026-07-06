/**
 * Helper utility for determining available standard sizes by product category
 */
export function getSizesForCategory(category: string): string[] | null {
  const cat = (category || '').toLowerCase().trim();
  if (!cat) return null;
  
  // Clothing & Apparel
  if (
    cat.includes('clothing') || 
    cat.includes('streetwear') || 
    cat.includes('thrift') || 
    cat.includes('luxury') || 
    cat.includes('sportswear') || 
    cat.includes('vintage') || 
    cat.includes('apparel') ||
    cat.includes('tee') ||
    cat.includes('shirt') ||
    cat.includes('pant') ||
    cat.includes('jacket') ||
    cat.includes('swim') ||
    cat.includes('dress') ||
    cat.includes('suit') ||
    cat.includes('hoodie') ||
    cat.includes('short') ||
    cat.includes('jeans') ||
    cat.includes('coat') ||
    cat.includes('sweater')
  ) {
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
  }
  
  // Sneakers & Footwear
  if (
    cat.includes('sneaker') || 
    cat.includes('shoe') || 
    cat.includes('footwear') || 
    cat.includes('boots')
  ) {
    return ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];
  }
  
  // Hats & Headwear
  if (cat.includes('hat') || cat.includes('cap')) {
    return ['S', 'M', 'L', 'XL'];
  }
  
  // Rings
  if (cat.includes('ring')) {
    return ['6', '7', '8', '9', '10', '11', '12'];
  }

  // One-size explicitly requested or common single-size items
  if (
    cat.includes('one-size') || 
    cat.includes('onesize') ||
    cat.includes('bag') ||
    cat.includes('sunglass') ||
    cat.includes('belt')
  ) {
    return ['One Size'];
  }

  // Categories without standard size dimensions (e.g., general Accessories, artwork, etc.)
  return null;
}
