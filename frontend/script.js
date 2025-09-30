const API_BASE = "http://localhost:5000/api";
let products = [];
let currentProductIndex = 0;
let currentImageIndex = 0;

const productsContainer = document.getElementById("products");
const modal = document.getElementById("productModal");
const modalImage = document.getElementById("modalImage");
const modalName = document.getElementById("modalName");
const modalDescription = document.getElementById("modalDescription");
const modalPrice = document.getElementById("modalPrice");
const closeModalBtn = document.getElementById("closeModal");
const prevImageBtn = document.getElementById("prevImage");
const nextImageBtn = document.getElementById("nextImage");
const prevProductBtn = document.getElementById("prevProduct");
const nextProductBtn = document.getElementById("nextProduct");

async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    products = await res.json();
    renderProducts();
  } catch (err) {
    console.error("Could not load products:", err);
    productsContainer.innerHTML =
      "<p>Impossible de charger le produit (check backend).</p>";
  }
}

function renderProducts() {
  productsContainer.innerHTML = "";
  if (!products.length) {
    productsContainer.innerHTML = "<p>Aucun Produit pour l'instant.</p>";
    return;
  }
  products.forEach((product, i) => {
    const card = document.createElement("div");
    card.className = "product-card";
    const imgSrc =
      product.images && product.images[0]
        ? `http://localhost:5000${product.images[0]}`
        : "";
    card.innerHTML = `
      <img src="${imgSrc}" alt="${escapeHtml(product.name)}">
      <h3>${escapeHtml(product.name)}</h3>
      <p>${escapeHtml(truncate(product.description || "", 80))}</p>
      <p><strong>$${product.price ?? ""}</strong></p>
    `;
    card.addEventListener("click", () => openModal(i));
    productsContainer.appendChild(card);
  });
}

function openModal(index) {
  currentProductIndex = index;
  currentImageIndex = 0;
  showModalImage();
  const p = products[currentProductIndex];
  modalName.textContent = p.name;
  modalDescription.textContent = p.description || "";
  modalPrice.textContent = `$${p.price ?? ""}`;
  modal.setAttribute("aria-hidden", "false");
}

function showModalImage() {
  const p = products[currentProductIndex];
  if (!p || !p.images || p.images.length === 0) {
    modalImage.src = "";
    modalImage.alt = "aucun image";
    return;
  }
  const path = p.images[currentImageIndex];
  modalImage.src = `http://localhost:5000${path}`;
  modalImage.alt = p.name;
}

prevImageBtn.addEventListener("click", () => {
  const imgs = products[currentProductIndex].images || [];
  currentImageIndex = (currentImageIndex - 1 + imgs.length) % imgs.length;
  showModalImage();
});
nextImageBtn.addEventListener("click", () => {
  const imgs = products[currentProductIndex].images || [];
  currentImageIndex = (currentImageIndex + 1) % imgs.length;
  showModalImage();
});

prevProductBtn.addEventListener("click", () => {
  currentProductIndex =
    (currentProductIndex - 1 + products.length) % products.length;
  currentImageIndex = 0;
  openModal(currentProductIndex);
});
nextProductBtn.addEventListener("click", () => {
  currentProductIndex = (currentProductIndex + 1) % products.length;
  currentImageIndex = 0;
  openModal(currentProductIndex);
});

closeModalBtn.addEventListener("click", () =>
  modal.setAttribute("aria-hidden", "true")
);
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.setAttribute("aria-hidden", "true");
});

// helpers
function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        s
      ])
  );
}

// initial load
fetchProducts();
