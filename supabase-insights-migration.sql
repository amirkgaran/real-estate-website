-- MyInvest editable Insights migration
-- Run this ONCE in Supabase -> SQL Editor -> New query.
-- It creates the Insights content table, security policies, and seeds the
-- seven articles already shown on the public Insights page.

create extension if not exists pgcrypto;

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  title text not null,
  body text not null,
  display_order integer not null default 100,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.insights enable row level security;

grant select on public.insights to anon;
grant select, insert, update, delete on public.insights to authenticated;

drop policy if exists "Public can view published insights" on public.insights;
create policy "Public can view published insights"
on public.insights for select
to anon
using (published = true);

drop policy if exists "Admins can view all insights" on public.insights;
create policy "Admins can view all insights"
on public.insights for select
to authenticated
using (public.is_site_admin());

drop policy if exists "Admins can insert insights" on public.insights;
create policy "Admins can insert insights"
on public.insights for insert
to authenticated
with check (public.is_site_admin());

drop policy if exists "Admins can update insights" on public.insights;
create policy "Admins can update insights"
on public.insights for update
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "Admins can delete insights" on public.insights;
create policy "Admins can delete insights"
on public.insights for delete
to authenticated
using (public.is_site_admin());

insert into public.insights (slug, category, title, body, display_order, published)
values
(
  'buying',
  'Buying',
  'Before you buy',
  '1. Clarify your objective. Decide whether the property is for personal use, income, appreciation or a combination.
2. Establish a realistic budget. Include the down payment, closing costs, land transfer tax, financing costs and a reserve for unexpected expenses.
3. Get financing organized early. A pre-approval helps establish your range, but final approval still depends on the property and lender review.
4. Study the location. Consider transportation, schools, employment, development plans, supply, demand and resale appeal.
5. Inspect and investigate. Review the physical condition, legal status and relevant documents before making a firm commitment.
6. Think about the exit before the entry. Ask who is likely to buy or rent the property from you in the future.',
  10,
  true
),
(
  'selling',
  'Selling',
  'Preparing for a stronger sale',
  '1. Start with the market, not emotion. Pricing should be based on current competition, comparable sales and buyer behaviour.
2. Prepare the property. Repairs, presentation, cleanliness and photography can materially affect first impressions.
3. Understand your net proceeds. Consider mortgage discharge, commissions, legal costs, adjustments and potential tax implications.
4. Choose the right launch strategy. Timing, pricing, offer strategy and marketing should reflect the specific market—not a one-size-fits-all formula.
5. Evaluate the whole offer. Price matters, but so do financing conditions, deposits, closing date and certainty of completion.',
  20,
  true
),
(
  'residential-investing',
  'Residential Investing',
  'Look beyond the purchase price',
  'A residential investment should be evaluated as an asset, not just as a property you like. Estimate realistic rent, vacancy, taxes, insurance, maintenance, condominium fees where applicable, financing costs and future capital expenditures.

- Rental demand
- Cash flow
- Tenant profile
- Maintenance burden
- Financing
- Resale liquidity

A property can appreciate and still be a poor investment if carrying costs, financing or risk are not properly understood.',
  30,
  true
),
(
  'commercial-real-estate',
  'Commercial Real Estate',
  'Income quality is as important as the building',
  'Commercial property requires a different level of analysis. Review the leases, tenant quality, remaining lease terms, operating expenses, recoveries, vacancies, environmental considerations, zoning and future capital needs.

- Understand net operating income and how it is calculated.
- Review lease expiries and concentration risk.
- Confirm zoning and permitted use before relying on future plans.
- Budget for vacancy, leasing commissions, tenant improvements and capital expenditures.
- Compare the expected return with the risk and financing structure.',
  40,
  true
),
(
  'financing',
  'Financing',
  'The financing structure can change the investment',
  'The lowest advertised interest rate is not always the best financing decision. Consider amortization, term, prepayment options, qualification requirements, renewal risk and how much flexibility you may need later.

- Stress-test the payment at higher rates.
- Maintain liquidity instead of investing every available dollar.
- Understand fixed versus variable-rate risk.
- For income property, evaluate debt service alongside realistic net income.',
  50,
  true
),
(
  'investment-strategy',
  'Investment Strategy',
  'Good opportunities should fit a plan',
  'Before deciding whether an investment is “good,” define what good means for you. Different investors may prioritize income, growth, capital preservation, tax efficiency, redevelopment potential or diversification.

- What is the expected return? Use reasonable assumptions rather than best-case projections.
- What can go wrong? Consider vacancy, repairs, interest rates, market changes and unexpected capital needs.
- How long can you hold? Real estate often rewards patience but can punish forced selling.
- What is the exit strategy? Know the likely buyer, tenant or redevelopment path before committing.',
  60,
  true
),
(
  'market-tips',
  'Market Tips',
  'Do not make decisions from headlines alone.',
  'Real estate markets are local and segmented. A condominium, detached home, small apartment building and retail plaza can behave very differently at the same time. Interest rates, inventory, employment, population growth, development activity and buyer confidence all matter—but their impact differs by property and location.

- Watch supply: New listings, construction and competing inventory.
- Watch demand: Buyer activity, rental demand, employment and population trends.
- Watch financing: Rates, lender appetite and qualification standards.
- Watch the property: A strong asset can outperform a weak market, and a weak asset can underperform a strong one.',
  70,
  true
)
on conflict (slug) do nothing;
