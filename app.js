/* ========== EBIS WIG STORE ========== */

var STORAGE_KEY = 'ebis_wig_products';

function getProducts() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveProducts(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    alert('Storage is full. Try removing some products or use smaller files.');
  }
}

function formatETB(amount) {
  var n = Number(amount) || 0;
  return n.toLocaleString('en-US') + ' ETB';
}

/* ========== STOREFRONT ========== */
(function storefront() {
  var grid = document.getElementById('productGrid');
  var noProducts = document.getElementById('noProducts');
  if (!grid) return;

  var products = getProducts();

  if (products.length === 0) {
    if (noProducts) noProducts.style.display = 'block';
    return;
  }

  if (noProducts) noProducts.style.display = 'none';

  products.forEach(function (p) {
    var card = document.createElement('div');
    card.className = 'product-card';

    var mediaHTML;
    if (p.mediaType === 'video') {
      mediaHTML = '<video src="' + p.media + '" muted playsinline loop preload="metadata"></video>';
    } else {
      mediaHTML = '<img src="' + p.media + '" alt="' + p.name + '">';
    }

    var tagHTML = p.tag ? '<span class="tag">' + p.tag + '</span>' : '';
    var oldPriceHTML = p.oldPrice ? '<small>' + formatETB(p.oldPrice) + '</small>' : '';

    card.innerHTML =
      '<div class="product-img">' +
        tagHTML +
        mediaHTML +
      '</div>' +
      '<div class="product-info">' +
        '<h3>' + p.name + '</h3>' +
        '<p class="product-desc">' + p.desc + '</p>' +
        '<div class="price-row">' +
          '<div class="price">' + formatETB(p.price) + oldPriceHTML + '</div>' +
          '<button class="btn-shop"><i class="fas fa-plus"></i> Add</button>' +
        '</div>' +
      '</div>';

    var video = card.querySelector('video');
    if (video) {
      card.addEventListener('mouseenter', function () {
        video.play().catch(function () {});
      });
      card.addEventListener('mouseleave', function () {
        video.pause();
        video.currentTime = 0;
      });
    }

    grid.appendChild(card);
  });
})();

/* ========== ADMIN ========== */
(function adminPanel() {
  var form = document.getElementById('productForm');
  if (!form) return;

  var nameInput = document.getElementById('productName');
  var descInput = document.getElementById('productDesc');
  var priceInput = document.getElementById('productPrice');
  var oldPriceInput = document.getElementById('productOldPrice');
  var tagInput = document.getElementById('productTag');

  var uploadZone = document.getElementById('uploadZone');
  var fileInput = document.getElementById('fileInput');
  var preview = document.getElementById('uploadPreview');

  var listEl = document.getElementById('adminProducts');
  var countEl = document.getElementById('productCount');
  var resetBtn = document.getElementById('resetBtn');

  var currentMedia = null;

  uploadZone.addEventListener('click', function () { fileInput.click(); });

  ['dragenter', 'dragover'].forEach(function (evt) {
    uploadZone.addEventListener(evt, function (e) {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(function (evt) {
    uploadZone.addEventListener(evt, function (e) {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
    });
  });

  uploadZone.addEventListener('drop', function (e) {
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', function (e) {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
    fileInput.value = '';
  });

  function handleFile(file) {
    var isImage = file.type.indexOf('image/') === 0;
    var isVideo = file.type.indexOf('video/') === 0;

    if (!isImage && !isVideo) {
      alert('Only images and videos are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Please use a file under 10MB.');
      return;
    }

    var reader = new FileReader();
    reader.onload = function (ev) {
      currentMedia = {
        dataUrl: ev.target.result,
        type: isVideo ? 'video' : 'image',
        name: file.name
      };
      renderPreview();
    };
    reader.readAsDataURL(file);
  }

  function renderPreview() {
    preview.innerHTML = '';
    if (!currentMedia) return;

    var item = document.createElement('div');
    item.className = 'preview-item';

    var mediaEl;
    if (currentMedia.type === 'video') {
      mediaEl = document.createElement('video');
      mediaEl.src = currentMedia.dataUrl;
      mediaEl.muted = true;
    } else {
      mediaEl = document.createElement('img');
      mediaEl.src = currentMedia.dataUrl;
      mediaEl.alt = 'preview';
    }
    item.appendChild(mediaEl);

    var info = document.createElement('div');
    info.className = 'file-info';
    info.innerHTML = '<strong>' + currentMedia.name + '</strong><span>Ready to add</span>';
    item.appendChild(info);

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', function () {
      currentMedia = null;
      renderPreview();
    });
    item.appendChild(removeBtn);

    preview.appendChild(item);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!currentMedia) {
      alert('Please upload a photo or video of the wig.');
      return;
    }

    var product = {
      id: Date.now().toString(),
      name: nameInput.value.trim(),
      desc: descInput.value.trim(),
      price: Number(priceInput.value),
      oldPrice: oldPriceInput.value ? Number(oldPriceInput.value) : null,
      tag: tagInput.value.trim() || null,
      media: currentMedia.dataUrl,
      mediaType: currentMedia.type,
      createdAt: Date.now()
    };

    var products = getProducts();
    products.unshift(product);
    saveProducts(products);

    form.reset();
    currentMedia = null;
    renderPreview();
    renderAdminList();

    alert('✅ "' + product.name + '" was added to your store!');
  });

  resetBtn.addEventListener('click', function () {
    form.reset();
    currentMedia = null;
    renderPreview();
  });

  function renderAdminList() {
    var products = getProducts();
    countEl.textContent = products.length;
    listEl.innerHTML = '';

    if (products.length === 0) {
      listEl.innerHTML = '<div class="admin-empty">No products yet. Add your first wig above ↑</div>';
      return;
    }

    products.forEach(function (p) {
      var item = document.createElement('div');
      item.className = 'admin-product-item';

      var mediaEl;
      if (p.mediaType === 'video') {
        mediaEl = document.createElement('video');
        mediaEl.src = p.media;
        mediaEl.muted = true;
      } else {
        mediaEl = document.createElement('img');
        mediaEl.src = p.media;
        mediaEl.alt = p.name;
      }
      item.appendChild(mediaEl);

      var info = document.createElement('div');
      info.className = 'info';
      info.innerHTML =
        '<h4>' + p.name + '</h4>' +
        '<p>' + p.desc + '</p>' +
        '<div class="price">' + formatETB(p.price) + '</div>';
      item.appendChild(info);

      var del = document.createElement('button');
      del.className = 'delete-btn';
      del.title = 'Delete';
      del.innerHTML = '<i class="fas fa-trash"></i>';
      del.addEventListener('click', function () {
        if (!confirm('Delete "' + p.name + '"?')) return;
        var updated = getProducts().filter(function (x) { return x.id !== p.id; });
        saveProducts(updated);
        renderAdminList();
      });
      item.appendChild(del);

      listEl.appendChild(item);
    });
  }

  renderAdminList();
})();