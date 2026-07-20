// partials.js — injects shared header, mobile nav, floating actions & footer
(function(){
  const path = location.pathname;
  const isRoot = path.endsWith('/') || path.endsWith('/index.html') || path === '' ;
  // works whether pages sit at root or in /blog//thank-you/
  const depth = (path.match(/\/(?!$)/g) || []).length; // rough depth for relative paths
  const base = path.includes('/blog/') || path.includes('/thank-you/') ? '../' : '';

  const nav = [
    ['Home', base + 'index.html'],
    ['About', base + 'about.html'],
    ['Amenities', base + 'amenities.html'],
    ['Floor Plans', base + 'floor-plans.html'],
    ['Price', base + 'price.html'],
    ['Gallery', base + 'gallery.html'],
    ['Location', base + 'location.html'],
    ['Builder', base + 'builder.html'],
    ['FAQ', base + 'faq.html'],
    ['Blog', base + 'blog/index.html'],
    ['Contact', base + 'contact.html'],
  ];

  const currentFile = path.split('/').pop() || 'index.html';

  function isCurrent(href){
    return href.endsWith(currentFile) && currentFile !== '';
  }

  const headerHTML = `
  <a href="#main" class="skip-link">Skip to main content</a>
  <header class="site-header">
    <div class="nav-wrap">
      <a href="${base}index.html" class="brand">
        <img src="${base}assets/img/logo-icon.png" alt="Vintage Greens logo" class="brand-mark" width="36" height="31">
        Vintage Greens
      </a>
      <nav class="nav-links" aria-label="Primary">
        ${nav.slice(0,9).map(([label,href])=>`<a href="${href}" ${isCurrent(href)?'aria-current="page"':''}>${label}</a>`).join('')}
      </nav>
      <div class="nav-cta">
        <a href="tel:+917508058594" class="btn btn-outline btn-sm">Call Now</a>
        <a href="${base}contact.html" class="btn btn-primary btn-sm">Book Site Visit</a>
      </div>
      <button class="burger" id="burgerBtn" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="mobile-menu" id="mobileMenu">
      ${nav.map(([label,href])=>`<a href="${href}" ${isCurrent(href)?'aria-current="page"':''}>${label}</a>`).join('')}
      <a href="${base}contact.html" class="btn btn-primary" style="margin-top:14px;">Book Site Visit</a>
    </div>
  </header>`;

  const footerHTML = `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <h4 style="font-family:var(--font-display);font-size:22px;text-transform:none;letter-spacing:0;color:#fff;">Vintage Greens</h4>
          <p style="color:rgba(255,255,255,.6);font-size:14px;max-width:34ch;">Luxury 3 BHK &amp; 4 BHK high-rise residences by Vintage Buildtech, on Airport Road, Zirakpur.</p>
          <div class="badges" style="margin-top:16px;">
            <span class="badge" style="background:rgba(255,255,255,.06);color:#E7D5A6;border-color:rgba(255,255,255,.15);">RERA: PBRERA-SAS79-PR1181</span>
          </div>
        </div>
        <div>
          <h4>Explore</h4>
          <a href="${base}about.html">About the Project</a>
          <a href="${base}amenities.html">Amenities</a>
          <a href="${base}floor-plans.html">Floor Plans</a>
          <a href="${base}price.html">Price</a>
          <a href="${base}gallery.html">Gallery</a>
        </div>
        <div>
          <h4>Company</h4>
          <a href="${base}builder.html">Builder Profile</a>
          <a href="${base}location.html">Location</a>
          <a href="${base}blog/index.html">Blog</a>
          <a href="${base}faq.html">FAQ</a>
          <a href="${base}privacy-policy.html">Privacy Policy</a>
        </div>
        <div>
          <h4>Contact</h4>
          <a href="tel:+917508058594">+91 75080 58594</a>
          <a href="${base}contact.html">Vintage Greens, PR-7, International Airport Road, Ramgarh Bhudda, Zirakpur - 140603</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; <span id="yr"></span> vintagegreenszirakpur.in — Authorised Marketing Partner</span>
        <span>Designed for Vintage Greens, Zirakpur</span>
      </div>
      <p class="footer-disclaimer">Disclaimer: This website is an independent lead-generation platform run by an authorised marketing partner and is not the official website of Vintage Buildtech. Images used are for representational purposes. Prices, floor areas, specifications and possession timelines are subject to change at the developer's discretion and RERA filings — please verify all details before making a purchase decision. RERA No. PBRERA-SAS79-PR1181, www.rera.punjab.gov.in</p>
    </div>
  </footer>
  <div class="float-actions">
    <a href="https://wa.me/917508058594?text=Hi%2C%20I%27m%20interested%20in%20Vintage%20Greens%2C%20Zirakpur" class="fab fab-wa" aria-label="Chat on WhatsApp" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.9.53 3.68 1.44 5.2L2 22l4.94-1.41A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.6 0-3.09-.45-4.36-1.24l-.31-.19-3.07.88.9-2.99-.2-.31A7.94 7.94 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.4-5.6c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.42-1.33-1.66-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.4-.14 0-.3-.02-.46-.02s-.42.06-.64.3c-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/></svg>
    </a>
  </div>
  <div class="sticky-call">
    <a href="tel:+917508058594" class="call">📞 Call Now</a>
    <a href="${base}contact.html" class="visit">Book Site Visit</a>
  </div>`;

  document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('header-placeholder').innerHTML = headerHTML;
    document.getElementById('footer-placeholder').innerHTML = footerHTML;
    const yr = document.getElementById('yr'); if(yr) yr.textContent = new Date().getFullYear();

    const burger = document.getElementById('burgerBtn');
    const menu = document.getElementById('mobileMenu');
    burger.addEventListener('click', function(){
      const open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true':'false');
      document.body.classList.toggle('nav-open', open);
    });

    document.dispatchEvent(new CustomEvent('partialsLoaded'));
  });
})();
