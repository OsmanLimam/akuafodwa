/*
 * AkuafoDwa string catalog.
 * English is the source of truth. Twi values were transcribed and approved by the
 * project owner (numbered list 1 to 66). Keys marked "keep English" in that list
 * intentionally have no Twi value and fall back to English. Any key without a Twi
 * value also falls back, so untranslated app-specific copy stays correct.
 */

export type Lang = 'en' | 'tw'

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'tw', label: 'Twi', short: 'TW' },
]

const en = {
  // Header / navigation
  browse: 'Browse',
  sell_produce: 'Sell produce',
  my_listings: 'My listings',
  offers: 'Offers',
  saved: 'Saved',
  sign_in: 'Sign in',
  sign_out: 'Sign out',
  create_account: 'Create account',
  my_profile: 'My profile',
  admin_dashboard: 'Admin dashboard',
  install_app: 'Install app',
  open_menu: 'Open menu',

  // Hero / home
  hero_line1: 'Fresh from the farm,',
  hero_line2: 'straight to your market.',
  hero_body:
    'Yam, maize, cocoa, tilapia, live goats and more, listed by farmers and traders across all 16 regions. Make an offer, negotiate, deal. No middlemen taking your cut.',
  search_placeholder: 'Search yam, tomatoes, goats, cocoa…',
  search: 'Search',
  live_listings: 'live listings',
  regions_covered: '16 regions covered',
  free_to_list: 'Free to list',
  fresh_on_the_market: 'Fresh on the market',
  filters: 'Filters',
  newest_first: 'Newest first',
  all_produce: 'All produce',

  // Listing card / detail
  make_an_offer: 'Make an offer',
  save: 'Save',
  saved_short: 'Saved',
  sold_out: 'Sold out',
  quantity_available: 'Quantity available',
  minimum_order: 'Minimum order',
  location: 'Location',
  views: 'Views',
  listed: 'Listed',
  price_negotiable: 'Price negotiable',
  description: 'Description',
  produce_details: 'Produce details',
  similar_produce: 'Similar produce',
  back_to_market: 'Back to the market',
  per: 'per',

  // Auth
  welcome_back: 'Welcome back to the market',
  join_free: 'Join AkuafoDwa, it’s free',
  email: 'Email',
  password: 'Password',
  full_name: 'Full name',
  phone_number: 'Phone number',
  region: 'Region',
  city_town: 'City / Town',
  farmer: 'Farmer',
  buyer: 'Buyer',
  already_account: 'Already have an account? Sign in',
  new_here: 'New here? Create an account',

  // Offer / deal flow
  your_offer: 'Your offer',
  send_offer: 'Send offer',
  accept_offer: 'Accept offer',
  decline: 'Decline',
  counter_offer: 'Counter offer',
  cancel_deal: 'Cancel deal',
  mark_completed: 'Mark completed',
  leave_review: 'Leave a review',
  deal_agreed: 'Deal agreed',
  negotiating: 'Negotiating',
  open: 'Open',
  completed: 'Completed',
  contacts_unlocked: 'Deal agreed, contacts unlocked:',
  chat_whatsapp: 'Chat on WhatsApp',
  seller: 'Seller',

  // Inbox
  buying: 'Buying',
  selling: 'Selling',
  type_message: 'Type a message…',
  send: 'Send',

  // Common
  welcome: 'Welcome',
  thank_you: 'Thank you',
  loading: 'Loading…',
  no_listings_found: 'No listings found',
  ghana_cedi: 'GH₵',
}

export type StringKey = keyof typeof en

/*
 * Twi transcriptions provided by the project owner. Numbering refers to their list.
 * #9 Create account: use English. #36 Email: keep English. #37 Password: keep English.
 */
const tw: Partial<Record<StringKey, string>> = {
  // Navigation (#1 to #11)
  // #1 Navigation: Akwantuo (reserved for the nav landmark label)
  browse: 'Hwehwɛ nneɛma a ɛwɔ hɔ', // #2
  sell_produce: 'Tɔn kuayɛ ho nneɛma', // #3
  my_listings: 'Me nneɛma a mede ato dwa so', // #4
  offers: 'Nneɛma a wɔde ama', // #5
  saved: 'Nneɛma a wɔakora', // #6
  sign_in: 'Kɔ mu', // #7
  sign_out: 'Fi mu', // #8
  // #9 create_account: keep English
  my_profile: 'Me ho nsɛm', // #10
  install_app: 'Fa app no gu wo fon so', // #11

  // Home / hero (#11 to #19 in the owner's list)
  hero_line1: 'Foforo fi afuo mu,', // #11
  hero_line2: 'kɔ wo dwa so tee..', // #12
  search_placeholder: 'Hwehwɛ borɔdeɛ, ntoosi, mpɔnkye, kookoo...', // #13
  search: 'Hwehwɛ', // #14
  live_listings: 'nneɛma a wɔde agu dwa so mprempren', // #15
  regions_covered: 'Mantam 16 no nyinaa ka ho', // #16
  free_to_list: 'Ɛyɛ kwa sɛ wode adeɛ bɛto dwa so', // #17
  fresh_on_the_market: 'Nneɛma foforo wɔ dwa so', // #18
  all_produce: 'Afuo mu nneɛma nyinaa', // #19

  // Listing page (#20 to #33)
  make_an_offer: 'Bɔ wo boɔ', // #20
  save: 'Kora', // #21
  saved_short: 'Neɛ Wɔakora', // #22
  sold_out: 'Wɔatɔn ne nyinaa', // #23
  quantity_available: 'Dodoɔ a ɛwɔ hɔ', // #24
  minimum_order: 'Dodoɔ a ɛsua koraa a wobɛtɔ', // #25
  location: 'Beaeɛ', // #26
  views: 'Nnipa a wɔabɛhwɛ', // #27
  listed: 'Wɔde agu dwa so', // #28
  price_negotiable: 'Yebetumi abɔ boɔ ho nkɔmmɔ', // #29
  description: 'Nkyerɛkyerɛmu', // #30
  similar_produce: 'Afuo mu nneɛma a ɛte saa wei', // #31
  back_to_market: 'San kɔ dwa so', // #32
  per: 'biara', // #33

  // Account (#34 to #43)
  welcome_back: 'Yɛma wo akwaaba bio wɔ dwa so', // #34
  join_free: 'Bɛka AkuafoDwa ho, ɛyɛ kwa', // #35
  // #36 email: keep English
  // #37 password: keep English
  full_name: 'Wo din nyinaa', // #38
  phone_number: 'Wo fon nɔma', // #39
  region: 'Mantam', // #40
  city_town: 'Kuro / Kuroketewa', // #41
  farmer: 'Okuani', // #42
  buyer: 'Otɔfoɔ', // #43, also #58

  // Deals (#44 to #62)
  your_offer: 'Wo boɔ a wode ama', // #44
  send_offer: 'fa wo boɔ ma', // #45
  accept_offer: 'Gye boɔ no to mu', // #46
  decline: 'Po', // #47
  counter_offer: 'Bɔ boɔ foforɔ', // #48
  cancel_deal: 'Twa apam no mu', // #49
  mark_completed: 'Hyɛ sɛ wɔawie', // #50
  leave_review: 'Kyerɛ wo adwene', // #51
  deal_agreed: 'Wɔapene wɔ apam no so', // #52
  negotiating: 'Wɔrebɔ boɔ ho nkɔmmɔ', // #53
  completed: 'Wɔawie', // #54
  contacts_unlocked: 'Nɔma a wɔabue:', // #55
  chat_whatsapp: 'Di nkɔmmɔ wɔ WhatsApp so', // #56
  seller: 'Ɔtɔnfoɔ', // #57
  buying: 'Ɔretɔ', // #59
  selling: 'Ɔretɔn', // #60
  type_message: 'Twere nsɛm bi...', // #61
  send: 'Fa kɔ', // #62

  // Common (#63 to #66)
  welcome: 'Yɛma wo akwaaba', // #63
  thank_you: 'Meda wo ase', // #64
  loading: 'Rekɔ so...', // #65
  no_listings_found: 'Yɛannhu biribiara', // #66
}

export function translate(lang: Lang, key: StringKey): string {
  if (lang === 'tw') {
    const v = tw[key]
    if (v && v.trim()) return v
  }
  return en[key]
}
