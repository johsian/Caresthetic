(function(){
  'use strict';

  // Header background on scroll
  var header = document.getElementById('siteHeader');
  var onScroll = function(){
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav toggle
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', function(){
    var open = mainNav.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mainNav.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      mainNav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Scroll reveal
  var revealEls = document.querySelectorAll('.reveal');
  var showReveal = function(el){ el.classList.add('is-visible'); };

  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          showReveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 120px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });

    // Safety net: a fast fling can skip an element past the observer's
    // sampling before it ever registers as intersecting. Sweep on scroll
    // and catch anything already above the fold that never got flagged.
    var sweep = function(){
      revealEls.forEach(function(el){
        if (!el.classList.contains('is-visible') && el.getBoundingClientRect().top < window.innerHeight){
          showReveal(el);
        }
      });
    };
    document.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('load', sweep);
    sweep();
  } else {
    revealEls.forEach(showReveal);
  }

  // Ensure hero video plays (Safari/iOS)
  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo){
    var playPromise = heroVideo.play();
    if (playPromise && playPromise.catch) playPromise.catch(function(){});
  }

  // Pre-fill product interest when a "Comprar" CTA links to the order form
  document.querySelectorAll('[data-product]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var select = document.getElementById('product');
      if (select) select.value = btn.getAttribute('data-product');
    });
  });

})();
