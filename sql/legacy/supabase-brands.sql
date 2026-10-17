-- Add brands page to page_content table
insert into public.page_content (page_key, page_title, banner_eyebrow, banner_title, banner_subtitle)
values ('brands', 'Brands Page', 'Our Brands', 'Shop by Brand', 'Discover premium beauty brands curated for every skin tone and type.')
on conflict (page_key) do nothing;

-- Upgrade your account to super_admin
-- Replace YOUR_EMAIL with your actual email address
-- update public.profiles set role = 'super_admin' where email = 'YOUR_EMAIL';

select 'Brands page content seeded ✓' as result;
