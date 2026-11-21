
import * as api from "./js/api.js";
import { auth, db } from "./js/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

// BACKUP PRODUCTS
const sampleProducts = [
  { id: "1", name: "Printed cotton kurta", category: "clothing", type: "ethnic", price: 899, stock: 10, tag: "Indian ethnic", image: "https://images.unsplash.com/photo-1583391733956-6c78276477e8?auto=format&fit=crop&w=700&q=80" },
  { id: "2", name: "Everyday summer dress", category: "clothing", type: "western", price: 1299, stock: 10, tag: "Western wear", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=80" },
  { id: "3", name: "Classic casual shirt", category: "clothing", type: "western", price: 999, stock: 10, tag: "Western wear", image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=700&q=80" },
  { id: "4", name: "Kids festive-style set", category: "clothing", type: "kids", price: 749, stock: 10, tag: "Kids wear", image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=700&q=80" },
  { id: "5", name: "Soft drape saree", category: "clothing", type: "ethnic", price: 1899, stock: 10, tag: "Indian ethnic", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80" },
  { id: "6", name: "Relaxed fit trousers", category: "clothing", type: "western", price: 1099, stock: 10, tag: "Western wear", image: "https://images.unsplash.com/photo-1506629905607-d9b297d2b3e5?auto=format&fit=crop&w=700&q=80" },
  { id: "7", name: "Gentle face cleanser", category: "beauty", type: "skincare", price: 349, stock: 10, tag: "Skincare", image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=700&q=80" },
  { id: "8", name: "Everyday lipstick", category: "beauty", type: "makeup", price: 499, stock: 10, tag: "Makeup", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=700&q=80" },
  { id: "9", name: "Hydrating face cream", category: "beauty", type: "skincare", price: 599, stock: 10, tag: "Skincare", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=80" },
  { id: "10", name: "Nourishing hair oil", category: "beauty", type: "haircare", price: 299, stock: 10, tag: "Haircare", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=700&q=80" },
  { id: "11", name: "Minimal gold-tone hoops", category: "accessories", type: "jewellery", price: 399, stock: 10, tag: "Jewellery", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=80" },
  { id: "12", name: "Everyday shoulder bag", category: "accessories", type: "bags", price: 1199, stock: 10, tag: "Bags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80" },
  { id: "13", name: "Comfortable flat sandals", category: "accessories", type: "footwear", price: 799, stock: 10, tag: "Footwear", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=80" },
  { id: "14", name: "Classic everyday watch", category: "accessories", type: "other", price: 1499, stock: 10, tag: "Accessories", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80" }
];

let products = sampleProducts;

const CART_KEY = "styleAndGlowCart";
const CHECKOUT_KEY = "styleGlowCheckoutAfterLogin";

let cart = loadCart();

let activeFilters = {
  clothing: "all",
  beauty: "all",
  accessories: "all"
};

let searchTerm = "";

const money = amount => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(amount);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function cleanProduct(product) {
  return {
    id: String(product.id),
    name: product.name || "Unnamed product",
    category: (product.category || "").toLowerCase(),
    type: (product.type || "").toLowerCase(),
    price: Number(product.price) || 0,
    stock: Math.max(
      0,
      Number(product.stock ?? product.quantity ?? product.inventory ?? 0) || 0
    ),
    tag: product.tag || product.type || "",
    image: product.image || ""
  };
}

async function loadProducts() {
  try {
    const result = await api.getProducts();

    if (Array.isArray(result) && result.length) {
      products = result.map(cleanProduct);
    } else {
      products = sampleProducts.map(cleanProduct);
    }
  } catch (error) {
    console.error("Firebase product loading error:", error);
    products = sampleProducts.map(cleanProduct);
    showToast("Could not connect to product catalogue. Showing demo products.");
  }

  // Correct saved cart quantities using available stock.
  let changed = false;

  cart = cart.map(item => {
    const product = products.find(entry => entry.id === item.id);

    if (!product) return item;

    const quantity = Math.min(item.quantity, product.stock);

    if (quantity !== item.quantity) changed = true;

    return { ...item, quantity };
  }).filter(item => {
    const product = products.find(entry => entry.id === item.id);
    return product && product.stock > 0 && item.quantity > 0;
  });

  if (changed) {
    saveCart();
    showToast("Cart updated to available stock.");
  }

  renderProducts();
  renderCart();
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    return saved.map(item => ({
      ...item,
      id: String(item.id),
      quantity: Math.max(1, Number(item.quantity) || 1)
    }));
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getWishlist() {
  try {
    return (JSON.parse(localStorage.getItem("styleAndGlowWishlist")) || []).map(String);
  } catch {
    return [];
  }
}

function renderProducts() {
  const containers = {
    clothing: document.getElementById("clothingProducts"),
    beauty: document.getElementById("beautyProducts"),
    accessories: document.getElementById("accessoriesProducts")
  };

  Object.entries(containers).forEach(([category, container]) => {
    if (!container) return;

    const filtered = products.filter(product => {
      const matchesCategory = product.category === category;

      const matchesType =
        activeFilters[category] === "all" ||
        product.type === activeFilters[category];

      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm) ||
        product.tag.toLowerCase().includes(searchTerm);

      return matchesCategory && matchesType && matchesSearch;
    });

    container.innerHTML = filtered.length
      ? filtered.map(createProductCard).join("")
      : `<p class="empty-results">No products found. Try another search or category.</p>`;
  });
}

function createProductCard(product) {
  const wished = getWishlist().includes(product.id);
  const outOfStock = product.stock <= 0;

  return `
    <article class="product-card">
      <div class="product-image">
        <img src="${escapeHTML(product.image)}"
             alt="${escapeHTML(product.name)}" loading="lazy">

        <span class="product-tag">${escapeHTML(product.tag)}</span>

        <button class="wish-button ${wished ? "wished" : ""}"
          data-wishlist="${escapeHTML(product.id)}"
          aria-label="Add product to wishlist">
          ${wished ? "♥" : "♡"}
        </button>
      </div>

      <div class="product-info">
        <h3>${escapeHTML(product.name)}</h3>

        <div class="product-meta">
          <span>${escapeHTML(product.tag)}</span>
          <span class="product-price">${money(product.price)}</span>
        </div>

        <p class="stock-label">
          ${outOfStock ? "Out of stock" : `${product.stock} available`}
        </p>
      </div>

      <button class="add-button"
        data-add="${escapeHTML(product.id)}"
        ${outOfStock ? "disabled" : ""}>
        ${outOfStock ? "Out of stock" : "Add to cart +"}
      </button>
    </article>`;
}

function toggleWishlist(id) {
  let wishlist = getWishlist();

  wishlist = wishlist.includes(id)
    ? wishlist.filter(item => item !== id)
    : [...wishlist, id];

  localStorage.setItem("styleAndGlowWishlist", JSON.stringify(wishlist));

  renderProducts();

  showToast(wishlist.includes(id)
    ? "Added to your wishlist"
    : "Removed from your wishlist");
}

// STOCK-LIMITED CART
function addToCart(id) {
  const product = products.find(item => item.id === String(id));

  if (!product) {
    showToast("Product not found.");
    return;
  }

  if (product.stock <= 0) {
    showToast("Sorry, this product is out of stock.");
    return;
  }

  const existing = cart.find(item => item.id === String(id));

  if (existing) {
    if (existing.quantity >= product.stock) {
      showToast(`Only ${product.stock} item(s) are available.`);
      return;
    }

    existing.quantity += 1;
  } else {
    cart.push({ id: String(id), quantity: 1 });
  }

  saveCart();
  renderCart();
  showToast("Added to your cart");
}

function changeQuantity(id, amount) {
  const item = cart.find(entry => entry.id === String(id));
  const product = products.find(entry => entry.id === String(id));

  if (!item || !product) return;

  if (amount > 0 && item.quantity >= product.stock) {
    showToast(`Only ${product.stock} item(s) are available.`);
    return;
  }

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(entry => entry.id !== String(id));
  }

  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== String(id));
  saveCart();
  renderCart();
}

function getCartTotal() {
  return cart.reduce((sum, item) => {
    const product = products.find(product => product.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = getCartTotal();

  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartSubtotal").textContent = money(total);
  document.getElementById("cartEmpty").hidden = cart.length > 0;
  document.getElementById("cartFooter").hidden = cart.length === 0;

  document.getElementById("cartItems").innerHTML = cart.map(item => {
    const product = products.find(entry => entry.id === item.id);
    if (!product) return "";

    return `
      <div class="cart-row">
        <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}">

        <div>
          <h3>${escapeHTML(product.name)}</h3>
          <p>${money(product.price)}</p>

          <div class="quantity-control">
            <button data-quantity="${escapeHTML(product.id)}"
              data-change="-1" aria-label="Decrease quantity">−</button>

            <span>${item.quantity}</span>

            <button data-quantity="${escapeHTML(product.id)}"
              data-change="1"
              aria-label="Increase quantity"
              ${item.quantity >= product.stock ? "disabled" : ""}>+</button>
          </div>

          <button class="remove-item"
            data-remove="${escapeHTML(product.id)}">Remove</button>
        </div>

        <strong>${money(product.price * item.quantity)}</strong>
      </div>`;
  }).join("");

  document.getElementById("checkoutTotal").textContent = money(total);
}

function setCartOpen(isOpen) {
  document.getElementById("cartDrawer").classList.toggle("open", isOpen);
  document.getElementById("drawerBackdrop").classList.toggle("open", isOpen);
  document.getElementById("cartDrawer").setAttribute("aria-hidden", String(!isOpen));
  document.body.style.overflow = isOpen ? "hidden" : "";
}

let toastTimer;

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// CHECKOUT MODAL STYLING
const checkoutStyle = document.createElement("style");

checkoutStyle.textContent = `
.checkout-modal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(35, 25, 30, .65);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  overflow-y: auto;
}
.checkout-modal[hidden] { display: none !important; }
.checkout-panel {
  background: #fffaf8;
  color: #30242a;
  width: 100%;
  max-width: 510px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 30px;
  border-radius: 16px;
  position: relative;
  box-shadow: 0 15px 60px rgba(0,0,0,.2);
}
.checkout-panel h2 {
  font-family: Georgia, serif;
  font-size: 30px;
  margin: 8px 0;
}
.checkout-panel > p { line-height: 1.5; }
.checkout-panel form {
  display: grid;
  gap: 10px;
  margin-top: 20px;
}
.checkout-panel form > label {
  font-weight: 600;
  margin-top: 8px;
}
.checkout-panel input:not([type=radio]),
.checkout-panel textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dfcfd2;
  border-radius: 8px;
  background: white;
  font: inherit;
  box-sizing: border-box;
}
.checkout-panel textarea { resize: vertical; }
.checkout-panel .close-button {
  position: absolute;
  right: 18px;
  top: 14px;
  font-size: 27px;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.checkout-payment {
  background: #f8ecee;
  padding: 14px;
  border-radius: 10px;
  margin-top: 12px;
}
.checkout-payment h3 { margin: 0 0 10px; }
.checkout-payment label { display: flex; gap: 8px; align-items: center; }
.checkout-payment p { margin-bottom: 0; font-size: 13px; }
.checkout-total {
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
  font-size: 18px;
  border-top: 1px solid #e8dadd;
}
.checkout-panel button[type=submit],
.checkout-panel > button.primary-button {
  width: 100%;
  padding: 14px;
  cursor: pointer;
}
.checkout-panel #checkoutMessage { color: #a12c40; }
`;

document.head.appendChild(checkoutStyle);

// CHECKOUT
function openCheckout() {
  if (!cart.length) {
    showToast("Your cart is empty. Add products first.");
    return;
  }

  setCartOpen(false);
  renderCart();

  document.getElementById("checkoutMessage").textContent = "";
  document.getElementById("checkoutModal").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeCheckout() {
  document.getElementById("checkoutModal").hidden = true;
  document.body.style.overflow = "";
}

async function startCheckout() {
  if (!cart.length) {
    showToast("Please add products to your cart first.");
    return;
  }

  const user = auth.currentUser;

  if (!user) {
    localStorage.setItem(CHECKOUT_KEY, "yes");
    window.location.href = "login.html";
    return;
  }

  try {
    const token = await user.getIdTokenResult(true);

    if (token.claims.admin === true) {
      showToast("Please use a customer account to place an order.");
      return;
    }
  } catch (error) {
    console.error("Account verification error:", error);
    showToast("Could not verify your account. Please log in again.");
    return;
  }

  openCheckout();
}

async function placeOrder(event) {
  event.preventDefault();

  const message = document.getElementById("checkoutMessage");
  const button = document.getElementById("placeOrderButton");
  const user = auth.currentUser;

  if (!user) {
    message.textContent = "Please log in before placing your order.";
    return;
  }

  if (!cart.length) {
    message.textContent = "Your cart is empty.";
    return;
  }

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("deliveryAddress").value.trim();

  if (name.length < 2) {
    message.textContent = "Please enter your full name.";
    return;
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    message.textContent = "Enter a valid 10-digit Indian mobile number.";
    return;
  }

  if (address.length < 10) {
    message.textContent = "Please enter your complete delivery address.";
    return;
  }

  button.disabled = true;
  button.textContent = "Placing your order...";
  message.textContent = "";

  try {
    const token = await user.getIdTokenResult(true);

    if (token.claims.admin === true) {
      throw new Error("Admin accounts cannot place customer orders.");
    }

    // Check stock again before saving the order.
    const orderItems = cart.map(item => {
      const product = products.find(entry => entry.id === item.id);

      if (!product) {
        throw new Error("A product in your cart is no longer available.");
      }

      if (item.quantity > product.stock) {
        throw new Error(`Only ${product.stock} ${product.name} item(s) are available.`);
      }

      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image
      };
    });

    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderData = {
      customerUid: user.uid,
      customerEmail: user.email || "",
      customerName: name,
      phone,
      address,
      items: orderItems,
      subtotal: total,
      total,
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Pending",
      orderStatus: "Placed",
      createdAt: serverTimestamp()
    };

    const orderRef = await addDoc(
      collection(db, "orders"),
      orderData
    );

    cart = [];
    saveCart();
    renderCart();

    document.getElementById("checkoutForm").reset();
    closeCheckout();

    document.getElementById("successOrderId").textContent = orderRef.id;
    document.getElementById("orderSuccess").hidden = false;
    document.body.style.overflow = "hidden";

  } catch (error) {
    console.error("Order placement failed:", error);
    message.textContent = error.message || "Order failed. Please try again.";
  } finally {
    button.disabled = false;
    button.textContent = "Place Order";
  }
}

// PRODUCT AND CART EVENTS
document.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add]");
  const wishlistButton = event.target.closest("[data-wishlist]");
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");

  if (addButton) addToCart(addButton.dataset.add);
  if (wishlistButton) toggleWishlist(wishlistButton.dataset.wishlist);

  if (quantityButton) {
    changeQuantity(
      quantityButton.dataset.quantity,
      Number(quantityButton.dataset.change)
    );
  }

  if (removeButton) removeFromCart(removeButton.dataset.remove);
});

document.querySelectorAll(".filter-row").forEach(row => {
  row.addEventListener("click", event => {
    const button = event.target.closest(".filter-chip");
    if (!button) return;

    const group = row.dataset.filterGroup;
    activeFilters[group] = button.dataset.filter;

    row.querySelectorAll(".filter-chip").forEach(chip => {
      chip.classList.toggle("selected", chip === button);
    });

    renderProducts();
  });
});

document.getElementById("searchInput").addEventListener("input", event => {
  searchTerm = event.target.value.trim().toLowerCase();
  renderProducts();
});

document.getElementById("cartButton").addEventListener("click", () => setCartOpen(true));
document.getElementById("closeCart").addEventListener("click", () => setCartOpen(false));
document.getElementById("drawerBackdrop").addEventListener("click", () => setCartOpen(false));

document.getElementById("checkoutButton").addEventListener("click", startCheckout);
document.getElementById("closeCheckout").addEventListener("click", closeCheckout);
document.getElementById("checkoutForm").addEventListener("submit", placeOrder);

document.getElementById("successContinueButton").addEventListener("click", () => {
  document.getElementById("orderSuccess").hidden = true;
  document.body.style.overflow = "";
});

document.getElementById("wishlistButton").addEventListener("click", () => {
  const wishlist = getWishlist();

  showToast(wishlist.length
    ? `You have ${wishlist.length} saved item(s)`
    : "Your wishlist is empty");
});

document.getElementById("newsletterForm").addEventListener("submit", event => {
  event.preventDefault();

  document.getElementById("newsletterMessage").textContent =
    "Thanks! Newsletter signup is a demo for now.";

  event.target.reset();
});

document.getElementById("menuToggle").addEventListener("click", () => {
  document.querySelector(".main-nav").classList.toggle("open");
});

document.querySelectorAll(".nav-link, .main-nav a").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelector(".main-nav").classList.remove("open");
  });
});

document.getElementById("currentYear").textContent = new Date().getFullYear();

// RESTORE CHECKOUT AFTER CUSTOMER LOGIN
onAuthStateChanged(auth, user => {
  if (user && localStorage.getItem(CHECKOUT_KEY) === "yes") {
    localStorage.removeItem(CHECKOUT_KEY);

    setTimeout(async () => {
      try {
        const token = await user.getIdTokenResult(true);

        if (token.claims.admin !== true) {
          openCheckout();
        }
      } catch (error) {
        console.error("Could not restore checkout:", error);
      }
    }, 300);
  }
});

// INITIAL DISPLAY
renderProducts();
renderCart();
loadProducts();
