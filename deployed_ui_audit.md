# Deployed Threadzw UI Audit — 2026-08-24

## Public landing page

The deployed app is branded as “ThreadZW” with a black, white, and neon-lime visual system. The hero communicates the core value clearly: build a shop, show stock, and receive WhatsApp orders. The public page is visually strong but has several trust and consistency issues: it still uses “ThreadZW Pro” and “Orders” language even though the current business model is Premium access plus WhatsApp customer interests; it displays placeholder/test storefront names such as `__TEST_DUMMY_SHOP__`; it claims “+20 active Zimbabwean reseller stores” without visible validation; and the landing page copy still describes the old limited-free/product-count model in its FAQ area.

The hero CTA is prominent and the phone mockup is relevant to Zimbabwean clothing sellers. The page is long and content-rich, but the primary action is repeated many times; the pricing and trust explanation should appear earlier and make the lifetime usage thresholds explicit.

## Signup entry screen

The deployed `/signup` route begins with an attractive editorial-style introduction: “Launch your clothing store in under 60 seconds.” The screen is mobile-first and visually sparse. It uses a large empty white canvas, a small centered collage, and a bottom CTA. The promise is clear, but the screen does not show the onboarding steps, the free-plan value, or the information needed to complete setup. The top brand is small and low-contrast, and the user must infer how many steps remain.

## First onboarding step

The first setup screen asks “What’s your shop called?” and provides a single text input with a good example placeholder. The back button and progress indicator are present, but the progress indicator is too subtle and not labeled; the continue CTA is anchored at the bottom with substantial unused whitespace. The screen should provide a stronger sense of progress, a short reassurance about what will happen next, and validation guidance for the shop handle/name. It should also avoid any future steps that ask for unnecessary formal company information, consistent with the requirement that no BP number or formal company documents are needed for initial setup.

## Second onboarding step

The second screen asks where the seller heard about ThreadZW, with seven options and a continue button. The screen is functional and lightweight, but it is not essential to launching a shop and currently consumes one of the visible onboarding steps. It should be framed as optional (“helps us improve” rather than a required-feeling step), and the progress indicator should communicate the actual remaining setup effort. The selected TikTok state is visually clear, although the list feels vertically compressed on desktop while the screen retains large unused space below.

## Account creation and completion

The account form requests email, WhatsApp phone number, and password in one compact step. The live test account was created successfully without email verification, confirming that the disabled-verification environment supports frictionless testing. Immediately after signup, the app shows a “Welcome to ThreadZW!” completion screen stating that the storefront is live and asking the user to continue to make it look like their brand. This is a strong confirmation moment, but it would benefit from an explicit checklist showing what is already complete and what the seller should do next (for example: add first product, add WhatsApp number, add location, share link).

## Category selection

The post-signup flow asks “What do you sell?” and presents Clothing, Cars & Vehicles, and Other Products. Clothing is selected by default, while the other categories are marked “Coming Soon.” This is a useful direction-setting step, but because the current rebuild is clothing-only, the screen could be simplified to a positive clothing-specific confirmation or make the unavailable choices clearly non-interactive. The current category cards are visually readable and use relevant icons, but the large unused lower area again makes the journey feel longer than necessary.

## Brand description

The next screen asks the seller to tell people about the brand, offering preset tags such as Streetwear brand, Sneaker store, Thrift store, Premium fashion, Local clothing brand, and Vintage clothing, plus a 160-character bio. This is relevant content for a storefront and is a good step to keep. The primary improvement should be to show a live storefront preview or example bio, keep the character count close to the field, and make the CTA feel enabled only after the seller has either chosen a tag or entered a short bio.

## Brand tag interaction

Selecting a preset tag automatically writes a long, usable starter bio into the textarea and updates the character count to 113/160. This is a strong onboarding pattern because it reduces blank-page friction. The improvement opportunity is to make the generated bio visibly editable and explain that it is a starting point, while keeping the step visually compact and showing the seller’s chosen shop name in the header or preview.

## Plan selection

The live plan step is the clearest mismatch with the new business rules. Free is presented as “Up to 9 products,” while Threadzw Premium is labeled “Coming Soon,” even though Premium/NardoPay is the intended paid architecture. The free card also lists dynamic themes and video backgrounds without clearly separating what is available now. This screen should present Free as unlimited products with 50 unique visits and 10 interests for life, and Premium as available now with a clear one-off price, benefits, and “Continue with Free” / “Upgrade to Premium” actions. This is the highest-priority onboarding correction.

## Free-plan activation confirmation

The final onboarding confirmation says “Your shop has been activated” and displays a shop link plus WhatsApp direct ordering, custom banner/logo, and “Lifetime active subscription.” The wording is misleading under the rebuilt architecture: the free plan is not a lifetime subscription, and the screen should instead say “Free storefront active” with the 50-visit / 10-interest lifetime allowance. It also should provide an immediate next-step checklist rather than only a dashboard CTA. The generated link shown in the live app uses `threadzw.co/shop/...`, while the deployed host is `threadzw.vercel.app`, so canonical-domain consistency should be verified.

## Merchant dashboard

The authenticated dashboard loads successfully and shows a useful first-run checklist: complete shop profile, add first product, and share the shop. It also displays a tutorial overlay on top of the dashboard. The dashboard’s largest business-rule mismatch is the plan card: it says “Clothing Free,” displays “0 / 9 products used,” and offers “Upgrade to Pro.” The KPI area also says “WhatsApp Orders,” while the product experience is actually WhatsApp customer interests. These should be replaced with two compact lifetime meters: unique visits (0/50) and interests (0/10), plus a Premium CTA.

The dashboard has strong structure, but the tutorial overlay obscures the underlying page, and the empty-state path currently presents many simultaneous “Start,” “Add,” “View all,” and tutorial actions. A prioritized “Next best action” card would reduce cognitive load for a new seller.

## Products screen

The empty inventory screen is clean and has prominent Add Product actions, but it still shows “0 / 2 used,” which is a separate legacy product-count limit and directly contradicts the intended unlimited clothing catalog. The empty-state sentence “Modify your keywords or add items matching other categories” is generic and slightly confusing when no search query exists. It should say “Your catalog is empty” and guide the seller through adding the first product with a concise checklist for image, price, size, colour, and stock.

## Account and profile editing

The account screen presents a polished storefront-style profile with share and edit actions, but its metrics are still “Products,” “Shop Views,” and “WhatsApp Clicks,” which should align with the lifetime quota terminology. The profile editor is a compact list of rows for profile photo, banner, shop name, username, bio, directions, category, and WhatsApp number. This is visually efficient, but the “Banner None” and “Add location/directions” states are too passive for first-run setup; they should be presented as actionable setup cards with examples and completion status. The editor also has no inline indication of the 160-character bio limit or phone-format help.

## Public storefront and catalog

The public storefront is visually coherent and mobile-first, with a strong header, shop identity, share/search/cart controls, a prominent Browse Catalog CTA, and a bottom navigation bar. The empty storefront is informative but still says “No active catalog items available” and “No active apparel matches your selection”; a first-run shop should instead show an illustrated add-first-product prompt that points the owner to the dashboard while remaining neutral for customers.

The catalog view is compact and easy to scan. Its main design opportunity is to avoid displaying an empty search/filter shell when there are no products and to show a clear “This shop is setting up its first drop” message. Customer-facing CTAs should later use the usage RPC before opening WhatsApp or directions, while the catalog itself must remain browsable after a free shop reaches its lifetime threshold.
