// ================================
// RAKESH BARAIYA BUSINESS DASHBOARD
// ================================

let customers = JSON.parse(
  localStorage.getItem("rakeshCustomers") || "[]"
);

let selectedPackageMonths = 0;


// ---------------- LOGIN ----------------

// Demo login for now.
// Real secure Supabase login will be added in the next stage.

const DEMO_EMAIL = "admin@rakeshbaraiya.com";
const DEMO_PASSWORD = "123456";

function login() {

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const message = document.getElementById("loginMessage");

  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {

    localStorage.setItem("rakeshLoggedIn", "true");

    message.textContent = "";

    showApp();

  } else {

    message.textContent = "Invalid email or password.";
    message.style.color = "#d93025";

  }
}


function logout() {

  localStorage.removeItem("rakeshLoggedIn");

  document.getElementById("appPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");

}


// ---------------- PAGE LOAD ----------------

document.addEventListener("DOMContentLoaded", function () {

  const loggedIn =
    localStorage.getItem("rakeshLoggedIn") === "true";

  if (loggedIn) {
    showApp();
  }

  updateDashboard();
  renderCustomers();

});


function showApp() {

  document.getElementById("loginPage").classList.add("hidden");

  document.getElementById("appPage").classList.remove("hidden");

  updateDashboard();
  renderCustomers();

}


// ---------------- PAGE NAVIGATION ----------------

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


// ---------------- PACKAGE ----------------

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


// ---------------- SAVE CUSTOMER ----------------

document
  .getElementById("customerForm")
  .addEventListener("submit", function (event) {

    event.preventDefault();

    const name =
      document.getElementById("customerName").value.trim();

    const mobile =
      document.getElementById("customerMobile").value.trim();

    const repositoryId =
      document.getElementById("repositoryId").value.trim();

    const email =
      document.getElementById("customerEmail").value.trim();

    const packageName =
      document.getElementById("selectedPackage").value;

    const payment =
      Number(
        document.getElementById("totalPaymentInput").value
      ) || 0;

    const startDate =
      document.getElementById("startDate").value;

    const validity =
      document.getElementById("validity").value;


    if (!name || !mobile) {

      alert("Please enter customer name and mobile number.");

      return;
    }


    if (!packageName) {

      alert("Please select a package.");

      return;
    }


    const customer = {

      id: Date.now(),

      name: name,

      mobile: mobile,

      repositoryId: repositoryId,

      email: email,

      package: packageName,

      payment: payment,

      startDate: startDate,

      validity: validity,

      createdAt: new Date().toISOString()

    };


    customers.push(customer);

    saveCustomers();

    alert("Customer saved successfully!");


    document
      .getElementById("customerForm")
      .reset();

    selectedPackageMonths = 0;

    showPage("dashboardPage");

    updateDashboard();
    renderCustomers();

  });


// ---------------- LOCAL STORAGE ----------------

function saveCustomers() {

  localStorage.setItem(
    "rakeshCustomers",
    JSON.stringify(customers)
  );

}


// ---------------- DASHBOARD ----------------

function updateDashboard() {

  const totalCustomers =
    customers.length;

  const totalPayment =
    customers.reduce(
      (sum, customer) =>
        sum + Number(customer.payment || 0),
      0
    );


  let active = 0;
  let expired = 0;


  customers.forEach(function (customer) {

    if (isCustomerExpired(customer)) {

      expired++;

    } else {

      active++;

    }

  });


  document.getElementById("totalCustomers").textContent =
    totalCustomers;

  document.getElementById("totalPayment").textContent =
    formatCurrency(totalPayment);

  document.getElementById("activePackages").textContent =
    active;

  document.getElementById("expiredPackages").textContent =
    expired;

}


// ---------------- EXPIRY CHECK ----------------

function isCustomerExpired(customer) {

  if (!customer.startDate) {
    return false;
  }

  const start =
    new Date(customer.startDate);

  let months = 0;

  if (customer.package === "Silver") {

    months = 3;

  } else if (customer.package === "Gold") {

    months = 6;

  } else if (customer.package === "Platinum") {

    months = 12;

  } else {

    return false;

  }


  const expiry =
    new Date(start);

  expiry.setMonth(
    expiry.getMonth() + months
  );


  return new Date() > expiry;

}


// ---------------- CUSTOMER HISTORY ----------------

function renderCustomers(list = customers) {

  const tbody =
    document.getElementById("customerTableBody");

  tbody.innerHTML = "";


  if (list.length === 0) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:30px;">
          No customer records found.
        </td>
      </tr>
    `;

    return;
  }


  list.forEach(function (customer) {

    const expired =
      isCustomerExpired(customer);


    const row =
      document.createElement("tr");


    row.innerHTML = `

      <td>
        <strong>${escapeHTML(customer.name)}</strong>
      </td>

      <td>
        ${escapeHTML(customer.mobile)}
      </td>

      <td>
        ${escapeHTML(customer.package)}
      </td>

      <td>
        ${formatCurrency(customer.payment)}
      </td>

      <td>
        <span style="
          color:${expired ? "#d93025" : "#16834b"};
          font-weight:600;
        ">
          ${expired ? "Expired" : "Active"}
        </span>
      </td>

      <td>

        <button
          class="action-btn edit-btn"
          onclick="editCustomer(${customer.id})">
          Edit
        </button>

        <button
          class="action-btn delete-btn"
          onclick="deleteCustomer(${customer.id})">
          Delete
        </button>

      </td>

    `;


    tbody.appendChild(row);

  });

}


// ---------------- SEARCH ----------------

function searchCustomers() {

  const search =
    document
      .getElementById("searchCustomer")
      .value
      .toLowerCase()
      .trim();


  if (!search) {

    renderCustomers(customers);

    return;
  }


  const filtered =
    customers.filter(function (customer) {

      return (

        customer.name
          .toLowerCase()
          .includes(search)

        ||

        customer.mobile
          .toLowerCase()
          .includes(search)

        ||

        customer.package
          .toLowerCase()
          .includes(search)

        ||

        (customer.repositoryId || "")
          .toLowerCase()
          .includes(search)

      );

    });


  renderCustomers(filtered);

}


// ---------------- EDIT CUSTOMER ----------------

function editCustomer(id) {

  const customer =
    customers.find(function (item) {

      return item.id === id;

    });


  if (!customer) {
    return;
  }


  document.getElementById("customerName").value =
    customer.name;

  document.getElementById("customerMobile").value =
    customer.mobile;

  document.getElementById("repositoryId").value =
    customer.repositoryId || "";

  document.getElementById("customerEmail").value =
    customer.email || "";

  document.getElementById("selectedPackage").value =
    customer.package;

  document.getElementById("totalPaymentInput").value =
    customer.payment;

  document.getElementById("startDate").value =
    customer.startDate || "";

  document.getElementById("validity").value =
    customer.validity || "";


  showPage("customerPage");


  // Remove old customer before saving edited version.
  customers =
    customers.filter(function (item) {

      return item.id !== id;

    });

}


// ---------------- DELETE CUSTOMER ----------------

function deleteCustomer(id) {

  const customer =
    customers.find(function (item) {

      return item.id === id;

    });


  if (!customer) {
    return;
  }


  const confirmDelete =
    confirm(
      "Delete customer " +
      customer.name +
      "?"
    );


  if (!confirmDelete) {
    return;
  }


  customers =
    customers.filter(function (item) {

      return item.id !== id;

    });


  saveCustomers();

  updateDashboard();

  renderCustomers();

}


// ---------------- CURRENCY ----------------

function formatCurrency(amount) {

  return "₹" +
    Number(amount || 0)
      .toLocaleString("en-IN");

}


// ---------------- SECURITY HELPER ----------------

function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
