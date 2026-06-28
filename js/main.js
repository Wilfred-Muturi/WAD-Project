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
  const featuredIds = ["p01", "p05", "p03", "p08"];
  const items = featuredIds.map((id) => findProduct(id)).filter(Boolean);
  grid.innerHTML = items.map(productCardHTML).join("");
  attachAddToCartHandlers(grid);
}