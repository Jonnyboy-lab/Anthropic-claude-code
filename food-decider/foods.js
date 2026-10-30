// The dishes the guide can recommend. Each row is one dish:
//
//   dish(name, emoji, region, [bread, greasy, spicy, heavy, novelty], price, hot, sitDown,
//        diets, meals, tags, osm, search)
//
//   region:   where in the world it's from; drives the "where would you be?" question
//   bread…novelty: 0–2 each (none / some / lots; novelty: familiar → adventurous)
//   price:    1 = $, 2 = $$, 3 = $$$
//   hot:      served hot (vs cold / fresh)
//   sitDown:  usually a sit-down meal (vs grab and go)
//   diets:    the main protein first, then other diets it can be made for
//             (meat, seafood, veg = vegetarian, vegan)
//   meals:    B breakfast, L lunch, D dinner, N late night
//   tags:     feelings and textures: crispy saucy melty slurpy fresh smoky grilled soup
//             comfort healthy sweet shareable, and how you eat it: hands fork chopsticks spoon
//   osm:      OpenStreetMap cuisine tags used to find real restaurants
//   search:   what to search for on a map

const MEAL_CODES = { B: "breakfast", L: "lunch", D: "dinner", N: "late" };

function dish(name, emoji, region, [bread, greasy, spicy, heavy, novelty], price, hot, sitDown, diets, meals, tags, osm, search) {
  return {
    name, emoji, region, bread, greasy, spicy, heavy, novelty, price,
    temp: hot ? "hot" : "cold",
    speed: sitDown ? "sit" : "fast",
    diets: diets.split(" ").map((d) => (d === "veg" ? "vegetarian" : d)),
    meals: [...meals].map((c) => MEAL_CODES[c]),
    tags: tags.split(" "),
    osm: osm.split(" "),
    search,
  };
}

const HOT = true, COLD = false, SIT = true, FAST = false;

const FOODS = [
  // American & diner
  dish("Smash Burger & Fries", "🍔", "american", [2, 2, 0, 2, 0], 1, HOT, FAST, "meat veg", "LDN", "crispy melty hands comfort", "burger american", "burgers"),
  dish("Chicken Tenders & Fries", "🍟", "american", [0, 2, 0, 1, 0], 1, HOT, FAST, "meat", "LDN", "crispy hands comfort", "chicken american", "chicken tenders"),
  dish("Philly Cheesesteak", "🥖", "american", [2, 2, 0, 2, 0], 1, HOT, FAST, "meat veg", "LDN", "melty hands comfort", "sandwich cheesesteak american", "cheesesteak"),
  dish("Deli Sandwich", "🥪", "american", [2, 0, 0, 1, 0], 1, COLD, FAST, "meat veg vegan", "BL", "fresh hands", "sandwich deli", "deli sandwich"),
  dish("Hot Dogs & Chili Dogs", "🌭", "american", [2, 2, 1, 1, 0], 1, HOT, FAST, "meat veg", "LN", "hands comfort", "hot_dog american", "hot dogs"),
  dish("Buffalo Wings", "🍗", "american", [0, 2, 2, 1, 0], 2, HOT, SIT, "meat", "DN", "crispy saucy hands shareable", "wings chicken american", "chicken wings"),
  dish("Steakhouse Dinner", "🥩", "american", [1, 1, 0, 2, 0], 3, HOT, SIT, "meat", "D", "grilled smoky fork", "steak_house steak", "steakhouse"),
  dish("Diner Breakfast", "🥞", "american", [1, 2, 0, 2, 0], 1, HOT, SIT, "meat veg", "BLN", "comfort sweet fork", "diner breakfast american", "diner"),
  dish("Soup & Grilled Cheese", "🥣", "american", [2, 1, 0, 1, 0], 1, HOT, FAST, "veg meat", "LD", "soup melty comfort spoon", "soup sandwich cafe", "soup and grilled cheese"),
  dish("Poutine & Cheese Fries", "🍟", "american", [0, 2, 0, 2, 1], 1, HOT, FAST, "veg meat", "LN", "crispy melty comfort fork", "poutine american", "poutine"),
  dish("Big Chopped Salad", "🥗", "american", [0, 0, 0, 0, 0], 2, COLD, FAST, "meat seafood veg vegan", "LD", "fresh healthy fork", "salad healthy", "salad"),
  dish("Grain Bowl", "🥙", "american", [0, 0, 1, 1, 1], 2, HOT, FAST, "meat veg vegan", "LD", "fresh healthy fork", "healthy bowl vegetarian", "grain bowl"),
  dish("Bagel & Schmear", "🥯", "american", [2, 0, 0, 1, 0], 1, COLD, FAST, "veg meat vegan", "B", "hands", "bagel breakfast", "bagels"),
  dish("Brunch Plate", "🍳", "american", [2, 1, 0, 1, 0], 2, HOT, SIT, "meat veg vegan", "BL", "comfort fork", "breakfast brunch cafe", "brunch"),
  dish("Lobster Roll", "🦞", "american", [2, 1, 0, 1, 1], 3, COLD, FAST, "seafood", "LD", "fresh hands", "seafood", "lobster roll"),
  dish("Oysters & Raw Bar", "🦪", "american", [0, 0, 0, 0, 2], 3, COLD, SIT, "seafood", "D", "fresh", "seafood oyster", "oyster bar"),

  // Southern, soul & Cajun
  dish("BBQ Brisket & Ribs", "🍖", "southern", [1, 2, 1, 2, 0], 2, HOT, SIT, "meat", "LD", "smoky grilled saucy hands shareable comfort", "bbq barbecue", "bbq"),
  dish("Soul Food Plate", "🍗", "southern", [1, 2, 0, 2, 1], 2, HOT, SIT, "meat", "LD", "crispy comfort fork", "soul_food southern", "soul food"),
  dish("Chicken & Waffles", "🧇", "southern", [1, 2, 0, 2, 1], 2, HOT, SIT, "meat", "BLD", "crispy sweet comfort fork", "southern soul_food breakfast", "chicken and waffles"),
  dish("Mac & Cheese", "🧀", "southern", [0, 2, 0, 2, 0], 1, HOT, FAST, "veg", "LD", "melty comfort spoon", "southern american", "mac and cheese"),
  dish("Gumbo & Jambalaya", "🍲", "southern", [0, 1, 2, 2, 1], 2, HOT, SIT, "meat seafood", "LD", "saucy soup comfort spoon", "cajun creole", "cajun"),
  dish("Shrimp Po' Boy", "🥖", "southern", [2, 2, 1, 2, 1], 2, HOT, FAST, "seafood", "LD", "crispy hands", "cajun sandwich seafood", "po boy"),
  dish("Seafood Boil", "🦀", "southern", [0, 1, 2, 2, 1], 3, HOT, SIT, "seafood", "D", "saucy hands shareable", "seafood cajun", "seafood boil"),

  // Mexican
  dish("Street Tacos", "🌮", "mexican", [1, 1, 2, 1, 0], 1, HOT, FAST, "meat seafood veg vegan", "LDN", "grilled fresh hands", "mexican tacos", "tacos"),
  dish("Loaded Burrito", "🌯", "mexican", [1, 1, 1, 2, 0], 1, HOT, FAST, "meat veg vegan", "LDN", "melty comfort hands", "mexican burrito tex-mex", "burrito"),
  dish("Birria Tacos & Consomé", "🌮", "mexican", [1, 2, 2, 2, 1], 1, HOT, FAST, "meat", "LDN", "saucy melty soup hands", "mexican tacos", "birria"),
  dish("Enchiladas & Mole", "🫔", "mexican", [0, 1, 1, 2, 1], 2, HOT, SIT, "meat veg", "LD", "saucy melty fork", "mexican", "enchiladas"),
  dish("Quesadilla", "🧀", "mexican", [1, 2, 0, 1, 0], 1, HOT, FAST, "meat veg", "LDN", "melty crispy hands", "mexican tex-mex", "quesadilla"),
  dish("Loaded Nachos", "🧀", "mexican", [0, 2, 1, 2, 0], 1, HOT, FAST, "meat veg", "LDN", "crispy melty hands shareable", "mexican tex-mex", "nachos"),
  dish("Pozole", "🍲", "mexican", [0, 0, 1, 2, 2], 2, HOT, SIT, "meat", "LD", "soup comfort spoon", "mexican", "pozole"),
  dish("Tamales", "🫔", "mexican", [1, 1, 1, 1, 1], 1, HOT, FAST, "meat veg", "BLD", "comfort hands", "mexican", "tamales"),
  dish("Breakfast Burrito", "🌯", "mexican", [1, 2, 1, 2, 0], 1, HOT, FAST, "meat veg", "B", "melty hands", "mexican breakfast", "breakfast burrito"),

  // Latin American & Caribbean
  dish("Pupusas", "🫓", "latin", [2, 1, 0, 1, 2], 1, HOT, SIT, "meat veg", "LD", "melty comfort hands", "salvadoran latin_american", "pupusas"),
  dish("Arepas", "🫓", "latin", [2, 1, 0, 1, 2], 1, HOT, FAST, "meat veg", "BLD", "melty hands", "venezuelan colombian latin_american", "arepas"),
  dish("Empanadas", "🥟", "latin", [2, 2, 0, 1, 1], 1, HOT, FAST, "meat veg", "LDN", "crispy hands", "argentinian empanada latin_american", "empanadas"),
  dish("Peruvian Rotisserie Chicken", "🍗", "latin", [0, 1, 1, 2, 1], 2, HOT, SIT, "meat", "LD", "grilled smoky fork", "peruvian latin_american chicken", "peruvian chicken"),
  dish("Ceviche", "🍋", "latin", [0, 0, 2, 0, 2], 2, COLD, SIT, "seafood", "LD", "fresh healthy fork", "peruvian seafood latin_american", "ceviche"),
  dish("Brazilian Steakhouse", "🥩", "latin", [0, 1, 0, 2, 2], 3, HOT, SIT, "meat", "D", "grilled smoky shareable fork", "brazilian steak_house", "brazilian steakhouse"),
  dish("Cuban Sandwich", "🥪", "caribbean", [2, 2, 0, 2, 1], 1, HOT, FAST, "meat", "LD", "melty crispy hands", "cuban caribbean sandwich", "cuban sandwich"),
  dish("Jerk Chicken & Rice", "🍗", "caribbean", [0, 1, 2, 2, 1], 1, HOT, FAST, "meat", "LD", "smoky grilled fork", "jamaican caribbean", "jerk chicken"),
  dish("Roti & Curry Goat", "🫓", "caribbean", [2, 1, 2, 2, 2], 2, HOT, FAST, "meat veg", "LD", "saucy hands", "caribbean trinidadian jamaican", "caribbean roti"),
  dish("Poke Bowl", "🐟", "islands", [0, 0, 1, 1, 1], 2, COLD, FAST, "seafood veg vegan", "LD", "fresh healthy chopsticks", "poke hawaiian", "poke"),
  dish("Hawaiian Plate Lunch", "🍍", "islands", [0, 2, 0, 2, 1], 1, HOT, FAST, "meat", "LD", "saucy grilled comfort fork", "hawaiian", "hawaiian plate lunch"),

  // Italian & European
  dish("Classic Pizza", "🍕", "italian", [2, 2, 0, 2, 0], 1, HOT, FAST, "meat veg", "LDN", "melty comfort hands shareable", "pizza italian", "pizza"),
  dish("Wood-Fired Neapolitan Pizza", "🍕", "italian", [2, 1, 0, 1, 1], 2, HOT, SIT, "veg meat vegan", "D", "melty shareable fork", "pizza italian", "neapolitan pizza"),
  dish("Pasta Night", "🍝", "italian", [1, 1, 0, 2, 0], 2, HOT, SIT, "meat seafood veg vegan", "LD", "saucy slurpy comfort fork", "italian pasta", "pasta"),
  dish("Lasagna & Baked Ziti", "🧀", "italian", [1, 2, 0, 2, 0], 2, HOT, SIT, "meat veg", "D", "melty saucy comfort fork", "italian", "lasagna"),
  dish("Chicken Parm Sub", "🥖", "italian", [2, 2, 0, 2, 0], 1, HOT, FAST, "meat veg", "LD", "melty saucy comfort hands", "italian sandwich", "chicken parm"),
  dish("Risotto & Wine Bar", "🍷", "italian", [1, 1, 0, 1, 1], 3, HOT, SIT, "veg seafood meat", "D", "saucy melty fork", "italian wine_bar", "italian wine bar"),
  dish("French Bistro Steak Frites", "🥩", "european", [2, 1, 0, 2, 1], 3, HOT, SIT, "meat seafood", "D", "crispy fork", "french", "french bistro"),
  dish("Crêpes", "🥞", "european", [1, 1, 0, 1, 1], 1, HOT, FAST, "veg meat", "BLN", "sweet melty fork", "crepe french", "crepes"),
  dish("Schnitzel & Sausages", "🥨", "european", [2, 2, 0, 2, 1], 2, HOT, SIT, "meat", "LD", "crispy comfort fork", "german", "german"),
  dish("Pierogi", "🥟", "european", [1, 1, 0, 2, 2], 1, HOT, SIT, "veg meat", "LD", "melty comfort fork", "polish ukrainian", "pierogi"),
  dish("Spanish Tapas", "🫒", "european", [1, 1, 1, 1, 1], 3, HOT, SIT, "meat seafood veg", "D", "shareable fork", "spanish tapas", "tapas"),
  dish("Paella", "🥘", "european", [0, 1, 0, 2, 2], 3, HOT, SIT, "seafood meat", "D", "saucy shareable fork", "spanish", "paella"),
  dish("Fish & Chips", "🐟", "european", [0, 2, 0, 2, 0], 2, HOT, FAST, "seafood", "LD", "crispy comfort hands", "fish_and_chips british", "fish and chips"),

  // Mediterranean & Middle Eastern
  dish("Gyro & Shawarma", "🥙", "mediterranean", [2, 1, 1, 2, 0], 1, HOT, FAST, "meat veg", "LDN", "saucy grilled hands", "greek kebab shawarma middle_eastern turkish lebanese", "shawarma"),
  dish("Falafel & Hummus", "🧆", "mediterranean", [1, 1, 0, 1, 1], 1, HOT, FAST, "vegan veg", "LD", "crispy healthy hands", "falafel lebanese middle_eastern mediterranean", "falafel"),
  dish("Greek Souvlaki Plate", "🫒", "mediterranean", [1, 0, 0, 1, 0], 2, HOT, SIT, "meat seafood veg", "LD", "grilled fresh healthy fork", "greek mediterranean", "greek"),
  dish("Turkish Kebab Platter", "🍢", "mediterranean", [1, 1, 1, 2, 1], 2, HOT, SIT, "meat", "LD", "grilled smoky shareable fork", "turkish kebab", "turkish kebab"),
  dish("Persian Kebab & Saffron Rice", "🍢", "mediterranean", [0, 0, 0, 2, 2], 2, HOT, SIT, "meat veg", "LD", "grilled fork", "persian iranian", "persian"),
  dish("Shakshuka", "🍳", "mediterranean", [2, 0, 1, 1, 2], 2, HOT, SIT, "veg", "BL", "saucy spoon", "israeli middle_eastern breakfast", "shakshuka"),

  // South Asian
  dish("Butter Chicken & Naan", "🍛", "south_asian", [2, 1, 1, 2, 1], 2, HOT, SIT, "meat veg", "LD", "saucy comfort hands", "indian", "indian"),
  dish("Biryani", "🍚", "south_asian", [0, 1, 2, 2, 1], 2, HOT, SIT, "meat veg", "LD", "shareable fork", "indian pakistani", "biryani"),
  dish("Fiery Vindaloo", "🌶️", "south_asian", [1, 1, 2, 2, 1], 2, HOT, SIT, "meat veg vegan", "D", "saucy fork", "indian", "indian curry"),
  dish("Dosa", "🫓", "south_asian", [1, 1, 1, 1, 2], 1, HOT, SIT, "veg vegan", "BLD", "crispy hands", "indian south_indian", "dosa"),
  dish("Momos", "🥟", "south_asian", [1, 1, 1, 1, 2], 1, HOT, FAST, "meat veg", "LD", "hands", "nepalese tibetan", "momos"),

  // African
  dish("Ethiopian Platter", "🍽️", "african", [2, 0, 2, 2, 2], 2, HOT, SIT, "meat veg vegan", "LD", "saucy shareable hands", "ethiopian eritrean", "ethiopian"),
  dish("Jollof Rice & Suya", "🍢", "african", [0, 1, 2, 2, 2], 2, HOT, SIT, "meat", "LD", "smoky grilled fork", "nigerian african west_african", "nigerian"),

  // East Asian
  dish("Sushi", "🍣", "east_asian", [0, 0, 0, 1, 1], 3, COLD, SIT, "seafood veg vegan", "LD", "fresh healthy chopsticks", "sushi japanese", "sushi"),
  dish("Ramen", "🍜", "east_asian", [0, 1, 1, 2, 1], 2, HOT, SIT, "meat veg vegan", "LDN", "slurpy soup comfort chopsticks", "ramen japanese noodle", "ramen"),
  dish("Udon & Tempura", "🍤", "east_asian", [0, 1, 0, 2, 1], 2, HOT, SIT, "seafood veg vegan", "LD", "slurpy soup crispy comfort chopsticks", "japanese udon noodle", "udon"),
  dish("Katsu Curry", "🍛", "east_asian", [0, 2, 0, 2, 1], 2, HOT, SIT, "meat", "LD", "crispy saucy comfort fork", "japanese", "katsu curry"),
  dish("Teriyaki Bowl", "🍱", "east_asian", [0, 1, 0, 1, 0], 1, HOT, FAST, "meat veg", "LD", "saucy grilled fork", "japanese teriyaki", "teriyaki"),
  dish("Korean BBQ", "🥓", "east_asian", [0, 1, 1, 2, 2], 3, HOT, SIT, "meat", "D", "grilled smoky shareable chopsticks", "korean barbecue", "korean bbq"),
  dish("Korean Fried Chicken", "🍗", "east_asian", [0, 2, 1, 1, 1], 2, HOT, FAST, "meat", "DN", "crispy saucy shareable hands", "korean chicken", "korean fried chicken"),
  dish("Bibimbap", "🍚", "east_asian", [0, 0, 1, 1, 1], 2, HOT, SIT, "meat veg vegan", "LD", "fresh healthy spoon", "korean", "bibimbap"),
  dish("Chinese Takeout", "🥡", "east_asian", [0, 2, 1, 2, 0], 1, HOT, FAST, "meat seafood veg vegan", "LDN", "saucy crispy comfort chopsticks", "chinese", "chinese food"),
  dish("Dim Sum", "🥟", "east_asian", [1, 1, 0, 1, 2], 2, HOT, SIT, "meat seafood veg", "BL", "shareable chopsticks", "dim_sum chinese cantonese", "dim sum"),
  dish("Sichuan Hot Pot", "🫕", "east_asian", [0, 1, 2, 2, 2], 3, HOT, SIT, "meat seafood veg vegan", "DN", "soup shareable chopsticks spoon", "chinese sichuan hot_pot", "hot pot"),
  dish("Noodles & Dumplings", "🥢", "east_asian", [1, 1, 1, 1, 1], 1, HOT, FAST, "meat veg", "LDN", "slurpy comfort chopsticks", "chinese noodle dumpling", "dumplings"),

  // Southeast Asian
  dish("Pad Thai", "🍜", "southeast_asian", [0, 1, 1, 2, 0], 2, HOT, SIT, "meat seafood veg vegan", "LD", "slurpy saucy chopsticks", "thai", "pad thai"),
  dish("Thai Green Curry", "🍛", "southeast_asian", [0, 1, 2, 2, 1], 2, HOT, SIT, "meat seafood veg vegan", "LD", "saucy comfort spoon", "thai", "thai curry"),
  dish("Pho", "🍲", "southeast_asian", [0, 0, 1, 1, 1], 1, HOT, SIT, "meat veg vegan", "BLD", "slurpy soup healthy comfort chopsticks spoon", "vietnamese pho", "pho"),
  dish("Banh Mi", "🥖", "southeast_asian", [2, 0, 1, 1, 1], 1, COLD, FAST, "meat veg vegan", "BL", "fresh hands", "vietnamese sandwich", "banh mi"),
  dish("Filipino Adobo & Lumpia", "🍗", "southeast_asian", [0, 2, 0, 2, 2], 2, HOT, SIT, "meat", "LD", "crispy saucy comfort fork", "filipino", "filipino"),
  dish("Laksa", "🍜", "southeast_asian", [0, 1, 2, 2, 2], 2, HOT, SIT, "seafood meat", "LD", "slurpy soup spoon", "malaysian singaporean", "laksa"),

  // Sweets & cafés
  dish("Ice Cream", "🍦", "cafe", [0, 1, 0, 0, 0], 1, COLD, FAST, "veg vegan", "LDN", "sweet", "ice_cream frozen_yogurt", "ice cream"),
  dish("Donuts", "🍩", "cafe", [2, 2, 0, 0, 0], 1, COLD, FAST, "veg", "BN", "sweet hands", "donut", "donuts"),
  dish("Bakery & Pastries", "🥐", "cafe", [2, 1, 0, 0, 0], 1, COLD, FAST, "veg vegan", "BL", "sweet hands", "bakery cafe", "bakery"),
  dish("Bubble Tea & Snacks", "🧋", "cafe", [0, 0, 0, 0, 1], 1, COLD, FAST, "veg vegan", "LDN", "sweet", "bubble_tea", "bubble tea"),
  dish("Açaí Bowl", "🫐", "cafe", [0, 0, 0, 0, 1], 2, COLD, FAST, "vegan veg", "BL", "sweet fresh healthy spoon", "acai juice", "acai bowl"),
  dish("Late-Night Dessert Bar", "🍰", "cafe", [0, 1, 0, 1, 0], 2, COLD, SIT, "veg", "DN", "sweet fork", "dessert cake", "dessert"),
];

if (typeof module !== "undefined") module.exports = { FOODS };
