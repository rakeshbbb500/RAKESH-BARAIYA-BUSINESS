/* RAKESH BARAIYA BUSINESS — client records, payment tracking and SIM-based SMS */
(() => {
  "use strict";
  let rows = [];
  let busy = false;
  let clientDB = null;
  const el = id => document.getElementById(id);
  const FEEDBACK_URL = new URL("./feedback.html", window.location.href).href;

  function showMessage(message) {
    const body = el("clientsDataTableBody");
    if (!body) return;
    body.replaceChildren();
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = message;
    tr.appendChild(td);
    body.appendChild(tr);
  }
  function cell(value) {
    const td = document.createElement("td");
    td.textContent = value == null || value === "" ? "—" : String(value);
    return td;
  }
  function actionButton(label, css, handler) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "action-btn " + css;
    b.textContent = label;
    b.addEventListener("click", handler);
    return b;
  }
  function resetForm() {
    el("clientsDataForm")?.reset();
    if (el("clientDataId")) el("clientDataId").value = "";
    if (el("clientDataSaveBtn")) el("clientDataSaveBtn").textContent = "Save Client Data";
    if (el("clientDataCancelBtn")) el("clientDataCancelBtn").hidden = true;
    if (el("clientDataPaymentStatus")) el("clientDataPaymentStatus").value = "Pending";
    if (el("clientDataPaymentAmount")) el("clientDataPaymentAmount").value = "0";
  }
  async function load() {
    if (!clientDB) { showMessage("Supabase client is not available. Check app.js."); return; }
    if (busy) return;
    busy = true;
    showMessage("Loading client data…");
    try {
      const { data: authData, error: authError } = await clientDB.auth.getUser();
      if (authError || !authData?.user) { showMessage("Please log in to view client data."); return; }
      const { data, error } = await clientDB.from("clients_data")
        .select("id,name,mobile,service,gmail_id,payment_status,payment_amount,payment_completed_at,created_at")
        .order("created_at", { ascending: false });
      if (error) { console.error(error); showMessage("Could not load records: " + error.message); return; }
      rows = data || [];
      render();
    } catch (error) {
      console.error(error);
      showMessage("An error occurred while loading records.");
    } finally { busy = false; }
  }
  function render() {
    const body = el("clientsDataTableBody");
    if (!body) return;
    body.replaceChildren();
    const query = (el("clientDataSearch")?.value || "").trim().toLowerCase();
    const filtered = rows.filter(item =>
      [item.name,item.mobile,item.service,item.gmail_id,item.payment_status]
        .some(value => String(value || "").toLowerCase().includes(query)));
    if (!filtered.length) { showMessage("No client records found."); return; }
    filtered.forEach(item => {
      const tr = document.createElement("tr");
      tr.append(cell(item.name), cell(item.mobile), cell(item.service), cell(item.gmail_id));
      const pay = document.createElement("td");
      const status = document.createElement("strong");
      status.textContent = item.payment_status || "Pending";
      status.style.color = item.payment_status === "Complete" ? "#16834b" : "#b45309";
      pay.appendChild(status);
      const amount = document.createElement("div");
      amount.textContent = "₹" + Number(item.payment_amount || 0).toLocaleString("en-IN");
      pay.appendChild(amount);
      tr.appendChild(pay);
      const actions = document.createElement("td");
      actions.append(
        actionButton("Edit", "edit-btn", () => editRecord(item)),
        actionButton("Delete", "delete-btn", () => deleteRecord(item))
      );
      actions.appendChild(actionButton(
        item.payment_status === "Complete" ? "Send Feedback SMS" : "Complete + SMS",
        "",
        () => item.payment_status === "Complete" ? openSMS(item) : completePayment(item)
      ));
      tr.appendChild(actions);
      body.appendChild(tr);
    });
  }
  function editRecord(item) {
    el("clientDataId").value = item.id;
    el("clientDataName").value = item.name || "";
    el("clientDataMobile").value = item.mobile || "";
    el("clientDataService").value = item.service || "";
    el("clientDataGmail").value = item.gmail_id || "";
    if (el("clientDataPaymentStatus")) el("clientDataPaymentStatus").value = item.payment_status || "Pending";
    if (el("clientDataPaymentAmount")) el("clientDataPaymentAmount").value = Number(item.payment_amount || 0);
    el("clientDataSaveBtn").textContent = "Update Client Data";
    el("clientDataCancelBtn").hidden = false;
    el("clientsDataForm").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function save(event) {
    event.preventDefault();
    if (!clientDB) { alert("Supabase client is not available."); return; }
    const name = el("clientDataName").value.trim();
    const mobile = el("clientDataMobile").value.trim();
    const service = el("clientDataService").value;
    const gmail = el("clientDataGmail").value.trim();
    const id = el("clientDataId").value;
    const paymentStatus = el("clientDataPaymentStatus")?.value || "Pending";
    const paymentAmount = Number(el("clientDataPaymentAmount")?.value || 0);
    if (!name || !mobile || !service) { alert("Please enter Client Name, Mobile Number and Service."); return; }
    if (!Number.isFinite(paymentAmount) || paymentAmount < 0) { alert("Payment amount must be zero or more."); return; }
    const button = el("clientDataSaveBtn");
    button.disabled = true;
    button.textContent = id ? "Updating…" : "Saving…";
    try {
      const { data: authData, error: authError } = await clientDB.auth.getUser();
      if (authError || !authData?.user) { alert("Please log in again."); return; }
      const payload = {
        name, mobile, service, gmail_id: gmail || null,
        payment_status: paymentStatus, payment_amount: paymentAmount,
        payment_completed_at: paymentStatus === "Complete" ? new Date().toISOString() : null
      };
      const result = id
        ? await clientDB.from("clients_data").update(payload).eq("id", id).select("id")
        : await clientDB.from("clients_data").insert({ ...payload, user_id: authData.user.id }).select("id");
      if (result.error) { console.error(result.error); alert("Could not save: " + result.error.message); return; }
      if (!result.data?.length) { alert("No record changed. Check your login and record ownership."); return; }
      alert(id ? "Client data updated successfully." : "Client data saved successfully.");
      resetForm();
      await load();
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving client data.");
    } finally {
      button.disabled = false;
      button.textContent = el("clientDataId").value ? "Update Client Data" : "Save Client Data";
    }
  }
  function openSMS(item) {
    const phone = String(item.mobile || "").replace(/[^\d+]/g, "");
    if (!phone) { alert("This client has no valid mobile number."); return; }
    const body = "નમસ્તે " + item.name + ", તમારું પેમેન્ટ પૂર્ણ થયું છે. RAKESH BARAIYA BUSINESS ને પસંદ કરવા બદલ આભાર 🙏 તમારો અનુભવ અહીં શેર કરો: " + FEEDBACK_URL;
    window.location.href = "sms:" + phone + "?&body=" + encodeURIComponent(body);
  }
  async function completePayment(item) {
    if (!confirm("Mark payment as Complete for " + item.name + "? This will open your phone's SMS app after saving.")) return;
    try {
      const { error } = await clientDB.from("clients_data")
        .update({ payment_status: "Complete", payment_completed_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) { alert("Could not update payment: " + error.message); return; }
      await load();
      openSMS({ ...item, payment_status: "Complete" });
    } catch (error) {
      console.error(error);
      alert("Could not complete payment.");
    }
  }
  async function deleteRecord(item) {
    if (!confirm("Delete client data for " + item.name + "? This cannot be undone.")) return;
    try {
      const { error } = await clientDB.from("clients_data").delete().eq("id", item.id);
      if (error) { alert("Delete failed: " + error.message); return; }
      alert("Client data deleted.");
      await load();
    } catch (error) { console.error(error); alert("Could not delete client data."); }
  }
  function showPageWithClients(pageId) {
    ["dashboardPage","customerPage","clientsDataPage"].forEach(id => {
      el(id)?.classList.toggle("hidden", id !== pageId);
    });
    if (pageId === "clientsDataPage") load();
  }
  function initialize() {
    clientDB = window.__businessDashboardSupabase || null;
    el("clientsDataForm")?.addEventListener("submit", save);
    el("clientDataSearch")?.addEventListener("input", render);
    el("clientDataCancelBtn")?.addEventListener("click", resetForm);
    window.showPage = showPageWithClients;
  }
  document.addEventListener("DOMContentLoaded", initialize);
})();