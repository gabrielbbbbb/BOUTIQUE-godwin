const API_BASE = "https://boutique-godwin.onrender.com";
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

loginBtn.addEventListener("click", async () => {
  const p = adminPasswordInput.value.trim();
  if (!p) {
    loginMsg.textContent = "Entrer mot de passe";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: p }),
    });

    if (!res.ok) {
      loginMsg.textContent = "Mot de passe incorrect";
      return;
    }

    const data = await res.json();
    if (data.success) {
      adminPassword = p;
      sessionStorage.setItem("adminPassword", adminPassword);
      setLoggedInUI();
    } else {
      loginMsg.textContent = "Mot de passe incorrect";
    }
  } catch (err) {
    console.error(err);
    loginMsg.textContent = "Erreur de connexion au serveur";
  }
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
    adminList.innerHTML = "<p>Impossible de charger le produit.</p>";
  }
}

function renderAdminList(items) {
  adminList.innerHTML = "";
  if (!items.length) {
    adminList.innerHTML = "<p>Pas de produit</p>";
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
        <button data-id="${p._id}" class="editBtn">Modifier</button>
        <button data-id="${p._id}" class="delBtn small-btn">Supprimer</button>
      </div>
    `;
    adminList.appendChild(div);
  });

  document.querySelectorAll(".delBtn").forEach((b) =>
    b.addEventListener("click", async (ev) => {
      const id = ev.target.dataset.id;
      if (!confirm("Supprimer ce produit?")) return;
      try {
        const res = await adminFetch(`${API_BASE}/products/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Echec de suppression");
        loadAdminProducts();
      } catch (err) {
        alert("Echec de suppression (voir console)");
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
    alert("Veuillez vous connecter d'abord");
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
      throw new Error(text || "Demande échouée");
    }
    alert("Sauvegardé!");
    productForm.reset();
    productIdField.value = "";
    loadAdminProducts();
  } catch (err) {
    alert("Échec de sauvegarde (voir console)");
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

/* const API_BASE = "http://localhost:5000/api";
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
    loginMsg.textContent = "Entrer mot de passe";
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
    const res = await fetch(`${API_BASE}/products`); // GET is public
    const list = await res.json();
    renderAdminList(list);
  } catch (err) {
    console.error(err);
    adminList.innerHTML = "<p>Impossible de charger le produit.</p>";
  }
}

function renderAdminList(items) {
  adminList.innerHTML = "";
  if (!items.length) {
    adminList.innerHTML = "<p>Pas de produit</p>";
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
        <button data-id="${p._id}" class="editBtn">Modifier</button>
        <button data-id="${p._id}" class="delBtn small-btn">Supprimer</button>
      </div>
    `;
    adminList.appendChild(div);
  });

  document.querySelectorAll(".delBtn").forEach((b) =>
    b.addEventListener("click", async (ev) => {
      const id = ev.target.dataset.id;
      if (!confirm("Supprimer ce produit ?")) return;
      try {
        const res = await adminFetch(`${API_BASE}/products/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Echec de suppression");
        loadAdminProducts();
      } catch (err) {
        alert("Echec de suppression (voir console)");
        console.error(err);
      }
    })
  );

  document.querySelectorAll(".editBtn").forEach((b) =>
    b.addEventListener("click", async (ev) => {
      const id = ev.target.dataset.id;
      try {
        const res = await fetch(`${API_BASE}/products/${id}`); // GET is public
        const p = await res.json();
        productIdField.value = p._id;
        nameField.value = p.name || "";
        priceField.value = p.price || "";
        brandField.value = p.brand || "";
        categoryField.value = p.category || "";
        descriptionField.value = p.description || "";
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
    alert("Veuillez vous connecter avant");
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
      throw new Error(text || "Demande échouée");
    }
    alert("✅ Sauvegardé !");
    productForm.reset();
    productIdField.value = "";
    loadAdminProducts();
  } catch (err) {
    alert("❌ Echec de sauvegarde (voir console)");
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
    loginMsg.textContent = "Entrer mot de passe";
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
    adminList.innerHTML = "<p>Impossible de charger le produit.</p>";
  }
}

function renderAdminList(items) {
  adminList.innerHTML = "";
  if (!items.length) {
    adminList.innerHTML = "<p>Pas de produit</p>";
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
        <button data-id="${p._id}" class="editBtn">Modifier</button>
        <button data-id="${p._id}" class="delBtn small-btn">Supprimer</button>
      </div>
    `;
    adminList.appendChild(div);
  });

  document.querySelectorAll(".delBtn").forEach((b) =>
    b.addEventListener("click", async (ev) => {
      const id = ev.target.dataset.id;
      if (!confirm("Suprrimer cet produit?")) return;
      try {
        const res = await adminFetch(`${API_BASE}/products/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Echec de supprimer");
        loadAdminProducts();
      } catch (err) {
        alert("Echec de supprimer (check console)");
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
    alert("Svp veillez Connecter  avant");
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
      throw new Error(text || "Demande échoué");
    }
    // success
    alert("Sauvégarder!");
    productForm.reset();
    productIdField.value = "";
    loadAdminProducts();
  } catch (err) {
    alert("Echoc de sauvegarder (check console)");
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
 */
