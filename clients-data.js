
/* =========================================================
   RAKESH BARAIYA - CLIENTS DATA
   Uses the existing Supabase login session.
========================================================= */

(() => {
  "use strict";

  let rows = [];
  let busy = false;

  function el(id) {
    return document.getElementById(id);
  }

  function supabaseDB() {
    return window.db || window.dbClient || null;
  }

  /*
   * app.js already creates a Supabase client as `const db`.
   * This module receives it through the helper installed below.
   */
  let clientDB = null;

  function setMessage(message) {
    const body = el("clientsDataTableBody");
    if (!body) return;

    body.replaceChildren();
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = message;
    tr.appendChild(td);
    body.appendChild(tr);
  }

  function cell(value) {
    const td = document.createElement("td");
    td.textContent = value == null || value === "" ? "—" : String(value);
    return td;
  }

  function resetForm() {
    el("clientsDataForm")?.reset();
    el("clientDataId").value = "";
    el("clientDataSaveBtn").textContent = "Save Client Data";
    el("clientDataCancelBtn").hidden = true;
  }

  async function load() {
    if (!clientDB) {
      setMessage("Supabase client is not available. Check app.js.");
      return;
    }

    if (busy) return;
    busy = true;
    setMessage("Loading client data...");

    try {
      const { data: authData, error: authError } =
        await clientDB.auth.getUser();

      if (authError || !authData?.user) {
        setMessage("Please log in to view client data.");
        return;
      }

      const { data, error } = await clientDB
        .from("clients_data")
        .select("id,name,mobile,service,gmail_id,created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Clients Data load error:", error);
        setMessage("Could not load records: " + error.message);
        return;
      }

      rows = data || [];
      render();
    } catch (error) {
      console.error(error);
      setMessage("An error occurred while loading records.");
    } finally {
      busy = false;
    }
  }

  function render() {
    const body = el("clientsDataTableBody");
    if (!body) return;

    body.replaceChildren();

    const query = (el("clientDataSearch")?.value || "")
      .trim()
      .toLowerCase();

    const filtered = rows.filter(item =>
      [item.name, item.mobile, item.service, item.gmail_id]
        .some(value => String(value || "").toLowerCase().includes(query))
    );

    if (!filtered.length) {
      setMessage("No client records found.");
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement("tr");
      tr.append(
        cell(item.name),
        cell(item.mobile),
        cell(item.service),
        cell(item.gmail_id)
      );

      const actions = document.createElement("td");

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "action-btn edit-btn";
      edit.textContent = "Edit";
      edit.addEventListener("click", () => editRecord(item));

      const del = document.createElement("button");
      del.type = "button";
      del.className = "action-btn delete-btn";
      del.textContent = "Delete";
      del.addEventListener("click", () => deleteRecord(item));

      actions.append(edit, del);
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
    el("clientDataSaveBtn").textContent = "Update Client Data";
    el("clientDataCancelBtn").hidden = false;
    el("clientsDataForm").scrollIntoView({ behavior: "smooth" });
  }

  async function save(event) {
    event.preventDefault();

    if (!clientDB) {
      alert("Supabase client is not available.");
      return;
    }

    const name = el("clientDataName").value.trim();
    const mobile = el("clientDataMobile").value.trim();
    const service = el("clientDataService").value;
    const gmail = el("clientDataGmail").value.trim();
    const id = el("clientDataId").value;

    if (!name || !mobile || !service) {
      alert("Please enter Client Name, Mobile Number and Service.");
      return;
    }

    const button = el("clientDataSaveBtn");
    button.disabled = true;
    button.textContent = id ? "Updating..." : "Saving...";

    try {
      const { data: authData, error: authError } =
        await clientDB.auth.getUser();

      if (authError || !authData?.user) {
        alert("Please log in again.");
        return;
      }

      const payload = {
        name,
        mobile,
        service,
        gmail_id: gmail || null
      };

      let result;

      if (id) {
        result = await clientDB
          .from("clients_data")
          .update(payload)
          .eq("id", id)
          .select("id");
      } else {
        result = await clientDB
          .from("clients_data")
          .insert({
            ...payload,
            user_id: authData.user.id
          })
          .select("id");
      }

      if (result.error) {
        console.error("Client save error:", result.error);
        alert("Could not save: " + result.error.message);
        return;
      }

      if (!result.data?.length) {
        alert("No record was changed. Check table permissions and ownership.");
        return;
      }

      alert(id ? "Client data updated successfully." :
        "Client data saved successfully.");

      resetForm();
      await load();
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving client data.");
    } finally {
      button.disabled = false;
      button.textContent = el("clientDataId").value
        ? "Update Client Data"
        : "Save Client Data";
    }
  }

  async function deleteRecord(item) {
    if (!confirm("Delete client data for " + item.name + "?")) return;

    try {
      const { error } = await clientDB
        .from("clients_data")
        .delete()
        .eq("id", item.id);

      if (error) {
        alert("Delete failed: " + error.message);
        return;
      }

      alert("Client data deleted.");
      await load();
    } catch (error) {
      console.error(error);
      alert("Could not delete client data.");
    }
  }

  function showPageWithClients(pageId) {
    ["dashboardPage", "customerPage", "clientsDataPage"].forEach(id => {
      el(id)?.classList.toggle("hidden", id !== pageId);
    });

    if (pageId === "clientsDataPage") load();
  }

  function initialize() {
    /*
     * app.js declares `const db`, which is not a window property.
     * Therefore, this module needs the safe bridge added in the
     * small app.js instruction below before clientDB can be set.
     */
    clientDB = window.__businessDashboardSupabase || supabaseDB();

    el("clientsDataForm")?.addEventListener("submit", save);
    el("clientDataSearch")?.addEventListener("input", render);
    el("clientDataCancelBtn")?.addEventListener("click", resetForm);

    window.showPage = showPageWithClients;
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
