(function () {
  'use strict';

  var STORAGE_KEY = 'caresthetic_cart_v1';
  var MAX_QUANTITY = 10;
  var products = new Map();
  var cart = loadCart();
  var lastFocusedElement = null;
  var toastTimer = null;

  var drawer = document.querySelector('[data-cart-drawer]');
  var overlay = document.querySelector('[data-cart-overlay]');
  var itemsContainer = document.querySelector('[data-cart-items]');
  var emptyState = document.querySelector('[data-cart-empty]');
  var footer = document.querySelector('[data-cart-footer]');
  var subtotal = document.querySelector('[data-cart-subtotal]');
  var checkoutButton = document.querySelector('[data-cart-checkout]');
  var checkoutLabel = document.querySelector('[data-checkout-label]');
  var errorMessage = document.querySelector('[data-cart-error]');
  var toast = document.querySelector('[data-cart-toast]');
  var toastText = document.querySelector('[data-cart-toast-text]');

  if (!drawer || !overlay || !itemsContainer || !checkoutButton) return;

  function loadCart() {
    try {
      var stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(stored)) return [];
      return stored
        .filter(function (item) {
          return item && typeof item.id === 'string' && Number.isInteger(item.quantity);
        })
        .map(function (item) {
          return { id: item.id, quantity: Math.min(Math.max(item.quantity, 1), MAX_QUANTITY) };
        });
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      // The cart still works for this visit when storage is unavailable.
    }
  }

  function formatMoney(cents, currency) {
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(cents / 100);
  }

  function cartQuantity() {
    return cart.reduce(function (total, item) {
      return total + item.quantity;
    }, 0);
  }

  function availableLimit(product) {
    if (Number.isInteger(product.inventory_count)) {
      return Math.max(0, Math.min(product.inventory_count, MAX_QUANTITY));
    }
    return MAX_QUANTITY;
  }

  function syncCartWithCatalog() {
    cart = cart.filter(function (item) {
      var product = products.get(item.id);
      if (!product || !product.active || product.price_cents <= 0) return false;
      var limit = availableLimit(product);
      if (limit === 0) return false;
      item.quantity = Math.min(item.quantity, limit);
      return true;
    });
    saveCart();
    render();
  }

  function updateTriggers() {
    var quantity = cartQuantity();
    document.querySelectorAll('[data-cart-count]').forEach(function (badge) {
      badge.textContent = String(quantity);
    });
    document.querySelectorAll('[data-cart-open]').forEach(function (button) {
      button.setAttribute(
        'aria-label',
        'Abrir carrito, ' + quantity + (quantity === 1 ? ' artículo' : ' artículos')
      );
    });
  }

  function makeIconButton(iconClass, label, action, id, disabled) {
    var button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.dataset.cartAction = action;
    button.dataset.productId = id;
    button.disabled = Boolean(disabled);
    var icon = document.createElement('i');
    icon.className = iconClass;
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(icon);
    return button;
  }

  function createCartItem(item) {
    var product = products.get(item.id);
    var article = document.createElement('article');
    article.className = 'cart-item';

    var imageWrap = document.createElement('div');
    imageWrap.className = 'cart-item-image';
    var image = document.createElement('img');
    image.src = product.cover_image_url || '/tizo-assets/images/tizo3-tube.png';
    image.alt = '';
    image.loading = 'lazy';
    imageWrap.appendChild(image);

    var details = document.createElement('div');
    details.className = 'cart-item-details';
    var name = document.createElement('h3');
    name.className = 'cart-item-name';
    name.textContent = product.name;
    var description = document.createElement('p');
    description.className = 'cart-item-description';
    description.textContent = product.short_description || 'TiZO';

    var bottom = document.createElement('div');
    bottom.className = 'cart-item-bottom';
    var price = document.createElement('span');
    price.className = 'cart-item-price';
    price.textContent = formatMoney(product.price_cents * item.quantity, product.currency);

    var actions = document.createElement('div');
    actions.className = 'cart-item-actions';
    var quantity = document.createElement('div');
    quantity.className = 'cart-quantity';
    quantity.setAttribute('aria-label', 'Cantidad de ' + product.name);
    var decrease = makeIconButton('ri-subtract-line', 'Disminuir cantidad', 'decrease', item.id, false);
    var quantityValue = document.createElement('span');
    quantityValue.textContent = String(item.quantity);
    quantityValue.setAttribute('aria-live', 'polite');
    var increase = makeIconButton(
      'ri-add-line',
      'Aumentar cantidad',
      'increase',
      item.id,
      item.quantity >= availableLimit(product)
    );
    quantity.appendChild(decrease);
    quantity.appendChild(quantityValue);
    quantity.appendChild(increase);

    var remove = makeIconButton('ri-delete-bin-6-line', 'Eliminar ' + product.name, 'remove', item.id, false);
    remove.className = 'cart-remove';
    actions.appendChild(quantity);
    actions.appendChild(remove);
    bottom.appendChild(price);
    bottom.appendChild(actions);

    details.appendChild(name);
    details.appendChild(description);
    details.appendChild(bottom);
    article.appendChild(imageWrap);
    article.appendChild(details);
    return article;
  }

  function render() {
    updateTriggers();
    itemsContainer.replaceChildren();

    var validItems = cart.filter(function (item) {
      return products.has(item.id);
    });
    var isEmpty = validItems.length === 0;
    emptyState.hidden = !isEmpty;
    footer.hidden = isEmpty;

    var total = 0;
    validItems.forEach(function (item) {
      var product = products.get(item.id);
      total += product.price_cents * item.quantity;
      itemsContainer.appendChild(createCartItem(item));
    });

    subtotal.textContent = formatMoney(total, validItems[0] ? products.get(validItems[0].id).currency : 'USD');
  }

  function showToast(message) {
    if (!toast || !toastText) return;
    window.clearTimeout(toastTimer);
    toastText.textContent = message;
    toast.hidden = false;
    window.requestAnimationFrame(function () {
      toast.classList.add('is-visible');
    });
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-visible');
      window.setTimeout(function () {
        toast.hidden = true;
      }, 220);
    }, 2200);
  }

  function addProduct(product) {
    if (!product || product.price_cents <= 0) {
      showToast('Este producto todavía no tiene precio disponible');
      return;
    }
    if (availableLimit(product) === 0) {
      showToast('Este producto está agotado');
      return;
    }

    products.set(product.id, product);
    var existing = cart.find(function (item) {
      return item.id === product.id;
    });
    if (existing) existing.quantity = Math.min(existing.quantity + 1, availableLimit(product));
    else cart.push({ id: product.id, quantity: 1 });
    saveCart();
    render();
    showToast(product.name + ' añadido al carrito');
  }

  function changeQuantity(id, delta) {
    var item = cart.find(function (candidate) {
      return candidate.id === id;
    });
    var product = products.get(id);
    if (!item || !product) return;
    var next = item.quantity + delta;
    if (next <= 0) cart = cart.filter(function (candidate) { return candidate.id !== id; });
    else item.quantity = Math.min(next, availableLimit(product));
    saveCart();
    render();
  }

  function removeProduct(id) {
    cart = cart.filter(function (item) {
      return item.id !== id;
    });
    saveCart();
    render();
  }

  function openCart(trigger) {
    lastFocusedElement = trigger || document.activeElement;
    overlay.hidden = false;
    drawer.hidden = false;
    document.body.classList.add('cart-open');
    window.requestAnimationFrame(function () {
      overlay.classList.add('is-visible');
      drawer.classList.add('is-open');
      var closeButton = drawer.querySelector('[data-cart-close]');
      if (closeButton) closeButton.focus();
    });
  }

  function closeCart() {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    document.body.classList.remove('cart-open');
    window.setTimeout(function () {
      overlay.hidden = true;
      drawer.hidden = true;
    }, 280);
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  function setCheckoutState(isLoading) {
    checkoutButton.disabled = isLoading;
    checkoutLabel.textContent = isLoading ? 'Preparando pago…' : 'Proceder al pago';
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  async function checkout() {
    errorMessage.hidden = true;
    setCheckoutState(true);
    try {
      var response = await window.fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(function (item) {
            return { id: item.id, quantity: item.quantity };
          })
        })
      });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok || !data.url) {
        throw new Error(data.message || 'No pudimos iniciar el pago. Intenta nuevamente.');
      }
      window.location.assign(data.url);
    } catch (error) {
      showError(error.message || 'No pudimos iniciar el pago. Intenta nuevamente.');
      setCheckoutState(false);
    }
  }

  window.addEventListener('caresthetic:catalog-ready', function (event) {
    products.clear();
    (event.detail || []).forEach(function (product) {
      products.set(product.id, product);
    });
    syncCartWithCatalog();
  });

  window.addEventListener('caresthetic:add-to-cart', function (event) {
    addProduct(event.detail);
  });

  document.querySelectorAll('[data-cart-open]').forEach(function (button) {
    button.addEventListener('click', function () {
      openCart(button);
    });
  });
  document.querySelectorAll('[data-cart-close]').forEach(function (button) {
    button.addEventListener('click', closeCart);
  });
  document.querySelectorAll('[data-cart-continue]').forEach(function (button) {
    button.addEventListener('click', function () {
      closeCart();
      var catalogSection = document.getElementById('comprar');
      if (catalogSection) catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  overlay.addEventListener('click', closeCart);
  checkoutButton.addEventListener('click', checkout);
  itemsContainer.addEventListener('click', function (event) {
    var button = event.target.closest('[data-cart-action]');
    if (!button) return;
    var id = button.dataset.productId;
    if (button.dataset.cartAction === 'increase') changeQuantity(id, 1);
    if (button.dataset.cartAction === 'decrease') changeQuantity(id, -1);
    if (button.dataset.cartAction === 'remove') removeProduct(id);
  });

  document.addEventListener('keydown', function (event) {
    if (!drawer.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      closeCart();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusable = Array.from(
      drawer.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled])')
    ).filter(function (element) {
      return !element.hidden && element.offsetParent !== null;
    });
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  if (new URLSearchParams(window.location.search).get('checkout') === 'cancelled') {
    showToast('El pago fue cancelado; tu carrito sigue guardado');
  }

  updateTriggers();
  render();
})();
