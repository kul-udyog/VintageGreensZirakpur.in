// script.js — interaction layer for Vintage Greens site
(function(){
  window.dataLayer = window.dataLayer || [];
  function gtmPush(eventName, formType){
    window.dataLayer.push({ event: eventName, form_type: formType });
  }

  // ---- Google Sheet lead capture -----------------------------------------
  // Paste the Web App URL from your Google Apps Script deployment here.
  // See google-apps-script-lead-capture.gs in the project root for setup
  // instructions. Until this is set, sendToSheet() silently does nothing.
  const SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyq6RxUMejBFkfV0R2DaeXNch7wP_1H1yw9OAKxsy9PqN2hm3EjDwJnygzT0jTwzNl2/exec";

  function sendToSheet(data){
    if (!SHEET_WEBAPP_URL || SHEET_WEBAPP_URL.indexOf('PASTE_YOUR') === 0) return;
    const body = new URLSearchParams(Object.assign({
      page: window.location.pathname
    }, data));
    try {
      // sendBeacon is purpose-built for "fire this, then we might navigate
      // away or close the tab immediately" — unlike a plain fetch(), the
      // browser guarantees it's sent even though a redirect or tel:/wa.me
      // navigation happens on the very next line after calling this.
      if (navigator.sendBeacon) {
        const ok = navigator.sendBeacon(SHEET_WEBAPP_URL, body);
        if (ok) return;
      }
      // Fallback for browsers without sendBeacon support.
      fetch(SHEET_WEBAPP_URL, { method: 'POST', mode: 'no-cors', body: body, keepalive: true });
    } catch (err) {
      // Never let a network hiccup block form submission or navigation.
    }
  }

  // ---- Lead form submit handling (mirrors the GTM / dataLayer pattern used
  // across the partner's other project sites: one event per form type, then
  // redirect to a clean thank-you URL for reliable conversion tracking) ----
  function bindForms(){
    document.querySelectorAll('form[data-form-type]').forEach(function(form){
      form.addEventListener('submit', function(e){
        e.preventDefault();
        const type = form.getAttribute('data-form-type');
        const source = form.getAttribute('data-source') || 'unknown';
        const nameVal = (form.querySelector('input[name="name"]') || {}).value || '';
        const phoneVal = (form.querySelector('input[name="phone"]') || {}).value || '';
        window.dataLayer.push({ event: 'lead_form_submit', form_type: type, form_source: source });
        sendToSheet({ name: nameVal, phone: phoneVal, action: 'Form Submit', source: source });

        // Brochure forms don't redirect to the thank-you page — submitting
        // the (required) name + number logs the lead, then immediately
        // opens WhatsApp with a pre-filled message so the brochure can be
        // sent there. Nothing is sent until the form is actually filled in
        // and submitted (the browser enforces the `required` fields).
        if (type === 'brochure_download') {
          const waLink = form.getAttribute('data-whatsapp');
          if (waLink) window.open(waLink, '_blank', 'noopener');
          form.reset();
          return;
        }

        const redirect = form.getAttribute('data-redirect') || 'thank-you/index.html';
        window.location.href = redirect;
      });
    });
  }

  // ---- Lead-gate popup: intercepts every Call, WhatsApp, and "Book Site
  // Visit" link on the site (header, sticky mobile bar, floating WhatsApp
  // button, footer, in-page CTAs — anywhere) and requires name + phone
  // before the call/chat/navigation actually happens. -------------------
  function buildLeadGateModal(){
    const modal = document.createElement('div');
    modal.className = 'lead-gate';
    modal.innerHTML =
      '<div class="lead-gate-dialog">' +
        '<button type="button" class="lead-gate-close" data-lead-gate-close aria-label="Close">✕</button>' +
        '<h3 data-lead-gate-title>Quick details first</h3>' +
        '<p>Share your name and number, and we\'ll take you ahead.</p>' +
        '<form class="quick-form">' +
          '<input type="text" name="name" placeholder="Your Name" required>' +
          '<input type="tel" name="phone" placeholder="Phone Number" pattern="[0-9]{10}" required>' +
          '<button type="submit" class="btn btn-primary btn-block" data-lead-gate-submit>Continue</button>' +
        '</form>' +
      '</div>';
    return modal;
  }

  // Button text that signals buying intent gets gated too — not just
  // "Book Site Visit". Purely navigational labels (View Gallery, Explore
  // Amenities, Read Full Story, etc.) are deliberately left out so browsing
  // the site never gets interrupted — only actions that would otherwise
  // hand off to a call, chat, or a form asking for contact details.
  const GATED_TEXTS = {
    'Book Site Visit': 'Enter your details to book a site visit',
    'Request Price': 'Enter your details to get the price',
    'Request Brochure': 'Enter your details to get the brochure',
    'Contact Us': 'Enter your details to continue',
    'Talk to Us': 'Enter your details to continue'
  };

  function isGatedLink(link){
    const href = link.getAttribute('href') || '';
    if (href.indexOf('tel:') === 0) {
      return { action: 'Call Button', title: 'Enter your details to call us' };
    }
    if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp') !== -1) {
      return { action: 'WhatsApp Button', title: 'Enter your details to chat on WhatsApp' };
    }
    const text = (link.textContent || '').trim();
    if (GATED_TEXTS.hasOwnProperty(text)) {
      return { action: text, title: GATED_TEXTS[text] };
    }
    return null;
  }

  // Mirrors the same base-path logic partials.js uses, so this works
  // correctly whether the current page sits at the root or one level
  // down (blog/, thank-you/).
  function leadGateThankYouUrl(){
    const path = window.location.pathname;
    const base = path.indexOf('/blog/') !== -1 || path.indexOf('/thank-you/') !== -1 ? '../' : '';
    return base + 'thank-you/index.html';
  }

  function bindLeadGate(){
    // Anyone on the thank-you page just submitted a form to get here —
    // asking them again for Call/WhatsApp/etc. on this page would be
    // redundant, so the gate is skipped entirely here.
    if (window.location.pathname.indexOf('/thank-you/') !== -1) return;

    const modal = buildLeadGateModal();
    document.body.appendChild(modal);
    const form = modal.querySelector('form');
    const titleEl = modal.querySelector('[data-lead-gate-title]');
    const closeBtn = modal.querySelector('[data-lead-gate-close]');
    let pending = null;

    // Pressing the phone's/browser's back button while this popup is open
    // should just close the popup, not leave the page. We do this by
    // pushing a throwaway history entry when the popup opens, so "back"
    // pops that entry (fires popstate) instead of leaving for the
    // previous page. If the popup is closed any other way (X, backdrop,
    // Escape, form submit) we quietly remove that same entry so a later,
    // real "back" press still works normally.
    let historyEntryOpen = false;
    let suppressNextPopstate = false;

    function openModal(action){
      pending = action;
      titleEl.textContent = action.title;
      form.reset();
      modal.classList.add('open');
      document.body.classList.add('modal-open');
      const firstInput = form.querySelector('input[name="name"]');
      if (firstInput) firstInput.focus();
      if (!historyEntryOpen) {
        history.pushState({ leadGateOpen: true }, '');
        historyEntryOpen = true;
      }
    }
    function closeModal(fromPopstate){
      modal.classList.remove('open');
      document.body.classList.remove('modal-open');
      pending = null;
      if (historyEntryOpen) {
        historyEntryOpen = false;
        if (!fromPopstate) {
          suppressNextPopstate = true;
          history.back();
        }
      }
    }

    window.addEventListener('popstate', function(){
      if (suppressNextPopstate) { suppressNextPopstate = false; return; }
      if (modal.classList.contains('open')) closeModal(true);
    });

    closeBtn.addEventListener('click', function(){ closeModal(false); });
    modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(false); });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (!pending) return;
      const nameVal = (form.querySelector('input[name="name"]') || {}).value || '';
      const phoneVal = (form.querySelector('input[name="phone"]') || {}).value || '';
      window.dataLayer.push({ event: 'lead_gate_submit', gate_action: pending.action, gate_source: pending.source });
      sendToSheet({ name: nameVal, phone: phoneVal, action: pending.action, source: pending.source });
      const target = pending;
      closeModal(false);

      // Call/WhatsApp still need to actually fire (dialer / chat) — those
      // aren't pages, so they don't replace the thank-you redirect below.
      if (target.action === 'Call Button') {
        window.location.href = target.href; // tel: — doesn't actually navigate the tab away
      } else if (target.action === 'WhatsApp Button') {
        window.open(target.href, '_blank', 'noopener');
      }
      // Every gated action — including Request Price, Book Site Visit,
      // Request Brochure, Contact Us, Talk to Us — lands on the thank-you
      // page next, instead of continuing on to the link's original page
      // (which would otherwise show another form/button and re-trigger
      // this same gate a second time).
      window.location.href = leadGateThankYouUrl();
    });

    // Capturing-phase listener so this runs before the browser's default
    // navigation for the clicked link.
    document.addEventListener('click', function(e){
      const link = e.target.closest('a[href]');
      if (!link || modal.contains(link)) return;
      const gate = isGatedLink(link);
      if (!gate) return;
      e.preventDefault();
      e.stopPropagation();
      openModal({
        href: link.getAttribute('href'),
        external: link.getAttribute('target') === '_blank',
        action: gate.action,
        title: gate.title,
        source: link.className || gate.action
      });
    }, true);
  }

  // ---- FAQ accordion (native <details>, just track opens for analytics) ----
  function bindFaq(){
    document.querySelectorAll('.faq-item').forEach(function(item){
      item.addEventListener('toggle', function(){
        if(item.open){ gtmPush('faq_expand', item.dataset.q || ''); }
      });
    });
  }

  // ---- Amenity category tabs ----
  function bindTabs(){
    const tabBtns = document.querySelectorAll('.tab-btn');
    if(!tabBtns.length) return;
    tabBtns.forEach(function(btn){
      btn.addEventListener('click', function(){
        const group = btn.closest('[data-tabgroup]');
        group.querySelectorAll('.tab-btn').forEach(b=>b.setAttribute('aria-selected','false'));
        group.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
        btn.setAttribute('aria-selected','true');
        document.getElementById(btn.getAttribute('aria-controls')).classList.add('active');
      });
    });
  }

  // ---- EMI Calculator ----
  function bindEmi(){
    const box = document.getElementById('emiCalc');
    if(!box) return;
    const price = box.querySelector('#emiPrice');
    const down = box.querySelector('#emiDown');
    const rate = box.querySelector('#emiRate');
    const tenure = box.querySelector('#emiTenure');
    const out = box.querySelector('#emiResult');
    function fmt(n){ return '₹' + Math.round(n).toLocaleString('en-IN'); }
    function calc(){
      const P = Number(price.value) - Number(down.value);
      const r = Number(rate.value)/12/100;
      const n = Number(tenure.value)*12;
      const emi = P>0 && r>0 ? (P*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1) : 0;
      out.querySelector('.amt').textContent = fmt(emi) + ' / mo';
      box.querySelector('#emiPriceOut').textContent = fmt(price.value);
      box.querySelector('#emiDownOut').textContent = fmt(down.value);
      box.querySelector('#emiRateOut').textContent = rate.value + '%';
      box.querySelector('#emiTenureOut').textContent = tenure.value + ' yrs';
    }
    [price,down,rate,tenure].forEach(el=>el.addEventListener('input',calc));
    calc();
  }

  // ---- Testimonial carousel dots (simple scroll-snap, this just adds
  // click-to-scroll buttons for accessibility on top of native touch swipe) ----
  function bindTestimonials(){
    const track = document.querySelector('.t-track');
    if(!track) return;
    document.querySelectorAll('[data-t-prev]').forEach(b=>b.addEventListener('click',()=>track.scrollBy({left:-340,behavior:'smooth'})));
    document.querySelectorAll('[data-t-next]').forEach(b=>b.addEventListener('click',()=>track.scrollBy({left:340,behavior:'smooth'})));
  }

  // ---- Lazy image fade-in once loaded (perf: pairs with loading="lazy" +
  // decoding="async" already set in markup, and fetchpriority="high" on
  // the hero LCP image) ----
  function bindLazyFade(){
    document.querySelectorAll('img.lazy-fade').forEach(function(img){
      if(img.complete){ img.classList.add('loaded'); }
      else{ img.addEventListener('load', ()=>img.classList.add('loaded')); }
    });
  }

  let initialized = false;
  function initAll(){
    if (initialized) return;
    initialized = true;
    bindForms(); bindFaq(); bindTabs(); bindEmi(); bindTestimonials(); bindLazyFade(); bindLeadGate();
  }

  document.addEventListener('partialsLoaded', initAll);
  // Fallback in case partials event already fired or page has no partials
  document.addEventListener('DOMContentLoaded', initAll);
})();
