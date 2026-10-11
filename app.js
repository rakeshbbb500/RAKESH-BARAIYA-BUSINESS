
/* =========================================================
   RAKESH BARAIYA - BUSINESS DASHBOARD
   Supabase Authentication + Customer History
   + Clients Data integration
========================================================= */

const SUPABASE_URL =
  "https://bgakkkbavdtcndylpwgd.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_fcs7MDIxJomgpkkuHLH1eg_Zt_UcHMh";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// Share the existing Supabase client with clients-data.js.
window.__businessDashboardSupabase = db;

let customers = [];
let selectedPackageMonths = 0;
let loadingCustomers = false;
let authReady = false;

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const customerForm = document.getElementById("customerForm");
  const loginForm = document.getElementById("loginForm");

  if (customerForm) {
    customerForm.addEventListener("submit", saveCustomer);
  }

  if (loginForm) {
    loginForm.addEventListener("submit", event => {
      event.preventDefault();
      login();
    });
  }

  resetCustomerForm();
  showLogin();

  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error("Session error:", error.message);
    showLogin();
  } else if (data.session) {
    authReady = true;
    showApp();
  }

  db.auth.onAuthStateChange((event, session) => {
    if (session) {
      authReady = true;
      showApp();
    } else {
      authReady = false;
      customers = [];
      updateDashboard();
      renderCustomers();
      showLogin();
    }
  });
});

/* =========================================================
   LOGIN / LOGOUT
========================================================= */

async function login() {
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const message = document.getElementById("loginMessage");

  if (!emailInput || !passwordInput) return;

  if (message) {
    message.textContent = "Signing in...";
    message.style.color = "#555";
  }

  const { data, error } = await db.auth.signInWithPassword({
    email: emailInput.value.trim(),
    password: passwordInput.value
  });

  if (error) {
    if (message) {
      message.textContent = "Login failed: " + error.message;
      message.style.color = "#d93025";
    }
    return;
  }

  authReady = !!data.session;

  if (message) {
    message.textContent = "Login successful.";
    message.style.color = "#188038";
  }

  showApp();
}

async function logout() {
  const { error } = await db.auth.signOut();

  if (error) {
    alert("Logout failed: " + error.message);
    return;
  }

  authReady = false;
  customers = [];
  showLogin();
}

function showLogin() {
  document.getElementById("appPage")?.classList.add("hidden");
  document.getElementById("loginPage")?.classList.remove("hidden");

  const email = document.getElementById("loginEmail");
  const password = document.getElementById("loginPassword");
  const message = document.getElementById("loginMessage");

  if (email) email.value = "";
  if (password) password.value = "";
  if (message) message.textContent = "";
}

function showApp() {
  if (!authReady) return;

  document.getElementById("loginPage")?.classList.add("hidden");
  document.getElementById("appPage")?.classList.remove("hidden");

  updateDashboard();
  renderCustomers();

  loadCustomers().then(() => {
    updateDashboard();
    renderCustomers();
  });
}

/* =========================================================
   NAVIGATION
   clients-data.js replaces showPage when it loads.
========================================================= */

function showPage(pageId) {
  const pageIds = [
    "dashboardPage",
    "customerPage",
    "clientsDataPage"
  ];

  pageIds.forEach(id => {
    document.getElementById(id)?.classList.toggle(
      "hidden",
      id !== pageId
    );
  });
}

function openNewCustomer() {
  resetCustomerForm();

  const title = document.getElementById("customerFormTitle");
  const button = document.getElementById("saveCustomerBtn");

  if (title) title.textContent = "New Customer";
  if (button) button.textContent = "Save Customer";

  showPage("customerPage");
}

/* =========================================================
   PACKAGE SELECTION
========================================================= */

function selectPackage(packageName, price, months) {
  const packageInput = document.getElementById("selectedPackage");
  const paymentInput = document.getElementById("totalPaymentInput");
  const validityInput = document.getElementById("validity");

  if (packageInput) packageInput.value = packageName;
  if (paymentInput) paymentInput.value = price > 0 ? price : "";

  selectedPackageMonths = months;

  if (validityInput) {
    validityInput.value =
      months === 3 ? "3 Months" :
      months === 6 ? "6 Months" :
      months === 12 ? "1 Year" : "Custom";
  }
}

/* =========================================================
   LOAD CUSTOMER HISTORY
========================================================= */

async function loadCustomers() {
  if (loadingCustomers || !authReady) return;

  loadingCustomers = true;

  try {
    const { data, error } = await db
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Customer load error:", error.message);
      alert("Could not load Customer History: " + error.message);
      return;
    }

    customers = data || [];
  } catch (error) {
    console.error("Customer load exception:", error);
  } finally {
    loadingCustomers = false;
  }
}

/* =========================================================
   SAVE / UPDATE CUSTOMER
========================================================= */

async function saveCustomer(event) {
  event.preventDefault();

  if (!authReady) {
    alert("Please log in first.");
    return;
  }

  const value = id =>
    document.getElementById(id)?.value.trim() || "";

  const name = value("customerName");
  const mobile = value("customerMobile");
  const repositoryId = value("repositoryId");
  const email = value("customerEmail");
  const packageName = value("selectedPackage");
  const payment = Number(value("totalPaymentInput")) || 0;
  const startDate = value("startDate");
  const validity = value("validity");
  const editingId = value("editingCustomerId");

  if (!name || !mobile) {
    alert("Please enter customer name and mobile number.");
    return;
  }

  if (!packageName) {
    alert("Please select a package.");
    return;
  }

  if (!startDate) {
    alert("Please select start date.");
    return;
  }

  const payload = {
    name,
    mobile,
    repository_id: repositoryId || null,
    email: email || null,
    package: packageName,
    total_payment: payment,
    start_date: startDate,
    validity: validity || null,
    updated_at: new Date().toISOString()
  };

  const button = document.getElementById("saveCustomerBtn");

  if (button) {
    button.disabled = true;
    button.textContent = editingId ? "Updating..." : "Saving...";
  }

  try {
    let result;

    if (editingId) {
      result = await db
        .from("customers")
        .update(payload)
        .eq("id", editingId);
    } else {
      result = await db
        .from("customers")
        .insert(payload);
    }

    if (result.error) {
      alert("Could not save customer: " + result.error.message);
      return;
    }

    alert(
      editingId
        ? "Customer updated successfully!"
        : "Customer saved successfully!"
    );

    resetCustomerForm();
    await loadCustomers();
    updateDashboard();
    renderCustomers();
    showPage("dashboardPage");
  } catch (error) {
    console.error("Save error:", error);
    alert("Something went wrong while saving customer.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Save Customer";
    }
  }
}

/* =========================================================
   RESET CUSTOMER FORM
========================================================= */

function resetCustomerForm() {
  document.getElementById("customerForm")?.reset();

  const editingId = document.getElementById("editingCustomerId");
  const title = document.getElementById("customerFormTitle");
  const button = document.getElementById("saveCustomerBtn");
  const packageInput = document.getElementById("selectedPackage");
  const validity = document.getElementById("validity");
  const startDate = document.getElementById("startDate");

  if (editingId) editingId.value = "";
  if (title) title.textContent = "New Customer";
  if (button) button.textContent = "Save Customer";
  if (packageInput) packageInput.value = "";
  if (validity) validity.value = "";

  if (startDate) {
    startDate.value = new Date().toISOString().split("T")[0];
  }

  selectedPackageMonths = 0;
}

/* =========================================================
   DASHBOARD SUMMARY
========================================================= */

function updateDashboard() {
  const totalCustomers = customers.length;

  const totalPayment = customers.reduce(
    (sum, customer) => sum + Number(customer.total_payment || 0),
    0
  );

  let active = 0;
  let expired = 0;

  customers.forEach(customer => {
    if (isCustomerExpired(customer)) {
      expired++;
    } else {
      active++;
    }
  });

  const totalEl = document.getElementById("totalCustomers");
  const paymentEl = document.getElementById("totalPayment");
  const activeEl = document.getElementById("activePackages");
  const expiredEl = document.getElementById("expiredPackages");

  if (totalEl) totalEl.textContent = totalCustomers;
  if (paymentEl) paymentEl.textContent = formatCurrency(totalPayment);
  if (activeEl) activeEl.textContent = active;
  if (expiredEl) expiredEl.textContent = expired;
}

/* =========================================================
   PACKAGE VALIDITY
========================================================= */

function getPackageMonths(packageName) {
  if (packageName === "Silver") return 3;
  if (packageName === "Gold") return 6;
  if (packageName === "Platinum") return 12;
  return 0;
}

function isCustomerExpired(customer) {
  const months = getPackageMonths(customer.package);

  if (!months || !customer.start_date) return false;

  const start = new Date(customer.start_date + "T00:00:00");
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + months);

  return new Date() > expiry;
}

/* =========================================================
   RENDER CUSTOMER TABLE
========================================================= */

function renderCustomers(list) {
  const tbody = document.getElementById("customerTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const rows = list || customers;

  if (rows.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.style.textAlign = "center";
    cell.style.padding = "30px";
    cell.textContent = "No customer records found.";

    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  rows.forEach(customer => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const strong = document.createElement("strong");
    strong.textContent = customer.name || "";
    nameCell.appendChild(strong);

    const mobileCell = document.createElement("td");
    mobileCell.textContent = customer.mobile || "";

    const packageCell = document.createElement("td");
    packageCell.textContent = customer.package || "";

    const paymentCell = document.createElement("td");
    paymentCell.textContent = formatCurrency(customer.total_payment);

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    const expired = isCustomerExpired(customer);

    status.textContent = expired ? "Expired" : "Active";
    status.style.color = expired ? "#d93025" : "#16834b";
    status.style.fontWeight = "600";
    statusCell.appendChild(status);

    const actionCell = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.className = "action-btn edit-btn";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => editCustomer(customer.id);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "action-btn delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteCustomer(customer.id);

    const pdfBtn = document.createElement("button");
    pdfBtn.className = "action-btn";
    pdfBtn.textContent = "PDF";
    pdfBtn.onclick = () => generateCustomerPDF(customer.id);

    actionCell.append(editBtn, deleteBtn, pdfBtn);
    row.append(
      nameCell,
      mobileCell,
      packageCell,
      paymentCell,
      statusCell,
      actionCell
    );

    tbody.appendChild(row);
  });
}

/* =========================================================
   SEARCH CUSTOMER
========================================================= */

function searchCustomers() {
  const searchInput = document.getElementById("searchCustomer");
  if (!searchInput) return;

  const search = searchInput.value.toLowerCase().trim();

  if (!search) {
    renderCustomers(customers);
    return;
  }

  const filtered = customers.filter(customer =>
    String(customer.name || "").toLowerCase().includes(search) ||
    String(customer.mobile || "").toLowerCase().includes(search) ||
    String(customer.package || "").toLowerCase().includes(search) ||
    String(customer.repository_id || "").toLowerCase().includes(search) ||
    String(customer.email || "").toLowerCase().includes(search)
  );

  renderCustomers(filtered);
}

/* =========================================================
   EDIT CUSTOMER
========================================================= */

function editCustomer(id) {
  const customer = customers.find(
    item => String(item.id) === String(id)
  );

  if (!customer) return;

  const setValue = (elementId, value) => {
    const element = document.getElementById(elementId);
    if (element) element.value = value ?? "";
  };

  setValue("editingCustomerId", customer.id);
  setValue("customerName", customer.name);
  setValue("customerMobile", customer.mobile);
  setValue("repositoryId", customer.repository_id);
  setValue("customerEmail", customer.email);
  setValue("selectedPackage", customer.package);
  setValue("totalPaymentInput", customer.total_payment);
  setValue("startDate", customer.start_date);
  setValue("validity", customer.validity);

  selectedPackageMonths = getPackageMonths(customer.package);

  const title = document.getElementById("customerFormTitle");
  const button = document.getElementById("saveCustomerBtn");

  if (title) title.textContent = "Edit Customer";
  if (button) button.textContent = "Update Customer";

  showPage("customerPage");
}

/* =========================================================
   DELETE CUSTOMER
========================================================= */

async function deleteCustomer(id) {
  const customer = customers.find(
    item => String(item.id) === String(id)
  );

  if (!customer) return;

  if (!confirm("Delete customer " + customer.name + "?")) return;

  const { error } = await db
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Delete failed: " + error.message);
    return;
  }

  await loadCustomers();
  updateDashboard();
  renderCustomers();

  alert("Customer deleted successfully.");
}

/* =========================================================
   CUSTOMER PDF
========================================================= */

function generateCustomerPDF(id) {
  const customer = customers.find(
    item => String(item.id) === String(id)
  );

  if (!customer) return;

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF library is still loading. Please try again.");
    return;
  }

  const doc = new window.jspdf.jsPDF();

  doc.setFontSize(18);
  doc.text("RAKESH BARAIYA", 20, 20);

  doc.setFontSize(12);
  doc.text("Customer Record", 20, 30);

  const lines = [
    ["Customer Name", customer.name || ""],
    ["Mobile No.", customer.mobile || ""],
    ["Repository ID", customer.repository_id || ""],
    ["Email ID", customer.email || ""],
    ["Package", customer.package || ""],
    ["Total Payment", formatCurrency(customer.total_payment)],
    ["Start Date", customer.start_date || ""],
    ["Validity", customer.validity || ""],
    ["Status", isCustomerExpired(customer) ? "Expired" : "Active"]
  ];

  let y = 45;

  lines.forEach(item => {
    doc.setFont("helvetica", "bold");
    doc.text(item[0] + ":", 20, y);

    doc.setFont("helvetica", "normal");
    doc.text(String(item[1]), 70, y);

    y += 10;
  });

  doc.setFontSize(9);
  doc.text(
    "Generated from RAKESH BARAIYA Business Dashboard",
    20,
    285
  );

  const safeName = String(customer.name || "customer")
    .replace(/[^a-z0-9_-]/gi, "_");

  doc.save("customer-" + safeName + ".pdf");
}

/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}
