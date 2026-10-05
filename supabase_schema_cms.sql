-- ============================================================
-- OneNetworx Platform — CMS System
-- Run this to enable the Admin Settings CMS feature.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    hero_heading text NOT NULL DEFAULT 'Elite Remote Sales. Zero Compromise.',
    hero_subheading text NOT NULL DEFAULT 'Join the top 1% of distributed agents. We provide the accounts, the training, and the infrastructure. You bring the closing power.',
    hero_image_url text NOT NULL DEFAULT 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    philosophy_main text NOT NULL DEFAULT '"The future of sales isn''t in a cubicle. It''s distributed, asynchronous, and utterly relentless."',
    privacy_policy_html text NOT NULL DEFAULT '<h2>Privacy Policy</h2><p>Your privacy is important to us. We only collect the necessary data to process your application and facilitate your employment.</p>',
    terms_service_html text NOT NULL DEFAULT '<h2>Terms of Service</h2><p>By applying to OneNetworx, you agree to submit truthful information and abide by our professional standards during the screening process.</p>',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure there is always exactly one row for configuration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.platform_settings) THEN
        INSERT INTO public.platform_settings (
            hero_heading, 
            hero_subheading, 
            hero_image_url, 
            philosophy_main,
            privacy_policy_html,
            terms_service_html
        ) VALUES (
            'Elite Remote Sales. Zero Compromise.',
            'Join the top 1% of distributed agents. We provide the accounts, the training, and the infrastructure. You bring the closing power.',
            'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            '"The future of sales isn''t in a cubicle. It''s distributed, asynchronous, and utterly relentless."',
            '<h2>Privacy Policy</h2><p>Your privacy is important to us. We only collect the necessary data to process your application and facilitate your employment.</p>',
            '<h2>Terms of Service</h2><p>By applying to OneNetworx, you agree to submit truthful information and abide by our professional standards during the screening process.</p>'
        );
    END IF;
END $$;
