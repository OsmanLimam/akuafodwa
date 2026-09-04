/**
 * AkuafoDwa seed data + logic. The CLI wrapper is prisma/seed.ts (bun prisma/seed.ts).
 * src/lib/bootstrap.ts reuses runSeed() to load the demo market on fresh hosts
 * when SEED_DEMO=1 and the database is still empty.
 *
 * Wipes and recreates: categories, users, listings (locally hosted photos),
 * favorites, demo offer threads. Images live in /public/uploads/seed and are
 * referenced by stable local paths.
 */
import { PrismaClient, Prisma } from '@prisma/client'
import { scryptSync, randomBytes } from 'crypto'

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

/*
 * SECURITY: the seeded admin password is never hardcoded. It comes from the
 * DEMO_ADMIN_PASSWORD environment variable; when unset, a random password is
 * generated for this seed run and printed once below. Production seeding is
 * blocked entirely in src/lib/bootstrap.ts.
 */
export const SEED_ADMIN_PASSWORD =
  process.env.DEMO_ADMIN_PASSWORD || `akuafo-admin-${randomBytes(6).toString('hex')}`

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 3600 * 1000 - Math.floor(Math.random() * 20) * 3600 * 1000)
}

const DEFAULT_CATEGORIES = [
  { name: 'Roots & Tubers', slug: 'roots-tubers', icon: 'Sprout' },
  { name: 'Grains & Legumes', slug: 'grains-legumes', icon: 'Wheat' },
  { name: 'Vegetables', slug: 'vegetables', icon: 'Carrot' },
  { name: 'Fruits', slug: 'fruits', icon: 'Apple' },
  { name: 'Cash Crops', slug: 'cash-crops', icon: 'Leaf' },
  { name: 'Poultry & Eggs', slug: 'poultry-eggs', icon: 'Egg' },
  { name: 'Livestock', slug: 'livestock', icon: 'Beef' },
  { name: 'Fish & Aquaculture', slug: 'fish-aquaculture', icon: 'Fish' },
  { name: 'Processed Foods', slug: 'processed-foods', icon: 'Package' },
  { name: 'Seeds & Agro Inputs', slug: 'seeds-inputs', icon: 'FlaskConical' },
]

interface SeedUser {
  email: string
  name: string
  phone: string
  region: string
  pass: string
  role?: string
  sellerType?: string
  businessName?: string
  bio?: string
  identityStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
}

const USERS: SeedUser[] = [
  {
    email: 'akua@akuafodwa.com', name: 'Akua Mensah', phone: '024 555 0101', region: 'Ashanti', pass: 'demo1234',
    sellerType: 'FARMER', businessName: 'Mensah Family Farm', identityStatus: 'VERIFIED',
    bio: 'Mixed crop farmer near Ejura. We grow yam, tomatoes and ginger, and raise broiler chickens. Farm visits welcome.',
  },
  {
    email: 'kwame@akuafodwa.com', name: 'Kwame Owusu', phone: '020 555 0102', region: 'Greater Accra', pass: 'demo1234',
    sellerType: 'TRADER', businessName: 'Owusu Provisions', identityStatus: 'VERIFIED',
    bio: 'Trader supplying shops and institutions around Tema and Accra. Buying eggs, grains and fresh produce in bulk.',
  },
  {
    email: 'yaw@akuafodwa.com', name: 'Yaw Boateng', phone: '055 555 0103', region: 'Bono', pass: 'demo1234',
    sellerType: 'WHOLESALER', businessName: 'Boateng Agro Supplies', identityStatus: 'VERIFIED',
    bio: 'Wholesaler at Sunyani. Maize, onions, oranges and agro inputs in bag quantities. Warehouse pickup any working day.',
  },
  {
    email: 'abena@akuafodwa.com', name: 'Abena Asante', phone: '027 555 0104', region: 'Central', pass: 'demo1234',
    sellerType: 'FARMER', businessName: 'Asante Green Farms', identityStatus: 'VERIFIED',
    bio: 'Vegetable and pineapple farmer near Cape Coast and Elmina. Everything harvested to order.',
  },
  {
    email: 'kofi@akuafodwa.com', name: 'Kofi Alhassan', phone: '024 555 0105', region: 'Northern', pass: 'demo1234',
    sellerType: 'FARMER', businessName: 'Alhassan Farms', identityStatus: 'VERIFIED',
    bio: 'Northern region farmer. Rice, groundnuts, sweet potatoes and livestock from Tamale and Savelugu.',
  },
  {
    email: 'adjoa@akuafodwa.com', name: 'Adjoa Kuma', phone: '050 555 0106', region: 'Volta', pass: 'demo1234',
    sellerType: 'FARMER', businessName: 'Kuma Farms & Processed Foods', identityStatus: 'PENDING',
    bio: 'Cassava, gari and tilapia from Ho and Akosombo. Verification documents submitted, awaiting review.',
  },
  {
    email: 'fatima@akuafodwa.com', name: 'Fatima Abdulai', phone: '026 555 0107', region: 'Upper East', pass: 'demo1234',
    sellerType: 'TRADER', businessName: 'Fatima Agro Traders', identityStatus: 'VERIFIED',
    bio: 'Livestock and beans trader in Bolgatanga and Navrongo. Guinea fowls, sheep and Neri beans.',
  },
  {
    email: 'kojo@akuafodwa.com', name: 'Kojo Annan', phone: '020 555 0108', region: 'Western', pass: 'demo1234',
    sellerType: 'PROCESSOR', businessName: 'Annan Smokehouse & Oils', identityStatus: 'VERIFIED',
    bio: 'Smoked fish, palm oil and honey processing and trading from Takoradi and Axim.',
  },
  {
    email: 'esi@akuafodwa.com', name: 'Esi Nyarko', phone: '054 555 0109', region: 'Eastern', pass: 'demo1234',
    sellerType: 'FARMER', businessName: 'Nyarko Hill Farms', identityStatus: 'UNVERIFIED',
    bio: 'Cocoyam, garden eggs, cabbage and pawpaw from the Akuapem hills. New to AkuafoDwa.',
  },
  {
    // SECURITY: the admin password is never hardcoded. Seeding reads
    // DEMO_ADMIN_PASSWORD from the environment; if unset, a random password is
    // generated and printed once in the seeding log (local dev only —
    // production seeding is blocked in src/lib/bootstrap.ts).
    email: 'admin@akuafodwa.com', name: 'AkuafoDwa Admin', phone: '030 555 0000', region: 'Greater Accra',
    pass: SEED_ADMIN_PASSWORD, role: 'ADMIN',
  },
]

interface SeedListing {
  title: string
  img: string
  cat: string
  region: string
  city?: string
  price: number
  unit: string
  quantity: number
  seller: string
  desc: string
  age: number
  views: number
  grade?: string
  packaging?: string
  harvestInfo?: string
  productionMethod?: string
  minOrder?: number
  fulfillment?: 'PICKUP' | 'DELIVERY' | 'BOTH'
  negotiable?: boolean
}

const LISTINGS: SeedListing[] = [
  {
    title: 'Pona Yam Tubers (Farm Direct)', img: '/uploads/seed/yam.jpg', cat: 'roots-tubers', region: 'Ashanti', city: 'Ejura',
    price: 35, unit: 'tuber', quantity: 200, seller: 'akua@akuafodwa.com', age: 1, views: 42,
    grade: 'Grade A, big sizes', packaging: 'Loose tubers, heaped for loading', harvestInfo: 'Harvested this week, main season crop',
    productionMethod: 'Conventional', minOrder: 10, fulfillment: 'PICKUP',
    desc: 'Fresh Pona yam straight from our farm at Ejura. Big, firm tubers, great for fufu or boiling. Buyers welcome to inspect and select on site. Bulk discounts from 50 tubers.',
  },
  {
    title: 'Fresh Cassava Roots (For Fufu or Gari)', img: '/uploads/seed/cassava.jpg', cat: 'roots-tubers', region: 'Volta', city: 'Ho',
    price: 950, unit: 'bag', quantity: 60, seller: 'adjoa@akuafodwa.com', age: 2, views: 31,
    packaging: '50kg bag', harvestInfo: 'Uprooted on order, 10 to 12 months mature', minOrder: 5, fulfillment: 'PICKUP',
    desc: 'Well-matured cassava, freshly uprooted. Perfect for fufu flour processors and gari makers. 50kg bags, loaded on your truck or we help you arrange transport. Order ahead so we harvest fresh for you.',
  },
  {
    title: 'Sweet Potatoes (Orange Flesh)', img: '/uploads/seed/sweet-potato.jpg', cat: 'roots-tubers', region: 'Northern', city: 'Tamale',
    price: 4, unit: 'kg', quantity: 800, seller: 'kofi@akuafodwa.com', age: 3, views: 27,
    grade: 'Premium, well cured', harvestInfo: 'Harvested this week', productionMethod: 'Conventional', minOrder: 50, fulfillment: 'BOTH',
    desc: 'Sweet orange-fleshed variety, freshly harvested this week. Clean, well-cured tubers with long shelf life. Retail and wholesale buyers welcome.',
  },
  {
    title: 'Cocoyam (Mantemesi)', img: '/uploads/seed/cocoyam.jpg', cat: 'roots-tubers', region: 'Eastern', city: 'Koforidua',
    price: 7, unit: 'kg', quantity: 500, seller: 'esi@akuafodwa.com', age: 4, views: 18,
    harvestInfo: 'Current season harvest', minOrder: 20, fulfillment: 'PICKUP',
    desc: 'Fresh mantemesi cocoyam from the Akuapem hills. Smooth texture, ideal for plain boiling or kokonte. Sold per kg, minimum order 20kg.',
  },
  {
    title: 'White Maize (Dried and Cleaned)', img: '/uploads/seed/maize.jpg', cat: 'grains-legumes', region: 'Bono East', city: 'Techiman',
    price: 380, unit: 'maxi bag (50kg)', quantity: 120, seller: 'yaw@akuafodwa.com', age: 1, views: 55,
    grade: 'Grade A', packaging: 'Maxi bag (50kg)', harvestInfo: 'Major season harvest, dried to about 13% moisture', minOrder: 10, fulfillment: 'BOTH', negotiable: true,
    desc: 'Quality dried white maize from Techiman, the food basket of Ghana. Well dried, cleaned and free of debris. Immediate delivery from warehouse. Sample available before you buy.',
  },
  {
    title: 'Local Perfumed Rice (Aromatic)', img: '/uploads/seed/rice.jpg', cat: 'grains-legumes', region: 'Northern', city: 'Tamale',
    price: 720, unit: 'bag', quantity: 45, seller: 'kofi@akuafodwa.com', age: 5, views: 23,
    packaging: '50kg bag', harvestInfo: 'Last milling, this season paddy', productionMethod: 'Conventional', minOrder: 5, fulfillment: 'PICKUP',
    desc: 'Locally grown perfumed rice from the Northern rice belt. Milled and polished, stone-free. Once you cook it you will always come back. 50kg bags.',
  },
  {
    title: 'Red Beans (Neri Variety)', img: '/uploads/seed/beans.jpg', cat: 'grains-legumes', region: 'Upper West', city: 'Wa',
    price: 850, unit: 'bag', quantity: 30, seller: 'fatima@akuafodwa.com', age: 6, views: 15,
    grade: 'Grade A, handpicked', packaging: '50kg bag', harvestInfo: 'Current season, well dried', minOrder: 5, fulfillment: 'PICKUP',
    desc: 'Red kidney beans (Neri) from Wa. Handpicked and well dried. Cooks soft and tasty. Ideal for traders and chop bar owners.',
  },
  {
    title: 'Groundnuts (Unshelled)', img: '/uploads/seed/groundnut.jpg', cat: 'grains-legumes', region: 'Northern', city: 'Savelugu',
    price: 620, unit: 'bag', quantity: 40, seller: 'kofi@akuafodwa.com', age: 7, views: 21,
    packaging: '50kg bag', harvestInfo: 'Freshly harvested this season', minOrder: 5, fulfillment: 'PICKUP',
    desc: 'Fresh groundnuts still in shells from Savelugu farms. High oil content, very sweet. Perfect for paste processors and traders.',
  },
  {
    title: 'Fresh Tomatoes (Crate)', img: '/uploads/seed/tomato.jpg', cat: 'vegetables', region: 'Ashanti', city: 'Kumasi',
    price: 480, unit: 'crate', quantity: 25, seller: 'akua@akuafodwa.com', age: 1, views: 38,
    grade: 'Fresh market grade, big sizes', packaging: 'Wooden crate', harvestInfo: 'Harvested this morning', fulfillment: 'BOTH',
    desc: 'Firm, red market tomatoes freshly harvested. Big sizes, minimal spoilage, sorted personally. Come and pick, or we deliver within Kumasi.',
  },
  {
    title: 'Hot Pepper (Legon 18)', img: '/uploads/seed/pepper.jpg', cat: 'vegetables', region: 'Bono', city: 'Sunyani',
    price: 400, unit: 'crate', quantity: 18, seller: 'yaw@akuafodwa.com', age: 2, views: 26,
    packaging: 'Wooden crate', harvestInfo: 'Harvested this morning', fulfillment: 'PICKUP',
    desc: 'Legon 18 hot pepper, very fresh, spicy and shiny. Great for shito makers and restaurants. Harvested this morning, sorted and crated.',
  },
  {
    title: 'Fresh Okra (Basket)', img: '/uploads/seed/okra.jpg', cat: 'vegetables', region: 'Central', city: 'Cape Coast',
    price: 320, unit: 'basket', quantity: 22, seller: 'abena@akuafodwa.com', age: 1, views: 19,
    harvestInfo: 'Harvested daily', productionMethod: 'Conventional', fulfillment: 'PICKUP',
    desc: 'Tender young okra, harvested daily. No tough ones inside, I pick them myself. Ideal for market women and food vendors.',
  },
  {
    title: 'Garden Eggs (Aubergine)', img: '/uploads/seed/garden-eggs.jpg', cat: 'vegetables', region: 'Eastern', city: 'Suhum',
    price: 350, unit: 'basket', quantity: 30, seller: 'esi@akuafodwa.com', age: 3, views: 22,
    harvestInfo: 'Current season', fulfillment: 'PICKUP',
    desc: 'Fresh garden eggs from Suhum. Crisp and slightly bitter, exactly as it should be. Bulk buyers get a small discount.',
  },
  {
    title: 'Red Onions (50kg Bag)', img: '/uploads/seed/onion.jpg', cat: 'vegetables', region: 'Bono', city: 'Sunyani',
    price: 550, unit: 'bag', quantity: 35, seller: 'yaw@akuafodwa.com', age: 4, views: 30,
    packaging: '50kg mesh bag, well cured', minOrder: 5, fulfillment: 'BOTH',
    desc: 'Well-cured red onions with tight skins. Stores well for weeks. Sold per 50kg bag from my store in Sunyani.',
  },
  {
    title: 'Green Cabbage (Big Heads)', img: '/uploads/seed/cabbage.jpg', cat: 'vegetables', region: 'Eastern', city: 'Akropong',
    price: 10, unit: 'head', quantity: 400, seller: 'esi@akuafodwa.com', age: 2, views: 25,
    grade: 'Large, compact heads', harvestInfo: 'Cool hills of Akuapem, current season', minOrder: 20, fulfillment: 'PICKUP',
    desc: 'Large, compact cabbage heads from the cool hills of Akuapem. Perfect for salads, waakye sellers and hotels. Sold per head.',
  },
  {
    title: 'Smooth Cayenne Pineapples', img: '/uploads/seed/pineapple.jpg', cat: 'fruits', region: 'Central', city: 'Elmina',
    price: 15, unit: 'piece', quantity: 600, seller: 'abena@akuafodwa.com', age: 1, views: 44,
    grade: 'Golden ripe, sugar tested', harvestInfo: 'Harvested to order', productionMethod: 'Conventional', minOrder: 50, fulfillment: 'BOTH',
    desc: 'Sweet, juicy smooth cayenne pineapples grown near Elmina. Golden inside, sugar content on point. Sold per piece, bulk price negotiable.',
  },
  {
    title: 'Ripe Mangoes (Small Crate)', img: '/uploads/seed/mango.jpg', cat: 'fruits', region: 'Volta', city: 'Keta',
    price: 240, unit: 'crate', quantity: 15, seller: 'adjoa@akuafodwa.com', age: 2, views: 33,
    packaging: 'Small crate, cushioned', harvestInfo: 'Tree ripened, no chemical ripening', fulfillment: 'PICKUP',
    desc: 'Sweet Pawi mangoes, tree-ripened with no chemical ripening. Handle with care, they are ready to eat now. Small crates for easy transport.',
  },
  {
    title: 'Fresh Bananas (Bunch)', img: '/uploads/seed/banana.jpg', cat: 'fruits', region: 'Western', city: 'Takoradi',
    price: 60, unit: 'bunch', quantity: 40, seller: 'kojo@akuafodwa.com', age: 3, views: 20,
    harvestInfo: 'Cut fresh on order', fulfillment: 'PICKUP',
    desc: 'Fresh green bunches of sweet bananas. We can ripen them for you on request. Ideal for retailers and juice makers.',
  },
  {
    title: 'Pawpaw (Solo Sunrise)', img: '/uploads/seed/papaya.jpg', cat: 'fruits', region: 'Eastern', city: 'Koforidua',
    price: 8, unit: 'piece', quantity: 300, seller: 'esi@akuafodwa.com', age: 4, views: 17,
    grade: 'Firm-ripe at picking', harvestInfo: 'Picked at firm-ripe stage so they travel well', fulfillment: 'PICKUP',
    desc: 'Solo Sunrise pawpaw, small and sweet with deep orange flesh. Picked at firm-ripe stage so they travel well.',
  },
  {
    title: 'Sweet Oranges (100 per Bag)', img: '/uploads/seed/orange.jpg', cat: 'fruits', region: 'Bono', city: 'Sunyani',
    price: 420, unit: 'bag', quantity: 50, seller: 'yaw@akuafodwa.com', age: 5, views: 28,
    packaging: 'Mesh bag of about 100 pieces', minOrder: 5, fulfillment: 'BOTH',
    desc: 'Juicy sweet oranges, about 100 pieces per bag. Perfect for juice sellers and hawking. Prices drop for 10+ bags.',
  },
  {
    title: 'Plantain Bunches (Apantu)', img: '/uploads/seed/plantain.jpg', cat: 'fruits', region: 'Ashanti', city: 'Kumasi',
    price: 75, unit: 'bunch', quantity: 90, seller: 'akua@akuafodwa.com', age: 1, views: 35,
    grade: 'Medium ripe', harvestInfo: 'Freshly cut, clean hands of fruit', fulfillment: 'PICKUP',
    desc: 'Big apantu plantain bunches, medium ripe, perfect for kelewele and frying. Freshly cut with clean hands of fruit. Come and select your bunches.',
  },
  {
    title: 'Dried Cocoa Beans (Current Season)', img: '/uploads/seed/cocoa.jpg', cat: 'cash-crops', region: 'Western North', city: 'Sefwi Wiawso',
    price: 3100, unit: 'bag', quantity: 28, seller: 'kojo@akuafodwa.com', age: 6, views: 47,
    grade: 'Well fermented, tested cutaway', packaging: '63.5kg bag', harvestInfo: 'Current season', minOrder: 5, fulfillment: 'PICKUP', negotiable: true,
    desc: 'Well-fermented and dried cocoa beans from Sefwi. Bag count and quality tested. Serious buyers only, samples available at the warehouse.',
  },
  {
    title: 'Raw Cashew Nuts (RCN)', img: '/uploads/seed/cashew.jpg', cat: 'cash-crops', region: 'Bono', city: 'Dormaa Ahenkro',
    price: 1150, unit: 'bag', quantity: 22, seller: 'yaw@akuafodwa.com', age: 8, views: 36,
    packaging: '80kg bag', harvestInfo: 'This season RCN, high KOR', minOrder: 10, fulfillment: 'PICKUP',
    desc: 'This season raw cashew nuts from Dormaa, high KOR. Warehouse samples available on request before purchase.',
  },
  {
    title: 'Live Broiler Chickens (Table Size)', img: '/uploads/seed/chicken.jpg', cat: 'poultry-eggs', region: 'Ashanti', city: 'Kumasi',
    price: 95, unit: 'live bird', quantity: 150, seller: 'akua@akuafodwa.com', age: 1, views: 52,
    grade: 'Table size, about 2kg each', harvestInfo: 'Fully vaccinated, 6 to 7 weeks old', productionMethod: 'Conventional', minOrder: 10, fulfillment: 'BOTH',
    desc: 'Healthy table-size broilers, about 2kg each. Vaccinated and well fed. Slaughtered on request at no extra cost. Come and select your birds.',
  },
  {
    title: 'Fresh Eggs (Crate of 30)', img: '/uploads/seed/eggs.jpg', cat: 'poultry-eggs', region: 'Greater Accra', city: 'Tema',
    price: 68, unit: 'crate', quantity: 80, seller: 'kwame@akuafodwa.com', age: 1, views: 61,
    packaging: 'Crate of 30', harvestInfo: 'Collected daily', minOrder: 10, fulfillment: 'DELIVERY',
    desc: 'Fresh brown eggs collected daily from our Tema farm. Strong shells, uniform sizes. Delivery available within Tema and Accra.',
  },
  {
    title: 'Guinea Fowls (Live)', img: '/uploads/seed/guinea-fowl.jpg', cat: 'poultry-eggs', region: 'Upper East', city: 'Bolgatanga',
    price: 130, unit: 'live bird', quantity: 60, seller: 'fatima@akuafodwa.com', age: 5, views: 24,
    harvestInfo: 'Adult birds, strong and hardy', fulfillment: 'PICKUP',
    desc: 'Strong local guinea fowls from the north. Hard birds that travel well. Perfect for festive season stock. Book ahead for large numbers.',
  },
  {
    title: 'Live Goats (WAD Breed)', img: '/uploads/seed/goat.jpg', cat: 'livestock', region: 'Northern', city: 'Tamale',
    price: 850, unit: 'head', quantity: 24, seller: 'kofi@akuafodwa.com', age: 2, views: 39,
    grade: '1.5 to 2 years old', harvestInfo: 'Healthy stock, shiny coats', productionMethod: 'Free range', minOrder: 2, fulfillment: 'PICKUP',
    desc: 'Healthy West African Dwarf goats, 1.5 to 2 years old. Clean teeth, shiny coats. Come and select your animals yourself at the farm.',
  },
  {
    title: 'Djallonké Sheep', img: '/uploads/seed/sheep.jpg', cat: 'livestock', region: 'Upper East', city: 'Navrongo',
    price: 1100, unit: 'head', quantity: 18, seller: 'fatima@akuafodwa.com', age: 3, views: 29,
    harvestInfo: 'Trypanotolerant breed, hardy', productionMethod: 'Free range', minOrder: 2, fulfillment: 'PICKUP',
    desc: 'Tried-and-true Djallonké sheep, resistant and beautiful. Ideal for breeding or festive sales. Vet records available on request.',
  },
  {
    title: 'Pigs (Live, Butcher Weight)', img: '/uploads/seed/pig.jpg', cat: 'livestock', region: 'Ashanti', city: 'Obuasi',
    price: 1600, unit: 'head', quantity: 10, seller: 'akua@akuafodwa.com', age: 7, views: 34,
    harvestInfo: 'About 80 to 90kg live weight', productionMethod: 'Conventional', fulfillment: 'PICKUP',
    desc: 'Well-raised pigs at butcher weight, around 80 to 90kg live. Fed on quality feed, no swill. Transport can be arranged within Ashanti.',
  },
  {
    title: 'Fresh Tilapia (Pond Raised)', img: '/uploads/seed/tilapia.jpg', cat: 'fish-aquaculture', region: 'Volta', city: 'Akosombo',
    price: 45, unit: 'kg', quantity: 400, seller: 'adjoa@akuafodwa.com', age: 1, views: 41,
    grade: '400g and above', harvestInfo: 'Harvested to order', productionMethod: 'Conventional', minOrder: 20, fulfillment: 'BOTH',
    desc: 'Fresh tilapia from our ponds near Akosombo, harvested to order. Sizes from 400g up. Ice-packed for transport.',
  },
  {
    title: 'Smoked Mackerel (Box)', img: '/uploads/seed/mackerel.jpg', cat: 'fish-aquaculture', region: 'Western', city: 'Takoradi',
    price: 380, unit: 'box', quantity: 20, seller: 'kojo@akuafodwa.com', age: 4, views: 26,
    packaging: 'Export box, well dried smoke', minOrder: 5, fulfillment: 'BOTH',
    desc: 'Well-smoked mackerel from Takoradi smokehouses. Golden dry smoke that keeps for months. Traders welcome, come and taste.',
  },
  {
    title: 'Pure Palm Oil (Zomi, 25L)', img: '/uploads/seed/palm-oil.jpg', cat: 'processed-foods', region: 'Western', city: 'Axim',
    price: 55, unit: 'litre', quantity: 500, seller: 'kojo@akuafodwa.com', age: 5, views: 37,
    packaging: '25L containers or per litre', productionMethod: 'Conventional', minOrder: 25, fulfillment: 'BOTH',
    desc: 'Traditional zomi palm oil, pounded and smoked the proper way. Deep red and aromatic. Sold per litre, minimum 25 litres.',
  },
  {
    title: 'Natural Forest Honey (Raw)', img: '/uploads/seed/honey.jpg', cat: 'processed-foods', region: 'Bono', city: 'Berekum',
    price: 120, unit: 'litre', quantity: 200, seller: 'yaw@akuafodwa.com', age: 6, views: 31,
    packaging: '30kg jerrycan or per litre', productionMethod: 'Wild harvested', minOrder: 10, fulfillment: 'BOTH',
    desc: 'Raw unprocessed honey from Berekum forest beekeepers. Nothing added, nothing removed. Sweet with real forest notes.',
  },
  {
    title: 'White Gari (Premium)', img: '/uploads/seed/gari.jpg', cat: 'processed-foods', region: 'Volta', city: 'Kpando',
    price: 580, unit: 'bag', quantity: 35, seller: 'adjoa@akuafodwa.com', age: 9, views: 23,
    grade: 'Premium, fine grain', packaging: '50kg bag', minOrder: 5, fulfillment: 'BOTH',
    desc: 'Crisp premium white gari from Kpando processors. Fine grain, well roasted. Wholesale price for 10+ bags.',
  },
  {
    title: 'Fresh Ginger', img: '/uploads/seed/ginger.jpg', cat: 'vegetables', region: 'Ashanti', city: 'Kumasi',
    price: 18, unit: 'kg', quantity: 350, seller: 'akua@akuafodwa.com', age: 2, views: 27,
    harvestInfo: 'Freshly dug and washed', minOrder: 20, fulfillment: 'BOTH',
    desc: 'Aromatic fresh ginger, freshly dug and washed. Strong flavour, a little goes a long way. Sold per kg.',
  },
  {
    title: 'Day-Old Chicks (Broiler)', img: '/uploads/seed/day-old-chicks.jpg', cat: 'seeds-inputs', region: 'Greater Accra', city: 'Accra',
    price: 12, unit: 'piece', quantity: 1000, seller: 'kwame@akuafodwa.com', age: 3, views: 19,
    harvestInfo: 'Vaccinated against Marek\u2019s', minOrder: 50, fulfillment: 'DELIVERY',
    desc: 'Strong broiler day-old chicks from a certified hatchery. Uniform sizes, vaccinated against Marek\u2019s. Book ahead for large orders.',
  },
  {
    title: 'NPK Fertilizer (50kg)', img: '/uploads/seed/fertilizer.jpg', cat: 'seeds-inputs', region: 'Greater Accra', city: 'Accra',
    price: 950, unit: 'bag', quantity: 70, seller: 'kwame@akuafodwa.com', age: 10, views: 22,
    grade: 'NPK 15-15-15 compound', packaging: '50kg sealed bag', minOrder: 10, fulfillment: 'BOTH', negotiable: true,
    desc: 'Original NPK 15-15-15 compound fertilizer in 50kg bags. Sealed from factory. Farmers\u2019 groups get priority pricing.',
  },
]

export async function runSeed(db: PrismaClient | Prisma.TransactionClient) {
  console.log('Seeding AkuafoDwa...')

  await db.auditLog.deleteMany()
  await db.offerMessage.deleteMany()
  await db.review.deleteMany()
  await db.offerThread.deleteMany()
  await db.favorite.deleteMany()
  await db.listingImage.deleteMany()
  await db.listing.deleteMany()
  await db.session.deleteMany()
  await db.user.deleteMany()
  await db.category.deleteMany()

  const catIds: Record<string, string> = {}
  for (const c of DEFAULT_CATEGORIES) {
    const cat = await db.category.create({ data: { ...c, isDefault: true } })
    catIds[c.slug] = cat.id
  }
  console.log(`OK ${DEFAULT_CATEGORIES.length} categories`)

  const userIds: Record<string, string> = {}
  for (const u of USERS) {
    const user = await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        phone: u.phone,
        passwordHash: hashPassword(u.pass),
        role: u.role ?? 'USER',
        sellerType: u.sellerType ?? null,
        businessName: u.businessName ?? null,
        bio: u.bio ?? null,
        identityStatus: u.identityStatus ?? 'UNVERIFIED',
        verifiedAt: u.identityStatus === 'VERIFIED' ? daysAgo(30) : null,
        createdAt: daysAgo(40 + Math.floor(Math.random() * 30)),
      },
    })
    userIds[u.email] = user.id
  }
  console.log(`OK ${USERS.length} users`)

  const createdListings: { id: string; slug: string }[] = []
  for (const l of LISTINGS) {
    const listing = await db.listing.create({
      data: {
        title: l.title,
        description: l.desc,
        price: l.price,
        unit: l.unit,
        quantity: l.quantity,
        region: l.region,
        city: l.city,
        priceNegotiable: l.negotiable !== false,
        grade: l.grade ?? null,
        packaging: l.packaging ?? null,
        harvestInfo: l.harvestInfo ?? null,
        productionMethod: l.productionMethod ?? null,
        minOrder: l.minOrder ?? null,
        fulfillment: l.fulfillment ?? 'PICKUP',
        views: l.views,
        createdAt: daysAgo(l.age),
        sellerId: userIds[l.seller],
        categoryId: catIds[l.cat],
        images: { create: [{ url: l.img, sortOrder: 0 }] },
      },
    })
    createdListings.push({ id: listing.id, slug: l.img.split('/').pop()!.replace('.jpg', '') })
  }
  console.log(`OK ${createdListings.length} listings`)

  const bySlug = (slug: string) => createdListings.find((l) => l.slug === slug)!
  const buyer = userIds['kwame@akuafodwa.com']
  const now = Date.now()

  // Demo thread 1: Kwame buys Akua's tomatoes -> COMPLETED + review
  {
    const t = bySlug('tomato')
    const thread = await db.offerThread.create({
      data: {
        listingId: t.id,
        buyerId: buyer,
        sellerId: userIds['akua@akuafodwa.com'],
        status: 'COMPLETED',
        createdAt: daysAgo(2),
        updatedAt: new Date(now - 12 * 3600 * 1000),
      },
    })
    const msgs = [
      { senderId: null, kind: 'SYSTEM', body: 'Offer conversation started for "Fresh Tomatoes (Crate)".', ago: 2 },
      { senderId: buyer, kind: 'OFFER', quantity: 10, price: 450, body: 'Good morning! I need 10 crates for my store at Kejetia. Can you do 450 per crate?', ago: 2 },
      { senderId: userIds['akua@akuafodwa.com'], kind: 'MESSAGE', body: 'Akwaaba! The tomatoes are fresh from this morning\u2019s harvest. 450 is a little below my asking, I can do 470.', ago: 1.8 },
      { senderId: buyer, kind: 'OFFER', quantity: 10, price: 460, body: 'Let\u2019s meet in the middle at 460. I will come for them myself tomorrow.', ago: 1.6 },
      { senderId: userIds['akua@akuafodwa.com'], kind: 'MESSAGE', body: 'Okay, 460 works. Pick up before 10am so the sun doesn\u2019t touch them.', ago: 1.5 },
      { senderId: userIds['akua@akuafodwa.com'], kind: 'OFFER', quantity: 10, price: 460, body: 'Confirming my acceptance price: 460 per crate, 10 crates.', ago: 1.45 },
    ]
    for (const m of msgs) {
      const { ago, ...rest } = m
      await db.offerMessage.create({
        data: { ...rest, threadId: thread.id, createdAt: new Date(now - ago * 24 * 3600 * 1000) },
      })
    }
    await db.offerMessage.create({
      data: { threadId: thread.id, senderId: null, kind: 'SYSTEM', body: 'Deal agreed! Contact details have been shared below. Please arrange payment and delivery together.', createdAt: new Date(now - 1.4 * 24 * 3600 * 1000) },
    })
    await db.offerMessage.create({
      data: { threadId: thread.id, senderId: null, kind: 'SYSTEM', body: 'Deal completed! The buyer can now rate the seller based on this transaction.', createdAt: new Date(now - 12 * 3600 * 1000) },
    })
    await db.review.create({
      data: {
        threadId: thread.id,
        sellerId: userIds['akua@akuafodwa.com'],
        buyerId: buyer,
        rating: 5,
        comment: 'Very fresh tomatoes and honest dealing. Picked them up at the farm, will buy again!',
        createdAt: new Date(now - 10 * 3600 * 1000),
      },
    })
  }

  // Demo thread 2: Abena negotiates Kofi's goats -> NEGOTIATING
  {
    const t = bySlug('goat')
    const thread = await db.offerThread.create({
      data: {
        listingId: t.id,
        buyerId: userIds['abena@akuafodwa.com'],
        sellerId: userIds['kofi@akuafodwa.com'],
        status: 'NEGOTIATING',
        createdAt: daysAgo(1),
        updatedAt: new Date(now - 3 * 3600 * 1000),
      },
    })
    const msgs = [
      { senderId: null, kind: 'SYSTEM', body: 'Offer conversation started for "Live Goats (WAD Breed)".', ago: 1 },
      { senderId: userIds['abena@akuafodwa.com'], kind: 'OFFER', quantity: 3, price: 780, body: 'I want 3 females for breeding. 780 per head if I take all three?', ago: 1 },
      { senderId: userIds['kofi@akuafodwa.com'], kind: 'MESSAGE', body: 'The females are strong from good stock. 800 is my best price, you are welcome to inspect them at the farm first.', ago: 0.6 },
      { senderId: userIds['abena@akuafodwa.com'], kind: 'MESSAGE', body: 'Can you do 790? I can come this Friday with my transport.', ago: 0.12 },
    ]
    for (const m of msgs) {
      const { ago, ...rest } = m
      await db.offerMessage.create({
        data: { ...rest, threadId: thread.id, createdAt: new Date(now - ago * 24 * 3600 * 1000) },
      })
    }
  }

  // Demo thread 3: Kwame offers on Yaw's maize -> OPEN (fresh)
  {
    const t = bySlug('maize')
    const thread = await db.offerThread.create({
      data: {
        listingId: t.id,
        buyerId: buyer,
        sellerId: userIds['yaw@akuafodwa.com'],
        status: 'OPEN',
        createdAt: new Date(now - 4 * 3600 * 1000),
        updatedAt: new Date(now - 4 * 3600 * 1000),
      },
    })
    await db.offerMessage.create({
      data: { threadId: thread.id, senderId: null, kind: 'SYSTEM', body: 'Offer conversation started for "White Maize (Dried and Cleaned)".', createdAt: new Date(now - 4 * 3600 * 1000) },
    })
    await db.offerMessage.create({
      data: { threadId: thread.id, senderId: buyer, kind: 'OFFER', quantity: 20, price: 350, body: 'I will take 20 bags at 350 per bag. Can load this week.', createdAt: new Date(now - 4 * 3600 * 1000) },
    })
  }

  // Favorites (Kwame saves a few)
  for (const slug of ['yam', 'tilapia', 'honey']) {
    await db.favorite.create({
      data: { userId: buyer, listingId: bySlug(slug).id },
    })
  }

  console.log('Seed complete! Demo accounts:')
  console.log('  akua@akuafodwa.com / demo1234 (farmer, verified)')
  console.log('  kwame@akuafodwa.com / demo1234 (buyer)')
  console.log('  admin@akuafodwa.com / ' + SEED_ADMIN_PASSWORD + ' (admin)')
}


