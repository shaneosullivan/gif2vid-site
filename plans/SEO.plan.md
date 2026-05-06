# SEO Improvement Plan — gif2vid.com

**Audited:** 2026-05-06  
**Site:** https://gif2vid.com  
**Stack:** Plain HTML/CSS/TypeScript, esbuild, PWA, Simple Analytics

---

## Current State Summary

The site has a solid foundation: correct title tag, well-written meta description, canonical link, full OG/Twitter card tags, `lang` attribute, and a clean robots.txt. However it has significant gaps in structured data, heading hierarchy, page content depth, and a few missing technical quick-wins that are all straightforward to fix given the static HTML setup.

---

## Issues & Recommendations

Issues are grouped by priority. Each has a concrete implementation note.

---

### Priority 1 — High Impact, Quick Wins

---

#### 1.1 Add `sitemap.xml`

**Issue:** No `sitemap.xml` exists. The `robots.txt` has no `Sitemap:` directive.  
**Why it matters:** Even for a single-page site, a sitemap accelerates Googlebot discovery and confirms the canonical URL.

**Fix — create `/sitemap.xml`:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://gif2vid.com/</loc>
    <lastmod>2026-05-06</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

**Fix — add to bottom of `robots.txt`:**

```
Sitemap: https://gif2vid.com/sitemap.xml
```

---

#### 1.2 Add JSON-LD Structured Data (`WebApplication`)

**Issue:** Zero structured data on the page. This is the single highest-leverage SEO change available.  
**Why it matters:** Structured data gives Google explicit semantic context about the tool, can unlock rich results in SERPs, and reinforces the page's purpose for competitive keywords like "GIF to MP4 converter online free".

**Fix — add inside `<head>` in `index.html`:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "GIF to Video Converter",
  "url": "https://gif2vid.com/",
  "description": "Convert GIF animations to MP4 videos instantly in your browser. Free, private, no upload needed. Works offline.",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Any",
  "browserRequirements": "Requires a modern browser with WebAssembly support",
  "featureList": [
    "GIF to MP4 conversion",
    "Client-side processing (no upload)",
    "Offline support",
    "Up to 90% file size reduction"
  ],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Person",
    "name": "Shane O'Sullivan",
    "url": "https://chofter.com"
  }
}
</script>
```

---

#### 1.3 Strengthen the `<h1>` Tag

**Issue:** Current H1 is `GIF to Video Converter`. The page title leads with "Free GIF to MP4 Converter - Convert GIF to Video Online" — far more keyword-rich.  
**Why it matters:** Google treats H1 as a primary on-page signal. The current H1 wastes the highest-weight heading slot.

**Fix — in `index.html` line 82:**

```html
<!-- Before -->
<h1 class="title">GIF to Video Converter</h1>

<!-- After -->
<h1 class="title">Free GIF to MP4 Converter Online</h1>
```

---

#### 1.4 Add `<h2>` Before the Explainer Paragraph

**Issue:** The paragraph at `index.html` lines 134–139 ("Converting GIFs to videos makes it possible to upload them to platforms...") is the most SEO-valuable body copy on the page, but it has no heading above it. Crawlers heavily weight text that follows headings.  
**Why it matters:** This paragraph naturally targets queries like "why convert GIF to MP4", "GIF to Instagram", "GIF to TikTok". It needs a heading anchor.

**Fix — wrap the paragraph at line 134:**

```html
<h2 class="why-heading">Why Convert GIF to Video?</h2>
<p class="subtitle">
  Converting GIFs to videos makes it possible to upload them to
  platforms that don't support GIFs, like Instagram and TikTok. MP4
  videos also offer better compression, resulting in smaller file sizes
  without significant loss of quality.
</p>
```

**Suggested CSS for `.why-heading`** (add to `styles.css`):

```css
.why-heading {
  font-size: 1.2rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  color: inherit;
}
```

---

#### 1.5 Add LCP Preload for Hero Image

**Issue:** The hero image (`/images/hero_small.jpg`) is loaded via a CSS `background-image`, which means the browser only discovers it after parsing the stylesheet. This delays LCP (Largest Contentful Paint), a Core Web Vitals ranking factor.  
**Why it matters:** LCP is a direct Google ranking signal.

**Fix — add inside `<head>` in `index.html` (before `<link rel="stylesheet">`):**

```html
<link rel="preload" as="image" href="/images/hero_small.jpg" fetchpriority="high" />
```

---

### Priority 2 — Medium Impact

---

#### 2.1 Add `og:site_name`

**Issue:** The Open Graph block is missing `og:site_name`.  
**Why it matters:** Facebook and LinkedIn use this when rendering share cards. Without it the site name may be shown as the raw domain.

**Fix — add to OG block in `index.html`:**

```html
<meta property="og:site_name" content="Gif2Vid" />
```

---

#### 2.2 Add `twitter:site` and `twitter:creator`

**Issue:** Twitter/X card tags are missing `twitter:site` and `twitter:creator`.  
**Why it matters:** Strengthens social attribution and improves appearance in tweet cards.

**Fix — add to Twitter block in `index.html`:**

```html
<meta property="twitter:site" content="@chofter" />
<meta property="twitter:creator" content="@chofter" />
```


---

#### 2.3 Add `rel="author"` to Footer Attribution Link

**Issue:** The footer link `<a href="https://chofter.com" rel="noopener">` is missing `rel="author"`.  
**Why it matters:** `rel="author"` strengthens E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals for Google. Especially relevant for a single-author tool site.

**Fix — `index.html` line 145:**

```html
<!-- Before -->
<a href="https://chofter.com" target="_blank" rel="noopener">Shane O'Sullivan</a>

<!-- After -->
<a href="https://chofter.com" target="_blank" rel="noopener author">Shane O'Sullivan</a>
```

---

#### 2.4 Connect Google Search Console

**Issue:** No `<meta name="google-site-verification">` tag is present.  
**Why it matters:** Search Console is the primary tool for monitoring indexing, click-through rates, impressions, and crawl errors. It does not affect rankings but is essential for ongoing SEO visibility.

**Options (pick one):**
1. Add verification meta tag to `<head>`: `<meta name="google-site-verification" content="YOUR_TOKEN" />`
2. Upload a `google<token>.html` verification file to the root.
3. Add a DNS TXT record (no code change needed).

---

#### 2.5 Add FAQ Section for Long-Tail Keywords

**Issue:** The page is very thin on content — only one real paragraph of body copy. Competitors (ezgif.com, cloudconvert.com, convertio.co) all have significantly more content and FAQ sections.  
**Why it matters:** FAQ content targets long-tail queries and gives Google more semantic signal about the page's topic. Combined with `FAQPage` JSON-LD structured data, it can unlock FAQ rich results in SERPs.

**Fix — add an FAQ section above the footer:**

```html
<section class="faq-section">
  <h2>Frequently Asked Questions</h2>
  <dl class="faq-list">
    <dt>Is gif2vid free to use?</dt>
    <dd>Yes, gif2vid is completely free with no usage limits.</dd>

    <dt>Does my GIF get uploaded to a server?</dt>
    <dd>No. All conversion happens directly in your browser. Your files never leave your device.</dd>

    <dt>What video format does gif2vid produce?</dt>
    <dd>gif2vid converts GIFs to MP4 (H.264) format, which is compatible with Instagram, TikTok, Twitter/X, and all major video platforms.</dd>

    <dt>How much smaller will the MP4 be compared to my GIF?</dt>
    <dd>MP4 videos are typically 80–90% smaller than the equivalent GIF with no visible loss of quality.</dd>

    <dt>Does gif2vid work offline?</dt>
    <dd>Yes. Once the page has loaded, gif2vid works without an internet connection.</dd>
  </dl>
</section>
```

**Add FAQ JSON-LD to `<head>`:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is gif2vid free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, gif2vid is completely free with no usage limits."
      }
    },
    {
      "@type": "Question",
      "name": "Does my GIF get uploaded to a server?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. All conversion happens directly in your browser. Your files never leave your device."
      }
    },
    {
      "@type": "Question",
      "name": "What video format does gif2vid produce?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "gif2vid converts GIFs to MP4 (H.264) format, compatible with Instagram, TikTok, Twitter/X, and all major video platforms."
      }
    },
    {
      "@type": "Question",
      "name": "How much smaller will the MP4 be compared to my GIF?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MP4 videos are typically 80–90% smaller than the equivalent GIF with no visible loss of quality."
      }
    },
    {
      "@type": "Question",
      "name": "Does gif2vid work offline?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Once the page has loaded, gif2vid works without an internet connection."
      }
    }
  ]
}
</script>
```

---

### Priority 3 — Low Impact / Cleanup

---

#### 3.1 Remove Ignored/Non-Standard Meta Tags

**Issue:** Three meta tags are present that have no effect on any major search engine:

| Tag | Reason to Remove |
|-----|-----------------|
| `<meta name="keywords">` | Google has ignored this since 2009; Bing since ~2011 |
| `<meta name="revisit-after" content="7 days">` | Not recognized by any major crawler |
| `<meta name="language" content="English">` | Non-standard; `<html lang="en">` already handles this |

**Fix:** Delete lines 16–18, 58–59 from `index.html`.

---

#### 3.2 Tighten `robots.txt` Disallow Rules

**Issue:** `Disallow: /*.json$` blocks all `.json` files, then `Allow: /manifest.json` is needed to undo it. This is redundant and fragile — the `Allow:` rule only works because it comes after `Disallow:` and is more specific. The disallow for `.ts` files is also over-broad (TypeScript source files aren't served in production anyway).

**Fix — replace the current disallows with specific filenames:**

```
# robots.txt for gif2vid.com

User-agent: *
Allow: /

Disallow: /dist/
Disallow: /node_modules/
Disallow: /package.json
Disallow: /package-lock.json
Disallow: /tsconfig.json

Sitemap: https://gif2vid.com/sitemap.xml
```

---

## Implementation Checklist

| # | Task | Priority | File(s) |
|---|------|----------|---------|
| 1 | Create `sitemap.xml` | High | `/sitemap.xml` (new file) |
| 2 | Add `Sitemap:` to `robots.txt` | High | `robots.txt` |
| 3 | Add `WebApplication` JSON-LD | High | `index.html` `<head>` |
| 4 | Strengthen H1 text | High | `index.html:82` |
| 5 | Add `<h2>` before explainer paragraph | High | `index.html:134` |
| 6 | Add `<link rel="preload">` for hero image | High | `index.html` `<head>` |
| 7 | Add `og:site_name` | Medium | `index.html` |
| 8 | Add `twitter:site` / `twitter:creator` | Medium | `index.html` |
| 9 | Add `rel="author"` to footer link | Medium | `index.html:145` |
| 10 | Set up Google Search Console | Medium | DNS / file / meta tag |
| 11 | Add FAQ section + `FAQPage` JSON-LD | Medium | `index.html` + `styles.css` |
| 12 | Remove ignored meta tags (`keywords`, `revisit-after`, `language`) | Low | `index.html` |
| 13 | Tighten `robots.txt` disallow rules | Low | `robots.txt` |

---

## What's Already Good (Keep)

- **Title tag:** 57 chars, keyword-rich, brand at end. Don't change.
- **Meta description:** Under 160 chars, includes key USPs (free, private, no upload, offline, 90% smaller). Don't change.
- **Canonical tag:** Present and correct.
- **OG/Twitter cards:** Structurally correct; 1200×630 image, alt text present.
- **`<html lang="en">`:** Correct.
- **Viewport meta:** Present.
- **robots.txt `index, follow`:** Correct.
- **PWA manifest:** Well-formed; installability signals are a positive.
- **Analytics:** Simple Analytics loads async, no CWV impact.
- **GitHub SVG alt text:** `alt="GitHub"` — correct.
