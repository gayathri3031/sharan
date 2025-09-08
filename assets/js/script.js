(function(){
'use strict';

// Configuration and Utilities
const config = {
  selectors: {
    sidebar: '[data-sidebar]',
    sidebarBtn: '[data-sidebar-btn]',
    testimonials: '[data-testimonials-item]',
    modal: {
      container: '[data-modal-container]',
      closeBtn: '[data-modal-close-btn]',
      overlay: '[data-overlay]',
      img: '[data-modal-img]',
      title: '[data-modal-title]',
      text: '[data-modal-text]'
    },
    select: {
      main: '[data-select]',
      items: '[data-select-item]',
      value: '[data-select-value]'
    },
    filter: {
      btn: '[data-filter-btn]',
      items: '[data-filter-item]'
    },
    form: {
      main: '[data-form]',
      inputs: '[data-form-input]',
      btn: '[data-form-btn]'
    },
    nav: {
      links: '[data-nav-link]',
      pages: '[data-page]'
    },
    themeBtn: '[data-theme-btn]'
  },
  data: {
    portfolioCsv: './assets/data/portfolio.csv',
    blogCsv: './assets/data/blog.csv',
    skillsCsv: './assets/data/skills.csv',
    experienceCsv: './assets/data/experience.csv',
    educationCsv: './assets/data/education.csv',
    servicesCsv: './assets/data/services.csv',
    testimonialsCsv: './assets/data/testimonials.csv',
    clientsCsv: './assets/data/clients.csv',
    socialCsv: './assets/data/social.csv'
  }
};

// Helper Functions
/**
 * Toggles the 'active' class on a given element.
 * @param {HTMLElement} elem - The element to toggle.
 */
const elementToggleFunc = function (elem) {
  elem.classList.toggle('active');
};

/**
 * Parses CSV text supporting quoted fields, embedded commas, and escaped quotes.
 * Returns an array of rows, each row is an array of strings.
 * This assumes newlines are row delimiters and fields may be wrapped in ".
 */
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (char === '\r') {
        // ignore CR, handle on LF
      } else {
        field += char;
      }
    }
  }
  // push last field/row
  row.push(field);
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows;
};

/**
 * Fetches a CSV file and returns an array of objects with headers as keys.
 * Supports quoted fields and embedded commas.
 * @param {string} url
 * @returns {Promise<Array<Record<string,string>>>}
 */
const loadCsv = async (url) => {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error('Failed to load CSV: ' + url);
  const text = await res.text();
  const rows = parseCsv(text.trim());
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => r.some(c => (c || '').trim() !== ''))
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (r[i] || '').trim(); });
      return obj;
    });
};

/**
 * Renders portfolio items into `.project-list` using CSV data.
 * Preserves classes/structure for existing CSS/JS.
 */
const renderPortfolio = (items) => {
  const list = document.querySelector('.project-list');
  if (!list) return;
  list.innerHTML = '';
  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'project-item  active';
    li.setAttribute('data-filter-item', '');
    li.setAttribute('data-category', (item.category || '').toLowerCase());

    const imgSrc = item.thumb || item.image;

    li.innerHTML = `
      <a href="${item.link || '#'}">
        <figure class="project-img">
          <div class="project-item-icon-box">
            <ion-icon name="eye-outline"></ion-icon>
          </div>
          <img src="${imgSrc}" alt="${item.alt || item.title || ''}" loading="lazy">
        </figure>
        <h3 class="project-title">${item.title || ''}</h3>
        <p class="project-category">${item.category || ''}</p>
      </a>
    `;

    fragment.appendChild(li);
  });

  list.appendChild(fragment);
};

/**
 * Renders blog posts into `.blog-posts-list` using CSV data.
 */
const renderBlog = (posts) => {
  const list = document.querySelector('.blog-posts-list');
  if (!list) return;
  list.innerHTML = '';
  const fragment = document.createDocumentFragment();

  posts.forEach(post => {
    const li = document.createElement('li');
    li.className = 'blog-post-item';
    li.innerHTML = `
      <a href="${post.link || '#'}">
        <figure class="blog-banner-box">
          <img src="${post.image}" alt="${post.alt || post.title || ''}" loading="lazy">
        </figure>
        <div class="blog-content">
          <div class="blog-meta">
            <p class="blog-category">${post.category || ''}</p>
            <span class="dot"></span>
            <time datetime="${post.date || ''}">${formatDate(post.date)}</time>
          </div>
          <h3 class="h3 blog-item-title">${post.title || ''}</h3>
          <p class="blog-text">${post.excerpt || ''}</p>
        </div>
      </a>
    `;
    fragment.appendChild(li);
  });

  list.appendChild(fragment);
};

/**
 * Formats date (YYYY-MM-DD) to MMM DD, YYYY.
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

// Render Skills
const renderSkills = (skills) => {
  const list = document.getElementById('skills-list');
  if (!list) return;
  list.innerHTML = '';
  const fragment = document.createDocumentFragment();

  skills.forEach(s => {
    const level = String(s.level || '').replace(/[^0-9]/g, '') || '0';
    const li = document.createElement('li');
    li.className = 'skills-item';
    li.innerHTML = `
      <div class="title-wrapper">
        <h5 class="h5">${s.name || ''}</h5>
        <data value="${level}">${level}%</data>
      </div>
      <div class="skill-progress-bg">
        <div class="skill-progress-fill" style="width: ${level}%;"></div>
      </div>
    `;
    fragment.appendChild(li);
  });

  list.appendChild(fragment);
};

// Render Timeline-like lists (Experience, Education)
const renderTimeline = (items, containerId) => {
  const list = document.getElementById(containerId);
  if (!list) return;
  list.innerHTML = '';
  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'timeline-item';
    li.innerHTML = `
      <h4 class="h4 timeline-item-title">${item.title || ''}</h4>
      <span>${item.period || ''}</span>
      <p class="timeline-text">${item.description || ''}</p>
    `;
    fragment.appendChild(li);
  });

  list.appendChild(fragment);
};

// Render Services (What I'm doing)
const renderServices = (services) => {
  const list = document.getElementById('services-list');
  if (!list) return;
  list.innerHTML = '';
  const fragment = document.createDocumentFragment();

  services.forEach(svc => {
    const li = document.createElement('li');
    li.className = 'service-item';
    li.innerHTML = `
      <div class="service-icon-box">
        <img src="${svc.icon}" alt="${svc.alt || ''}" width="40">
      </div>
      <div class="service-content-box">
        <h4 class="h4 service-item-title">${svc.title || ''}</h4>
        <p class="service-item-text">${svc.text || ''}</p>
      </div>
    `;
    fragment.appendChild(li);
  });

  list.appendChild(fragment);
};

// Render Testimonials
const renderTestimonials = (items) => {
  const list = document.getElementById('testimonials-list');
  if (!list) return;
  list.innerHTML = '';
  const fragment = document.createDocumentFragment();

  items.forEach(t => {
    const li = document.createElement('li');
    li.className = 'testimonials-item';
    li.innerHTML = `
      <div class="content-card" data-testimonials-item>
        <figure class="testimonials-avatar-box">
          <img src="${t.avatar}" alt="${t.alt || t.name || ''}" width="60" data-testimonials-avatar>
        </figure>
        <h4 class="h4 testimonials-item-title" data-testimonials-title>${t.name || ''}</h4>
        <div class="testimonials-text" data-testimonials-text>
          <p>${t.text || ''}</p>
        </div>
      </div>
    `;
    fragment.appendChild(li);
  });

  list.appendChild(fragment);

  // Refresh cached testimonial elements for modal behavior
  elements.testimonialsItems = document.querySelectorAll(config.selectors.testimonials);
};

// Render Clients
const renderClients = (clients) => {
  const list = document.getElementById('clients-list');
  if (!list) return;
  list.innerHTML = '';
  const fragment = document.createDocumentFragment();

  clients.forEach(c => {
    const li = document.createElement('li');
    li.className = 'clients-item client-bg';
    li.innerHTML = `
      <a href="${c.link || '#'}">
        <img src="${c.logo}" alt="${c.alt || 'client logo'}">
      </a>
    `;
    fragment.appendChild(li);
  });

  list.appendChild(fragment);
};

// Render Social list
const renderSocial = (items) => {
  const list = document.getElementById('social-list');
  if (!list) return;
  list.innerHTML = '';
  const fragment = document.createDocumentFragment();

  items.forEach(s => {
    const li = document.createElement('li');
    li.className = 'social-item';
    li.innerHTML = `
      <a href="${s.link || '#'}" class="social-link" aria-label="${s.label || ''}" target="_blank" rel="noopener noreferrer">
        <ion-icon name="${s.icon}"></ion-icon>
      </a>
    `;
    fragment.appendChild(li);
  });

  list.appendChild(fragment);
};

let lastFocusedElement = null;

// Project Modal: build and control
const ensureProjectModal = () => {
  if (document.getElementById('project-modal')) return;

  const container = document.createElement('div');
  container.className = 'modal-container';
  container.setAttribute('data-project-modal-container', '');

  container.innerHTML = `
    <div class="overlay" data-project-overlay></div>
    <section class="testimonials-modal project-modal" id="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
      <button class="modal-close-btn" data-project-modal-close aria-label="Close project details">
        <ion-icon name="close-outline"></ion-icon>
      </button>
      <div class="modal-content">
        <figure class="project-banner">
          <img src="" alt="" data-project-image />
        </figure>
        <h4 class="h3 modal-title" id="project-modal-title" data-project-title>Project</h4>
        <p class="project-category" data-project-category></p>
        <p class="project-usecase" data-project-usecase></p>
        <div class="project-meta">
          <p><strong>Tech:</strong></p>
          <div class="chip-list" data-project-tech-list></div>
          <p><strong>Features:</strong></p>
          <ul class="features-list" data-project-features-list></ul>
          <div class="project-meta-grid">
            <p><strong>Role:</strong> <span data-project-role></span></p>
            <p><strong>Team:</strong> <span data-project-team></span></p>
            <p><strong>Duration:</strong> <span data-project-duration></span></p>
          </div>
          <div class="project-links">
            <a href="#" target="_blank" rel="noopener" data-project-live>Live demo</a>
            <a href="#" target="_blank" rel="noopener" data-project-repo>Repository</a>
          </div>
        </div>
      </div>
    </section>
  `;
  document.body.appendChild(container);

  const overlay = container.querySelector('[data-project-overlay]');
  const closeBtn = container.querySelector('[data-project-modal-close]');
  const modal = container.querySelector('#project-modal');

  const getFocusable = () => Array.from(modal.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])'));

  const close = () => {
    container.classList.remove('active');
    overlay.classList.remove('active');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  };

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  // Keyboard handling: Esc to close, Tab trap
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = getFocusable();
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
};

const splitList = (value, primarySep = ';', secondarySep = ',') => {
  if (!value) return [];
  const hasPrimary = value.includes(primarySep);
  const sep = hasPrimary ? primarySep : secondarySep;
  return value.split(sep).map(s => s.trim()).filter(Boolean);
};

const openProjectModal = (item) => {
  ensureProjectModal();
  const container = document.querySelector('[data-project-modal-container]');
  const overlay = container.querySelector('[data-project-overlay]');
  const modal = container.querySelector('#project-modal');

  lastFocusedElement = document.activeElement;

  const imageEl = container.querySelector('[data-project-image]');
  imageEl.src = item.image || item.thumb || '';
  imageEl.alt = item.alt || item.title || '';

  container.querySelector('[data-project-title]').textContent = item.title || 'Project';
  container.querySelector('[data-project-category]').textContent = item.category || '';
  container.querySelector('[data-project-usecase]').textContent = item.usecase || '';

  // Tech chips
  const techWrap = container.querySelector('[data-project-tech-list]');
  techWrap.innerHTML = '';
  splitList(item.tech, ',', ';').forEach(t => {
    const span = document.createElement('span');
    span.className = 'chip';
    span.textContent = t;
    techWrap.appendChild(span);
  });

  // Features list
  const featList = container.querySelector('[data-project-features-list]');
  featList.innerHTML = '';
  splitList(item.features, ';', ',').forEach(f => {
    const li = document.createElement('li');
    li.textContent = f;
    featList.appendChild(li);
  });

  container.querySelector('[data-project-role]').textContent = item.role || '—';
  container.querySelector('[data-project-team]').textContent = item.team || '—';
  container.querySelector('[data-project-duration]').textContent = item.duration || '—';

  const liveEl = container.querySelector('[data-project-live]');
  liveEl.href = item.live || '#';
  liveEl.style.display = item.live ? 'inline-flex' : 'none';

  const repoEl = container.querySelector('[data-project-repo]');
  repoEl.href = item.repo || '#';
  repoEl.style.display = item.repo ? 'inline-flex' : 'none';

  container.classList.add('active');
  overlay.classList.add('active');

  // Move focus into modal
  const closeBtn = container.querySelector('[data-project-modal-close]');
  if (closeBtn) closeBtn.focus();
};

// Attach handlers to project cards after render
const wireProjectModalHandlers = (items) => {
  const anchors = document.querySelectorAll('.project-list li.project-item > a');
  anchors.forEach((a, index) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const item = items[index];
      if (item) openProjectModal(item);
    });
  });
};

// DOM Elements
const elements = {
  sidebar: document.querySelector(config.selectors.sidebar),
  sidebarBtn: document.querySelector(config.selectors.sidebarBtn),
  testimonialsItems: document.querySelectorAll(config.selectors.testimonials),
  modal: {
    container: document.querySelector(config.selectors.modal.container),
    closeBtn: document.querySelector(config.selectors.modal.closeBtn),
    overlay: document.querySelector(config.selectors.modal.overlay),
    img: document.querySelector(config.selectors.modal.img),
    title: document.querySelector(config.selectors.modal.title),
    text: document.querySelector(config.selectors.modal.text)
  },
  select: {
    main: document.querySelector(config.selectors.select.main),
    items: document.querySelectorAll(config.selectors.select.items),
    value: document.querySelector(config.selectors.select.value)
  },
  filter: {
    btn: document.querySelectorAll(config.selectors.filter.btn),
    items: document.querySelectorAll(config.selectors.filter.items)
  },
  form: {
    main: document.querySelector(config.selectors.form.main),
    inputs: document.querySelectorAll(config.selectors.form.inputs),
    btn: document.querySelector(config.selectors.form.btn)
  },
  nav: {
    links: document.querySelectorAll(config.selectors.nav.links),
    pages: document.querySelectorAll(config.selectors.nav.pages)
  },
  themeBtn: document.querySelector(config.selectors.themeBtn)
};

// Sidebar Functionality
/**
 * Initializes the sidebar toggle behavior.
 */
const initSidebar = () => {
  elements.sidebarBtn.addEventListener('click', () => elementToggleFunc(elements.sidebar));
};

// Testimonials Modal Functionality
/**
 * Sets up the testimonials modal open/close and content population.
 */
const initTestimonialsModal = () => {
  const toggleModal = () => {
    elements.modal.container.classList.toggle('active');
    elements.modal.overlay.classList.toggle('active');
  };

  elements.testimonialsItems.forEach(item => {
    item.addEventListener('click', () => {
      const avatar = item.querySelector('[data-testimonials-avatar]');
      elements.modal.img.src = avatar.src;
      elements.modal.img.alt = avatar.alt;
      elements.modal.title.innerHTML = item.querySelector('[data-testimonials-title]').innerHTML;
      elements.modal.text.innerHTML = item.querySelector('[data-testimonials-text]').innerHTML;
      toggleModal();
    });
  });

  elements.modal.closeBtn.addEventListener('click', toggleModal);
  elements.modal.overlay.addEventListener('click', toggleModal);
};

// Portfolio Filter Functionality
/**
 * Initializes portfolio filtering via custom select and buttons.
 */
const initPortfolioFilter = () => {
  const filterFunc = function (selectedValue) {

    for (let i = 0; i < elements.filter.items.length; i++) {

      if (selectedValue === 'all') {
        elements.filter.items[i].classList.add('active');
      } else if (selectedValue === elements.filter.items[i].dataset.category) {
        elements.filter.items[i].classList.add('active');
      } else {
        elements.filter.items[i].classList.remove('active');
      }

    }

  };

  elements.select.main.addEventListener('click', function () { elementToggleFunc(this); });

  // add event in all select items
  for (let i = 0; i < elements.select.items.length; i++) {
    elements.select.items[i].addEventListener('click', function () {

      let selectedValue = this.innerText.toLowerCase();
      elements.select.value.innerText = this.innerText;
      elementToggleFunc(elements.select.main);
      filterFunc(selectedValue);

    });
  }

  // add event in all filter button items for large screen
  let lastClickedBtn = elements.filter.btn[0];

  for (let i = 0; i < elements.filter.btn.length; i++) {

    elements.filter.btn[i].addEventListener('click', function () {

      let selectedValue = this.innerText.toLowerCase();
      elements.select.value.innerText = this.innerText;
      filterFunc(selectedValue);

      lastClickedBtn.classList.remove('active');
      this.classList.add('active');
      lastClickedBtn = this;

    });

  }
};

// Form Validation
/**
 * Enables submit button only when form is valid.
 */
const initFormValidation = () => {
  // add event to all form input field
  for (let i = 0; i < elements.form.inputs.length; i++) {
    elements.form.inputs[i].addEventListener('input', function () {

      // check form validation
      if (elements.form.main.checkValidity()) {
        elements.form.btn.removeAttribute('disabled');
      } else {
        elements.form.btn.setAttribute('disabled', '');
      }

    });
  }
};

// Page Navigation
/**
 * Handles SPA-like navigation by toggling active pages/links.
 */
const initPageNavigation = () => {
  // add event to all nav link
  for (let i = 0; i < elements.nav.links.length; i++) {
    elements.nav.links[i].addEventListener('click', function () {

      for (let i = 0; i < elements.nav.pages.length; i++) {
        if (this.innerHTML.toLowerCase() === elements.nav.pages[i].dataset.page) {
          elements.nav.pages[i].classList.add('active');
          elements.nav.links[i].classList.add('active');
          window.scrollTo(0, 0);
        } else {
          elements.nav.pages[i].classList.remove('active');
          elements.nav.links[i].classList.remove('active');
        }
      }

    });
  }
};

// Theme Switching Functionality
/**
 * Initializes theme toggle using localStorage persistence.
 */
const initThemeSwitching = () => {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Theme toggle handler
  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Add theme toggle event listener
  elements.themeBtn.addEventListener('click', toggleTheme);
};

// 3D Tilt Effects
/**
 * Adds subtle 3D tilt interaction to card-like elements.
 * Disabled when prefers-reduced-motion is enabled.
 */
const initTiltEffects = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const selectors = [
    '.project-item > a',
    '.blog-post-item > a',
    '.service-item',
    '.clients-item',
    '.content-card'
  ];
  const tiltElements = document.querySelectorAll(selectors.join(','));
  const maxRotationDeg = 12;

  tiltElements.forEach((card) => {
    card.classList.add('tilt-card');

    let boundingRect = null;
    let animationFrameId = null;

    const handlePointerMove = (event) => {
      if (!boundingRect) return;
      const relativeX = (event.clientX - boundingRect.left) / boundingRect.width;
      const relativeY = (event.clientY - boundingRect.top) / boundingRect.height;
      const rotateX = ((0.5 - relativeY) * maxRotationDeg);
      const rotateY = ((relativeX - 0.5) * maxRotationDeg);

      const applyTransform = () => {
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      };

      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(applyTransform);
    };

    const handlePointerEnter = () => {
      boundingRect = card.getBoundingClientRect();
      card.style.willChange = 'transform';
      card.classList.add('tilting');
    };

    const handlePointerLeave = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        card.style.transform = '';
        card.style.willChange = '';
        card.classList.remove('tilting');
      });
    };

    card.addEventListener('mouseenter', handlePointerEnter);
    card.addEventListener('mousemove', handlePointerMove);
    card.addEventListener('mouseleave', handlePointerLeave);
  });
};

// Scroll Reveal Animations
const initRevealAnimations = () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const candidates = document.querySelectorAll(`
    .content-card,
    .service-item,
    .testimonials-item,
    .clients-item,
    .project-item,
    .blog-post-item,
    .timeline-item,
    .skills-item
  `);

  candidates.forEach(el => el.classList.add('reveal'));
  if (prefersReduced) {
    candidates.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

  candidates.forEach(el => observer.observe(el));
};

/**
 * Loads CSV data and renders all sections.
 */
const initContentFromCsv = async () => {
  try {
    const [portfolioItems, blogPosts, skills, experience, education, services, testimonials, clients, social] = await Promise.all([
      loadCsv(config.data.portfolioCsv),
      loadCsv(config.data.blogCsv),
      loadCsv(config.data.skillsCsv),
      loadCsv(config.data.experienceCsv),
      loadCsv(config.data.educationCsv),
      loadCsv(config.data.servicesCsv),
      loadCsv(config.data.testimonialsCsv),
      loadCsv(config.data.clientsCsv),
      loadCsv(config.data.socialCsv)
    ]);

    renderPortfolio(portfolioItems);
    wireProjectModalHandlers(portfolioItems);
    renderBlog(blogPosts);
    renderSkills(skills);
    renderTimeline(experience, 'experience-list');
    renderTimeline(education, 'education-list');
    renderServices(services);
    renderTestimonials(testimonials);
    renderClients(clients);
    renderSocial(social);
  } catch (err) {
    console.error('Error loading CSV content:', err);
  }
};

// Initialize Application
/**
 * Bootstraps all feature initializers.
 */
const initApp = async () => {
  await initContentFromCsv();
  initSidebar();
  initTestimonialsModal();
  // initPortfolioFilter(); // Disabled: filter UI removed
  initFormValidation();
  initPageNavigation();
  initThemeSwitching();
  initTiltEffects();
  initRevealAnimations();
};

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

})();
