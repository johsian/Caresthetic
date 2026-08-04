(function () {
  'use strict';

  var config = window.CARESTHETIC_SUPABASE;
  var configurationPanel = document.getElementById('configuration-panel');
  var loginPanel = document.getElementById('login-panel');
  var dashboard = document.getElementById('dashboard');
  var signOutButton = document.getElementById('sign-out-button');
  var loginForm = document.getElementById('login-form');
  var loginButton = document.getElementById('login-button');
  var loginError = document.getElementById('login-error');
  var passwordInput = document.getElementById('login-password');
  var passwordToggle = document.getElementById('password-toggle');
  var productList = document.getElementById('product-list');
  var productSearch = document.getElementById('product-search');
  var statusFilter = document.getElementById('status-filter');
  var catalogLoading = document.getElementById('catalog-loading');
  var catalogEmpty = document.getElementById('catalog-empty');
  var productDialog = document.getElementById('product-dialog');
  var productForm = document.getElementById('product-form');
  var productFormError = document.getElementById('product-form-error');
  var newProductButton = document.getElementById('new-product-button');
  var dialogCloseButton = document.getElementById('dialog-close-button');
  var cancelProductButton = document.getElementById('cancel-product-button');
  var deleteProductButton = document.getElementById('delete-product-button');
  var saveProductButton = document.getElementById('save-product-button');
  var toast = document.getElementById('toast');
  var client;
  var products = [];
  var toastTimer;
  var slugEdited = false;

  function showOnly(panel) {
    configurationPanel.classList.toggle('is-hidden', panel !== configurationPanel);
    loginPanel.classList.toggle('is-hidden', panel !== loginPanel);
    dashboard.classList.toggle('is-hidden', panel !== dashboard);
    signOutButton.classList.toggle('is-hidden', panel !== dashboard);
  }

  function setButtonLoading(button, loading, loadingText) {
    if (!button) return;
    if (loading) {
      button.dataset.label = button.textContent.trim();
      button.disabled = true;
      button.textContent = loadingText;
    } else {
      button.disabled = false;
      if (button.dataset.label) button.textContent = button.dataset.label;
    }
  }

  function showToast(message, isError) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle('error', Boolean(isError));
    toast.classList.add('visible');
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('visible');
    }, 3600);
  }

  function makeElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function formatPrice(product) {
    if (!product.price_cents) return 'Sin precio';
    return new Intl.NumberFormat('es-PR', {
      style: 'currency',
      currency: product.currency || 'USD'
    }).format(product.price_cents / 100);
  }

  function inventoryText(product) {
    if (product.inventory_count === null) return 'Sin conteo';
    if (product.inventory_count === 0) return 'Agotado';
    return product.inventory_count + ' unidades';
  }

  function createCell(label, value) {
    var cell = makeElement('div', 'product-cell');
    cell.appendChild(makeElement('span', 'cell-label', label));
    cell.appendChild(makeElement('span', 'cell-value', value));
    return cell;
  }

  function createProductRow(product) {
    var row = makeElement('article', 'product-row');
    row.dataset.productId = product.id;

    var thumb = makeElement('div', 'product-thumb');
    var image = makeElement('img');
    image.src = product.cover_image_url || '/favicon.png';
    image.alt = '';
    image.loading = 'lazy';
    image.addEventListener('error', function () {
      image.src = '/favicon.png';
    }, { once: true });
    thumb.appendChild(image);

    var name = makeElement('div', 'product-name');
    name.appendChild(makeElement('strong', '', product.name));
    name.appendChild(makeElement('span', '', product.short_description || product.slug));

    var statusCell = makeElement('div', 'product-cell');
    statusCell.appendChild(makeElement('span', 'cell-label', 'Estado'));
    statusCell.appendChild(makeElement(
      'span',
      'status-badge ' + (product.active ? 'status-active' : 'status-draft'),
      product.active ? 'Publicado' : 'Borrador'
    ));

    var editButton = makeElement('button', 'row-action');
    editButton.type = 'button';
    editButton.setAttribute('aria-label', 'Editar ' + product.name);
    editButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>';
    editButton.addEventListener('click', function () {
      openProductEditor(product);
    });

    row.appendChild(thumb);
    row.appendChild(name);
    row.appendChild(createCell('Precio', formatPrice(product)));
    row.appendChild(createCell('Inventario', inventoryText(product)));
    row.appendChild(statusCell);
    row.appendChild(editButton);
    return row;
  }

  function getFilteredProducts() {
    var query = productSearch.value.trim().toLocaleLowerCase('es');
    var filter = statusFilter.value;
    return products.filter(function (product) {
      var searchable = [product.name, product.slug, product.short_description, product.description]
        .join(' ')
        .toLocaleLowerCase('es');
      var matchesQuery = !query || searchable.indexOf(query) !== -1;
      var matchesStatus = filter === 'all'
        || (filter === 'active' && product.active)
        || (filter === 'inactive' && !product.active)
        || (filter === 'out' && product.inventory_count === 0);
      return matchesQuery && matchesStatus;
    });
  }

  function renderProducts() {
    var filtered = getFilteredProducts();
    var fragment = document.createDocumentFragment();
    filtered.forEach(function (product) {
      fragment.appendChild(createProductRow(product));
    });
    productList.replaceChildren(fragment);
    catalogEmpty.classList.toggle('is-hidden', filtered.length > 0);
  }

  function updateStats() {
    document.getElementById('total-count').textContent = products.length;
    document.getElementById('active-count').textContent = products.filter(function (product) {
      return product.active;
    }).length;
    document.getElementById('low-stock-count').textContent = products.filter(function (product) {
      return product.inventory_count !== null && product.inventory_count <= 5;
    }).length;
  }

  async function loadProducts() {
    catalogLoading.classList.remove('is-hidden');
    productList.classList.add('is-hidden');
    catalogEmpty.classList.add('is-hidden');

    var result = await client
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    catalogLoading.classList.add('is-hidden');
    productList.classList.remove('is-hidden');

    if (result.error) {
      showToast('No se pudo cargar el catálogo. Verifica la conexión.', true);
      return;
    }

    products = result.data || [];
    updateStats();
    renderProducts();
  }

  function normalizeSlug(value) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function setField(id, value) {
    document.getElementById(id).value = value === null || value === undefined ? '' : value;
  }

  function openProductEditor(product) {
    productForm.reset();
    productFormError.textContent = '';
    slugEdited = Boolean(product);
    document.getElementById('product-dialog-title').textContent = product ? 'Editar producto' : 'Nuevo producto';
    deleteProductButton.classList.toggle('is-hidden', !product);

    setField('product-id', product && product.id);
    setField('product-name', product && product.name);
    setField('product-slug', product && product.slug);
    setField('product-short-description', product && product.short_description);
    setField('product-description', product && product.description);
    setField('product-price', product ? (product.price_cents / 100).toFixed(2) : '0.00');
    setField('product-inventory', product && product.inventory_count);
    setField('product-order', product ? product.sort_order : ((products.length + 1) * 10));
    setField('product-image', product && product.cover_image_url);
    setField('product-features', product && (product.features || []).join('\n'));
    document.getElementById('product-active').checked = product ? product.active : false;
    document.getElementById('product-featured').checked = product ? product.featured : false;

    productDialog.showModal();
    window.setTimeout(function () {
      document.getElementById('product-name').focus();
    }, 30);
  }

  function closeProductEditor() {
    productDialog.close();
  }

  function getProductPayload() {
    var inventoryValue = document.getElementById('product-inventory').value;
    var features = document.getElementById('product-features').value
      .split('\n')
      .map(function (feature) { return feature.trim(); })
      .filter(Boolean);

    return {
      slug: document.getElementById('product-slug').value.trim(),
      name: document.getElementById('product-name').value.trim(),
      short_description: document.getElementById('product-short-description').value.trim(),
      description: document.getElementById('product-description').value.trim(),
      price_cents: Math.round(Number(document.getElementById('product-price').value || 0) * 100),
      currency: 'USD',
      inventory_count: inventoryValue === '' ? null : Number(inventoryValue),
      cover_image_url: document.getElementById('product-image').value.trim(),
      features: features,
      active: document.getElementById('product-active').checked,
      featured: document.getElementById('product-featured').checked,
      sort_order: Number(document.getElementById('product-order').value || 0)
    };
  }

  async function saveProduct(event) {
    event.preventDefault();
    productFormError.textContent = '';

    if (!productForm.checkValidity()) {
      productForm.reportValidity();
      return;
    }

    var id = document.getElementById('product-id').value;
    var payload = getProductPayload();
    setButtonLoading(saveProductButton, true, 'Guardando…');

    var result = id
      ? await client.from('products').update(payload).eq('id', id).select().single()
      : await client.from('products').insert(payload).select().single();

    setButtonLoading(saveProductButton, false);

    if (result.error) {
      if (result.error.code === '23505') {
        productFormError.textContent = 'Ese identificador ya está en uso. Escribe uno diferente.';
      } else {
        productFormError.textContent = 'No se pudo guardar el producto. Revisa los datos e inténtalo otra vez.';
      }
      return;
    }

    closeProductEditor();
    showToast(id ? 'Producto actualizado.' : 'Producto creado.');
    await loadProducts();
  }

  async function deleteProduct() {
    var id = document.getElementById('product-id').value;
    var name = document.getElementById('product-name').value.trim();
    if (!id) return;
    if (!window.confirm('¿Eliminar “' + name + '”? Esta acción no se puede deshacer.')) return;

    setButtonLoading(deleteProductButton, true, 'Eliminando…');
    var result = await client.from('products').delete().eq('id', id);
    setButtonLoading(deleteProductButton, false);

    if (result.error) {
      productFormError.textContent = 'No se pudo eliminar el producto.';
      return;
    }

    closeProductEditor();
    showToast('Producto eliminado.');
    await loadProducts();
  }

  async function verifyAdministrator(session) {
    if (!session || !session.user) {
      showOnly(loginPanel);
      return false;
    }

    var membership = await client
      .from('admin_users')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (membership.error || !membership.data) {
      await client.auth.signOut();
      showOnly(loginPanel);
      loginError.textContent = membership.error
        ? 'No se pudo verificar el acceso administrativo.'
        : 'Esta cuenta no tiene permisos de administración.';
      return false;
    }

    showOnly(dashboard);
    document.getElementById('welcome-copy').textContent = 'Sesión activa como ' + session.user.email + '. Los cambios publicados aparecen en la tienda.';
    await loadProducts();
    return true;
  }

  async function signIn(event) {
    event.preventDefault();
    loginError.textContent = '';

    if (!loginForm.checkValidity()) {
      loginForm.reportValidity();
      return;
    }

    setButtonLoading(loginButton, true, 'Verificando…');
    var result = await client.auth.signInWithPassword({
      email: document.getElementById('login-email').value.trim(),
      password: passwordInput.value
    });
    setButtonLoading(loginButton, false);

    if (result.error) {
      loginError.textContent = 'No pudimos iniciar sesión. Verifica el correo y la contraseña.';
      return;
    }

    await verifyAdministrator(result.data.session);
  }

  async function signOut() {
    signOutButton.disabled = true;
    await client.auth.signOut();
    signOutButton.disabled = false;
    loginForm.reset();
    products = [];
    showOnly(loginPanel);
  }

  function bindEvents() {
    loginForm.addEventListener('submit', signIn);
    signOutButton.addEventListener('click', signOut);
    passwordToggle.addEventListener('click', function () {
      var showing = passwordInput.type === 'text';
      passwordInput.type = showing ? 'password' : 'text';
      passwordToggle.setAttribute('aria-label', showing ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });
    productSearch.addEventListener('input', renderProducts);
    statusFilter.addEventListener('change', renderProducts);
    newProductButton.addEventListener('click', function () { openProductEditor(null); });
    dialogCloseButton.addEventListener('click', closeProductEditor);
    cancelProductButton.addEventListener('click', closeProductEditor);
    deleteProductButton.addEventListener('click', deleteProduct);
    productForm.addEventListener('submit', saveProduct);
    document.getElementById('product-name').addEventListener('input', function (event) {
      if (!slugEdited) document.getElementById('product-slug').value = normalizeSlug(event.target.value);
    });
    document.getElementById('product-slug').addEventListener('input', function () {
      slugEdited = true;
    });
    productDialog.addEventListener('click', function (event) {
      if (event.target === productDialog) closeProductEditor();
    });
  }

  async function initialize() {
    if (!config || !config.url || !config.publishableKey || !window.supabase) {
      showOnly(configurationPanel);
      return;
    }

    client = window.supabase.createClient(config.url, config.publishableKey);
    bindEvents();

    var sessionResult = await client.auth.getSession();
    if (sessionResult.error || !sessionResult.data.session) {
      showOnly(loginPanel);
      return;
    }

    await verifyAdministrator(sessionResult.data.session);
  }

  initialize();
})();
