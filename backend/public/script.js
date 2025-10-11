const API_BASE = "http://localhost:5000/api"; // Local API
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

const themeToggle = document.getElementById("themeToggle");

// Au chargement
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-theme");
  themeToggle.textContent = "☀️ Mode clair";
}

// Au clic
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  const isDark = document.body.classList.contains("dark-theme");
  themeToggle.textContent = isDark ? "☀️ Mode clair" : "🌙 Mode sombre";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    products = await res.json();
    renderProducts();
  } catch (err) {
    console.error("Could not load products:", err);
    productsContainer.innerHTML =
      "<p>Impossible de charger les produits (check backend).</p>";
  }
}

function renderProducts() {
  productsContainer.innerHTML = "";
  if (!products.length) {
    productsContainer.innerHTML = "<p>Aucun produit pour l'instant.</p>";
    return;
  }

  products.forEach((product, i) => {
    const card = document.createElement("div");
    card.className = "product-card";

    //Cleaning up image source logic
    const imgSrc =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : "placeholder.jpg";

    /* const imgSrc =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images[0].startsWith("/")
          ? product.images[0] // local path like /uploads/image.jpg
          : `/uploads/${product.images[0]}` // fallback if only filename is stored
        : "placeholder.jpg"; // fallback image
 */
    card.innerHTML = `
      <img src="${imgSrc}" alt="${escapeHtml(product.name)}">
      <h3>${escapeHtml(product.name)}</h3>
      <p class='modalDescrip'>${escapeHtml(
        truncate(product.description || "", 80)
      )}</p>
      <p><strong>${product.price ?? ""} CFA</strong></p>
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
  modalPrice.textContent = `${p.price ?? ""} CFA`;
  modal.setAttribute("aria-hidden", "false");
}

function showModalImage() {
  const p = products[currentProductIndex];
  if (!p || !p.images || p.images.length === 0) {
    modalImage.src = "";
    modalImage.alt = "Aucune image";
    return;
  }
  const path = p.images[currentImageIndex];
  modalImage.src = path;
  modalImage.alt = p.name;
}

// Image navigation
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

// Product navigation
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

// Modal close
closeModalBtn.addEventListener("click", () =>
  modal.setAttribute("aria-hidden", "true")
);
window.addEventListener("click", (e) => {
  if (e.target === modal) modal.setAttribute("aria-hidden", "true");
});

// Helpers
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

// Initial load
fetchProducts();
