/**
 * Blog content lives here as structured data (no MDX dependency). Each post
 * compiles to a static page at /blog/{slug} and shows up in /sitemap.xml.
 *
 * Add a new post: append an entry. Sitemap + index + dynamic route pick it
 * up automatically.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string; id?: string }
  | { type: "h3"; text: string; id?: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "callout"; text: string };

export type Post = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;       // ISO date
  updatedAt?: string;        // ISO date
  author: string;
  readingMinutes: number;
  tags: string[];
  hero?: string;             // image path (under /public)
  body: Block[];
};

export const POSTS: Post[] = [
  {
    slug: "how-to-start-a-single-product-store",
    title: "How to Start a Single-Product Store (and Why It Outsells Big Catalogs)",
    description:
      "A focused store that sells one great thing beats a sprawling catalog for new brands. Here's how to launch one in a weekend — picking the product, pricing, page design, and the first traffic source.",
    publishedAt: "2026-04-12",
    author: "Sainsberry Team",
    readingMinutes: 7,
    tags: ["getting-started", "strategy", "single-product"],
    body: [
      { type: "p", text: "When you're launching a new ecommerce brand, the temptation is to load up a catalog and let the buyer choose. Resist it. A single-product store almost always converts better than a 50-SKU shop, especially early on — and it's dramatically easier to ship." },
      { type: "p", text: "This guide walks through exactly how to launch one: how to pick the product, how to price it, how to build a page that converts, and how to get your first paying customers in week one." },

      { type: "h2", text: "Why one product wins", id: "why-one-product-wins" },
      { type: "p", text: "Choice paralysis is real. Every extra SKU on a page splits attention and adds a decision your visitor has to make before they buy. Single-product stores remove that friction entirely." },
      { type: "ul", items: [
        "One story to tell — your whole page can sell one outcome instead of being a generic catalog.",
        "One inventory line to manage — no SKU sprawl, no out-of-stock pages, no abandoned variants.",
        "One ad creative to optimise — every dollar of paid traffic teaches you something about the same offer.",
        "Faster to launch — you can be live in an afternoon, not a sprint.",
      ]},

      { type: "h2", text: "Pick a product that earns the page", id: "pick-the-product" },
      { type: "p", text: "Not every product deserves a dedicated store. The best single-product stores hit at least three of these criteria:" },
      { type: "ul", items: [
        "Solves a specific, painful problem (not 'nice to have').",
        "Has enough margin to absorb paid traffic — 60%+ is comfortable, 40% works with strong organic.",
        "Is shippable cheaply — heavy or fragile items eat margin fast.",
        "Is hard to find in big-box retail (or noticeably better than what's there).",
      ]},

      { type: "h2", text: "Price for one decision", id: "pricing" },
      { type: "p", text: "Use a compare-at price to anchor value, but don't fake it — buyers see through inflated 'was' prices. Pair the live price with a small, real discount, then layer on quantity discounts ('Buy 2, save 10%') to lift average order value without changing the offer." },

      { type: "h2", text: "Design the page like a landing page, not a catalog", id: "page-design" },
      { type: "p", text: "A single-product store's home page IS its product page. That means it should answer one question above the fold: 'Why should I buy this right now?'" },
      { type: "ol", items: [
        "Hero image that shows the product in use, not on a white background.",
        "One-line name, two-line subtitle, real price.",
        "Single primary button: 'Buy now' — not 'Shop', not 'Learn more'.",
        "Social proof immediately after the buy button: reviews, press, customer photos.",
        "Long-form story for buyers who scroll: how it's made, who it's for, FAQ.",
      ]},

      { type: "h2", text: "Add upsells without losing focus", id: "upsells" },
      { type: "p", text: "The cleanest way to lift order value on a single-product page is a bundle add-on — one or two complementary items the buyer can tack on before checkout (gift wrap, a refill, a matching accessory). These convert because they require no new decision; the buyer already decided to buy." },

      { type: "h2", text: "Get the first 100 customers", id: "first-customers" },
      { type: "p", text: "Skip Google for the first month — you can't outrank Amazon overnight. Instead:" },
      { type: "ul", items: [
        "Post the product everywhere you already have an audience (LinkedIn, Twitter, your own newsletter).",
        "Send 20 cold emails to creators who'd love it — offer a free unit in exchange for an honest review.",
        "Run $10/day Instagram ads to a single, tight interest cluster. Iterate the creative weekly.",
        "List on one curated marketplace (Etsy, Product Hunt) for the traffic, not the sales.",
      ]},

      { type: "callout", text: "Single-product stores succeed by being ruthlessly focused. Every section of your site, every ad, every email is selling the same one thing. That focus compounds — and the brands that stay disciplined for 6 months almost always break out." },
    ],
  },

  {
    slug: "cash-on-delivery-vs-online-payment-india",
    title: "Cash on Delivery vs Online Payment in India: Which Converts Better in 2026?",
    description:
      "COD still drives the majority of D2C orders in India, but rising RTOs are eating margins. Here's the data on conversion, return rates, and when to push prepaid vs COD.",
    publishedAt: "2026-04-22",
    author: "Sainsberry Team",
    readingMinutes: 6,
    tags: ["india", "payments", "cod", "conversion"],
    body: [
      { type: "p", text: "If you're selling D2C in India, the COD-vs-prepaid question never goes away. Cash on Delivery still drives roughly 60% of all D2C orders nationally, but Return-to-Origin (RTO) rates on COD shipments routinely hit 25–35% — and every RTO eats ~₹150–250 in forward + reverse logistics." },
      { type: "p", text: "The answer isn't 'pick one'. It's knowing when to default to each, and how to nudge buyers toward the option that's actually better for your unit economics." },

      { type: "h2", text: "Why COD still wins on conversion", id: "cod-conversion" },
      { type: "p", text: "Two reasons. First, trust: a buyer who hasn't seen your brand before would rather pay when the box arrives. Second, friction: typing a UPI ID, waiting for the OTP, switching to the banking app — every step loses 5–15% of buyers." },
      { type: "p", text: "For a first-time visitor on a single-product store, offering COD typically lifts add-to-cart-to-order conversion by 30–60% over prepaid-only checkout." },

      { type: "h2", text: "Why prepaid wins on profit", id: "prepaid-profit" },
      { type: "p", text: "Once an order is placed, prepaid is materially better:" },
      { type: "ul", items: [
        "RTO rate of 3–6% (vs 25–35% on COD).",
        "Cash flow lands on day 1, not day 14.",
        "Lower fulfilment cost — no cash-handling fee from the courier.",
        "Smaller fraud surface — no fake addresses placing 10 orders of 'buy now, refuse delivery'.",
      ]},

      { type: "h2", text: "The hybrid playbook", id: "hybrid" },
      { type: "p", text: "Sophisticated D2C brands in India do all three of these:" },
      { type: "ol", items: [
        "Offer both methods. Default selection = COD for first-time visitors, prepaid for repeat buyers.",
        "Charge a small COD fee (₹30–₹50). This alone nudges 15–25% of buyers to prepaid with almost no drop in total conversion.",
        "Block COD on bad pin codes. Build a denylist of pin codes with historical RTO > 50% and force prepaid there.",
      ]},

      { type: "h2", text: "The 'risk-free guarantee' angle", id: "guarantee" },
      { type: "p", text: "If you really need to push prepaid, frame it as a benefit, not a constraint. '100% refund within 7 days, no questions asked' on a prepaid order outperforms a generic 'Cash on Delivery available' badge for products under ₹2000." },

      { type: "h2", text: "When COD-only is fine", id: "cod-only" },
      { type: "p", text: "For your first 30 days, if you're shipping a sub-₹1000 product to a young audience that hasn't heard of you — go COD-only. Your job is to learn what converts; payments friction will mask that signal. Add prepaid once you've nailed the product page." },

      { type: "callout", text: "Don't agonise. Start COD-only, watch your RTO rate for 60 days, then add prepaid with a small COD fee. That single nudge is usually worth more than any pricing experiment." },
    ],
  },

  {
    slug: "10-conversion-tactics-one-product-stores",
    title: "10 Conversion Tactics That Actually Move the Needle for One-Product Stores",
    description:
      "Skip the 50-item Shopify checklists. Here are 10 specific, proven tactics for single-product stores — what to add, what to remove, and what to test first.",
    publishedAt: "2026-05-03",
    author: "Sainsberry Team",
    readingMinutes: 8,
    tags: ["conversion", "cro", "single-product", "playbook"],
    body: [
      { type: "p", text: "Single-product stores have one job: convert visitors into buyers. There's no upsell to a different SKU, no cross-sell to a category page. The product page IS the funnel. Here are 10 tactics that consistently lift conversion on focused stores." },

      { type: "h2", text: "1. Replace the carousel with a static hero", id: "static-hero" },
      { type: "p", text: "Image carousels drop conversion ~15% on product pages. Buyers don't wait for slide 4. Pick the single best photo and let it sit." },

      { type: "h2", text: "2. Put the price next to the name, not below the description", id: "price-position" },
      { type: "p", text: "Price answers a question buyers have before they finish reading the title. Putting it below the description forces them to scroll to a 'yes/no' point and many leave." },

      { type: "h2", text: "3. Use a sticky 'Buy now' bar on mobile", id: "sticky-buy" },
      { type: "p", text: "Mobile users scroll long pages. A sticky buy button keeps the action one tap away no matter where they are on the page. Worth 10–20% lift in mobile checkout starts." },

      { type: "h2", text: "4. Show stock scarcity only when it's real", id: "scarcity" },
      { type: "p", text: "'Only 3 left' is the highest-leverage word on the page — but only when it's true. Fake scarcity tanks brand trust permanently. Wire it to actual inventory or don't show it." },

      { type: "h2", text: "5. Quantity discount tiers (Buy 2, save 10%)", id: "quantity-tiers" },
      { type: "p", text: "On consumables and gifting, tiered discounts can lift AOV by 25–40%. Show the tier the buyer is currently in and the next tier they could unlock — 'Add 1 more to save 20%' is one of the best conversion phrases ever written." },

      { type: "h2", text: "6. Compress your above-the-fold to four elements", id: "above-fold" },
      { type: "p", text: "Image, name, price, buy button. That's it. Move social proof, ingredients, FAQ — all of it — below the fold. The hero exists to close fast buyers in one screen." },

      { type: "h2", text: "7. Add one specific guarantee", id: "guarantee" },
      { type: "p", text: "'30-day no-questions refund' is good. '30-day refund, you keep the box' is better. Specificity is what makes a guarantee feel real." },

      { type: "h2", text: "8. Real reviews with photos, not five-star averages", id: "reviews" },
      { type: "p", text: "A page with a 4.7-star aggregate and 0 reviews you can read converts worse than a page with 12 long, photo-heavy reviews and no star widget at all. Quality over signalling." },

      { type: "h2", text: "9. Remove all navigation except 'Cart' on the product page", id: "nav-trim" },
      { type: "p", text: "Every link in your header is a way out. On a single-product store, the buyer doesn't need 'Shop', 'Collections', 'About'. Keep brand wordmark + cart. That's it." },

      { type: "h2", text: "10. A one-tap add-on at checkout", id: "checkout-addon" },
      { type: "p", text: "Gift wrap, refill, accessory — one checkbox that adds 10–20% to AOV without slowing checkout. Don't show three add-ons; pick the one that converts best and feature only that." },

      { type: "callout", text: "Pick two of these to ship this week. Single-product stores compound — every percentage point you add to conversion shows up on every dollar of ad spend you'll ever run again." },
    ],
  },

  {
    slug: "quantity-discounts-vs-bogo",
    title: "Quantity Discounts vs BOGO: Which Drives More Revenue?",
    description:
      "Buy-One-Get-One feels exciting, but tiered quantity discounts almost always net more profit on single-product stores. Here's the math, with real examples.",
    publishedAt: "2026-05-15",
    author: "Sainsberry Team",
    readingMinutes: 5,
    tags: ["pricing", "promotions", "aov", "bogo"],
    body: [
      { type: "p", text: "'Buy One Get One Free' is the most famous promotion in retail. It also frequently destroys margin without lifting net revenue. For most single-product stores, tiered quantity discounts (Buy 2 save 10%, Buy 3 save 20%) outperform BOGO on both AOV and gross profit." },

      { type: "h2", text: "The math", id: "the-math" },
      { type: "p", text: "Assume a ₹1000 product with 60% margin (₹400 cost, ₹600 gross profit)." },
      { type: "h3", text: "BOGO 'Buy 1 Get 1 Free'", id: "bogo-math" },
      { type: "ul", items: [
        "Revenue: ₹1000",
        "Cost: ₹800 (you're shipping two units)",
        "Gross profit: ₹200",
        "Customer perceives a 50% saving",
      ]},
      { type: "h3", text: "Tiered 'Buy 2, save 20%'", id: "tier-math" },
      { type: "ul", items: [
        "Revenue: ₹1600",
        "Cost: ₹800",
        "Gross profit: ₹800",
        "Customer perceives a 20% saving",
      ]},
      { type: "p", text: "Same number of units shipped, same customer cost. Quantity discount makes 4× the profit. The customer 'felt' a smaller discount but bought the same volume." },

      { type: "h2", text: "When BOGO actually wins", id: "bogo-wins" },
      { type: "p", text: "BOGO outperforms tiered discounts in a few specific cases:" },
      { type: "ul", items: [
        "Inventory you must clear (seasonal, expiring) — the 'free' unit is salvage value.",
        "Acquiring a new buyer in a category they've never tried (the 'free' unit pays for trial).",
        "Gifting season — buyers want one to keep, one to give, and 'free' simplifies the decision.",
      ]},

      { type: "h2", text: "How to set up tiers", id: "tier-setup" },
      { type: "p", text: "Three tiers is the sweet spot. More than that and the buyer skims past." },
      { type: "ol", items: [
        "Tier 1 — Buy 2, save 10%",
        "Tier 2 — Buy 3, save 20%",
        "Tier 3 — Buy 5, save 30%",
      ]},
      { type: "p", text: "Show the buyer the tier they're currently qualifying for, and the next tier they could unlock. The phrase 'Add 1 more to save 20%' converts better than any discount badge." },

      { type: "h2", text: "What about percentage discounts?", id: "percent-off" },
      { type: "p", text: "Flat percent-off (10% off everything) is the worst promotion for single-product stores. You're discounting buyers who would have paid full price, with no behavioural lift. Quantity tiers only reward buyers who increase order size — every margin point you give up earns you AOV in return." },

      { type: "callout", text: "Default to quantity tiers. Reach for BOGO only when you have a specific reason — clearing inventory, breaking into a new category, or seasonal gifting." },
    ],
  },

  {
    slug: "launch-online-store-in-10-minutes",
    title: "Launch an Online Store in 10 Minutes: The 2026 Quickstart",
    description:
      "From zero to live URL in 10 minutes — no developer, no theme to customise. Here's the actual sequence: sign up, add product, take your first order.",
    publishedAt: "2026-05-28",
    author: "Sainsberry Team",
    readingMinutes: 4,
    tags: ["getting-started", "quickstart", "tutorial"],
    body: [
      { type: "p", text: "The hardest part of starting an online store is the part nobody talks about: getting from 'I have an idea' to 'I have a URL I can send people'. Most platforms make this take a week. It doesn't have to." },
      { type: "p", text: "Here's the actual 10-minute path with Sainsberry — single product, cash on delivery, live URL you can post on Instagram before lunch." },

      { type: "h2", text: "Minute 0–2: Sign up", id: "signup" },
      { type: "p", text: "Email, password, store name. Your store URL (sainsberry.com/s/your-name) is created automatically on signup — no DNS to configure, no domain to buy, no SSL to wait for." },

      { type: "h2", text: "Minute 2–5: Add your product", id: "add-product" },
      { type: "p", text: "Single-product stores have one form to fill:" },
      { type: "ul", items: [
        "Product name",
        "One-line subtitle (the headline that sells it)",
        "Price (and optional compare-at price for the strikethrough)",
        "Hero image",
        "Inventory count",
      ]},
      { type: "p", text: "Skip the description for now. You can write it after launch. A blank description still converts; an unpublished store doesn't." },

      { type: "h2", text: "Minute 5–7: Add upsells (optional but profitable)", id: "upsells" },
      { type: "p", text: "Drop in one or two add-ons (gift wrap, accessory) and one quantity discount tier ('Buy 2, save 10%'). These two changes alone typically lift first-month AOV by 25–40%." },

      { type: "h2", text: "Minute 7–9: Preview and publish", id: "preview" },
      { type: "p", text: "Open your storefront URL. Walk through buy → checkout → confirmation as if you were a customer. Look for typos, broken images, and unclear pricing. Fix anything that takes 30 seconds; everything else, ship and fix later." },

      { type: "h2", text: "Minute 9–10: Take the first order", id: "first-order" },
      { type: "p", text: "Post the URL in the first 5 places you have any audience — WhatsApp status, Instagram bio, one personal post, one comment on a relevant community thread, one DM to the friend most likely to buy." },
      { type: "p", text: "The first order doesn't need to be your mom's. But your mom counts too." },

      { type: "h2", text: "What to do next", id: "next" },
      { type: "p", text: "Once you have a live store and a few orders:" },
      { type: "ul", items: [
        "Write a proper description (story → outcome → specs → FAQ).",
        "Add 2–3 more gallery images.",
        "Wire up Google Analytics or any free analytics tool.",
        "Set up your first abandoned-cart email.",
      ]},

      { type: "callout", text: "The brands that grow fastest are the ones that ship first and polish second. A store live for 10 days with three flaws beats a perfect store launched next quarter every single time." },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function allPosts(): Post[] {
  return [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
