export const CREDIT_BANDS = {
  essential: { label: '⭐ Essential', credits: 5, badgeColor: 'bg-blue-100 text-blue-700', description: 'Basic daily living aids' },
  useful: { label: '⭐⭐ Useful', credits: 15, badgeColor: 'bg-purple-100 text-purple-700', description: 'Helpful adaptations & tools' },
  quality: { label: '⭐⭐⭐ Quality', credits: 30, badgeColor: 'bg-amber-100 text-amber-700', description: 'Quality mobility & comfort items' },
  premium: { label: '⭐⭐⭐⭐ Premium', credits: 50, badgeColor: 'bg-red-100 text-red-700', description: 'High-value mobility equipment' },
  gift: { label: '🎁 Free Gift', credits: 0, badgeColor: 'bg-green-100 text-green-700', description: 'Free to a good home' },
};

export const CATEGORY_LABELS = {
  mobility: '🦯 Mobility',
  daily_living: '🏠 Daily Living',
  comfort: '🛋️ Comfort & Warmth',
  technology: '📱 Technology',
  social: '🎲 Social & Activities',
  clothing: '👕 Clothing & Accessories',
  home: '🔧 Home & Safety',
  other: '📦 Other',
};

export const CONDITION_LABELS = {
  new: 'Brand New',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
};

// Suggested items by category for prompting donors
export const SUGGESTED_ITEMS = {
  mobility: ['Walking stick', 'Zimmer frame', 'Wheelchair cushion', 'Grab rail', 'Bath seat', 'Raised toilet seat', 'Crutches'],
  daily_living: ['Kettle tipper', 'Jar opener', 'Pill organiser', 'Large-print phone', 'Magnifier', 'Sock aid', 'Long-handled reacher'],
  comfort: ['Electric blanket', 'Heated throw', 'Lap tray', 'Pressure cushion', 'Bed wedge pillow'],
  technology: ['Tablet', 'Simple smartphone', 'Amazon Echo/Alexa', 'Large-button remote', 'Personal alarm'],
  social: ['Jigsaw puzzles', 'Large-print books', 'Board games', 'Knitting supplies', 'Art & craft materials'],
  clothing: ['Non-slip slippers', 'Adapted clothing', 'Compression socks', 'Warm cardigan', 'Fleece blanket'],
  home: ['Smoke alarm', 'Key safe', 'Door sensor', 'Night light', 'Tap turner', 'Draught excluder'],
};