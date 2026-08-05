(function () {
  'use strict';

  var config = window.CARESTHETIC_SUPABASE;
  var catalog = document.getElementById('tizo-catalog');

  if (!catalog || !config || !config.url || !config.publishableKey || !window.supabase) {
    return;
  }

  var client = window.supabase.createClient(config.url, config.publishableKey);

  function makeElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function formatPrice(product) {
    if (!product.price_cents) return '';
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: product.currency || 'USD'
    }).format(product.price_cents / 100);
  }

  function createProductCard(product, index) {
    var card = makeElement('article', 'glass-card rounded-3xl p-8 text-center catalog-card');
    card.style.transitionDelay = Math.min(index * 0.05 + 0.1, 0.4) + 's';

    var imageWrap = makeElement('div', 'flex items-end justify-center mb-6');
    imageWrap.style.height = '160px';
    var image = makeElement('img', 'product-img');
    image.src = product.cover_image_url || '/tizo-assets/images/tizo3-tube.png';
    image.alt = product.name;
    image.loading = 'lazy';
    image.style.height = '140px';
    image.style.width = 'auto';
    imageWrap.appendChild(image);

    var title = makeElement('h3', 'font-heading font-bold text-white text-xl mb-1', product.name);
    var subtitle = makeElement('p', 'font-body text-white/40 text-xs tracking-wider uppercase mb-3', product.short_description);
    subtitle.style.letterSpacing = '0.1em';

    var price = formatPrice(product);
    var metaText = '';
    if (product.inventory_count === 0) metaText = 'Agotado';
    else if (product.inventory_count !== null) metaText = product.inventory_count + ' disponibles';
    else metaText = 'Disponible en clínica';
    if (price) metaText = price + ' · ' + metaText;
    var meta = makeElement('p', 'font-body text-sm mb-5 catalog-meta', metaText);

    var button;
    if (!product.price_cents) {
      button = makeElement('span', 'catalog-button catalog-button-disabled', 'Precio pendiente');
      button.setAttribute('aria-disabled', 'true');
    } else if (product.inventory_count === 0) {
      button = makeElement('span', 'catalog-button catalog-button-disabled', 'Agotado');
      button.setAttribute('aria-disabled', 'true');
    } else {
      button = makeElement('button', 'btn-gold catalog-button text-xs px-6 py-3 rounded-full w-full', 'Añadir al carrito');
      button.type = 'button';
      button.setAttribute('aria-label', 'Añadir ' + product.name + ' al carrito');
      button.addEventListener('click', function () {
        window.dispatchEvent(new CustomEvent('caresthetic:add-to-cart', { detail: product }));
      });
      button.style.maxWidth = '200px';
    }

    card.appendChild(imageWrap);
    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(meta);
    card.appendChild(button);
    return card;
  }

  client
    .from('products')
    .select('id, slug, name, short_description, price_cents, currency, inventory_count, cover_image_url, active, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .then(function (result) {
      if (result.error || !result.data || !result.data.length) return;

      var fragment = document.createDocumentFragment();
      result.data.forEach(function (product, index) {
        fragment.appendChild(createProductCard(product, index));
      });
      catalog.replaceChildren(fragment);
      catalog.setAttribute('data-source', 'supabase');
      window.dispatchEvent(new CustomEvent('caresthetic:catalog-ready', { detail: result.data }));
    });
})();
