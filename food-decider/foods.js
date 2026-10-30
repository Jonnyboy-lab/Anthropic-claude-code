// Each food is described by traits the questionnaire scores against.
//   bread:  0 = none, 1 = some, 2 = bread is the star
//   greasy: 0 = light, 1 = middle, 2 = indulgent
//   spicy:  0 = mild, 1 = some kick, 2 = hot
//   diets:  which diets the dish can satisfy
//   price:  1 = $, 2 = $$, 3 = $$$
//   meals:  meal times it fits
//   speed:  "fast" (counter/takeout) or "sit" (sit-down)
//   novelty: 0 = familiar comfort, 2 = adventurous
//   heavy:  0 = snack-sized, 2 = very filling
//   temp:   "hot" or "cold" dish
//   osm:    OpenStreetMap cuisine tags used to find restaurants nearby
//   search: text used for map search fallbacks
const FOODS = [
  { name: "Burger & Fries", emoji: "🍔", bread: 2, greasy: 2, spicy: 0, diets: ["meat", "vegetarian"], price: 1, meals: ["lunch", "dinner", "late"], speed: "fast", novelty: 0, heavy: 2, temp: "hot", osm: ["burger", "american"], search: "burger restaurant" },
  { name: "Pizza", emoji: "🍕", bread: 2, greasy: 2, spicy: 0, diets: ["meat", "vegetarian"], price: 1, meals: ["lunch", "dinner", "late"], speed: "fast", novelty: 0, heavy: 2, temp: "hot", osm: ["pizza", "italian"], search: "pizza" },
  { name: "Fried Chicken", emoji: "🍗", bread: 1, greasy: 2, spicy: 1, diets: ["meat"], price: 1, meals: ["lunch", "dinner", "late"], speed: "fast", novelty: 0, heavy: 2, temp: "hot", osm: ["chicken", "fried_chicken", "american"], search: "fried chicken" },
  { name: "Tacos", emoji: "🌮", bread: 1, greasy: 1, spicy: 2, diets: ["meat", "seafood", "vegetarian", "vegan"], price: 1, meals: ["lunch", "dinner", "late"], speed: "fast", novelty: 1, heavy: 1, temp: "hot", osm: ["mexican", "tex-mex", "tacos"], search: "tacos" },
  { name: "Burrito", emoji: "🌯", bread: 1, greasy: 1, spicy: 1, diets: ["meat", "vegetarian", "vegan"], price: 1, meals: ["lunch", "dinner", "late"], speed: "fast", novelty: 0, heavy: 2, temp: "hot", osm: ["mexican", "tex-mex", "burrito"], search: "burrito" },
  { name: "Deli Sandwich", emoji: "🥪", bread: 2, greasy: 0, spicy: 0, diets: ["meat", "vegetarian", "vegan"], price: 1, meals: ["breakfast", "lunch"], speed: "fast", novelty: 0, heavy: 1, temp: "cold", osm: ["sandwich", "deli"], search: "sandwich shop" },
  { name: "Philly Cheesesteak", emoji: "🥖", bread: 2, greasy: 2, spicy: 0, diets: ["meat"], price: 1, meals: ["lunch", "dinner", "late"], speed: "fast", novelty: 0, heavy: 2, temp: "hot", osm: ["sandwich", "american", "cheesesteak"], search: "cheesesteak" },
  { name: "Sushi", emoji: "🍣", bread: 0, greasy: 0, spicy: 0, diets: ["seafood", "vegetarian", "vegan"], price: 3, meals: ["lunch", "dinner"], speed: "sit", novelty: 1, heavy: 1, temp: "cold", osm: ["sushi", "japanese"], search: "sushi" },
  { name: "Ramen", emoji: "🍜", bread: 0, greasy: 1, spicy: 1, diets: ["meat", "vegetarian", "vegan"], price: 2, meals: ["lunch", "dinner", "late"], speed: "sit", novelty: 1, heavy: 2, temp: "hot", osm: ["ramen", "japanese", "noodle"], search: "ramen" },
  { name: "Pho", emoji: "🍲", bread: 0, greasy: 0, spicy: 1, diets: ["meat", "vegetarian", "vegan"], price: 1, meals: ["breakfast", "lunch", "dinner"], speed: "sit", novelty: 1, heavy: 1, temp: "hot", osm: ["vietnamese", "pho"], search: "pho" },
  { name: "Banh Mi", emoji: "🥖", bread: 2, greasy: 0, spicy: 1, diets: ["meat", "vegetarian", "vegan"], price: 1, meals: ["breakfast", "lunch"], speed: "fast", novelty: 2, heavy: 1, temp: "cold", osm: ["vietnamese", "sandwich"], search: "banh mi" },
  { name: "Pad Thai & Curry", emoji: "🍛", bread: 0, greasy: 1, spicy: 2, diets: ["meat", "seafood", "vegetarian", "vegan"], price: 2, meals: ["lunch", "dinner"], speed: "sit", novelty: 1, heavy: 2, temp: "hot", osm: ["thai"], search: "thai food" },
  { name: "Indian Curry & Naan", emoji: "🍛", bread: 2, greasy: 1, spicy: 2, diets: ["meat", "vegetarian", "vegan"], price: 2, meals: ["lunch", "dinner"], speed: "sit", novelty: 1, heavy: 2, temp: "hot", osm: ["indian", "pakistani", "nepalese"], search: "indian restaurant" },
  { name: "Chinese Takeout", emoji: "🥡", bread: 0, greasy: 2, spicy: 1, diets: ["meat", "seafood", "vegetarian", "vegan"], price: 1, meals: ["lunch", "dinner", "late"], speed: "fast", novelty: 0, heavy: 2, temp: "hot", osm: ["chinese"], search: "chinese food" },
  { name: "Szechuan Hot Pot", emoji: "🌶️", bread: 0, greasy: 1, spicy: 2, diets: ["meat", "seafood", "vegetarian", "vegan"], price: 3, meals: ["dinner"], speed: "sit", novelty: 2, heavy: 2, temp: "hot", osm: ["chinese", "sichuan", "hot_pot"], search: "hot pot" },
  { name: "Korean BBQ", emoji: "🥩", bread: 0, greasy: 1, spicy: 1, diets: ["meat"], price: 3, meals: ["dinner"], speed: "sit", novelty: 2, heavy: 2, temp: "hot", osm: ["korean", "barbecue"], search: "korean bbq" },
  { name: "Gyro / Shawarma", emoji: "🥙", bread: 2, greasy: 1, spicy: 1, diets: ["meat", "vegetarian", "vegan"], price: 1, meals: ["lunch", "dinner", "late"], speed: "fast", novelty: 1, heavy: 2, temp: "hot", osm: ["greek", "kebab", "lebanese", "middle_eastern", "turkish", "shawarma"], search: "shawarma gyro" },
  { name: "Falafel & Hummus Bowl", emoji: "🧆", bread: 1, greasy: 0, spicy: 0, diets: ["vegetarian", "vegan"], price: 1, meals: ["lunch", "dinner"], speed: "fast", novelty: 1, heavy: 1, temp: "hot", osm: ["falafel", "lebanese", "middle_eastern", "mediterranean"], search: "falafel" },
  { name: "Pasta", emoji: "🍝", bread: 1, greasy: 1, spicy: 0, diets: ["meat", "seafood", "vegetarian", "vegan"], price: 2, meals: ["lunch", "dinner"], speed: "sit", novelty: 0, heavy: 2, temp: "hot", osm: ["italian", "pasta"], search: "italian restaurant" },
  { name: "Steakhouse", emoji: "🥩", bread: 1, greasy: 1, spicy: 0, diets: ["meat"], price: 3, meals: ["dinner"], speed: "sit", novelty: 0, heavy: 2, temp: "hot", osm: ["steak_house", "steak"], search: "steakhouse" },
  { name: "BBQ Ribs & Brisket", emoji: "🍖", bread: 1, greasy: 2, spicy: 1, diets: ["meat"], price: 2, meals: ["lunch", "dinner"], speed: "sit", novelty: 0, heavy: 2, temp: "hot", osm: ["bbq", "barbecue"], search: "bbq restaurant" },
  { name: "Seafood Platter", emoji: "🦞", bread: 0, greasy: 1, spicy: 0, diets: ["seafood"], price: 3, meals: ["lunch", "dinner"], speed: "sit", novelty: 1, heavy: 2, temp: "hot", osm: ["seafood"], search: "seafood restaurant" },
  { name: "Fish & Chips", emoji: "🐟", bread: 0, greasy: 2, spicy: 0, diets: ["seafood"], price: 2, meals: ["lunch", "dinner"], speed: "fast", novelty: 0, heavy: 2, temp: "hot", osm: ["fish_and_chips", "seafood", "british"], search: "fish and chips" },
  { name: "Poke Bowl", emoji: "🥗", bread: 0, greasy: 0, spicy: 1, diets: ["seafood", "vegetarian", "vegan"], price: 2, meals: ["lunch", "dinner"], speed: "fast", novelty: 1, heavy: 1, temp: "cold", osm: ["poke", "hawaiian"], search: "poke bowl" },
  { name: "Salad", emoji: "🥗", bread: 0, greasy: 0, spicy: 0, diets: ["meat", "seafood", "vegetarian", "vegan"], price: 2, meals: ["lunch", "dinner"], speed: "fast", novelty: 0, heavy: 0, temp: "cold", osm: ["salad", "healthy", "vegetarian"], search: "salad" },
  { name: "Grain / Buddha Bowl", emoji: "🥙", bread: 0, greasy: 0, spicy: 1, diets: ["meat", "vegetarian", "vegan"], price: 2, meals: ["lunch", "dinner"], speed: "fast", novelty: 1, heavy: 1, temp: "hot", osm: ["healthy", "vegan", "vegetarian", "bowl"], search: "healthy bowl" },
  { name: "Diner Breakfast", emoji: "🥞", bread: 1, greasy: 2, spicy: 0, diets: ["meat", "vegetarian"], price: 1, meals: ["breakfast", "lunch", "late"], speed: "sit", novelty: 0, heavy: 2, temp: "hot", osm: ["diner", "breakfast", "american"], search: "diner" },
  { name: "Bagel & Coffee", emoji: "🥯", bread: 2, greasy: 0, spicy: 0, diets: ["meat", "vegetarian", "vegan"], price: 1, meals: ["breakfast"], speed: "fast", novelty: 0, heavy: 1, temp: "cold", osm: ["bagel", "coffee_shop", "breakfast"], search: "bagel shop" },
  { name: "Brunch (Eggs Benedict & Avo Toast)", emoji: "🍳", bread: 2, greasy: 1, spicy: 0, diets: ["meat", "vegetarian", "vegan"], price: 2, meals: ["breakfast", "lunch"], speed: "sit", novelty: 0, heavy: 1, temp: "hot", osm: ["breakfast", "brunch", "cafe"], search: "brunch" },
  { name: "Breakfast Burrito", emoji: "🌯", bread: 1, greasy: 2, spicy: 1, diets: ["meat", "vegetarian"], price: 1, meals: ["breakfast"], speed: "fast", novelty: 0, heavy: 2, temp: "hot", osm: ["mexican", "breakfast"], search: "breakfast burrito" },
  { name: "Hot Dogs", emoji: "🌭", bread: 2, greasy: 2, spicy: 0, diets: ["meat", "vegetarian"], price: 1, meals: ["lunch", "late"], speed: "fast", novelty: 0, heavy: 1, temp: "hot", osm: ["hot_dog", "american"], search: "hot dogs" },
  { name: "Wings", emoji: "🍗", bread: 0, greasy: 2, spicy: 2, diets: ["meat"], price: 2, meals: ["dinner", "late"], speed: "sit", novelty: 0, heavy: 1, temp: "hot", osm: ["wings", "chicken"], search: "chicken wings" },
  { name: "Mediterranean Plate", emoji: "🫒", bread: 1, greasy: 0, spicy: 0, diets: ["meat", "seafood", "vegetarian", "vegan"], price: 2, meals: ["lunch", "dinner"], speed: "sit", novelty: 1, heavy: 1, temp: "hot", osm: ["mediterranean", "greek"], search: "mediterranean restaurant" },
  { name: "Ethiopian Platter", emoji: "🍽️", bread: 2, greasy: 0, spicy: 2, diets: ["meat", "vegetarian", "vegan"], price: 2, meals: ["lunch", "dinner"], speed: "sit", novelty: 2, heavy: 2, temp: "hot", osm: ["ethiopian", "african"], search: "ethiopian restaurant" },
  { name: "Dim Sum", emoji: "🥟", bread: 1, greasy: 1, spicy: 0, diets: ["meat", "seafood", "vegetarian"], price: 2, meals: ["breakfast", "lunch"], speed: "sit", novelty: 2, heavy: 1, temp: "hot", osm: ["dim_sum", "chinese", "cantonese"], search: "dim sum" },
  { name: "Dumplings", emoji: "🥟", bread: 1, greasy: 1, spicy: 1, diets: ["meat", "seafood", "vegetarian", "vegan"], price: 1, meals: ["lunch", "dinner", "late"], speed: "fast", novelty: 1, heavy: 1, temp: "hot", osm: ["dumpling", "chinese"], search: "dumplings" },
  { name: "Peruvian Chicken", emoji: "🍗", bread: 0, greasy: 1, spicy: 1, diets: ["meat"], price: 2, meals: ["lunch", "dinner"], speed: "sit", novelty: 2, heavy: 2, temp: "hot", osm: ["peruvian", "latin_american"], search: "peruvian chicken" },
  { name: "Soup & Bread Bowl", emoji: "🥣", bread: 2, greasy: 0, spicy: 0, diets: ["meat", "vegetarian", "vegan"], price: 1, meals: ["lunch", "dinner"], speed: "fast", novelty: 0, heavy: 1, temp: "hot", osm: ["soup", "bakery", "cafe"], search: "soup" },
  { name: "Ice Cream / Dessert", emoji: "🍦", bread: 0, greasy: 1, spicy: 0, diets: ["vegetarian", "vegan"], price: 1, meals: ["lunch", "dinner", "late"], speed: "fast", novelty: 0, heavy: 0, temp: "cold", osm: ["ice_cream", "dessert", "frozen_yogurt"], search: "ice cream" },
  { name: "Bakery Pastries", emoji: "🥐", bread: 2, greasy: 1, spicy: 0, diets: ["vegetarian", "vegan"], price: 1, meals: ["breakfast", "lunch"], speed: "fast", novelty: 0, heavy: 0, temp: "cold", osm: ["bakery", "cafe", "coffee_shop"], search: "bakery" },
];

if (typeof module !== "undefined") module.exports = { FOODS };
