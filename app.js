const SUPABASE_URL = "https://bgakkkbavdtcndylpwgd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_fcs7MDIxJomgpkkuHLH1eg_Zt_UcHMh";

const DEMO_EMAIL = "softwearenjiniear@gmail.com";
const DEMO_PASSWORD = "rakesh@2007";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

let customers = [];
let selectedPackageMonths = 0;
let loadingCustomers = false;

document.addEventListener("DOMContentLoaded", async function () {

  document
    .getElementById("customerForm")
    .addEventListener("submit", saveCustomer);

  document
    .getElementById("loginForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      login();
    });

  resetCustomerForm();

  // Check local login session
  if (sessionStorage.getItem("rakeshLoggedIn") === "true") {
    await showApp();
  } else {
    showLogin();
  }
});


/* =========================
   LOGIN
========================= */

async function login() {

  const email = document
    .getElementById("loginEmail")
    .value
    .trim();

  const password =
    document.getElementById("loginPassword").value;

  const message =
    document.getElementById("loginMessage");

  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {

    message.textContent = "Invalid email or password.";
    message.style.color = "#d93025";

    return;
  }

  // Save login session
  sessionStorage.setItem("rakeshLoggedIn", "true");

  message.textContent = "";

  await showApp();
}


function logout() {

  sessionStorage.removeItem("rakeshLoggedIn");

  customers = [];

  showLogin();
}


function showLogin() {

  document
    .getElementById("appPage")
    .classList.add("hidden");

  document
    .getElementById("loginPage")
    .classList.remove("hidden");

  const email =
    document.getElementById("loginEmail");

  const password =
    document.getElementById("loginPassword");

  if (email) email.value = "";
  if (password) password.value = "";
}


async function showApp() {

  document
    .getElementById("loginPage")
    .classList.add("hidden");

  document
    .getElementById("appPage")
    .classList.remove("hidden");

  await loadCustomers();

  updateDashboard();

  renderCustomers();
}


/* =========================
   PAGE NAVIGATION
========================= */

function showPage(pageId) {

  const dashboardPage =
    document.getElementById("dashboardPage");

  const customerPage =
    document.getElementById("customerPage");

  if (pageId === "customerPage") {

    dashboardPage.classList.add("hidden");
    customerPage.classList.remove("hidden");

  } else {

    customerPage.classList.add("hidden");
    dashboardPage.classList.remove("hidden");
  }
}


function openNewCustomer() {

  resetCustomerForm();

  document.getElementById("customerFormTitle").textContent =
    "New Customer";

  document.getElementById("saveCustomerBtn").textContent =
    "Save Customer";

  showPage("customerPage");
}


/* =========================
   PACKAGE
========================= */

function selectPackage(packageName, price, months) {

  document.getElementById("selectedPackage").value =
    packageName;

  document.getElementById("totalPaymentInput").value =
    price > 0 ? price : "";

  selectedPackageMonths = months;

  if (months === 3) {

    document.getElementById("validity").value =
      "3 Months";

  } else if (months === 6) {

    document.getElementById("validity").value =
      "6 Months";

  } else if (months === 12) {

    document.getElementById("validity").value =
      "1 Year";

  } else {

    document.getElementById("validity").value =
      "Custom";
  }
}


/* =========================
   LOAD CUSTOMERS
========================= */

async function loadCustomers() {

  if (loadingCustomers) return;

  loadingCustomers = true;

  const result = await db
    .from("customers")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  loadingCustomers = false;

  if (result.error) {

    console.error(result.error);

    alert(
      "Customer data load failed: " +
      result.error.message
    );

    customers = [];

    return;
  }

  customers = result.data || [];
}


/* =========================
   SAVE CUSTOMER
========================= */

async function saveCustomer(event) {

  event.preventDefault();

  const name =
    document.getElementById("customerName")
      .value.trim();

  const mobile =
    document.getElementById("customerMobile")
      .value.trim();

  const repositoryId =
    document.getElementById("repositoryId")
      .value.trim();

  const email =
    document.getElementById("customerEmail")
      .value.trim();

  const packageName =
    document.getElementById("selectedPackage")
      .value.trim();

  const payment =
    Number(
      document.getElementById("totalPaymentInput")
        .value
    ) || 0;

  const startDate =
    document.getElementById("startDate").value;

  const validity =
    document.getElementById("validity")
      .value.trim();

  const editingId =
    document.getElementById("editingCustomerId")
      .value;


  if (!name || !mobile) {

    alert(
      "Please enter customer name and mobile number."
    );

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

    name: name,

    mobile: mobile,

    repository_id:
      repositoryId || null,

    email:
      email || null,

    package:
      packageName,

    total_payment:
      payment,

    start_date:
      startDate,

    validity:
      validity || null,

    updated_at:
      new Date().toISOString()
  };


  const button =
    document.getElementById("saveCustomerBtn");

  button.disabled = true;

  button.textContent =
    editingId
      ? "Updating..."
      : "Saving...";


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


  button.disabled = false;

  button.textContent =
    editingId
      ? "Update Customer"
      : "Save Customer";


  if (result.error) {

    console.error(result.error);

    alert(
      "Could not save customer: " +
      result.error.message
    );

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
}


/* =========================
   RESET FORM
========================= */

function resetCustomerForm() {

  const form =
    document.getElementById("customerForm");

  if (form) form.reset();


  document.getElementById(
    "editingCustomerId"
  ).value = "";


  document.getElementById(
    "customerFormTitle"
  ).textContent = "New Customer";


  document.getElementById(
    "saveCustomerBtn"
  ).textContent = "Save Customer";


  document.getElementById(
    "selectedPackage"
  ).value = "";


  document.getElementById(
    "validity"
  ).value = "";


  const today =
    new Date()
      .toISOString()
      .split("T")[0];


  document.getElementById(
    "startDate"
  ).value = today;


  selectedPackageMonths = 0;
}


/* =========================
   DASHBOARD
========================= */

function updateDashboard() {

  const totalCustomers =
    customers.length;


  const totalPayment =
    customers.reduce(function (sum, customer) {

      return (
        sum +
        Number(
          customer.total_payment || 0
        )
      );

    }, 0);


  let active = 0;

  let expired = 0;


  customers.forEach(function (customer) {

    if (isCustomerExpired(customer)) {

      expired++;

    } else {

      active++;
    }

  });


  document.getElementById(
    "totalCustomers"
  ).textContent =
    totalCustomers;


  document.getElementById(
    "totalPayment"
  ).textContent =
    formatCurrency(totalPayment);


  document.getElementById(
    "activePackages"
  ).textContent =
    active;


  document.getElementById(
    "expiredPackages"
  ).textContent =
    expired;
}


/* =========================
   PACKAGE VALIDITY
========================= */

function getPackageMonths(packageName) {

  if (packageName === "Silver")
    return 3;

  if (packageName === "Gold")
    return 6;

  if (packageName === "Platinum")
    return 12;

  return 0;
}


function isCustomerExpired(customer) {

  const months =
    getPackageMonths(
      customer.package
    );


  if (
    !months ||
    !customer.start_date
  ) {

    return false;
  }


  const start =
    new Date(
      customer.start_date +
      "T00:00:00"
    );


  const expiry =
    new Date(start);


  expiry.setMonth(
    expiry.getMonth() + months
  );


  return new Date() > expiry;
}


/* =========================
   CUSTOMER TABLE
========================= */

function renderCustomers(list) {

  const tbody =
    document.getElementById(
      "customerTableBody"
    );


  tbody.innerHTML = "";


  const rows =
    list || customers;


  if (rows.length === 0) {

    const emptyRow =
      document.createElement("tr");


    const emptyCell =
      document.createElement("td");


    emptyCell.colSpan = 6;

    emptyCell.style.textAlign =
      "center";

    emptyCell.style.padding =
      "30px";

    emptyCell.textContent =
      "No customer records found.";


    emptyRow.appendChild(
      emptyCell
    );


    tbody.appendChild(
      emptyRow
    );


    return;
  }


  rows.forEach(function (customer) {

    const expired =
      isCustomerExpired(customer);


    const row =
      document.createElement("tr");


    const nameCell =
      document.createElement("td");


    const nameStrong =
      document.createElement("strong");


    nameStrong.textContent =
      customer.name || "";


    nameCell.appendChild(
      nameStrong
    );


    const mobileCell =
      document.createElement("td");


    mobileCell.textContent =
      customer.mobile || "";


    const packageCell =
      document.createElement("td");


    packageCell.textContent =
      customer.package || "";


    const paymentCell =
      document.createElement("td");


    paymentCell.textContent =
      formatCurrency(
        customer.total_payment
      );


    const statusCell =
      document.createElement("td");


    const statusSpan =
      document.createElement("span");


    statusSpan.textContent =
      expired
        ? "Expired"
        : "Active";


    statusSpan.style.color =
      expired
        ? "#d93025"
        : "#16834b";


    statusSpan.style.fontWeight =
      "600";


    statusCell.appendChild(
      statusSpan
    );


    const actionCell =
      document.createElement("td");


    const editBtn =
      document.createElement("button");


    editBtn.className =
      "action-btn edit-btn";


    editBtn.textContent =
      "Edit";


    editBtn.onclick =
      function () {

        editCustomer(
          customer.id
        );

      };


    const deleteBtn =
      document.createElement("button");


    deleteBtn.className =
      "action-btn delete-btn";


    deleteBtn.textContent =
      "Delete";


    deleteBtn.onclick =
      function () {

        deleteCustomer(
          customer.id
        );

      };


    const pdfBtn =
      document.createElement("button");


    pdfBtn.className =
      "action-btn";


    pdfBtn.textContent =
      "PDF";


    pdfBtn.onclick =
      function () {

        generateCustomerPDF(
          customer.id
        );

      };


    actionCell.appendChild(
      editBtn
    );

    actionCell.appendChild(
      deleteBtn
    );

    actionCell.appendChild(
      pdfBtn
    );


    row.appendChild(
      nameCell
    );

    row.appendChild(
      mobileCell
    );

    row.appendChild(
      packageCell
    );

    row.appendChild(
      paymentCell
    );

    row.appendChild(
      statusCell
    );

    row.appendChild(
      actionCell
    );


    tbody.appendChild(
      row
    );

  });
}


/* =========================
   SEARCH
========================= */

function searchCustomers() {

  const search =
    document.getElementById(
      "searchCustomer"
    )
    .value
    .toLowerCase()
    .trim();


  if (!search) {

    renderCustomers(
      customers
    );

    return;
  }


  const filtered =
    customers.filter(
      function (customer) {

        return (

          String(
            customer.name || ""
          )
          .toLowerCase()
          .includes(search)

          ||

          String(
            customer.mobile || ""
          )
          .toLowerCase()
          .includes(search)

          ||

          String(
            customer.package || ""
          )
          .toLowerCase()
          .includes(search)

          ||

          String(
            customer.repository_id || ""
          )
          .toLowerCase()
          .includes(search)

          ||

          String(
            customer.email || ""
          )
          .toLowerCase()
          .includes(search)

        );

      }
    );


  renderCustomers(
    filtered
  );
}


/* =========================
   EDIT
========================= */

function editCustomer(id) {

  const customer =
    customers.find(
      function (item) {

        return item.id === id;

      }
    );


  if (!customer) return;


  document.getElementById(
    "editingCustomerId"
  ).value =
    customer.id;


  document.getElementById(
    "customerName"
  ).value =
    customer.name || "";


  document.getElementById(
    "customerMobile"
  ).value =
    customer.mobile || "";


  document.getElementById(
    "repositoryId"
  ).value =
    customer.repository_id || "";


  document.getElementById(
    "customerEmail"
  ).value =
    customer.email || "";


  document.getElementById(
    "selectedPackage"
  ).value =
    customer.package || "";


  document.getElementById(
    "totalPaymentInput"
  ).value =
    customer.total_payment ?? "";


  document.getElementById(
    "startDate"
  ).value =
    customer.start_date || "";


  document.getElementById(
    "validity"
  ).value =
    customer.validity || "";


  selectedPackageMonths =
    getPackageMonths(
      customer.package
    );


  document.getElementById(
    "customerFormTitle"
  ).textContent =
    "Edit Customer";


  document.getElementById(
    "saveCustomerBtn"
  ).textContent =
    "Update Customer";


  showPage(
    "customerPage"
  );
}


/* =========================
   DELETE
========================= */

async function deleteCustomer(id) {

  const customer =
    customers.find(
      function (item) {

        return item.id === id;

      }
    );


  if (!customer) return;


  if (
    !confirm(
      "Delete customer " +
      customer.name +
      "?"
    )
  ) {

    return;
  }


  const result =
    await db
      .from("customers")
      .delete()
      .eq("id", id);


  if (result.error) {

    console.error(
      result.error
    );


    alert(
      "Delete failed: " +
      result.error.message
    );


    return;
  }


  await loadCustomers();

  updateDashboard();

  renderCustomers();


  alert(
    "Customer deleted successfully."
  );
}


/* =========================
   PDF
========================= */

function generateCustomerPDF(id) {

  const customer =
    customers.find(
      function (item) {

        return item.id === id;

      }
    );


  if (!customer) return;


  if (
    !window.jspdf ||
    !window.jspdf.jsPDF
  ) {

    alert(
      "PDF library is still loading. Please try again."
    );

    return;
  }


  const jsPDF =
    window.jspdf.jsPDF;


  const doc =
    new jsPDF();


  doc.setFontSize(18);

  doc.text(
    "RAKESH BARAIYA",
    20,
    20
  );


  doc.setFontSize(12);

  doc.text(
    "Customer Record",
    20,
    30
  );


  const lines = [

    [
      "Customer Name",
      customer.name || ""
    ],

    [
      "Mobile No.",
      customer.mobile || ""
    ],

    [
      "Repository ID",
      customer.repository_id || ""
    ],

    [
      "Email ID",
      customer.email || ""
    ],

    [
      "Package",
      customer.package || ""
    ],

    [
      "Total Payment",
      formatCurrency(
        customer.total_payment
      )
    ],

    [
      "Start Date",
      customer.start_date || ""
    ],

    [
      "Validity",
      customer.validity || ""
    ],

    [
      "Status",
      isCustomerExpired(customer)
        ? "Expired"
        : "Active"
    ]

  ];


  let y = 45;


  lines.forEach(
    function (item) {

      doc.setFont(
        "helvetica",
        "bold"
      );


      doc.text(
        item[0] + ":",
        20,
        y
      );


      doc.setFont(
        "helvetica",
        "normal"
      );


      doc.text(
        String(item[1]),
        70,
        y
      );


      y += 10;

    }
  );


  doc.setFontSize(9);


  doc.text(
    "Generated from RAKESH BARAIYA Business Dashboard",
    20,
    285
  );


  const safeName =
    String(
      customer.name ||
      "customer"
    )
    .replace(
      /[^a-z0-9_-]/gi,
      "_"
    );


  doc.save(
    "customer-" +
    safeName +
    ".pdf"
  );
}


/* =========================
   CURRENCY
========================= */

function formatCurrency(amount) {

  return (
    "₹" +
    Number(
      amount || 0
    ).toLocaleString(
      "en-IN"
    )
  );
}
