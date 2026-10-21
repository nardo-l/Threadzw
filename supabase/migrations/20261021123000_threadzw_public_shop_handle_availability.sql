-- Public onboarding only needs a yes/no answer; never expose shop records for handle checks.
CREATE OR REPLACE FUNCTION public.is_shop_slug_available(p_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    nullif(lower(trim(both '-' from regexp_replace(coalesce(p_slug, ''), '[^a-zA-Z0-9]+', '-', 'g'))), '') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.shops s
      WHERE lower(s.slug) = lower(trim(both '-' from regexp_replace(coalesce(p_slug, ''), '[^a-zA-Z0-9]+', '-', 'g')))
    );
$function$;

REVOKE ALL ON FUNCTION public.is_shop_slug_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_shop_slug_available(text) TO anon, authenticated;
