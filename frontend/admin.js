const API_BASE = "http://localhost:5000/api";
const loginSection = document.getElementById("loginSection");
const panelSection = document.getElementById("panelSection");
const loginBtn = document.getElementById("loginBtn");
const adminPasswordInput = document.getElementById("adminPassword");
const loginMsg = document.getElementById("loginMsg");

const productForm = document.getElementById("productForm");
const adminList = document.getElementById("adminList");
const productIdField = document.getElementById("productId");
const nameField = document.getElementById("name");
const priceField = document.getElementById("price");
const brandField = document.getElementById("brand");
const categoryField = document.getElementById("category");
const descriptionField = document.getElementById("description");
const imagesField = document.getElementById("images");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");

let adminPassword = sessionStorage.getItem("adminPassword") || null;

function setLoggedInUI() {
  if (adminPassword) {
    loginSection.style.display = "none";
    panelSection.style.display = "block";
    loadAdminProducts();
  } else {
    loginSection.style.display = "block";
    panelSection.style.display = "none";
  }
}
setLoggedInUI();

loginBtn.addEventListener("click", () => {
  const p = adminPasswordInput.value.trim();
  if (!p) {
    loginMsg.textContent = "Enter password";
    return;
  }
  adminPassword = p;
  sessionStorage.setItem("adminPassword", adminPassword);
  setLoggedInUI();
});

// helper to call fetch with admin header
function adminFetch(url, options = {}) {
  options.headers = options.headers || {};
  options.headers["x-admin-password"] = adminPassword;
  return fetch(url, options);
}

async function loadAdminProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const list = await res.json();
    renderAdminList(list);
  } catch (err) {
    console.error(err);
    adminList.innerHTML = "<p>Could not load products.</p>";
  }
}

function renderAdminList(items) {
  adminList.innerHTML = "";
  if (!items.length) {
    adminList.innerHTML = "<p>No products yet</p>";
    return;
  }
  items.forEach((p) => {
    const div = document.createElement("div");
    div.className = "admin-item";
    const imgSrc =
      p.images && p.images[0] ? `http://localhost:5000${p.images[0]}` : "";
    div.innerHTML = `
      <img src="${imgSrc}" alt="${p.name}">
      <div style="flex:1">
        <strong>${escapeHtml(p.name)}</strong><br>
        <small>$${p.price ?? ""} — ${escapeHtml(p.brand || "")}</small>
      </div>
      <div>
        <button data-id="${p._id}" class="editBtn">Edit</button>
        <button data-id="${p._id}" class="delBtn small-btn">Delete</button>
      </div>
    `;
    adminList.appendChild(div);
  });

  document.querySelectorAll(".delBtn").forEach((b) =>
    b.addEventListener("click", async (ev) => {
      const id = ev.target.dataset.id;
      if (!confirm("Delete this product?")) return;
      try {
        const res = await adminFetch(`${API_BASE}/products/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Delete failed");
        loadAdminProducts();
      } catch (err) {
        alert("Delete failed (check console)");
        console.error(err);
      }
    })
  );

  document.querySelectorAll(".editBtn").forEach((b) =>
    b.addEventListener("click", async (ev) => {
      const id = ev.target.dataset.id;
      try {
        const res = await fetch(`${API_BASE}/products/${id}`);
        const p = await res.json();
        productIdField.value = p._id;
        nameField.value = p.name || "";
        priceField.value = p.price || "";
        brandField.value = p.brand || "";
        categoryField.value = p.category || "";
        descriptionField.value = p.description || "";
        // user can upload new images (they will be appended)
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        console.error(err);
      }
    })
  );
}

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!adminPassword) {
    alert("Please login first");
    return;
  }

  const fd = new FormData();
  fd.append("name", nameField.value);
  fd.append("description", descriptionField.value);
  fd.append("price", priceField.value);
  fd.append("brand", brandField.value);
  fd.append("category", categoryField.value);

  const files = imagesField.files;
  for (let i = 0; i < files.length && i < 4; i++) fd.append("images", files[i]);

  try {
    const id = productIdField.value;
    const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
    const method = id ? "PUT" : "POST";

    const res = await adminFetch(url, { method, body: fd });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Request failed");
    }
    // success
    alert("Saved!");
    productForm.reset();
    productIdField.value = "";
    loadAdminProducts();
  } catch (err) {
    alert("Save failed (check console)");
    console.error(err);
  }
});

resetBtn.addEventListener("click", () => {
  productForm.reset();
  productIdField.value = "";
});

// helpers
function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}
