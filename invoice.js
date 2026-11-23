(() => {
  "use strict";
  
  const $ = (id) => document.getElementById(id);

  let items = [];
  let nextItemId = 1;

  // Format in KES currency: KES 2,000.00
  const money = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES"
    }).format(Number.isFinite(amount) ? amount : 0);
  };

  const value = (id) => $(id).value.trim();

  const setText = (id, text) => {
    const el = $(id);
    if (el) el.textContent = text || "";
  };

  const safeNumber = (id) => {
    const el = $(id);
    if (!el) return 0;
    const number = Number(el.value);
    return Number.isFinite(number) ? number : 0;
  };

  // Prevents html injection
  const escapeHtml = (unsafe) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Notification message
  function showToast(message) {
    const toast = $("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // Display invoice items
  function renderItems() {
    const body = $("itemsBody");
    if (!body) return;

    if (!items.length) {
      body.innerHTML = `<tr class="empty-row"><td colspan="5">No items added</td></tr>`;
      calculateTotals();
      return;
    }

    
    body.innerHTML = items.map((item) => `<tr>
      <td>
        <span class="item-description">${escapeHtml(item.description)}</span>
        <button class="remove-item no-print" type="button" data-remove="${item.id}">Remove</button>
      </td>
      <td class="align-right">${item.quantity}</td>
      <td class="align-right">${money(item.price)}</td>
      <td class="align-right"><strong>${money(item.quantity * item.price)}</strong></td>
    </tr>`).join("");

    calculateTotals();
  }

  function calculateTotals() {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const discount = Math.min(Math.max(0, safeNumber("discount")), subtotal);
    const taxableAmount = Math.max(0, subtotal - discount);
    const vatRate = Math.min(100, Math.max(0, safeNumber("vatRate")));
    const tax = taxableAmount * vatRate / 100;
    const total = taxableAmount + tax;

    setText("subtotal", money(subtotal));
    setText("discountPreview", `- ${money(discount)}`);
    setText("vatLabel", String(vatRate));
    setText("tax", money(tax));
    setText("totalAmount", money(total));
  }

   function updatePreview() {
    setText("businessName", value("business") || "Mukai Designs");
    setText("businessContactInfo", value("businessEmail") || "");
    setText("clientName", value("client") || "-");
    setText("invoiceNo", value("inNo") || "INV-001");
    setText("invoiceDate", value("date") || "-");
  }

  function addItem() {
    const description = value("description");
    const quantity = safeNumber("quantity");
    const price = safeNumber("price");

    if (!description || !quantity || !price) {
      showToast("Please fill Description, Quantity and Price");
      return;
    }

    items.push({ id: nextItemId++, description, quantity, price });
    $("description").value = "";
    $("quantity").value = 1;
    $("price").value = "";
    renderItems();
    showToast("Item added");
  }

  // Remove button - using event delegation
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    const id = Number(btn.dataset.remove);
    items = items.filter(item => item.id !== id);
    renderItems();
  });

  // Connect buttons + inputs
  document.addEventListener("DOMContentLoaded", () => {
    const addBtn = $("addItemBtn");
    if (addBtn) addBtn.addEventListener("click", addItem);

    // Live update when typing
    ["business", "businessEmail", "client", "inNo", "date", "vatRate", "discount"].forEach(id => {
      const el = $(id);
      if (el) el.addEventListener("input", () => { updatePreview(); calculateTotals(); });
    });

    updatePreview();
    renderItems();
  });

})();