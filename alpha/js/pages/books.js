// js/pages/books.js
// Books page scroll choreography. Five .book entries, each with a sticky
// .book-left (cover, title, subtitle) and stacked .quote blocks on the right.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function initHero() {
    A.heroReveal({
      name: '.hero .hero-name',
      sub:  '.hero .hero-sub',
      kick: '.hero .hero-kicker'
    });
  }

  function initBook(book) {
    const left   = book.querySelector('.book-left');
    const cover  = book.querySelector('.book-cover');
    const genre  = book.querySelector('.book-genre');
    const title  = book.querySelector('.book-title');
    const sub    = book.querySelector('.book-subtitle');
    const blocks = book.querySelectorAll('.synopsis, .quote');

    // Left column: stagger reveal
    const leftEls = [genre, cover, title, sub].filter(Boolean);
    if (leftEls.length) {
      gsap.set(leftEls, { y: 35, opacity: 0 });
      gsap.to(leftEls, {
        y: 0, opacity: 1,
        duration: 0.75, ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: book, start: 'top 80%', toggleActions: 'play none none reverse' }
      });
    }
    if (cover) {
      const img = cover.querySelector('img');
      if (img) A.kenBurns(img, { trigger: cover, from: 1.05 });
    }

    // Right column: synopsis + each quote rises in sequence
    if (blocks.length) {
      gsap.set(blocks, { y: 50, opacity: 0 });
      gsap.to(blocks, {
        y: 0, opacity: 1,
        duration: 0.9, ease: 'power3.out',
        stagger: 0.18,
        scrollTrigger: { trigger: book, start: 'top 75%', toggleActions: 'play none none reverse' }
      });
    }
  }

  function init() {
    if (A.reduced) return;
    initHero();
    document.querySelectorAll('.book').forEach(initBook);
    A.refreshOnLoad();
  }

  window.initBooksPage = init;

  function isMyPage() {
    const c = document.querySelector('[data-barba-namespace]');
    return c && c.dataset.barbaNamespace === 'books';
  }

  if (isMyPage()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
