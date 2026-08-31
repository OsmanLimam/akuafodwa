/**
 * V2 in-place update: fixes seed listing images (local files), scrubs em dashes,
 * enriches sellers and listings with the new fields. Run: bun scripts/update-db-v2.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const IMAGE_DIR = '/uploads/seed'

// old title (current DB) -> new listing payload
const UPDATES: Array<{
  matchTitle: string
  title: string
  img: string
  desc: string
  grade?: string
  packaging?: string
  harvestInfo?: string
  productionMethod?: string
  minOrder?: number
  fulfillment?: 'PICKUP' | 'DELIVERY' | 'BOTH'
}> = [
  { matchTitle: 'Pona Yam Tubers — Farm Direct', title: 'Pona Yam Tubers (Farm Direct)', img: `${IMAGE_DIR}/yam.jpg`, grade: 'Grade A, big sizes', packaging: 'Loose tubers, heaped for loading', harvestInfo: 'Harvested this week, main season crop', productionMethod: 'Conventional', minOrder: 10, fulfillment: 'PICKUP', desc: 'Fresh Pona yam straight from our farm at Ejura. Big, firm tubers, great for fufu or boiling. Buyers welcome to inspect and select on site. Bulk discounts from 50 tubers.' },
  { matchTitle: 'Fresh Cassava Roots (For Fufu or Gari)', title: 'Fresh Cassava Roots (For Fufu or Gari)', img: `${IMAGE_DIR}/cassava.jpg`, packaging: '50kg bag', harvestInfo: 'Uprooted on order, 10 to 12 months mature', minOrder: 5, fulfillment: 'PICKUP', desc: 'Well-matured cassava, freshly uprooted. Perfect for fufu flour processors and gari makers. 50kg bags, loaded on your truck or we help you arrange transport. Order ahead so we harvest fresh for you.' },
  { matchTitle: 'Sweet Potatoes — Orange Flesh', title: 'Sweet Potatoes (Orange Flesh)', img: `${IMAGE_DIR}/sweet-potato.jpg`, grade: 'Premium, well cured', harvestInfo: 'Harvested this week', productionMethod: 'Conventional', minOrder: 50, fulfillment: 'BOTH', desc: 'Sweet orange-fleshed variety, freshly harvested this week. Clean, well-cured tubers with long shelf life. Retail and wholesale buyers welcome.' },
  { matchTitle: 'Cocoyam (Mantemesi)', title: 'Cocoyam (Mantemesi)', img: `${IMAGE_DIR}/cocoyam.jpg`, harvestInfo: 'Current season harvest', minOrder: 20, fulfillment: 'PICKUP', desc: 'Fresh mantemesi cocoyam from the Akuapem hills. Smooth texture, ideal for plain boiling or kokonte. Sold per kg, minimum order 20kg.' },
  { matchTitle: 'White Maize — Dried & Cleaned', title: 'White Maize (Dried and Cleaned)', img: `${IMAGE_DIR}/maize.jpg`, grade: 'Grade A', packaging: 'Maxi bag (50kg)', harvestInfo: 'Major season harvest, dried to about 13% moisture', minOrder: 10, fulfillment: 'BOTH', desc: 'Quality dried white maize from Techiman, the food basket of Ghana. Well dried, cleaned and free of debris. Immediate delivery from warehouse. Sample available before you buy.' },
  { matchTitle: 'Local Perfumed Rice (Aromatic)', title: 'Local Perfumed Rice (Aromatic)', img: `${IMAGE_DIR}/rice.jpg`, packaging: '50kg bag', harvestInfo: 'Last milling, this season paddy', productionMethod: 'Conventional', minOrder: 5, fulfillment: 'PICKUP', desc: 'Locally grown perfumed rice from the Northern rice belt. Milled and polished, stone-free. Once you cook it you will always come back. 50kg bags.' },
  { matchTitle: 'Red Beans (Neri Variety)', title: 'Red Beans (Neri Variety)', img: `${IMAGE_DIR}/beans.jpg`, grade: 'Grade A, handpicked', packaging: '50kg bag', harvestInfo: 'Current season, well dried', minOrder: 5, fulfillment: 'PICKUP', desc: 'Red kidney beans (Neri) from Wa. Handpicked and well dried. Cooks soft and tasty. Ideal for traders and chop bar owners.' },
  { matchTitle: 'Groundnuts — Unshelled', title: 'Groundnuts (Unshelled)', img: `${IMAGE_DIR}/groundnut.jpg`, packaging: '50kg bag', harvestInfo: 'Freshly harvested this season', minOrder: 5, fulfillment: 'PICKUP', desc: 'Fresh groundnuts still in shells from Savelugu farms. High oil content, very sweet. Perfect for paste processors and traders.' },
  { matchTitle: 'Fresh Tomatoes — Crate', title: 'Fresh Tomatoes (Crate)', img: `${IMAGE_DIR}/tomato.jpg`, grade: 'Fresh market grade, big sizes', packaging: 'Wooden crate', harvestInfo: 'Harvested this morning', fulfillment: 'BOTH', desc: 'Firm, red market tomatoes freshly harvested. Big sizes, minimal spoilage, sorted personally. Come and pick, or we deliver within Kumasi.' },
  { matchTitle: 'Hot Pepper (Legon 18)', title: 'Hot Pepper (Legon 18)', img: `${IMAGE_DIR}/pepper.jpg`, packaging: 'Wooden crate', harvestInfo: 'Harvested this morning', fulfillment: 'PICKUP', desc: 'Legon 18 hot pepper, very fresh, spicy and shiny. Great for shito makers and restaurants. Harvested this morning, sorted and crated.' },
  { matchTitle: 'Fresh Okra — Basket', title: 'Fresh Okra (Basket)', img: `${IMAGE_DIR}/okra.jpg`, harvestInfo: 'Harvested daily', productionMethod: 'Conventional', fulfillment: 'PICKUP', desc: 'Tender young okra, harvested daily. No tough ones inside, I pick them myself. Ideal for market women and food vendors.' },
  { matchTitle: 'Garden Eggs (Aubergine)', title: 'Garden Eggs (Aubergine)', img: `${IMAGE_DIR}/garden-eggs.jpg`, harvestInfo: 'Current season', fulfillment: 'PICKUP', desc: 'Fresh garden eggs from Suhum. Crisp and slightly bitter, exactly as it should be. Bulk buyers get a small discount.' },
  { matchTitle: 'Red Onions — 50kg Bag', title: 'Red Onions (50kg Bag)', img: `${IMAGE_DIR}/onion.jpg`, packaging: '50kg mesh bag, well cured', minOrder: 5, fulfillment: 'BOTH', desc: 'Well-cured red onions with tight skins. Stores well for weeks. Sold per 50kg bag from my store in Sunyani.' },
  { matchTitle: 'Green Cabbage — Big Heads', title: 'Green Cabbage (Big Heads)', img: `${IMAGE_DIR}/cabbage.jpg`, grade: 'Large, compact heads', harvestInfo: 'Cool hills of Akuapem, current season', minOrder: 20, fulfillment: 'PICKUP', desc: 'Large, compact cabbage heads from the cool hills of Akuapem. Perfect for salads, waakye sellers and hotels. Sold per head.' },
  { matchTitle: 'Smooth Cayenne Pineapples', title: 'Smooth Cayenne Pineapples', img: `${IMAGE_DIR}/pineapple.jpg`, grade: 'Golden ripe, sugar tested', harvestInfo: 'Harvested to order', productionMethod: 'Conventional', minOrder: 50, fulfillment: 'BOTH', desc: 'Sweet, juicy smooth cayenne pineapples grown near Elmina. Golden inside, sugar content on point. Sold per piece, bulk price negotiable.' },
  { matchTitle: 'Ripe Mangoes — Small Crate', title: 'Ripe Mangoes (Small Crate)', img: `${IMAGE_DIR}/mango.jpg`, packaging: 'Small crate, cushioned', harvestInfo: 'Tree ripened, no chemical ripening', fulfillment: 'PICKUP', desc: 'Sweet Pawi mangoes, tree-ripened with no chemical ripening. Handle with care, they are ready to eat now. Small crates for easy transport.' },
  { matchTitle: 'Fresh Bananas — Bunch', title: 'Fresh Bananas (Bunch)', img: `${IMAGE_DIR}/banana.jpg`, harvestInfo: 'Cut fresh on order', fulfillment: 'PICKUP', desc: 'Fresh green bunches of sweet bananas. We can ripen them for you on request. Ideal for retailers and juice makers.' },
  { matchTitle: 'Pawpaw (Papaya) — Solo Sunrise', title: 'Pawpaw (Solo Sunrise)', img: `${IMAGE_DIR}/papaya.jpg`, grade: 'Firm-ripe at picking', harvestInfo: 'Picked at firm-ripe stage so they travel well', fulfillment: 'PICKUP', desc: 'Solo Sunrise pawpaw, small and sweet with deep orange flesh. Picked at firm-ripe stage so they travel well.' },
  { matchTitle: 'Sweet Oranges — 100 per Bag', title: 'Sweet Oranges (100 per Bag)', img: `${IMAGE_DIR}/orange.jpg`, packaging: 'Mesh bag of about 100 pieces', minOrder: 5, fulfillment: 'BOTH', desc: 'Juicy sweet oranges, about 100 pieces per bag. Perfect for juice sellers and hawking. Prices drop for 10+ bags.' },
  { matchTitle: 'Plantain Bunches — Apantu', title: 'Plantain Bunches (Apantu)', img: `${IMAGE_DIR}/plantain.jpg`, grade: 'Medium ripe', harvestInfo: 'Freshly cut, clean hands of fruit', fulfillment: 'PICKUP', desc: 'Big apantu plantain bunches, medium ripe, perfect for kelewele and frying. Freshly cut with clean hands of fruit. Come and select your bunches.' },
  { matchTitle: 'Dried Cocoa Beans — Current Season', title: 'Dried Cocoa Beans (Current Season)', img: `${IMAGE_DIR}/cocoa.jpg`, grade: 'Well fermented, tested cutaway', packaging: '63.5kg bag', harvestInfo: 'Current season', minOrder: 5, fulfillment: 'PICKUP', desc: 'Well-fermented and dried cocoa beans from Sefwi. Bag count and quality tested. Serious buyers only, samples available at the warehouse.' },
  { matchTitle: 'Raw Cashew Nuts (RCN)', title: 'Raw Cashew Nuts (RCN)', img: `${IMAGE_DIR}/cashew.jpg`, packaging: '80kg bag', harvestInfo: 'This season RCN, high KOR', minOrder: 10, fulfillment: 'PICKUP', desc: 'This season raw cashew nuts from Dormaa, high KOR. Warehouse samples available on request before purchase.' },
  { matchTitle: 'Live Broiler Chickens — Table Size', title: 'Live Broiler Chickens (Table Size)', img: `${IMAGE_DIR}/chicken.jpg`, grade: 'Table size, about 2kg each', harvestInfo: 'Fully vaccinated, 6 to 7 weeks old', productionMethod: 'Conventional', minOrder: 10, fulfillment: 'BOTH', desc: 'Healthy table-size broilers, about 2kg each. Vaccinated and well fed. Slaughtered on request at no extra cost. Come and select your birds.' },
  { matchTitle: 'Fresh Eggs — Crate of 30', title: 'Fresh Eggs (Crate of 30)', img: `${IMAGE_DIR}/eggs.jpg`, packaging: 'Crate of 30', harvestInfo: 'Collected daily', minOrder: 10, fulfillment: 'DELIVERY', desc: 'Fresh brown eggs collected daily from our Tema farm. Strong shells, uniform sizes. Delivery available within Tema and Accra.' },
  { matchTitle: 'Guinea Fowls — Live', title: 'Guinea Fowls (Live)', img: `${IMAGE_DIR}/guinea-fowl.jpg`, harvestInfo: 'Adult birds, strong and hardy', fulfillment: 'PICKUP', desc: 'Strong local guinea fowls from the north. Hard birds that travel well. Perfect for festive season stock. Book ahead for large numbers.' },
  { matchTitle: 'Live Goats (WAD Breed)', title: 'Live Goats (WAD Breed)', img: `${IMAGE_DIR}/goat.jpg`, grade: '1.5 to 2 years old', harvestInfo: 'Healthy stock, shiny coats', productionMethod: 'Free range', minOrder: 2, fulfillment: 'PICKUP', desc: 'Healthy West African Dwarf goats, 1.5 to 2 years old. Clean teeth, shiny coats. Come and select your animals yourself at the farm.' },
  { matchTitle: 'Djallonké Sheep', title: 'Djallonké Sheep', img: `${IMAGE_DIR}/sheep.jpg`, harvestInfo: 'Trypanotolerant breed, hardy', productionMethod: 'Free range', minOrder: 2, fulfillment: 'PICKUP', desc: 'Tried-and-true Djallonké sheep, resistant and beautiful. Ideal for breeding or festive sales. Vet records available on request.' },
  { matchTitle: 'Pigs — Live, Butcher Weight', title: 'Pigs (Live, Butcher Weight)', img: `${IMAGE_DIR}/pig.jpg`, harvestInfo: 'About 80 to 90kg live weight', productionMethod: 'Conventional', fulfillment: 'PICKUP', desc: 'Well-raised pigs at butcher weight, around 80 to 90kg live. Fed on quality feed, no swill. Transport can be arranged within Ashanti.' },
  { matchTitle: 'Fresh Tilapia — Pond Raised', title: 'Fresh Tilapia (Pond Raised)', img: `${IMAGE_DIR}/tilapia.jpg`, grade: '400g and above', harvestInfo: 'Harvested to order', productionMethod: 'Conventional', minOrder: 20, fulfillment: 'BOTH', desc: 'Fresh tilapia from our ponds near Akosombo, harvested to order. Sizes from 400g up. Ice-packed for transport.' },
  { matchTitle: 'Smoked Mackerel — Box', title: 'Smoked Mackerel (Box)', img: `${IMAGE_DIR}/mackerel.jpg`, packaging: 'Export box, well dried smoke', minOrder: 5, fulfillment: 'BOTH', desc: 'Well-smoked mackerel from Takoradi smokehouses. Golden dry smoke that keeps for months. Traders welcome, come and taste.' },
  { matchTitle: 'Pure Palm Oil (Zomi) — 25L', title: 'Pure Palm Oil (Zomi, 25L)', img: `${IMAGE_DIR}/palm-oil.jpg`, packaging: '25L containers or per litre', productionMethod: 'Conventional', minOrder: 25, fulfillment: 'BOTH', desc: 'Traditional zomi palm oil, pounded and smoked the proper way. Deep red and aromatic. Sold per litre, minimum 25 litres.' },
  { matchTitle: 'Natural Forest Honey — Raw', title: 'Natural Forest Honey (Raw)', img: `${IMAGE_DIR}/honey.jpg`, packaging: '30kg jerrycan or per litre', productionMethod: 'Wild harvested', minOrder: 10, fulfillment: 'BOTH', desc: 'Raw unprocessed honey from Berekum forest beekeepers. Nothing added, nothing removed. Sweet with real forest notes.' },
  { matchTitle: 'White Gari — Premium', title: 'White Gari (Premium)', img: `${IMAGE_DIR}/gari.jpg`, grade: 'Premium, fine grain', packaging: '50kg bag', minOrder: 5, fulfillment: 'BOTH', desc: 'Crisp premium white gari from Kpando processors. Fine grain, well roasted. Wholesale price for 10+ bags.' },
  { matchTitle: 'Fresh Ginger', title: 'Fresh Ginger', img: `${IMAGE_DIR}/ginger.jpg`, harvestInfo: 'Freshly dug and washed', minOrder: 20, fulfillment: 'BOTH', desc: 'Aromatic fresh ginger, freshly dug and washed. Strong flavour, a little goes a long way. Sold per kg.' },
  { matchTitle: 'Day-Old Chicks — Broiler', title: 'Day-Old Chicks (Broiler)', img: `${IMAGE_DIR}/day-old-chicks.jpg`, harvestInfo: 'Vaccinated against Marek\u2019s', minOrder: 50, fulfillment: 'DELIVERY', desc: 'Strong broiler day-old chicks from a certified hatchery. Uniform sizes, vaccinated against Marek\u2019s. Book ahead for large orders.' },
  { matchTitle: 'NPK Fertilizer — 50kg', title: 'NPK Fertilizer (50kg)', img: `${IMAGE_DIR}/fertilizer.jpg`, grade: 'NPK 15-15-15 compound', packaging: '50kg sealed bag', minOrder: 10, fulfillment: 'BOTH', desc: 'Original NPK 15-15-15 compound fertilizer in 50kg bags. Sealed from factory. Farmers\u2019 groups get priority pricing.' },
]

const SELLER_UPDATES: Array<{
  email: string
  sellerType: string
  businessName: string
  bio: string
  identityStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED'
}> = [
  { email: 'akua@akuafodwa.com', sellerType: 'FARMER', businessName: 'Mensah Family Farm', identityStatus: 'VERIFIED', bio: 'Mixed crop farmer near Ejura. We grow yam, tomatoes and ginger, and raise broiler chickens. Farm visits welcome.' },
  { email: 'kwame@akuafodwa.com', sellerType: 'TRADER', businessName: 'Owusu Provisions', identityStatus: 'VERIFIED', bio: 'Trader supplying shops and institutions around Tema and Accra. Buying eggs, grains and fresh produce in bulk.' },
  { email: 'yaw@akuafodwa.com', sellerType: 'WHOLESALER', businessName: 'Boateng Agro Supplies', identityStatus: 'VERIFIED', bio: 'Wholesaler at Sunyani. Maize, onions, oranges and agro inputs in bag quantities. Warehouse pickup any working day.' },
  { email: 'abena@akuafodwa.com', sellerType: 'FARMER', businessName: 'Asante Green Farms', identityStatus: 'VERIFIED', bio: 'Vegetable and pineapple farmer near Cape Coast and Elmina. Everything harvested to order.' },
  { email: 'kofi@akuafodwa.com', sellerType: 'FARMER', businessName: 'Alhassan Farms', identityStatus: 'VERIFIED', bio: 'Northern region farmer. Rice, groundnuts, sweet potatoes and livestock from Tamale and Savelugu.' },
  { email: 'adjoa@akuafodwa.com', sellerType: 'FARMER', businessName: 'Kuma Farms & Processed Foods', identityStatus: 'PENDING', bio: 'Cassava, gari and tilapia from Ho and Akosombo. Verification documents submitted, awaiting review.' },
  { email: 'fatima@akuafodwa.com', sellerType: 'TRADER', businessName: 'Fatima Agro Traders', identityStatus: 'VERIFIED', bio: 'Livestock and beans trader in Bolgatanga and Navrongo. Guinea fowls, sheep and Neri beans.' },
  { email: 'kojo@akuafodwa.com', sellerType: 'PROCESSOR', businessName: 'Annan Smokehouse & Oils', identityStatus: 'VERIFIED', bio: 'Smoked fish, palm oil and honey processing and trading from Takoradi and Axim.' },
  { email: 'esi@akuafodwa.com', sellerType: 'FARMER', businessName: 'Nyarko Hill Farms', identityStatus: 'UNVERIFIED', bio: 'Cocoyam, garden eggs, cabbage and pawpaw from the Akuapem hills. New to AkuafoDwa.' },
]

function scrub(s: string): string {
  return s.replace(/—/g, ', ').replace(/\s*,\s*,/g, ',').replace(/,\s*\./g, '.').replace(/\s+/g, ' ')
}

async function main() {
  console.log('Updating live DB to V2...')

  let imgCount = 0
  for (const u of UPDATES) {
    const listing = await db.listing.findFirst({ where: { title: u.matchTitle } })
    if (!listing) {
      console.log(`  (skip, not found: ${u.matchTitle})`)
      continue
    }
    await db.listingImage.deleteMany({ where: { listingId: listing.id } })
    await db.listingImage.create({ data: { listingId: listing.id, url: u.img, sortOrder: 0 } })
    await db.listing.update({
      where: { id: listing.id },
      data: {
        title: u.title,
        description: u.desc,
        grade: u.grade ?? null,
        packaging: u.packaging ?? null,
        harvestInfo: u.harvestInfo ?? null,
        productionMethod: u.productionMethod ?? null,
        minOrder: u.minOrder ?? null,
        fulfillment: u.fulfillment ?? 'PICKUP',
      },
    })
    imgCount++
  }
  console.log(`OK ${imgCount} listings updated with local images + fields`)

  let sellerCount = 0
  for (const s of SELLER_UPDATES) {
    const res = await db.user.updateMany({
      where: { email: s.email },
      data: {
        sellerType: s.sellerType,
        businessName: s.businessName,
        bio: s.bio,
        identityStatus: s.identityStatus,
        verifiedAt: s.identityStatus === 'VERIFIED' ? new Date() : null,
      },
    })
    sellerCount += res.count
  }
  console.log(`OK ${sellerCount} sellers updated`)

  // Scrub em dashes from any remaining text: listings, messages, reviews, categories.
  const listings = await db.listing.findMany()
  for (const l of listings) {
    if (l.title.includes('—') || l.description.includes('—')) {
      await db.listing.update({
        where: { id: l.id },
        data: { title: scrub(l.title), description: scrub(l.description) },
      })
    }
  }
  const messages = await db.offerMessage.findMany()
  for (const m of messages) {
    if (m.body && m.body.includes('—')) {
      await db.offerMessage.update({ where: { id: m.id }, data: { body: scrub(m.body) } })
    }
  }
  const reviews = await db.review.findMany()
  for (const r of reviews) {
    if (r.comment && r.comment.includes('—')) {
      await db.review.update({ where: { id: r.id }, data: { comment: scrub(r.comment) } })
    }
  }
  console.log('OK em dash scrub complete')

  // Final safety check
  const badImages = await db.listingImage.count({ where: { url: { not: { startsWith: '/uploads/' } } } })
  console.log(badImages === 0 ? 'OK all listing images are local' : `WARNING ${badImages} non-local images remain`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
