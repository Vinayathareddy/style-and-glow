
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct
} from "./js/api.js";

const $ = id => document.getElementById(id);

let inventory = [];

function money(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

// Load products from Firebase
async function loadProducts() {
  try {
    inventory = await getProducts();
    render();
  } catch (error) {
    console.error("Load error:", error);
    alert("Could not load products from Firebase.");
  }
}

// Display products
function render() {
  if (!$("adminSearch")) return;

  const term = $("adminSearch").value.trim().toLowerCase();

  $("totalProducts").textContent = inventory.length;

  $("totalStock").textContent = inventory.reduce(
    (sum, p) => sum + Number(p.stock ?? p.quantity ?? 0),
    0
  );

  $("lowStock").textContent = inventory.filter(
    p => Number(p.stock ?? p.quantity ?? 0) < 5
  ).length;

  const rows = inventory.filter(p =>
    `${p.name || ""} ${p.category || ""} ${p.type || ""}`
      .toLowerCase()
      .includes(term)
  );

  $("productRows").innerHTML = rows.map(p => `
    <tr>
      <td>
        <div class="table-product">
          <img src="${escapeHtml(p.image || "")}" alt="">
          <strong>${escapeHtml(p.name || "")}</strong>
        </div>
      </td>
      <td>${escapeHtml(p.category || "")}</td>
      <td>${money(Number(p.price || 0))}</td>
      <td>${Number(p.stock ?? p.quantity ?? 0)}</td>
      <td>
        <button class="table-action" data-edit="${escapeHtml(p.id)}">
          Edit
        </button>
        <button class="table-action delete" data-delete="${escapeHtml(p.id)}">
          Delete
        </button>
      </td>
    </tr>
  `).join("") || '<tr><td colspan="5">No products found.</td></tr>';
}

// Reset form
function resetForm() {
  $("productForm").reset();
  $("productId").value = "";
  $("formTitle").textContent = "Add a product";
  $("saveButton").textContent = "Add product";
  $("cancelEdit").hidden = true;
}

// Add and update products
$("productForm").addEventListener("submit", async event => {
  event.preventDefault();

  const id = $("productId").value.trim();

  const product = {
    name: $("productName").value.trim(),
    category: $("productCategory").value,
    type: $("productType").value.trim(),
    tag: $("productType").value.trim(),
    price: Number($("productPrice").value),
    stock: Number($("productQty").value),
    image: $("productImage").value.trim(),
    status: "active"
  };

  try {
    $("saveButton").disabled = true;

    if (id) {
      await updateProduct(id, product);
      alert("Product updated successfully!");

    } else {
      // API generates the next unused product ID
      const result = await addProduct(product);
      const newId = result.name.split("/").pop();

      alert("Product added successfully! ID: " + newId);
    }

    resetForm();
    await loadProducts();

  } catch (error) {
    console.error("Save error:", error);
    alert("Could not save product. Please check the Console for details.");

  } finally {
    $("saveButton").disabled = false;
  }
});

// Edit and delete products
$("productRows").addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const p = inventory.find(
      x => x.id === editButton.dataset.edit
    );

    if (!p) return;

    $("productId").value = p.id;
    $("productName").value = p.name || "";
    $("productCategory").value = p.category || "clothing";
    $("productType").value = p.type || "";
    $("productPrice").value = p.price || 0;
    $("productQty").value = p.stock ?? p.quantity ?? 0;
    $("productImage").value = p.image || "";

    $("formTitle").textContent = "Edit product";
    $("saveButton").textContent = "Save changes";
    $("cancelEdit").hidden = false;

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  if (deleteButton) {
    const productId = deleteButton.dataset.delete;

    if (!confirm("Delete product " + productId + "?")) return;

    try {
      await deleteProduct(productId);
      alert("Product deleted successfully!");
      await loadProducts();

    } catch (error) {
      console.error("Delete error:", error);
      alert("Could not delete product.");
    }
  }
});

// Cancel editing
$("cancelEdit").addEventListener("click", event => {
  event.preventDefault();
  resetForm();
});

// Search products
$("adminSearch").addEventListener("input", render);

// Start dashboard
loadProducts();
