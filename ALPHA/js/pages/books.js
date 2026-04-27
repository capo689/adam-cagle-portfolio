// js/pages/books.js
// Books page scroll choreography. Five .book entries, each with a sticky
// .book-left (cover, title, subtitle) and stacked .quote blocks on the right.

(function () {
  const A = window.AnimHelpers;
  if (!A) return;

  function initHero() {
    // Books hero is a paragraph statement, not a punchy headline.
    // Use word-level SplitText so the reveal stays under ~1.2s.
    if (typeof SplitText === 'undefined') return;
    const heroName = document.querySelector('.hero .hero-name');
    const heroKick = document.querySelector('.hero .hero-kicker');
    if (!heroName) return;

    gsap.set([heroKick, heroName].filter(Boolean), { opacity: 0 });

    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
      .then(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        if (heroKick) {
          tl.fromTo(heroKick,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.6 }, 0.15);
        }
        const split = new SplitText(heroName, {
          type: 'words,lines',
          mask: 'lines',
          linesClass: 'split-line',
          wordsClass: 'split-word'
        });
        gsap.set(heroName, { opacity: 1 });
        gsap.set(split.words, { yPercent: 110 });
        tl.to(split.words, {
          yPercent: 0,
          duration: 0.7,
          stagger: 0.04
        }, 0.25);
      });
  }

  function initBook(book) {
    const left   = book.querySelector('.book-left');
    const cover  = book.querySelector('.book-cover');
    const genre  = book.querySelector('.book-genre');
    const title  = book.querySelector('.book-title');
    const sub    = book.querySelector('.book-subtitle');
    const quotes = book.querySelectorAll('.quote');

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

    // Right column: each quote rises
    if (quotes.length) {
      gsap.set(quotes, { y: 50, opacity: 0 });
      gsap.to(quotes, {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
