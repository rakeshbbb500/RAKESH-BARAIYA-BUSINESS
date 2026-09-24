/* =========================================================
   RAKESH BARAIYA
   BUSINESS MANAGEMENT DASHBOARD
   ========================================================= */


/* =========================
   SUPABASE CONFIGURATION
========================= */

const SUPABASE_URL =
  "https://bgakkkbavdtcndylpwgd.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_fcs7MDIxJomgpkkuHLH1eg_Zt_UcHMh";


/* =========================
   DEMO LOGIN
========================= */

const DEMO_EMAIL =
  "softwearenjiniear@gmail.com";

const DEMO_PASSWORD =
  "rakesh@2007";


/* =========================
   SUPABASE CLIENT
========================= */

const db =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================
   GLOBAL VARIABLES
========================= */

let customers = [];

let selectedPackageMonths = 0;

let loadingCustomers = false;


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const customerForm =
      document.getElementById(
        "customerForm"
      );

    if (customerForm) {

      customerForm.addEventListener(
        "submit",
        saveCustomer
      );

    }


    const loginForm =
      document.getElementById(
        "loginForm"
      );

    if (loginForm) {

      loginForm.addEventListener(
        "submit",
        function (event) {

          event.preventDefault();

          login();

        }
      );

    }


    resetCustomerForm();


    /* =========================
       CHECK LOGIN SESSION
    ========================= */

    if (
      sessionStorage.getItem(
        "rakeshLoggedIn"
      ) === "true"
    ) {

      showApp();

    } else {

      showLogin();

    }

  }
);


/* =========================================================
   LOGIN
========================================================= */

function login() {

  const emailInput =
    document.getElementById(
      "loginEmail"
    );

  const passwordInput =
    document.getElementById(
      "loginPassword"
    );

  const message =
    document.getElementById(
      "loginMessage"
    );


  if (!emailInput || !passwordInput) {

    return;

  }


  const email =
    emailInput.value
      .trim()
      .toLowerCase();

  const password =
    passwordInput.value;


  /* =========================
     CHECK LOGIN
  ========================= */

  if (
    email !==
      DEMO_EMAIL.toLowerCase() ||
    password !==
      DEMO_PASSWORD
  ) {

    if (message) {

      message.textContent =
        "Invalid email or password.";

      message.style.color =
        "#d93025";

    }

    return;

  }


  /* =========================
     LOGIN SUCCESS
  ========================= */

  sessionStorage.setItem(
    "rakeshLoggedIn",
    "true"
  );


  if (message) {

    message.textContent =
      "Login successful.";

    message.style.color =
      "#188038";

  }


  /* =========================
     OPEN DASHBOARD
  ========================= */

  showApp();

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

  sessionStorage.removeItem(
    "rakeshLoggedIn"
  );


  customers = [];


  showLogin();

}


/* =========================================================
   SHOW LOGIN PAGE
========================================================= */

function showLogin() {

  const loginPage =
    document.getElementById(
      "loginPage"
    );

  const appPage =
    document.getElementById(
      "appPage"
    );


  if (appPage) {

    appPage.classList.add(
      "hidden"
    );

  }


  if (loginPage) {

    loginPage.classList.remove(
      "hidden"
    );

  }


  const email =
    document.getElementById(
      "loginEmail"
    );

  const password =
    document.getElementById(
      "loginPassword"
    );

  const message =
    document.getElementById(
      "loginMessage"
    );


  if (email) {

    email.value = "";

  }


  if (password) {

    password.value = "";

  }


  if (message) {

    message.textContent = "";

  }

}


/* =========================================================
   SHOW MAIN APPLICATION
========================================================= */

function showApp() {

  const loginPage =
    document.getElementById(
      "loginPage"
    );

  const appPage =
    document.getElementById(
      "appPage"
    );


  if (loginPage) {

    loginPage.classList.add(
      "hidden"
    );

  }


  if (appPage) {

    appPage.classList.remove(
      "hidden"
    );

  }


  /* =========================
     SHOW DASHBOARD FIRST
  ========================= */

  updateDashboard();

  renderCustomers();


  /* =========================
     LOAD DATABASE SEPARATELY
     
     If Supabase fails,
     Dashboard still stays open.
  ========================= */

  loadCustomers()
    .then(function () {

      updateDashboard();

      renderCustomers();

    })
    .catch(function (error) {

      console.error(
        "Customer data load error:",
        error
      );

    });

}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {

  const dashboardPage =
    document.getElementById(
      "dashboardPage"
    );

  const customerPage =
    document.getElementById(
      "customerPage"
    );


  if (
    !dashboardPage ||
    !customerPage
  ) {

    return;

  }


  if (
    pageId ===
    "customerPage"
  ) {

    dashboardPage.classList.add(
      "hidden"
    );

    customerPage.classList.remove(
      "hidden"
    );

  } else {

    customerPage.classList.add(
      "hidden"
    );

    dashboardPage.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   NEW CUSTOMER
========================================================= */

function openNewCustomer() {

  resetCustomerForm();


  const title =
    document.getElementById(
      "customerFormTitle"
    );

  if (title) {

    title.textContent =
      "New Customer";

  }


  const button =
    document.getElementById(
      "saveCustomerBtn"
    );

  if (button) {

    button.textContent =
      "Save Customer";

  }


  showPage(
    "customerPage"
  );

}


/* =========================================================
   PACKAGE SELECTION
========================================================= */

function selectPackage(
  packageName,
  price,
  months
) {

  const packageInput =
    document.getElementById(
      "selectedPackage"
    );

  const paymentInput =
    document.getElementById(
      "totalPaymentInput"
    );

  const validityInput =
    document.getElementById(
      "validity"
    );


  if (packageInput) {

    packageInput.value =
      packageName;

  }


  if (paymentInput) {

    paymentInput.value =
      price > 0
        ? price
        : "";

  }


  selectedPackageMonths =
    months;


  if (!validityInput) {

    return;

  }


  if (months === 3) {

    validityInput.value =
      "3 Months";

  }

  else if (months === 6) {

    validityInput.value =
      "6 Months";

  }

  else if (months === 12) {

    validityInput.value =
      "1 Year";

  }

  else {

    validityInput.value =
      "Custom";

  }

}


/* =========================================================
   LOAD CUSTOMERS
========================================================= */

async function loadCustomers() {

  if (loadingCustomers) {

    return;

  }


  loadingCustomers = true;


  try {

    const result =
      await db
        .from("customers")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (result.error) {

      console.error(
        "Supabase load error:",
        result.error
      );


      customers = [];


      return;

    }


    customers =
      result.data || [];


  }

  catch (error) {

    console.error(
      "Customer load exception:",
      error
    );


    customers = [];

  }

  finally {

    loadingCustomers = false;

  }

}


/* =========================================================
   SAVE CUSTOMER
========================================================= */

async function saveCustomer(
  event
) {

  event.preventDefault();


  const name =
    document
      .getElementById(
        "customerName"
      )
      .value
      .trim();


  const mobile =
    document
      .getElementById(
        "customerMobile"
      )
      .value
      .trim();


  const repositoryId =
    document
      .getElementById(
        "repositoryId"
      )
      .value
      .trim();


  const email =
    document
      .getElementById(
        "customerEmail"
      )
      .value
      .trim();


  const packageName =
    document
      .getElementById(
        "selectedPackage"
      )
      .value
      .trim();


  const payment =
    Number(
      document
        .getElementById(
          "totalPaymentInput"
        )
        .value
    ) || 0;


  const startDate =
    document
      .getElementById(
        "startDate"
      )
      .value;


  const validity =
    document
      .getElementById(
        "validity"
      )
      .value
      .trim();


  const editingId =
    document
      .getElementById(
        "editingCustomerId"
      )
      .value;


  /* =========================
     VALIDATION
  ========================= */

  if (
    !name ||
    !mobile
  ) {

    alert(
      "Please enter customer name and mobile number."
    );

    return;

  }


  if (!packageName) {

    alert(
      "Please select a package."
    );

    return;

  }


  if (!startDate) {

    alert(
      "Please select start date."
    );

    return;

  }


  /* =========================
     CUSTOMER DATA
  ========================= */

  const payload = {

    name:
      name,

    mobile:
      mobile,

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
    document.getElementById(
      "saveCustomerBtn"
    );


  if (button) {

    button.disabled = true;

    button.textContent =
      editingId
        ? "Updating..."
        : "Saving...";

  }


  try {

    let result;


    /* =========================
       UPDATE
    ========================= */

    if (editingId) {

      result =
        await db
          .from("customers")
          .update(payload)
          .eq(
            "id",
            editingId
          );

    }


    /* =========================
       INSERT
    ========================= */

    else {

      result =
        await db
          .from("customers")
          .insert(
            payload
          );

    }


    if (result.error) {

      console.error(
        "Save error:",
        result.error
      );


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


    showPage(
      "dashboardPage"
    );

  }

  catch (error) {

    console.error(
      "Save exception:",
      error
    );


    alert(
      "Something went wrong while saving customer."
    );

  }

  finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        editingId
          ? "Update Customer"
          : "Save Customer";

    }

  }

}


/* =========================================================
   RESET CUSTOMER FORM
========================================================= */

function resetCustomerForm() {

  const form =
    document.getElementById(
      "customerForm"
    );


  if (form) {

    form.reset();

  }


  const editingId =
    document.getElementById(
      "editingCustomerId"
    );

  if (editingId) {

    editingId.value = "";

  }


  const title =
    document.getElementById(
      "customerFormTitle"
    );

  if (title) {

    title.textContent =
      "New Customer";

  }


  const saveButton =
    document.getElementById(
      "saveCustomerBtn"
    );

  if (saveButton) {

    saveButton.textContent =
      "Save Customer";

  }


  const packageInput =
    document.getElementById(
      "selectedPackage"
    );

  if (packageInput) {

    packageInput.value = "";

  }


  const validity =
    document.getElementById(
      "validity"
    );

  if (validity) {

    validity.value = "";

  }


  const today =
    new Date()
      .toISOString()
      .split("T")[0];


  const startDate =
    document.getElementById(
      "startDate"
    );

  if (startDate) {

    startDate.value =
      today;

  }


  selectedPackageMonths =
    0;

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

  const totalCustomers =
    customers.length;


  const totalPayment =
    customers.reduce(
      function (
        sum,
        customer
      ) {

        return (
          sum +
          Number(
            customer.total_payment ||
            0
          )
        );

      },
      0
    );


  let active = 0;

  let expired = 0;


  customers.forEach(
    function (customer) {

      if (
        isCustomerExpired(
          customer
        )
      ) {

        expired++;

      }

      else {

        active++;

      }

    }
  );


  const totalCustomersElement =
    document.getElementById(
      "totalCustomers"
    );

  const totalPaymentElement =
    document.getElementById(
      "totalPayment"
    );

  const activeElement =
    document.getElementById(
      "activePackages"
    );

  const expiredElement =
    document.getElementById(
      "expiredPackages"
    );


  if (totalCustomersElement) {

    totalCustomersElement.textContent =
      totalCustomers;

  }


  if (totalPaymentElement) {

    totalPaymentElement.textContent =
      formatCurrency(
        totalPayment
      );

  }


  if (activeElement) {

    activeElement.textContent =
      active;

  }


  if (expiredElement) {

    expiredElement.textContent =
      expired;

  }

}


/* =========================================================
   PACKAGE MONTHS
========================================================= */

function getPackageMonths(
  packageName
) {

  if (
    packageName ===
    "Silver"
  ) {

    return 3;

  }


  if (
    packageName ===
    "Gold"
  ) {

    return 6;

  }


  if (
    packageName ===
    "Platinum"
  ) {

    return 12;

  }


  return 0;

}


/* =========================================================
   CHECK EXPIRY
========================================================= */

function isCustomerExpired(
  customer
) {

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
    expiry.getMonth() +
    months
  );


  return (
    new Date() >
    expiry
  );

}


/* =========================================================
   CUSTOMER TABLE
========================================================= */

function renderCustomers(
  list
) {

  const tbody =
    document.getElementById(
      "customerTableBody"
    );


  if (!tbody) {

    return;

  }


  tbody.innerHTML =
    "";


  const rows =
    list || customers;


  /* =========================
     EMPTY
  ========================= */

  if (
    rows.length === 0
  ) {

    const emptyRow =
      document.createElement(
        "tr"
      );


    const emptyCell =
      document.createElement(
        "td"
      );


    emptyCell.colSpan =
      6;


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


  /* =========================
     CUSTOMER ROWS
  ========================= */

  rows.forEach(
    function (customer) {

      const expired =
        isCustomerExpired(
          customer
        );


      const row =
        document.createElement(
          "tr"
        );


      /* NAME */

      const nameCell =
        document.createElement(
          "td"
        );


      const nameStrong =
        document.createElement(
          "strong"
        );


      nameStrong.textContent =
        customer.name || "";


      nameCell.appendChild(
        nameStrong
      );


      /* MOBILE */

      const mobileCell =
        document.createElement(
          "td"
        );


      mobileCell.textContent =
        customer.mobile || "";


      /* PACKAGE */

      const packageCell =
        document.createElement(
          "td"
        );


      packageCell.textContent =
        customer.package || "";


      /* PAYMENT */

      const paymentCell =
        document.createElement(
          "td"
        );


      paymentCell.textContent =
        formatCurrency(
          customer.total_payment
        );


      /* STATUS */

      const statusCell =
        document.createElement(
          "td"
        );


      const statusSpan =
        document.createElement(
          "span"
        );


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


      /* ACTION */

      const actionCell =
        document.createElement(
          "td"
        );


      /* EDIT BUTTON */

      const editBtn =
        document.createElement(
          "button"
        );


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


      /* DELETE BUTTON */

      const deleteBtn =
        document.createElement(
          "button"
        );


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


      /* PDF BUTTON */

      const pdfBtn =
        document.createElement(
          "button"
        );


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


      /* ADD CELLS */

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

    }
  );

}


/* =========================================================
   SEARCH
========================================================= */

function searchCustomers() {

  const searchInput =
    document.getElementById(
      "searchCustomer"
    );


  if (!searchInput) {

    return;

  }


  const search =
    searchInput.value
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
            customer.name ||
            ""
          )
            .toLowerCase()
            .includes(search)

          ||

          String(
            customer.mobile ||
            ""
          )
            .toLowerCase()
            .includes(search)

          ||

          String(
            customer.package ||
            ""
          )
            .toLowerCase()
            .includes(search)

          ||

          String(
            customer.repository_id ||
            ""
          )
            .toLowerCase()
            .includes(search)

          ||

          String(
            customer.email ||
            ""
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


/* =========================================================
   EDIT CUSTOMER
========================================================= */

function editCustomer(
  id
) {

  const customer =
    customers.find(
      function (item) {

        return (
          item.id === id
        );

      }
    );


  if (!customer) {

    return;

  }


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
    customer.repository_id ||
    "";


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
    customer.total_payment ??
    "";


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


/* =========================================================
   DELETE CUSTOMER
========================================================= */

async function deleteCustomer(
  id
) {

  const customer =
    customers.find(
      function (item) {

        return (
          item.id === id
        );

      }
    );


  if (!customer) {

    return;

  }


  if (
    !confirm(
      "Delete customer " +
      customer.name +
      "?"
    )
  ) {

    return;

  }


  try {

    const result =
      await db
        .from("customers")
        .delete()
        .eq(
          "id",
          id
        );


    if (result.error) {

      console.error(
        "Delete error:",
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

  catch (error) {

    console.error(
      "Delete exception:",
      error
    );


    alert(
      "Something went wrong while deleting customer."
    );

  }

}


/* =========================================================
   PDF
========================================================= */

function generateCustomerPDF(
  id
) {

  const customer =
    customers.find(
      function (item) {

        return (
          item.id === id
        );

      }
    );


  if (!customer) {

    return;

  }


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


  /* =========================
     HEADER
  ========================= */

  doc.setFontSize(
    18
  );


  doc.text(
    "RAKESH BARAIYA",
    20,
    20
  );


  doc.setFontSize(
    12
  );


  doc.text(
    "Customer Record",
    20,
    30
  );


  /* =========================
     CUSTOMER INFORMATION
  ========================= */

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
      isCustomerExpired(
        customer
      )
        ? "Expired"
        : "Active"
    ]

  ];


  let y =
    45;


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
        String(
          item[1]
        ),
        70,
        y
      );


      y +=
        10;

    }
  );


  /* =========================
     FOOTER
  ========================= */

  doc.setFontSize(
    9
  );


  doc.text(
    "Generated from RAKESH BARAIYA Business Dashboard",
    20,
    285
  );


  /* =========================
     FILE NAME
  ========================= */

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


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
  amount
) {

  return (
    "₹" +
    Number(
      amount || 0
    ).toLocaleString(
      "en-IN"
    )
  );

}
