/*
 * content.js — fills the page with the content your dad edits in Pages CMS.
 *
 * HOW IT WORKS (the core CMS idea: content is separate from layout)
 *   1. The text, photos and contact details live in two data files:
 *        content/site.json     → hero, about, finishes, contact, social links
 *        content/catalog.json  → the 6 categories and their products
 *   2. The HTML keeps the layout, and marks the places to fill with attributes:
 *        data-text="site.hero.eyebrow"       → put this value as the element's text
 *        data-href="site.social.facebook"    → put this value in the link's href
 *        data-src="catalog.knobs.cover"      → put this value in the image's src
 *        data-render="finishes"              → build this block with a function below
 *   3. This script downloads both files, then fills every marked element.
 *
 * The text already written in the HTML stays as a fallback: if the JSON can't
 * load, visitors still see the old content instead of an empty page.
 */

(async function loadContent() {
  // cache: 'no-cache' asks the browser to check for a newer file,
  // so your dad's edits show up as soon as GitHub Pages has published them.
  const [site, catalog] = await Promise.all([
    fetch('content/site.json', { cache: 'no-cache' }).then(r => r.json()),
    fetch('content/catalog.json', { cache: 'no-cache' }).then(r => r.json()),
  ]).catch(err => {
    console.error('Could not load content, showing the built-in HTML text instead.', err);
    return [null, null];
  });
  if (!site || !catalog) return;

  const data = { site, catalog };

  // Read a value from a dotted path, e.g. get("site.hero.title").
  const get = path => path.split('.').reduce((obj, key) => (obj == null ? undefined : obj[key]), data);

  // Never insert edited text as raw HTML: escape it first, so a typo like "<"
  // can't break the page (and nobody can inject a script through the CMS).
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // "+963 21 267 2702" → "+963212672702" for tel: and WhatsApp links.
  const digits = phone => String(phone).replace(/[^\d+]/g, '');
  // Pages CMS saves uploaded photos as "/images/...". Removing the first "/" makes
  // the path relative, so it works both at infrastatera.github.io/gac-website/
  // and later at gacdoorhandles.com.
  const img = path => String(path ?? '').replace(/^\/+/, '');
  const waLink = phone => `https://wa.me/${digits(phone).replace('+', '')}`;

  // ---- 1. Simple fills ------------------------------------------------------
  document.querySelectorAll('[data-text]').forEach(el => {
    const v = get(el.dataset.text);
    if (v != null && v !== '') el.textContent = v;
  });
  document.querySelectorAll('[data-href]').forEach(el => {
    const v = get(el.dataset.href);
    if (v) el.href = (el.dataset.hrefPrefix || '') + v;
  });
  document.querySelectorAll('[data-src]').forEach(el => {
    const v = get(el.dataset.src);
    if (v) el.src = img(v);
  });

  // ---- 2. Blocks built from lists ------------------------------------------
  // Each function returns the HTML for one data-render="name" element.
  const renderers = {
    // "Designing Dream Interiors" with "Dream" in italics, then a line break.
    heroTitle: () => {
      const { title, highlight } = site.hero;
      const t = esc(title);
      return highlight && title.includes(highlight)
        ? t.replace(esc(highlight), `<em>${esc(highlight)}</em><br>`)
        : t;
    },
    aboutParagraphs: () => site.about.paragraphs.map(p => `<p>${esc(p)}</p>`).join(''),
    finishes: () => site.finishes.map(f => `<span class="finish-chip">${esc(f)}</span>`).join(''),

    footerContact: () => {
      const c = site.contact;
      return `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>
        <a href="${waLink(c.whatsapp)}" target="_blank" rel="noopener">WhatsApp: ${esc(c.whatsapp)}</a>
        ${c.phones[0] ? `<a href="tel:${digits(c.phones[0])}">Office: ${esc(c.phones[0])}</a>` : ''}`;
    },
    // The first location that has an address (the main office).
    footerLocation: () => {
      const loc = site.contact.locations.find(l => l.address);
      return loc ? `<p>${esc(loc.address).replace(/\n/g, '<br>')}</p>` : '';
    },
    year: () => String(new Date().getFullYear()),

    // Contact page
    phones: () => site.contact.phones.map(p => `<a href="tel:${digits(p)}">${esc(p)}</a>`).join(''),
    internationalPhones: () => site.contact.locations.filter(l => l.phone).map(l =>
      `<a href="tel:${digits(l.phone)}">${esc(l.label)}: ${esc(l.phone)} (Call &amp; WhatsApp)</a>`).join(''),
    locations: () => site.contact.locations.map(l => `
      <div class="contact-info-block" style="margin-bottom:2rem">
        <span class="contact-label">${esc(l.label)}</span>
        ${l.address ? `<p>${esc(l.address).replace(/\n/g, '<br>')}</p>` : ''}
        ${l.phone ? `<p><a href="tel:${digits(l.phone)}">${esc(l.phone)}</a><br>
          <small style="color:var(--gold);font-size:0.72rem;letter-spacing:0.1em">CALL &amp; WHATSAPP</small></p>` : ''}
      </div>`).join(''),

    // Product grid on a category page (the page sets CATEGORY, e.g. 'knobs').
    products: () => {
      const items = (catalog[window.CATEGORY] || {}).products || [];
      if (!items.length) {
        return '<p style="text-align:center;color:var(--text-light);padding:4rem 0;">No products found in this category yet.</p>';
      }
      return items.map((p, i) => `
        <div class="product-card" data-img-src="${esc(img(p.image))}" data-name="${esc(p.name)}" data-index="${i}">
          <img src="${esc(img(p.image))}" alt="${esc(p.name)}" loading="lazy"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
          <div class="img-placeholder" style="display:none">
            <span class="icon">&#10022;</span><span>${esc(p.name)}</span>
          </div>
          <div class="product-card-overlay"></div>
          <div class="product-card-info">
            <p class="product-card-name">${esc(p.name)}</p>
            <p class="product-card-tag">Brass Hardware</p>
          </div>
          <div class="product-card-zoom">&#8853;</div>
        </div>`).join('');
    },
  };

  document.querySelectorAll('[data-render]').forEach(el => {
    const fn = renderers[el.dataset.render];
    if (fn) el.innerHTML = fn();
  });

  // ---- 3. Images set through CSS -------------------------------------------
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg && site.hero.image) {
    heroBg.style.backgroundImage = `linear-gradient(135deg, rgba(28,28,28,0.88) 0%, rgba(28,28,28,0.5) 60%,
      rgba(184,150,62,0.15) 100%), url('${encodeURI(img(site.hero.image))}')`;
  }

  // Product cards were just created, so connect the lightbox now (see main.js).
  if (typeof initProductCards === 'function') initProductCards();
})();
