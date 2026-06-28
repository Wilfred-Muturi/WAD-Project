document.addEventListener("DOMContentLoaded", () => {
  syncCartBadge();
  initFeaturedGrid();
  initShopPage();
  initCartPage();
  setFooterYear();
});

const CART_KEY = "thrift-cart";

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn("localStorage unavailable:", err);
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn("localStorage unavailable:", err);
  }
}


function getCart() {
  try {
    const raw = safeGet(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Cart data was corrupted, resetting.", err);
    return [];
  }
}

function saveCart(cart) {
  safeSet(CART_KEY, JSON.stringify(cart));
  syncCartBadge();
}

function addToCart(productId, size, qty = 1) {
  const cart = getCart();
  const existing = cart.find((line) => line.id === productId && line.size === size);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, size, qty });
  }
  saveCart(cart);
}

function removeFromCart(productId, size) {
  const cart = getCart().filter((line) => !(line.id === productId && line.size === size));
  saveCart(cart);
}

function updateCartQty(productId, size, qty) {
  const cart = getCart();
  const line = cart.find((l) => l.id === productId && l.size === size);
  if (line) {
    line.qty = Math.max(1, qty);
    saveCart(cart);
  }
}

function cartItemCount() {
  return getCart().reduce((sum, line) => sum + line.qty, 0);
}

function syncCartBadge() {
  const badges = document.querySelectorAll("#cart-count");
  const count = cartItemCount();
  badges.forEach((b) => {
    b.textContent = count;
    b.style.display = count > 0 ? "inline-block" : "none";
  });
}

function findProduct(id) {
  if (typeof DRIFT_PRODUCTS === "undefined") return null;
  return REMAKE_WORKS.find((p) => p.id === id) || null;
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) {
    alert(message);
    return;
  }
  const toastEl = document.createElement("div");
  toastEl.className = "toast align-items-center text-bg-dark border-0";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  toastEl.setAttribute("aria-atomic", "true");
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;
  container.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 2600 });
  toast.show();
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

function initFeaturedGrid() {
  const grid = document.getElementById("featured-grid");
  if (!grid || typeof DRIFT_PRODUCTS === "undefined") return;
  const featuredIds = ["p01", "p05", "p03", "p07s"];
  const items = featuredIds.map((id) => findProduct(id)).filter(Boolean);
  grid.innerHTML = items.map(productCardHTML).join("");
  attachAddToCartHandlers(grid);
}

function initShopPage() {
  const grid = document.getElementById("product-grid");
  if (!grid || typeof REMAKE_WORKS === "undefined") return;

  const filterButtons = document.querySelectorAll(".category-pill");
  const searchInput = document.getElementById("product-search");
  const emptyState = document.getElementById("shop-empty-state");
  let activeCategory = "all";

  function render() {
    const query = (searchInput?.value || "").trim().toLowerCase();

    const items = REMAKE_WORKS.filter((p) => {
      const matchesCategory =
        activeCategory === "all" || p.category === activeCategory;

      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.short.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });

    grid.innerHTML = items.map(productCardHTML).join("");

    if (emptyState) {
      emptyState.classList.toggle("d-none", items.length > 0);
    }

    attachAddToCartHandlers(grid);
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category;
      render();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", render);
  }

  render();
}

function productCardHTML(p) {
  const priceHTML = p.sale
    ? `<span class="product-price old">KSh ${p.oldPrice}</span>
       <span class="product-price">KSh ${p.price}</span>`
    : `<span class="product-price">KSh ${p.price}</span>`;

  const sizeOptions = p.sizes
    .map((size) => `<option value="${size}">${size}</option>`)
    .join("");

  return `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="product-card">
        <div class="product-img-wrap">
          ${p.sale ? '<span class="product-tag sale">Sale</span>' : ""}
          <img src="${p.image}" alt="${p.name}" loading="lazy">
        </div>

        <div class="card-body p-3">
          <p class="eyebrow mb-1">${categoryLabel(p.category)}</p>
          <h3 class="h6 mb-1">${p.name}</h3>
          <p class="small text-ink-soft mb-2">${p.short}</p>

          <div class="mb-2">
            ${priceHTML}
          </div>

          <div class="d-flex gap-2">
            <select class="form-select form-select-sm size-select">
              ${sizeOptions}
            </select>

            <button
              class="btn btn-drift btn-sm add-to-cart-btn"
              data-id="${p.id}"
              type="button">
              Add
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

function categoryLabel(category) {
  const map = {
    men: "Men",
    women: "Women",
    kids: "Kids"
  };

  return map[category] || category;
}

function attachAddToCartHandlers(scope) {
  scope.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".product-card");
      const size =
        card.querySelector(".size-select")?.value || "One Size";

      addToCart(btn.dataset.id, size, 1);

      const product = findProduct(btn.dataset.id);

      showToast(
        `Added "${product ? product.name : "Item"}" (${size}) to your cart.`
      );
    });
  });
}