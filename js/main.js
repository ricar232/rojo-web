// ─────────────────────────────────────────────
// Register GSAP plugins
// ─────────────────────────────────────────────
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─────────────────────────────────────────────
// NAVBAR: scroll effect + glass
// ─────────────────────────────────────────────
const navbar = document.getElementById('navbar');
const handleScroll = () => {
  if (window.scrollY > 60) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
};
window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

// ─────────────────────────────────────────────
// MOBILE HAMBURGER MENU
// ─────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
let menuOpen = false;

function toggleMenu(open) {
  menuOpen = open;
  hamburger.classList.toggle('open', open);
  mobileMenu.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
}

if (hamburger) {
  hamburger.addEventListener('click', () => toggleMenu(!menuOpen));
}

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => toggleMenu(false));
});

// close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menuOpen) toggleMenu(false);
});


// ─────────────────────────────────────────────
// PARTICLE CANVAS
// ─────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas || prefersReducedMotion) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles;

  function resize() {
    w = canvas.width  = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    const count = Math.min(60, Math.floor(w * h / 18000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '0,255,157' : '0,191,255'
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.o})`;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > w) p.dx *= -1;
      if (p.y < 0 || p.y > h) p.dy *= -1;
    });
    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,255,157,${0.08 * (1 - dist/120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();
  window.addEventListener('resize', () => { resize(); createParticles(); });
})();

// ─────────────────────────────────────────────
// KINETIC TYPING HERO
// ─────────────────────────────────────────────
(function heroTyping() {
  if (prefersReducedMotion) return;
  const target = document.getElementById('typing-target');
  if (!target) return;
  let idx = 0;

  async function cycle() {
    while (true) {
      const lang = document.documentElement.lang || 'es';
      const dict = window.i18nTranslations ? window.i18nTranslations[lang] : null;
      const words = dict && dict['hero.typing.words'] ? dict['hero.typing.words'].split(',') : ['convierten', 'impresionan', 'escalan', 'destacan', 'crecen'];
      
      const word = words[idx % words.length];
      // Type
      for (let i = 0; i <= word.length; i++) {
        target.textContent = word.slice(0, i);
        // Reduce type speed slightly so the cursor looks smooth
        await new Promise(r => setTimeout(r, 75));
      }
      // Wait to read
      await new Promise(r => setTimeout(r, 2000));
      // Erase
      for (let i = word.length; i >= 0; i--) {
        target.textContent = word.slice(0, i);
        await new Promise(r => setTimeout(r, 45));
      }
      // Wait before next word
      await new Promise(r => setTimeout(r, 400));
      idx++;
    }
  }
  cycle();
})();

// ─────────────────────────────────────────────
// GSAP HERO ENTRANCE
// ─────────────────────────────────────────────
if (!prefersReducedMotion) {
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('.hero-badge',    { opacity: 0, y: 30, duration: 0.7 }, 0.3)
    .from('.hero-title',   { opacity: 0, y: 60, duration: 0.9 }, 0.5)
    .from('.hero-subtitle',{ opacity: 0, y: 40, duration: 0.7 }, 0.8)
    .from('.hero-ctas',    { opacity: 0, y: 30, duration: 0.6 }, 1.0);
}

// ─────────────────────────────────────────────
// GSAP SCROLL ANIMATIONS — generic fade-in
// ─────────────────────────────────────────────
function setupScrollFade(selector, opts = {}) {
  if (prefersReducedMotion) return;
  gsap.utils.toArray(selector).forEach((el, i) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
      opacity: 0,
      y: opts.y ?? 50,
      scale: opts.scale ?? 1,
      duration: opts.duration ?? 0.7,
      delay: (opts.stagger ?? 0.1) * (opts.staggerByIndex ? i : 0),
      ease: 'power3.out',
    });
  });
}

setupScrollFade('.service-card',    { stagger: 0.08, staggerByIndex: true });

setupScrollFade('.process-step-item', { stagger: 0.12, staggerByIndex: true });
setupScrollFade('.testimonials-track .service-card', { stagger: 0.1, staggerByIndex: true });

// Section headings
gsap.utils.toArray('.section-tag, h2').forEach(el => {
  if (prefersReducedMotion) return;
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 90%' },
    opacity: 0, y: 30, duration: 0.7, ease: 'power3.out'
  });
});

// ─────────────────────────────────────────────
// SKILL BARS — animate on scroll
// ─────────────────────────────────────────────
document.querySelectorAll('.skill-bar-fill').forEach(bar => {
  const width = bar.dataset.width + '%';
  if (prefersReducedMotion) {
    bar.style.width = width;
    return;
  }
  ScrollTrigger.create({
    trigger: bar,
    start: 'top 90%',
    onEnter: () => {
      bar.style.transition = 'width 1.2s cubic-bezier(0.4,0,0.2,1)';
      bar.style.width = width;
    }
  });
});



// ─────────────────────────────────────────────
// SERVICE MODAL
// ─────────────────────────────────────────────
const serviceModal = document.getElementById('service-modal');
const serviceIconMap = {
  'services.card1': `<svg class="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
  'services.card2': `<svg class="w-8 h-8 text-[var(--cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`,
  'services.card3': `<svg class="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>`,
  'services.card4': `<svg class="w-8 h-8 text-[var(--cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
  'services.card5': `<svg class="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  'services.card6': `<svg class="w-8 h-8 text-[var(--cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>`
};

window.openServiceModal = function(prefix) {
  if (!serviceModal) return;
  const lang = document.documentElement.lang || 'es';
  const dict = window.i18nTranslations ? window.i18nTranslations[lang] : null;
  if (!dict) return;

  document.getElementById('service-modal-title').textContent = dict[prefix + '.title'];
  document.getElementById('service-modal-desc').textContent  = dict[prefix + '.details'];
  document.getElementById('service-f1').textContent = dict[prefix + '.f1'];
  document.getElementById('service-f2').textContent = dict[prefix + '.f2'];
  document.getElementById('service-f3').textContent = dict[prefix + '.f3'];
  
  const iconWrap = document.getElementById('service-modal-icon');
  if (iconWrap) {
    iconWrap.innerHTML = serviceIconMap[prefix] || '';
    const isCyan = ['services.card2','services.card4','services.card6'].includes(prefix);
    iconWrap.style.background = isCyan ? 'rgba(0,191,255,0.12)' : 'rgba(0,255,157,0.12)';
    iconWrap.style.borderColor = isCyan ? 'rgba(0,191,255,0.2)' : 'rgba(0,255,157,0.2)';
  }

  serviceModal.classList.remove('hidden');
  serviceModal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  if (!prefersReducedMotion) {
    gsap.from('#service-modal-content', { opacity: 0, scale: 0.9, duration: 0.4, ease: 'back.out(1.2)' });
  }
};

window.closeServiceModal = function(e) {
  if (e.target === serviceModal) closeServiceModalDirect();
};
window.closeServiceModalDirect = function() {
  if (!serviceModal) return;
  if (!prefersReducedMotion) {
    gsap.to('#service-modal-content', {
      opacity: 0, scale: 0.9, duration: 0.3,
      onComplete: () => { 
        serviceModal.classList.add('hidden');
        serviceModal.classList.remove('flex');
        document.body.style.overflow = ''; 
      }
    });
  } else {
    serviceModal.classList.add('hidden');
    serviceModal.classList.remove('flex');
    document.body.style.overflow = '';
  }
};



document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (serviceModal && serviceModal.classList.contains('flex')) closeServiceModalDirect();
  }
});

// ─────────────────────────────────────────────
// TESTIMONIALS CAROUSEL
// ─────────────────────────────────────────────
(function testimonialCarousel() {
  const track = document.getElementById('testimonials-track');
  const cards = track?.children;
  if (!track || !cards.length) return;

  let current = 0;
  const cardWidth = () => cards[0].offsetWidth + 24; // gap

  function slideTo(idx) {
    current = Math.max(0, Math.min(idx, cards.length - 1));
    track.style.transform = `translateX(-${current * cardWidth()}px)`;
  }

  document.getElementById('prev-test')?.addEventListener('click', () => slideTo(current - 1));
  document.getElementById('next-test')?.addEventListener('click', () => slideTo(current + 1));

  // Autoplay
  let autoplay = setInterval(() => {
    slideTo(current + 1 < cards.length ? current + 1 : 0);
  }, 4500);

  track.parentElement.addEventListener('mouseenter', () => clearInterval(autoplay));
  track.parentElement.addEventListener('mouseleave', () => {
    autoplay = setInterval(() => slideTo(current + 1 < cards.length ? current + 1 : 0), 4500);
  });
})();

// ─────────────────────────────────────────────
// CONTACT FORM
// ─────────────────────────────────────────────
const form = document.getElementById('contact-form');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  let valid = true;

  // Validate name
  const name = document.getElementById('name');
  const nameErr = document.getElementById('name-error');
  if (!name.value.trim()) {
    if(nameErr) nameErr.classList.remove('hidden'); 
    valid = false;
    name.setAttribute('aria-invalid','true');
  } else {
    if(nameErr) nameErr.classList.add('hidden');
    name.removeAttribute('aria-invalid');
  }

  // Validate email
  const email = document.getElementById('email');
  const emailErr = document.getElementById('email-error');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email.value.trim())) {
    if(emailErr) emailErr.classList.remove('hidden'); 
    valid = false;
    email.setAttribute('aria-invalid','true');
  } else {
    if(emailErr) emailErr.classList.add('hidden');
    email.removeAttribute('aria-invalid');
  }

  // Validate message
  const message = document.getElementById('message');
  const msgErr = document.getElementById('message-error');
  if (!message.value.trim()) {
    if(msgErr) msgErr.classList.remove('hidden'); 
    valid = false;
    message.setAttribute('aria-invalid','true');
  } else {
    if(msgErr) msgErr.classList.add('hidden');
    message.removeAttribute('aria-invalid');
  }

  if (!valid) return;

  // WhatsApp redirection
  const phone = "13528143988";
  const serviceVal = document.getElementById('service').value || 'Sin especificar';
  
  const waMessage = `Hola Richard! 👋 Me interesa un proyecto de *${serviceVal}*.\n\n` +
                 `*Nombre:* ${name.value.trim()}\n` +
                 `*Email:* ${email.value.trim()}\n\n` +
                 `*Mensaje:* ${message.value.trim()}`;
  
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`;
  
  // Show success and redirect
  const btn = document.getElementById('submit-btn');
  if (btn) {
    btn.textContent = 'Abriendo WhatsApp…';
    btn.disabled = true;
  }
  
  // Wait a moment for UX before opening
  await new Promise(r => setTimeout(r, 1000));
  
  window.open(waUrl, '_blank');

  setTimeout(() => {
    form.querySelectorAll('input,select,textarea,button').forEach(el => el.classList.add('hidden'));
    const successMsg = document.getElementById('form-success');
    if (successMsg) {
      successMsg.classList.remove('hidden');
      if (!prefersReducedMotion) {
        gsap.from('#form-success', { opacity: 0, y: 20, duration: 0.5, ease: 'power3.out' });
      }
    }
  }, 500);
});

// ─────────────────────────────────────────────
// SMOOTH SCROLL HELPER
// ─────────────────────────────────────────────
window.scrollToContact = function() {
  document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
};

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ─────────────────────────────────────────────
// HERO PARALLAX
// ─────────────────────────────────────────────
if (!prefersReducedMotion) {
  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    const orb1 = document.querySelector('.orb-1');
    const orb2 = document.querySelector('.orb-2');
    if (orb1) orb1.style.transform = `translateY(${sy * 0.15}px)`;
    if (orb2) orb2.style.transform = `translateY(${sy * -0.12}px)`;
  }, { passive: true });
}

// ─────────────────────────────────────────────
// NAVBAR ACTIVE LINK on scroll
// ─────────────────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === '#' + id ? 'var(--accent)' : '';
      });
    }
  });
}, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

sections.forEach(s => io.observe(s));

console.log('%c🚀 Pycrafted — Coded with ❤️ + GSAP 2026', 'color:#00FF9D;font-size:14px;font-weight:bold;');

// ─────────────────────────────────────────────
// i18n: AUTO-DETECT LANGUAGE
// ─────────────────────────────────────────────
(function initLanguage() {
  const translations = window.i18nTranslations;
  if (!translations) return;

  // Detect language: use localStorage if present, otherwise navigator
  let lang = localStorage.getItem('site_lang');
  if (!lang) {
    const navLang = navigator.language || navigator.userLanguage;
    lang = navLang.startsWith('es') ? 'es' : 'en';
  }

  // Fallback if somehow not supported
  if (!translations[lang]) lang = 'es';
  
  // Set html lang attribute
  document.documentElement.lang = lang;

  function updateTexts(language) {
    const dict = translations[language];
    if (!dict) return;

    // elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        // If it's a direct text replacement
        el.innerHTML = dict[key];
      }
    });

    // elements with data-i18n-ph (placeholders)
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });
  }

  updateTexts(lang);
})();

// ─────────────────────────────────────────────
// 3D CSS PHONE INTERACTION
// ─────────────────────────────────────────────
(function init3DPhone() {
  if (prefersReducedMotion) return;
  const container = document.getElementById('hero-3d-container');
  const wrapper = document.getElementById('phone-3d-wrapper');
  
  if (!container || !wrapper) return;

  container.addEventListener('mousemove', (e) => {
    // Get mouse position relative to container
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top;  // y position within the element

    // Calculate rotation limits (max 30deg tilt)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Reverse axes for classic 3D tilt
    const rotateX = ((y - centerY) / centerY) * -25;
    const rotateY = ((x - centerX) / centerX) * 25;

    wrapper.style.transform = `rotateX(${rotateX + 5}deg) rotateY(${rotateY - 15}deg)`;
  });

  // Reset rotation when mouse leaves
  container.addEventListener('mouseleave', () => {
    wrapper.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
    wrapper.style.transform = `rotateX(5deg) rotateY(-15deg)`;
  });

  container.addEventListener('mouseenter', () => {
    wrapper.style.transition = 'transform 0.1s ease-out';
  });
})();

