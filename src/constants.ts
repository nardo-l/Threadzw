export const SHOP_CATEGORIES = [
  { id: 'clothing', label: 'Clothing', emoji: '👕' },
  { id: 'sneakers', label: 'Sneakers', emoji: '👟' },
  { id: 'thrift', label: 'Thrift & Vintage', emoji: '🧥' },
  { id: 'streetwear', label: 'Streetwear', emoji: '🔥' },
  { id: 'accessories', label: 'Accessories', emoji: '💍' },
  { id: 'electronics', label: 'Electronics', emoji: '📱' },
  { id: 'footwear', label: 'Footwear', emoji: '👠' },
  { id: 'sportswear', label: 'Sportswear', emoji: '⚽' },
  { id: 'formal', label: 'Formal Wear', emoji: '👔' },
  { id: 'kids', label: "Kids' Fashion", emoji: '🧒' },
  { id: 'bags', label: 'Bags & Luggage', emoji: '👜' },
  { id: 'beauty', label: 'Beauty & Grooming', emoji: '💄' },
  { id: 'other', label: 'Other', emoji: '📦' }
];

export const PRODUCT_CATEGORIES = [
  { id: 'tops', label: 'Tops & T-Shirts', emoji: '👕' },
  { id: 'bottoms', label: 'Bottoms & Jeans', emoji: '👖' },
  { id: 'dresses', label: 'Dresses & Skirts', emoji: '👗' },
  { id: 'outerwear', label: 'Jackets & Coats', emoji: '🧥' },
  { id: 'sneakers', label: 'Sneakers', emoji: '👟' },
  { id: 'boots', label: 'Boots & Formal Shoes', emoji: '👞' },
  { id: 'sandals', label: 'Sandals & Slippers', emoji: '🩴' },
  { id: 'accessories', label: 'Accessories', emoji: '💍' },
  { id: 'bags', label: 'Bags', emoji: '👜' },
  { id: 'caps', label: 'Caps & Hats', emoji: '🧢' },
  { id: 'electronics', label: 'Electronics', emoji: '📱' },
  { id: 'sportswear', label: 'Sportswear', emoji: '⚽' },
  { id: 'thrift', label: 'Thrift & Vintage', emoji: '♻️' },
  { id: 'other', label: 'Other', emoji: '📦' }
];

export const ZIMBABWE_TOWNS = [
  'Harare',
  'Bulawayo',
  'Mutare',
  'Gweru',
  'Masvingo',
  'Kwekwe',
  'Kadoma',
  'Chinhoyi',
  'Victoria Falls',
  'Bindura',
  'Marondera',
  'Zvishavane',
  'Chegutu',
  'Rusape',
  'Chiredzi',
  'Beit Bridge',
  'Kariba',
  'Hwange',
  'Norton',
  'Redcliff',
  'Chipinge',
  'Gokwe',
  'Mvurwi',
  'Karoi',
  'Shamva',
  'Nyanga',
  'Binga',
  'Plumtree',
  'Lupane',
  'Filabusi',
  'Gwanda',
  'Rutenga',
  'Triangle',
  'Chivhu',
  'Murewa',
  'Murehwa',
  'Wedza',
  'Centenary',
  'Mt Darwin',
  'Guruve',
  'Mazowe',
  'Epworth'
].sort((a, b) => {
  if (a === 'Harare' || a === 'Bulawayo') {
    if (b === 'Harare' || b === 'Bulawayo') {
      return a === 'Harare' ? -1 : 1;
    }
    return -1;
  }
  if (b === 'Harare' || b === 'Bulawayo') return 1;
  return a.localeCompare(b);
});
