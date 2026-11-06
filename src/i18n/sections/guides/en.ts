import { ETSY_HANDBOOK_URL, PINTEREST_CLAIM_URLS, PINTEREST_SHOPIFY_URL, PRODUCT } from './facts';
import type { KeywordResearch, LanguagePack, SeoSection } from './types';

const claim = PINTEREST_CLAIM_URLS.en;

function research(partial: KeywordResearch): KeywordResearch {
  return partial;
}

const etsySections: SeoSection[] = [
  {
    id: 'definition',
    heading: 'What Pinterest marketing means for an Etsy shop',
    paragraphs: [
      'Pinterest marketing for an Etsy seller is the work of publishing vertical images that answer a search, not the work of collecting followers. Someone types a product phrase, Pinterest shows pins, and a click should open the listing that matches the picture. The pin can keep receiving impressions after the week you published it. That is a behavior sellers observe. It is not a promise that any single pin will sell.',
      'Treat the pin as a search result with a picture. The title says what the object is, who it is for, and the occasion. The description adds material, size, and the reason to open the listing. The image shows the product in use or in a clean product shot a buyer can recognize. The destination should be that listing. A click that lands on the shop home makes the buyer search again, and many of them leave.',
      'This guide uses United States spelling. The same page is written for sellers in the United Kingdom, Canada, and Australia. Where the search phrase changes, the section on markets says so. Do not run five English websites. Write the pin itself in the spelling your buyer uses.',
    ],
  },
  {
    id: 'claim',
    heading: 'You cannot claim an Etsy shop as your website',
    paragraphs: [
      'Pinterest’s business help says a website claim requires a domain, subdomain, or subpath you own, plus the ability to edit its source code. The same article says you cannot claim most marketplace stores, and it names Etsy, eBay, and Amazon. A claim is not the same thing as pasting a shop URL into your profile. The profile link is useful. It does not make etsy.com your domain.',
      'Older seller handbook pages and some agency blogs still talk about claiming a shop or turning on rich pins by validating the Etsy domain. When that advice conflicts with the current help article, follow the help article. Product details can still appear on pins that point at in-stock listings when Pinterest already has product data. You do not need a false claim step to start.',
      'If you also sell on your own domain, claim that domain. Leave the Etsy listings as outbound links from pins. One website can be claimed by one Pinterest account, so do not split the same domain across two business profiles.',
    ],
  },
  {
    id: 'markets',
    heading: 'Search language in the US, UK, Canada, and Australia',
    paragraphs: [
      'Buyers do not search in your workshop vocabulary. A US buyer types “personalized leather keychain” or “Thanksgiving hostess gift”. A UK buyer types “personalised” and “jewellery”, and Mother’s Day in the UK falls in March, not on the second Sunday of May. Canada shares a lot of US spelling but Thanksgiving is the second Monday in October, and July 4 is not a local gift event. Australia’s Christmas is in summer, so a “cozy winter candle” pin is the wrong season in December.',
      'Use the buyer’s phrase in the pin title even when this guide uses US spelling. A UK jewellery shop should publish “personalised bridesmaid necklace”, not a translated American headline. A Canadian stationery shop can target “Thanksgiving place cards” in September and “Christmas” later, and should not copy a US November calendar blindly. An Australian seller plans Christmas content while the northern hemisphere is planning autumn.',
      'Secondary phrases are worth a separate pin, not a stuffed title. “Gift for new mom”, “housewarming gift for couple”, and “handmade wedding favor” are three searches. One title that lists all three reads like a tag dump and is harder to match. Make one pin per phrase, with a photo that fits that phrase.',
    ],
    bullets: [
      'United States: personalized, jewelry, fall, Mom, Thanksgiving in late November.',
      'United Kingdom: personalised, jewellery, autumn, Mum, Mother’s Day in March, Boxing Day.',
      'Canada: mixed spelling, Thanksgiving in October, Canada Day rather than July 4.',
      'Australia: Christmas in summer, Mother’s Day in May, avoid northern-hemisphere winter scenes in December.',
    ],
  },
  {
    id: 'listing',
    heading: 'Start from the listing, not from the shop logo',
    paragraphs: [
      'Open the listing you actually want to sell this month. Copy the words a buyer would type, not the poetic name in your brand book. If the listing is “sterling silver initial necklace”, the pin title should lead with that, plus the gift occasion if the photo shows it. Keep the title specific enough that a stranger knows what they will see after the click.',
      'Write the description in sentences. Name the material, who it is for, and the occasion. Mention the constraint that matters, such as “made to order” or “digital file, nothing is shipped”. Do not paste the entire Etsy tag list. Pinterest is matching a description a person can read.',
      'Link the pin to the listing URL, not the shop home and not your Instagram. If the listing sells out or you renew it and the URL changes, update the pin or stop sending people to a dead page. A gift-guide pin may point at a shop section when several listings belong together. A product pin should not.',
    ],
  },
  {
    id: 'examples',
    heading: 'Three original pin drafts you can adapt',
    paragraphs: [
      'These are examples of structure, not phrases you should copy into every shop. Change the material, the recipient, and the occasion so the text describes your listing.',
      'Jewelry, US Mother’s Day: title “Birthstone necklace for Mom, sterling silver”. Description: “A small birthstone necklace in sterling silver, made to order as a Mother’s Day gift. Choose the stone and the chain length on the listing. The photo shows the necklace at the collarbone so you can judge the scale.”',
      'UK wedding stationery: title “Personalised order of the day sign, boho wedding”. Description: “A printed order-of-the-day sign for a boho wedding, personalised with your names and times. The listing shows sizes and whether you receive a digital file or a posted print. Suits a barn or garden ceremony.”',
      'Australian summer Christmas: title “Linen Christmas table runner, coastal holiday”. Description: “A linen table runner in a coastal palette for an Australian Christmas lunch. It is a physical item, posted from Australia. The pin shows it on a timber table in daylight, not in a snowy scene.”',
    ],
  },
  {
    id: 'boards',
    heading: 'Name boards the way buyers search',
    paragraphs: [
      'A board is a folder with a name Pinterest can read. “My makes” and “Shop” waste that field. Use a phrase a buyer searches: “personalized wedding signs”, “handmade ceramic mugs”, “printable budget planners”. Write a one or two sentence description that repeats the real product words and says who the ideas are for.',
      'Two or three boards is enough at the start. One board per product family, plus one board for the gift occasion that actually matches your catalog. A candle shop might keep “soy candles for small rooms” and “housewarming gifts under 30”. A board for every holiday you do not sell for just dilutes the profile.',
      'Cover images should be your own work. Fill a new board with enough of your pins that it does not look empty, then add new designs on a schedule. Saving other people’s pins can show taste, but it does not replace photos of your listings.',
    ],
  },
  {
    id: 'cadence',
    heading: 'A weekly cadence that matches a small shop',
    paragraphs: [
      'Fresh designs matter more than reposting one image every day. Pinterest’s own guidance warns that repeatedly saving the same pins can look like spam. A useful week for a solo seller is a handful of new images, spread across the days you can actually make them, each tied to a listing you can fulfill.',
      'Do not copy a stranger’s “ten pins a day” rule. A shop with eight listings does not have ten honest angles every morning. Three strong pins a week, each with a different crop, headline, or occasion, will teach you more than thirty near-copies. Look at outbound clicks after a few weeks before you raise the volume.',
      'Seasonal pins should exist before the search rises. Wedding stationery for June needs to be on the profile in spring. Christmas designs for the US and UK should be publishing in October. Australia should not follow that northern calendar. Put the date you will publish on a calendar you can see, then make the image before that date, not the night before.',
    ],
    steps: [
      'Pick one listing that is in stock and that you want more visits on.',
      'Write two buyer phrases for it, in the spelling of the country you are targeting.',
      'Make two images: one product-on-white or in-hand, one in a real setting.',
      'Publish them on different days, each with its own title and description.',
      'At the end of the month, keep the phrases that earned outbound clicks and retire the ones that did not.',
    ],
  },
  {
    id: 'measure',
    heading: 'How to read results without a fake benchmark',
    paragraphs: [
      'There is no honest universal click rate for Etsy pins. Niches, prices, and photos differ. Use two sources you control. In Pinterest Analytics, on a business account, watch impressions, saves, and outbound clicks. Outbound clicks are the visits that left Pinterest. Saves mean someone wanted the idea later. Impressions without clicks mean the image was shown and not chosen.',
      'In Etsy Stats, look at where visits came from and which listings received them. Social traffic is grouped with other networks, so a spike is a clue, not a perfect Pinterest receipt. Compare a listing’s visits in the month before you started pinning it with the month after. If clicks on Pinterest rise and the listing visits do not, the pin is probably opening the wrong URL.',
      'Give a new pin more than a weekend. Many sellers see the first useful clicks later, and some pins stay quiet. Judge a batch over a few weeks, then change the title or the image. Do not change five things at once or you will not know which edit helped.',
    ],
  },
  {
    id: 'pingenx',
    heading: 'Where PingenX fits, and where it does not',
    paragraphs: [
      `PingenX is the product at pingenx.io. Inside the app the label is ${PRODUCT.appLabel}. It drafts a pin image, a title, a description, hashtags, and alt text, then schedules publication to one Pinterest account connected with Pinterest’s own authorization screen. It does not connect to Etsy, it does not read your orders, and it does not claim your shop.`,
      `The publisher sends a title of at most ${PRODUCT.titleMaxChars} characters, a description of at most ${PRODUCT.descriptionMaxChars} characters, and alt text of at most ${PRODUCT.altTextMaxChars} characters. If the pin has no board id, publishing uses the first board it can find on the connected account. The niche you type is a prompt for the draft. It does not create a new Pinterest board with that name. Create the boards you want on Pinterest first.`,
      'Hashtags are stored on the pin in PingenX. The publisher does not append that hashtag list to the Pinterest post. Put the words you need Pinterest to read in the title and the description. The manual generator currently saves pins without a destination link. Autopilot puts the single website URL from your Autopilot settings on every pin it creates. For an Etsy catalog, one shop URL on every pin is a weak landing page. Use Autopilot when one URL is the right destination for that batch, and otherwise add the listing link on Pinterest if the published pin has none.',
      `Plans are billed in euros. Starter is €${PRODUCT.plans.starter.priceEur}: ${PRODUCT.plans.starter.pins} pins, ${PRODUCT.plans.starter.aiImages} AI images, and ${PRODUCT.plans.starter.aiTexts} AI texts a month, with manual scheduling and no Autopilot. Pro is €${PRODUCT.plans.pro.priceEur} a month after a ${PRODUCT.trialDays}-day trial: ${PRODUCT.plans.pro.pins} pins, ${PRODUCT.plans.pro.aiImages} AI images, ${PRODUCT.plans.pro.aiTexts} AI texts, and Autopilot up to ${PRODUCT.plans.pro.autopilotPerDay} pins a day. Business is €${PRODUCT.plans.business.priceEur}: ${PRODUCT.plans.business.pins} pins, ${PRODUCT.plans.business.aiImages} AI images, ${PRODUCT.plans.business.aiTexts} AI texts, and Autopilot up to ${PRODUCT.plans.business.autopilotPerDay} pins a day. A workspace links one Pinterest account. Pin text is generated in English, French, Spanish, or German, matching the language selected in the app.`,
      `Autopilot can fill the calendar up to ${PRODUCT.autopilotLookAheadDays} days ahead and needs a business description plus posting hours. Before a pin is saved, an identical title is flagged, and so is a title with about ${Math.round(PRODUCT.duplicateTitleThreshold * 100)} percent of the same words as one you already stored. That check is there so you do not schedule near-copies. It does not judge whether the pin will sell.`,
    ],
    table: {
      caption: 'PingenX plan limits, billed in euros',
      headers: ['Plan', 'Monthly price', 'Pins', 'AI images', 'AI texts', 'Autopilot'],
      rows: [
        ['Starter', '€0', '5', '5', '20', 'No'],
        ['Pro', '€19 after 7 days', '150', '100', '300', 'Up to 3 a day'],
        ['Business', '€49 after 7 days', '600', '300', '1,000', 'Up to 5 a day'],
      ],
    },
  },
  {
    id: 'mistakes',
    heading: 'Mistakes that waste a month of pinning',
    paragraphs: [
      'The most expensive mistake is a beautiful pin that opens the shop home, or a pin with no link at all. The second is one photograph republished with a comma moved in the title. The third is a board named after your feelings instead of the product. The fourth is a Christmas pin published on December 20 for a US audience that started searching in October.',
      'Another quiet mistake is copying a keyword list from a US blog into a UK or Australian shop without changing spelling, season, or currency cues in the image. “Fall porch decor” is a real US search and a weak one in Sydney in April. Write the pin for the buyer who will pay shipping to their country, or for the digital file that has no shipping.',
      'Do not buy a promise of guaranteed rank, guaranteed sales, or a fixed number of pins that “the algorithm” demands. Pinterest does not publish a quota that fits every Etsy shop. Volume without a distinct image and a real listing is how accounts get noisy. Measure outbound clicks, then decide whether to make more.',
    ],
  },
];

const shopifySections: SeoSection[] = [
  {
    id: 'definition',
    heading: 'Two different jobs: catalog pins and designed pins',
    paragraphs: [
      'Pinterest marketing for a Shopify store splits into two jobs that shops often mix together. The first job is getting your products onto Pinterest as product pins, with a price, availability, and a link to the product page. Pinterest’s own Shopify app does that. It claims the store domain, installs the Pinterest tag, and connects the product feed. That is Pinterest’s integration, documented in Pinterest Business Help. PingenX does not replace it.',
      'The second job is publishing designed pins: a vertical image with a headline, a sentence a buyer can read, and a point of view the catalog photo does not have. A linen bedding store needs both the white-background product pin and a pin that shows the bedding in a guest room with the words “linen sheets for a small bedroom”. Catalog pins cover the inventory. Designed pins cover the searches that sound like a project or a gift.',
      'This page is about that second job, and about how not to break the first one. If you only design pretty images and never connect the catalog, in-stock data will not stay current on product pins. If you only connect the catalog, you will miss the idea searches that do not look like a SKU title.',
    ],
  },
  {
    id: 'app',
    heading: 'What the official Shopify connection actually does',
    paragraphs: [
      'Pinterest’s help article on linking Shopify says the app claims your website, installs the tag and the conversions API, connects the product feed, and can create product pins from that feed. It also says a Shopify store connects to one Pinterest business account at a time. Depending on the country, Pinterest may ask you to set up an advertiser account before the connection works. Read the current article before you install anything. Screens move.',
      'You still need a business account, a domain you control, and product pages that show a price, shipping, and a way to contact the store. A myshopify.com subdomain can be harder to claim cleanly than the custom domain customers see. Prefer the domain printed on your packing slip.',
      'Ads are a separate decision. The app may mention an ads credit. A credit is not a requirement to publish organic pins, and it is not income. PingenX does not buy Pinterest ads, does not install the tag, and does not sync inventory.',
    ],
  },
  {
    id: 'destinations',
    heading: 'Send each designed pin to a page that can convert',
    paragraphs: [
      'A designed pin should open a product page, a collection, or a guide on your store that features the products in the image. The home page is the wrong default. The buyer already chose a specific idea. Dropping them on a logo and a menu makes them start over.',
      'Match the words. If the pin says “gift for a new apartment”, the collection must be shoppable as a housewarming edit, not a dump of every SKU. If the pin shows one candle, open that candle. Check the URL after you duplicate a product in Shopify, because the handle may have changed.',
      'PingenX’s manual generator currently stores pins without a destination link. Autopilot writes one website URL, the one saved in Autopilot settings, onto every pin it creates. That is acceptable for a single collection you are promoting this week. It is a bad fit for a 40-product catalog. Use the Shopify app’s product pins for per-product links, and use PingenX for extra designed pins aimed at one URL per batch until you can set a link on each designed pin.',
    ],
  },
  {
    id: 'markets',
    heading: 'Shipping, spelling, and seasons across English-speaking markets',
    paragraphs: [
      'A US shop says “shipping” and plans fall campaigns around late November. A UK shop says “delivery”, “basket”, and often shows prices with VAT included. A Canadian shop should not promise US-only shipping times in the pin text. An Australian shop planning “summer dresses” in December is on-season; a US shop using that same pin is not.',
      'Write the pin in the spelling of the collection page it opens. Do not send a UK buyer to a page that says “personalized jewelry” if the product title says “personalised jewellery”, and do not do the reverse. The pin and the page should look like the same shop.',
      'Currency in the image is a promise. If the pin art says “$28” and the UK storefront charges pounds, remove the price from the image or show the currency you actually charge. Catalog product pins can pull the price from the feed. Designed pins do not update themselves when you change a price.',
    ],
  },
  {
    id: 'creative',
    heading: 'A designed pin that is not a copy of the catalog photo',
    paragraphs: [
      'Start with the search, then the scene. “Narrow kitchen storage” is a search. A tall photo of a rail inside a real narrow kitchen, with a short headline, is a pin. The catalog image of the rail on white still belongs in the product feed. They are not duplicates if the idea and the crop are different. They are duplicates if you only change the font.',
      'Put a short headline on the image only when it helps someone scanning a grid. The headline should match the title, not contradict it. Leave the price off unless you are willing to update the image when the price changes. Include the product so the click does not feel like a trick.',
      'Example for a US candle brand: title “Soy candle for a small bedroom, unscented night light alternative”. Description: “An unscented soy candle in a small jar, shown on a bedside table. The product page lists burn time, wax, and shipping from the US. Made for people who want a quiet light, not a strong perfume.” Example for a UK print shop: title “Personalised house portrait, new home gift”. Description: “A printed house portrait from a photo you upload, personalised with the street name. Delivery options and frame sizes are on the product page.”',
    ],
  },
  {
    id: 'boards',
    heading: 'Boards and collections should use the same nouns',
    paragraphs: [
      'If Shopify has a collection called “linen bedding”, the Pinterest board should not be called “sleep sanctuary” unless that is also the phrase on the collection page and in your ads. Pick the noun customers type. You can keep a more editorial board later, after the obvious boards exist.',
      'One board per collection you are willing to maintain is enough. A board with four pins and a clever name does less than a board whose name matches a collection with stock. Describe the board in one sentence: who it is for and what is on it.',
      'When publishing from PingenX, a pin without a board id is sent to the first board on the connected account. Name and order your boards on Pinterest knowing that. The niche field in PingenX guides the draft. It is not a reliable board router.',
    ],
  },
  {
    id: 'measure',
    heading: 'What to measure in Pinterest and in Shopify',
    paragraphs: [
      'On Pinterest, separate product pins that came from the catalog from designed pins you published yourself. Outbound clicks tell you the pin was chosen. The Pinterest tag, installed by the official app, is what helps Pinterest report on-site actions. PingenX’s own analytics screen sums impressions, saves, and clicks for pins it knows about. It does not replace Shopify’s orders report and it does not read your checkout.',
      'In Shopify, use the landing page report or the referrer you trust and look for sessions that began on the product or collection you linked. A rise in Pinterest clicks with no sessions usually means a broken or redirected URL. A rise in sessions with no add-to-cart means the page, the price, or the shipping cost is the next place to look, not another ten pins of the same photo.',
      'Judge a designed pin over several weeks. Catalog pins can change when the feed updates. Designed pins stay as you published them, including an old headline. Plan a review day once a month and archive or replace pins that point at sold-out products if Pinterest is still sending people there.',
    ],
  },
  {
    id: 'pingenx',
    heading: 'Using PingenX beside the Shopify app',
    paragraphs: [
      `Use the Pinterest for Shopify app for the catalog, the claim, and the tag. Use PingenX when you want additional images and sentences drafted, then scheduled, without pretending it is a feed. Inside the app the name on screen is ${PRODUCT.appLabel}. Pin copy is drafted in English, French, Spanish, or German. The publisher caps titles at ${PRODUCT.titleMaxChars} characters and descriptions at ${PRODUCT.descriptionMaxChars}. Hashtags saved in PingenX are not added to the Pinterest payload.`,
      `Starter is free and allows ${PRODUCT.plans.starter.pins} pins, ${PRODUCT.plans.starter.aiImages} AI images, and ${PRODUCT.plans.starter.aiTexts} AI texts a month, without Autopilot. Pro is €${PRODUCT.plans.pro.priceEur} a month after ${PRODUCT.trialDays} days and allows Autopilot up to ${PRODUCT.plans.pro.autopilotPerDay} pins a day. Business is €${PRODUCT.plans.business.priceEur} and allows up to ${PRODUCT.plans.business.autopilotPerDay} a day. Prices are in euros even if your Shopify store charges dollars or pounds. One workspace connects one Pinterest account.`,
      `Autopilot looks ahead up to ${PRODUCT.autopilotLookAheadDays} days and attaches one website URL to the batch. Point that URL at a collection you are featuring, not at the bare home page, and change it when the campaign changes. Near-duplicate titles are flagged around a ${Math.round(PRODUCT.duplicateTitleThreshold * 100)} percent word overlap so the calendar does not fill with the same sentence. None of this chooses a winner. Your outbound clicks do.`,
    ],
    table: {
      caption: 'What each tool is for',
      headers: ['Job', 'Pinterest Shopify app', 'PingenX'],
      rows: [
        ['Claim the store domain', 'Yes, as documented by Pinterest', 'No'],
        ['Product feed and price', 'Yes', 'No'],
        ['Designed pin image and sentences', 'No', 'Yes, within monthly limits'],
        ['Calendar and Autopilot', 'Not the job of the feed', 'Yes, on Pro and Business'],
        ['Pinterest ads', 'Pinterest’s ads tools', 'No'],
      ],
    },
  },
  {
    id: 'mistakes',
    heading: 'Mistakes Shopify stores repeat',
    paragraphs: [
      'Installing nothing and also designing nothing is an obvious stall. The subtler stall is publishing catalog photos again as “designed” pins with a logo in the corner. Another is linking every idea pin to the home page because it was faster to paste once. Another is writing US “fall decor” for a storefront that only ships inside the UK.',
      'Do not promise that a daily pin count will produce revenue. Shops with a large catalog can support more images than a shop with twelve products. Start from the collections that already sell, make a small set of designed pins for those searches, and stop when you run out of distinct ideas rather than when you hit someone else’s quota.',
      'Do not describe PingenX as a Shopify integration. It is a creation and scheduling tool for one Pinterest account. The integration that syncs products is Pinterest’s app. Using both is coherent. Claiming they are the same product is not.',
    ],
  },
];

const businessSections: SeoSection[] = [
  {
    id: 'definition',
    heading: 'Pinterest is a search engine for plans, not a feed to feed',
    paragraphs: [
      'Pinterest marketing for a small business means showing up when someone is planning a purchase, a project, or a next step. A food blogger is found for “weeknight soup”, a coach for “how to price a consulting package”, a template seller for “invoice template for freelancers”. The person is not asking to be entertained for fifteen seconds. They are collecting an idea they may open again later.',
      'That is why a single useful pin can matter for longer than a post on a chronological feed, and why a week of silence does not erase the earlier work. It is also why a pin with no clear next step wastes the visit. The next step has to exist: a blog post, a product, a booking page, or a free sample that is actually delivered. “Follow me” is not a next step.',
      'The businesses that struggle on Pinterest are often selling something the picture cannot explain, or sending people to a home page that makes them hunt. If your offer can be shown in one scene and described in one sentence, you can build a Pinterest presence without a social team.',
    ],
  },
  {
    id: 'who',
    heading: 'Who this is for in the US, UK, Canada, and Australia',
    paragraphs: [
      'This page is for independent businesses: bloggers who want readers, coaches and consultants who sell a call or a course, and small shops that are not on Etsy or Shopify specifically. Etsy sellers and Shopify stores have their own guides, because their links and catalog tools differ. The English here is US spelling. Publish your pins in the spelling your clients use.',
      'A US career coach and a UK career coach do not share a tax season, a spelling of “résumé” versus “CV”, or the same public holidays. A Canadian fitness coach planning “summer” and an Australian fitness coach planning “summer” are six months apart. Put the month in your calendar, not a generic “summer body” pin you found in a template pack.',
      'Local services can use Pinterest when the job is visual and the booking page is clear: a photographer, a florist, a kitchen remodeler with a defined service area. Say the city in the pin if you only serve that city. A pin that says “wedding florist” with no place sends inquiries you must refuse.',
    ],
  },
  {
    id: 'offer',
    heading: 'One pin, one offer, one URL',
    paragraphs: [
      'Decide what the click should accomplish before you design the image. A blog pin opens the article that matches the headline. A template pin opens the sales page for that template. A coaching pin opens the page that explains the engagement and how to book, not a ten-year archive of the blog.',
      'Write the title as the search, not as your brand slogan. “Freelance invoice template, Google Sheets” is a search. “Level up your CEO energy” is not, unless you have evidence people type it. The description should say what the person gets, how long it takes, and any limit, such as “US letter and A4” or “a 45-minute call on Zoom”.',
      'PingenX can draft the image and the sentences. The manual generator does not currently attach a destination URL. Autopilot attaches one website URL to every pin in the batch. Choose that URL for the offer you are promoting this week. If you sell several unrelated offers, do not point all of them at the home page and hope.',
    ],
  },
  {
    id: 'examples',
    heading: 'Examples for a blog, a coach, and a digital product',
    paragraphs: [
      'Food blog, US: title “Creamy tomato soup for a weeknight”. Description: “A stovetop tomato soup that uses canned tomatoes and comes together on a weeknight. The recipe post lists substitutions and a dairy-free option. The photo shows the bowl, the bread, and the pot so you can see the texture.”',
      'Coach, UK: title “How to price a consulting day, UK freelancers”. Description: “A plain explanation of pricing a consulting day for UK freelancers, including what to put in the proposal. The article is on the site, and the about page says who the writer takes as clients. This pin is not a promise of clients.”',
      'Digital product, Canada and Australia: title “Client proposal template for designers”. Description: “A proposal template for independent designers, with sections for scope, rounds of revision, and payment. The sales page says which apps open the file. Show A4 if your buyers print outside the US, and do not hard-code a US holiday into the preview.”',
    ],
  },
  {
    id: 'calendar',
    heading: 'A four-week calendar for a one-person business',
    paragraphs: [
      'Week one, pick a single offer and write five real searches a client would type. Discard any phrase you would be embarrassed to put above your own checkout. Week two, make one image per remaining phrase. Vary the crop and the headline. Do not export the same canvas five times.',
      'Week three, publish them on different days and file them on a board named for the offer, not for your mood. Week four, read outbound clicks and the on-site behavior you can actually see. Keep the phrases that earned a click through to the page. Rewrite the headline on the ones that were seen and ignored. Only then decide whether a second offer deserves the same treatment.',
      'Seasonal businesses should slide this block earlier than the buying moment. A tax coach in the US starts before April. A UK accountant does not copy that date. A wedding photographer publishes ceremony details months ahead. Put the publish date on the calendar when you sign the job, not when the panic starts.',
    ],
  },
  {
    id: 'boards',
    heading: 'Boards are categories a stranger can scan',
    paragraphs: [
      'Name boards after the problems you solve: “weeknight vegetarian recipes”, “freelance pricing”, “small-brand photography”. A board called “inspiration” is a drawer. Write two sentences in the board description using the words on the pins inside it.',
      'You do not need a board for every service on your website. You need a board for every service you are willing to explain with new images this quarter. An empty board looks like an abandoned shop.',
      'If a pin is published without a chosen board id, PingenX sends it to the first board on the account. Set up that first board on purpose, or accept that new pins will land there until you move them on Pinterest.',
    ],
  },
  {
    id: 'weekly',
    heading: 'What a single week of work actually looks like',
    paragraphs: [
      'Monday, choose the offer and write the URL in a note you will reuse. If the URL is your home page, stop and pick a deeper page. Tuesday, draft two titles in the spelling your clients use and reject any title that could fit a competitor unchanged. Wednesday, make the images. Thursday, schedule them on different days and read them aloud once. A sentence you would not say to a client does not belong on the pin. Friday, leave them alone. The following Friday, write down impressions, outbound clicks, and whether the page received the visit.',
      'That week does not require Autopilot. It fits inside Starter if you only need a few pins, and it shows you whether the offer is clear before you pay for a larger calendar. When the same offer still deserves new images, then a longer schedule is rational. When it does not, more automation just publishes the uncertainty faster.',
    ],
  },
  {
    id: 'measure',
    heading: 'Measure the visit, not a vanity save',
    paragraphs: [
      'Saves mean the idea was worth keeping. Outbound clicks mean someone left Pinterest for your URL. Neither number is revenue. A coach should care whether the click reached the booking page. A blogger should care whether the article was opened. A template seller should care whether the sales page loaded the right product.',
      'PingenX shows impressions, saves, and clicks for pins tracked in the product. Your site analytics show what happened after the click. Use both. If Pinterest says people clicked and your site shows no sessions, check the URL, the consent banner, and whether the pin link is empty.',
      'Ignore screenshots of other people’s dashboards. A 300 percent claim without a baseline, a niche, and a time window is not a forecast for your business. Compare your own last month with this month.',
    ],
  },
  {
    id: 'pingenx',
    heading: 'What PingenX will and will not do for a small business',
    paragraphs: [
      `PingenX drafts pins and schedules them to one connected Pinterest account. The on-screen name is ${PRODUCT.appLabel}. It does not write in Portuguese or Dutch. It drafts in English, French, Spanish, or German. It does not run ads, scrape followers, or post to several Pinterest accounts from one workspace.`,
      `Starter, at no monthly fee, includes ${PRODUCT.plans.starter.pins} pins, ${PRODUCT.plans.starter.aiImages} AI images, and ${PRODUCT.plans.starter.aiTexts} AI texts, and it does not include Autopilot. Pro is €${PRODUCT.plans.pro.priceEur} a month after a ${PRODUCT.trialDays}-day trial, with Autopilot up to ${PRODUCT.plans.pro.autopilotPerDay} pins a day. Business is €${PRODUCT.plans.business.priceEur}, with Autopilot up to ${PRODUCT.plans.business.autopilotPerDay} a day. The publisher limits a title to ${PRODUCT.titleMaxChars} characters and a description to ${PRODUCT.descriptionMaxChars}. Hashtags kept inside PingenX are not sent as a separate list.`,
      `Autopilot needs a description of the business, an audience, an offer, a tone, and hours, and it can fill up to ${PRODUCT.autopilotLookAheadDays} days. Every pin in that run uses the same website URL. Identical titles, and titles that share about ${Math.round(PRODUCT.duplicateTitleThreshold * 100)} percent of their words with one you already saved, are flagged. Publishing still depends on Pinterest accepting the API connection. A queued pin is not a published pin until the status says so.`,
    ],
    table: {
      caption: 'A practical split of work',
      headers: ['Task', 'You', 'PingenX'],
      rows: [
        ['Choose the offer and the URL', 'Yes', 'No, except one Autopilot URL'],
        ['Draft image, title, description', 'You can', 'Yes, within the plan'],
        ['Reject a near-duplicate title', 'You should', 'The app flags close matches'],
        ['Read revenue', 'Your site or payment tool', 'No'],
        ['Publish to one Pinterest account', 'You connect it', 'Yes, when Pinterest accepts the call'],
      ],
    },
  },
  {
    id: 'mistakes',
    heading: 'What to stop doing',
    paragraphs: [
      'Stop publishing quotes with no offer. Stop linking every pin to your home page. Stop scheduling more pins than you have distinct things to say. Stop copying a holiday from the wrong country. Stop treating a hashtag block as a substitute for a sentence, especially because those stored hashtags are not what the publisher sends.',
      'Stop buying guarantees. No tool, including PingenX, can promise impressions, saves, or clients. The work that holds up is a clear offer, a matching page, a specific image, and a calendar you actually keep.',
      'If you sell on Etsy or Shopify, use those guides. The constraints are different: Etsy cannot be claimed as your domain, and Shopify has an official catalog connection that this product does not replace.',
    ],
  },
];

const homeSections: SeoSection[] = [
  {
    id: 'what',
    heading: 'What these guides are',
    paragraphs: [
      'These are practical guides to Pinterest for people who sell something: an Etsy listing, a Shopify catalog, or a service and a page of their own. Each guide explains the search, the link, the calendar, and the part PingenX can take. PingenX drafts and schedules pins for one Pinterest account. It is not an Etsy integration and it is not the official Shopify catalog app.',
      'The English guides use US spelling and call out where the UK, Canada, and Australia search differently. They are one English URL on purpose. Country-specific sites would only exist if the page itself were rewritten for that country.',
    ],
  },
  {
    id: 'start',
    heading: 'Where to start',
    paragraphs: [
      'If you sell on Etsy, start with the Etsy guide. The important constraint is that you cannot claim the Etsy domain, so each pin has to earn the click with its own listing link. If you sell on Shopify, start with the Shopify guide. Connect Pinterest’s own app for the product feed, then use designed pins for idea searches. If you sell a service, a blog, or a digital product, start with the small-business guide.',
      'Prices in the product are in euros. Starter has no monthly fee and tight limits. Pro and Business add a seven-day trial and Autopilot. Nothing here promises a rank, a click rate, or a revenue number.',
    ],
  },
];

const etsyHub: SeoSection[] = [
  {
    id: 'use',
    heading: 'How to use this Etsy section',
    paragraphs: [
      'This section collects Pinterest guides for Etsy sellers in the United States, the United Kingdom, Canada, and Australia. The first published guide covers the full path: what a pin is for, why the Etsy domain cannot be claimed, how search phrases change by country, and what PingenX will and will not schedule.',
      'Later guides are planned for pin ideas, keywords, boards, digital products, seasonal timing, and analytics. They are not online yet. We are not publishing empty URLs for those topics. Use the guide that exists, then judge it by your own outbound clicks.',
    ],
  },
  {
    id: 'fit',
    heading: 'What PingenX changes for a seller',
    paragraphs: [
      'PingenX can draft the image and the words and put pins on a calendar for one Pinterest account. It does not open your Etsy shop, import listings, or set a different link on every manual pin today. Autopilot uses one website URL for the batch. Read the guide before you assume a scheduler solves the listing link.',
    ],
  },
];

const shopifyHub: SeoSection[] = [
  {
    id: 'use',
    heading: 'How to use this Shopify section',
    paragraphs: [
      'Shopify stores already have an official Pinterest app for catalogs, the website claim, and the tag. This section is for the work that app does not do: designed pins aimed at real searches, pointed at a product or a collection, scheduled on purpose.',
      'The published guide explains the split and the limits of PingenX. Further pages, including product pins, collections, and seasonal campaigns, are planned and not published. One strong guide is more useful than a stack of thin ones.',
    ],
  },
  {
    id: 'fit',
    heading: 'Keep the catalog and the creative apart',
    paragraphs: [
      'Do not disconnect a working product feed because a design tool asked you to. Keep the feed for price and stock. Add designed pins when you have a scene and a sentence the feed photo does not cover. Measure them separately.',
    ],
  },
];

const businessHub: SeoSection[] = [
  {
    id: 'use',
    heading: 'How to use this small-business section',
    paragraphs: [
      'This section is for bloggers, coaches, consultants, and other independent businesses that send Pinterest traffic to their own site. It is not the Etsy section and not the Shopify section. Those catalogs have different rules.',
      'The published guide is a four-week way to pick one offer, publish a few specific pins, and read the clicks. Pages for bloggers, coaches, calendars, and pin design are planned. They will be written as their own guides, not as copies of this one with a noun swapped.',
    ],
  },
  {
    id: 'fit',
    heading: 'A scheduler does not invent an offer',
    paragraphs: [
      'If the page you link to is vague, more pins make the vagueness louder. PingenX drafts and schedules. You still choose the offer, the country you are speaking to, and the URL. Starter is free and small. Autopilot starts on the paid plans.',
    ],
  },
];

export const enPack: LanguagePack = {
  language: 'en',
  home: {
    localizedTitle: 'Pinterest marketing guides',
    metaTitle: 'Pinterest marketing guides | PingenX',
    localizedMetaDescription:
      'Pinterest guides for Etsy sellers, Shopify stores, and small businesses. What to publish, what to measure, and what PingenX actually schedules.',
    primaryKeyword: 'Pinterest marketing guides',
    secondaryKeywords: ['Pinterest for Etsy', 'Pinterest for Shopify', 'Pinterest for small business'],
    intro:
      'Start with the channel you sell on. Each guide is a working method: the search phrase, the page the pin should open, the weekly cadence, and a precise account of what PingenX does. There is no guaranteed ranking and no invented traffic number.',
    sections: homeSections,
    faqs: [
      {
        question: 'Are these pages translations of each other?',
        answer:
          'No. English, French, Spanish, Portuguese, and Dutch each have their own guide, written for the way sellers search in that language. The language switcher only appears when the equivalent page exists.',
      },
      {
        question: 'Does PingenX post to Etsy or Shopify for me?',
        answer:
          'No. PingenX publishes pins to one connected Pinterest account. Etsy listings and Shopify products stay on those platforms. Shopify merchants can use Pinterest’s own app for a product catalog. PingenX does not replace that app.',
      },
    ],
    research: research({
      secondaryKeywords: ['Pinterest for Etsy', 'Pinterest for Shopify', 'Pinterest for small business'],
      longTailKeywords: ['how to use Pinterest for an online shop'],
      commercialKeywords: ['Pinterest scheduler for small business'],
      informationalQueries: ['what is Pinterest marketing'],
      questions: ['Does PingenX post to Etsy?'],
      competitorPages: [],
      terminology: 'US spelling on the page. UK, CA, and AU differences are explained inside the guides, not on separate URLs.',
    }),
  },
  hubs: [
    {
      category: 'etsy',
      localizedTitle: 'Pinterest for Etsy sellers',
      metaTitle: 'Pinterest guides for Etsy sellers | PingenX',
      localizedMetaDescription:
        'Guides for Etsy sellers who use Pinterest to reach buyers. Start with the marketing guide, then measure outbound clicks on your own listings.',
      primaryKeyword: 'Pinterest guides for Etsy sellers',
      secondaryKeywords: ['Etsy Pinterest tips', 'promote an Etsy shop on Pinterest'],
      intro:
        'Etsy sellers use Pinterest as a visual search engine. Buyers arrive with a product in mind. Your job is a pin that matches that product and opens the right listing. This hub points only to guides that are actually published.',
      sections: etsyHub,
      faqs: [
        {
          question: 'Can I claim my Etsy shop on Pinterest?',
          answer:
            'Pinterest’s help center says marketplace stores such as Etsy cannot be claimed, because you do not control the domain. You can still put the shop URL on your profile and link pins to listings.',
        },
      ],
      research: research({
        secondaryKeywords: ['Etsy Pinterest tips', 'promote an Etsy shop on Pinterest'],
        longTailKeywords: ['how to get Etsy traffic from Pinterest'],
        commercialKeywords: ['Etsy Pinterest scheduler'],
        informationalQueries: ['does Pinterest work for Etsy'],
        questions: ['Can I claim my Etsy shop on Pinterest?'],
        competitorPages: [],
        terminology: 'Shop, listing, and pin are the working nouns. UK sellers still say personalised and jewellery on the pins themselves.',
      }),
    },
    {
      category: 'shopify',
      localizedTitle: 'Pinterest for Shopify stores',
      metaTitle: 'Pinterest guides for Shopify stores | PingenX',
      localizedMetaDescription:
        'How Shopify stores use Pinterest’s catalog app and separate designed pins. PingenX schedules the designed pins. It does not sync the catalog.',
      primaryKeyword: 'Pinterest guides for Shopify stores',
      secondaryKeywords: ['Shopify Pinterest app', 'designed pins for Shopify'],
      intro:
        'A Shopify store can send a product feed to Pinterest and also publish designed pins for searches that do not look like a SKU. This hub separates those jobs so you do not buy the wrong tool.',
      sections: shopifyHub,
      faqs: [
        {
          question: 'Does PingenX replace the Pinterest app on Shopify?',
          answer:
            'No. Pinterest’s Shopify app claims the domain, installs the tag, and connects the product feed. PingenX drafts and schedules designed pins for one Pinterest account.',
        },
      ],
      research: research({
        secondaryKeywords: ['Shopify Pinterest app', 'designed pins for Shopify'],
        longTailKeywords: ['Pinterest product feed vs designed pins'],
        commercialKeywords: ['Pinterest scheduler for Shopify'],
        informationalQueries: ['how to connect Shopify to Pinterest'],
        questions: ['Does PingenX replace the Pinterest Shopify app?'],
        competitorPages: [{ label: 'Pinterest Help, link Shopify', url: PINTEREST_SHOPIFY_URL }],
        terminology: 'Product page, collection, and catalog are kept distinct from a designed pin.',
      }),
    },
    {
      category: 'business',
      localizedTitle: 'Pinterest for online businesses',
      metaTitle: 'Pinterest guides for small businesses | PingenX',
      localizedMetaDescription:
        'A practical Pinterest starting point for bloggers, coaches, and independent businesses. One offer, one URL, and a calendar you can keep.',
      primaryKeyword: 'Pinterest guides for small businesses',
      secondaryKeywords: ['Pinterest for bloggers', 'Pinterest for coaches'],
      intro:
        'Independent businesses do not need a catalog feed to start. They need one offer that can be shown in a picture and a page that delivers it. This hub leads to that guide.',
      sections: businessHub,
      faqs: [
        {
          question: 'Is this the same guide as the Etsy or Shopify page?',
          answer:
            'No. Those pages deal with listings and product feeds. This section is for businesses that send people to their own site.',
        },
      ],
      research: research({
        secondaryKeywords: ['Pinterest for bloggers', 'Pinterest for coaches'],
        longTailKeywords: ['Pinterest content calendar for a small business'],
        commercialKeywords: ['Pinterest automation for coaches'],
        informationalQueries: ['how to use Pinterest for a small business'],
        questions: ['Is Pinterest worth it for a coach?'],
        competitorPages: [],
        terminology: 'Offer, booking page, and blog post are the destinations, not a marketplace listing.',
      }),
    },
  ],
  articles: [
    {
      contentId: 'etsy-pinterest-marketing',
      localizedTitle: 'Pinterest marketing for Etsy sellers',
      metaTitle: 'Pinterest Marketing for Etsy Sellers | PingenX',
      localizedMetaDescription:
        'How Etsy sellers use Pinterest search: listing-level pins, buyer phrases in the US, UK, Canada, and Australia, and what PingenX schedules.',
      intro:
        'Pinterest marketing for Etsy sellers means publishing a specific pin for a specific listing, using the words a buyer types, and checking outbound clicks before you make more. You cannot claim the Etsy domain. You can still send people to a listing. PingenX can draft and schedule the pin. It does not log into Etsy, and it does not guarantee sales.',
      sections: etsySections,
      faqs: [
        {
          question: 'Can I claim my Etsy shop on Pinterest?',
          answer:
            'No. Pinterest Business Help says a claim requires a domain you own and can edit. Marketplace stores such as Etsy, eBay, and Amazon cannot be claimed. Put the shop URL on your profile if you want, and point each product pin at a listing.',
        },
        {
          question: 'Should every pin link to my shop home?',
          answer:
            'No. A product pin should open the listing in the image. A shop-home link makes the buyer search a second time. PingenX’s manual generator currently saves pins without a link, and Autopilot applies one website URL to the whole batch. Do not point that single URL at the home page if you can point it at the listing you are promoting.',
        },
        {
          question: 'How many pins should I publish each day?',
          answer:
            'There is no universal quota. A small shop learns more from a few distinct images a week than from reposting one photo. Raise the volume only after outbound clicks show that the listing and the phrase are working.',
        },
        {
          question: 'Does PingenX support several Pinterest accounts?',
          answer:
            'A workspace connects one Pinterest account. The publisher sends a title of up to 100 characters and a description of up to 800 characters to a board on that account.',
        },
        {
          question: 'Which plan includes Autopilot?',
          answer:
            'Starter does not. Pro includes up to 3 pins a day and Business up to 5, after a 7-day trial, at €19 or €49 a month. Autopilot fills at most 14 days ahead and uses one website URL for every pin in the run.',
        },
        {
          question: 'Will this guarantee Etsy sales?',
          answer:
            'No. Pinterest can send visitors. Whether they buy depends on the listing, the price, the photos, and the shipping. Use Pinterest Analytics and Etsy Stats to see what happened. Ignore guarantees.',
        },
      ],
      sources: [
        { label: 'Pinterest Business Help: claim your website', url: claim },
        { label: 'Etsy Seller Handbook: promote your shop on Pinterest', url: ETSY_HANDBOOK_URL },
      ],
      research: research({
        secondaryKeywords: [
          'Pinterest for Etsy sellers',
          'promote Etsy shop on Pinterest',
          'Etsy traffic from Pinterest',
          'Pinterest SEO for handmade shops',
        ],
        longTailKeywords: [
          'how to use Pinterest to get Etsy sales',
          'can I claim my Etsy shop on Pinterest',
          'Pinterest board names for Etsy',
          'personalised vs personalized Pinterest pins',
        ],
        commercialKeywords: [
          'Etsy Pinterest scheduler',
          'Pinterest automation for Etsy',
          'tool to schedule Etsy pins',
        ],
        informationalQueries: [
          'does Pinterest still work for Etsy',
          'what is a good Pinterest pin for Etsy',
          'when to post Christmas pins for Etsy',
        ],
        questions: [
          'Can I claim my Etsy shop on Pinterest?',
          'Should every pin link to my shop home?',
          'How many pins should I publish?',
        ],
        competitorPages: [
          { label: 'HiSellIt, Etsy Pinterest guide', url: 'https://hisellit.com/blogs/how-to-use-pinterest-to-drive-etsy-sales/' },
          { label: 'PetalBoard, Etsy seller guide', url: 'https://petalboard.com/blog/pinterest-marketing-etsy-sellers-guide' },
          { label: 'Pinboostr, Etsy sellers', url: 'https://pinboostr.com/pinterest-for-etsy-sellers-drive-traffic-that-buys/' },
        ],
        terminology:
          'One English page for the US, UK, Canada, and Australia. Pins should use local spelling and local holidays even though this guide is in US English. No en-GB URL until a separate page exists.',
      }),
    },
    {
      contentId: 'shopify-pinterest-marketing',
      localizedTitle: 'Pinterest marketing for Shopify stores',
      metaTitle: 'Pinterest Marketing for Shopify | PingenX',
      localizedMetaDescription:
        'How Shopify stores combine Pinterest’s catalog app with designed pins. What the official app does, and what PingenX schedules instead.',
      intro:
        'Pinterest marketing for Shopify is two systems. Pinterest’s Shopify app claims the domain and turns the product feed into product pins. Designed pins, the ones with a scene and a sentence, are a separate calendar. PingenX helps with that calendar. It does not sync your catalog and it does not run ads.',
      sections: shopifySections,
      faqs: [
        {
          question: 'Do I still need the Pinterest app in Shopify?',
          answer:
            'If you want a claimed domain, the tag, and product pins that can show price and availability from your feed, yes. That is Pinterest’s app, described in Pinterest Business Help. PingenX does not do those jobs.',
        },
        {
          question: 'Can PingenX link each designed pin to a different product?',
          answer:
            'Not in the current manual generator, which saves pins without a destination link. Autopilot applies the single website URL from your settings to every pin it creates. Use that for one collection at a time. Use the catalog feed when every SKU needs its own URL.',
        },
        {
          question: 'Does PingenX install the Pinterest tag?',
          answer:
            'No. The official Shopify connection is what Pinterest documents for the tag and the conversions API. PingenX analytics cover impressions, saves, and clicks on pins it tracks, not Shopify revenue.',
        },
        {
          question: 'How should a UK or Australian store write pins?',
          answer:
            'Match the storefront. UK pins should say delivery and personalised if the product page does. Australian seasonal pins should not copy a US fall calendar. The guide is in US English; the pin should use the buyer’s spelling.',
        },
        {
          question: 'Will more pins fix a weak product page?',
          answer:
            'No. If clicks arrive and add-to-cart does not, look at the price, the shipping cost, and the page. Publishing more of the same image will not repair that.',
        },
      ],
      sources: [
        { label: 'Pinterest Business Help: link Shopify and Pinterest', url: PINTEREST_SHOPIFY_URL },
        { label: 'Pinterest Business Help: claim your website', url: claim },
      ],
      research: research({
        secondaryKeywords: [
          'Pinterest for Shopify stores',
          'Shopify Pinterest product pins',
          'Pinterest traffic to Shopify',
        ],
        longTailKeywords: [
          'Pinterest catalog vs designed pins Shopify',
          'does PingenX sync Shopify products',
          'Pinterest tag Shopify',
        ],
        commercialKeywords: ['Pinterest scheduler for Shopify', 'Shopify Pinterest automation'],
        informationalQueries: ['how to sell on Pinterest with Shopify', 'Pinterest product feed Shopify'],
        questions: ['Do I need the Pinterest Shopify app?'],
        competitorPages: [
          { label: 'Shopify, Pinterest product feed', url: 'https://www.shopify.com/blog/pinterest-product-feed' },
          { label: 'Shopify, how to sell on Pinterest', url: 'https://www.shopify.com/blog/how-to-sell-on-pinterest' },
          { label: 'Tailwind, Pinterest for Shopify', url: 'https://www.tailwindapp.com/blog/pinterest-for-shopify-12-dos-and-donts-that-drive-real-sales' },
        ],
        terminology:
          'Catalog pin and designed pin are kept as separate terms. Shipping versus delivery is called out for UK stores. No separate en-GB page.',
      }),
    },
    {
      contentId: 'business-pinterest-marketing',
      localizedTitle: 'Pinterest marketing for a small business',
      metaTitle: 'Pinterest Marketing for Small Business | PingenX',
      localizedMetaDescription:
        'A four-week Pinterest method for bloggers, coaches, and independent businesses. One offer, one URL, and no guaranteed traffic.',
      intro:
        'Pinterest marketing for a small business is how you show up when someone is planning, not how you collect followers. Pick one offer, publish a few pins that name that offer, open the page that delivers it, and read the clicks. PingenX can draft and schedule the pins for one account. It cannot invent the offer or promise clients.',
      sections: businessSections,
      faqs: [
        {
          question: 'Is Pinterest only for physical products?',
          answer:
            'No. Blogs, templates, and services use it when the result can be shown and the next step is a real page. A city-based service should say the city. A vague brand pin with no offer is a weak use of the tool.',
        },
        {
          question: 'Can I schedule pins in several languages?',
          answer:
            'The app drafts pin text in English, French, Spanish, or German, based on the language you select. It does not currently draft in Portuguese or Dutch. You can still edit a title before you schedule.',
        },
        {
          question: 'How fast will I get clients?',
          answer:
            'Nobody honest can say. Compare your own outbound clicks and your booking or sales page over several weeks. A percentage from someone else’s screenshot is not your forecast.',
        },
        {
          question: 'What does Autopilot publish?',
          answer:
            'On Pro, up to 3 pins a day. On Business, up to 5. It uses your business description, offer, audience, tone, and hours, looks ahead at most 14 days, and puts one website URL on the batch. Starter does not include it.',
        },
        {
          question: 'Does the publisher post my hashtags?',
          answer:
            'The generator stores hashtags, but the scheduled publisher sends the title, description, image, alt text, link, and board. Put important phrases in the title and description.',
        },
      ],
      sources: [{ label: 'Pinterest Business Help: claim your website', url: claim }],
      research: research({
        secondaryKeywords: [
          'Pinterest for bloggers',
          'Pinterest for coaches',
          'Pinterest for small business',
          'how to use Pinterest for business',
        ],
        longTailKeywords: [
          'Pinterest content ideas for coaches',
          'Pinterest marketing for freelancers',
          'does Pinterest work for service businesses',
        ],
        commercialKeywords: ['Pinterest scheduler', 'Pinterest automation tool', 'small business Pinterest tool'],
        informationalQueries: ['Pinterest marketing strategy for beginners', 'how often to pin for a small business'],
        questions: ['Is Pinterest worth it for a coach?', 'How do I measure Pinterest for a blog?'],
        competitorPages: [
          { label: 'Shopify NL, Pinterest marketing guide', url: 'https://www.shopify.com/nl/blog/pinterest-marketing' },
        ],
        terminology:
          'Small business covers bloggers, coaches, and digital products. Etsy and Shopify stay on their own URLs so this page does not compete with them.',
      }),
    },
  ],
};
