/**
 * STRUCTURA shared project-information system.
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "structura.projectInfo";

  const DEFAULTS = {
    projectId: "",
    projectName: "",
    client: "",
    location: "",
    preparedBy: "",
    checkedBy: "",
    date: "",
    notes: "",
  };

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS, date: todayISO() };
      return { ...DEFAULTS, date: todayISO(), ...JSON.parse(raw) };
    } catch (_) {
      return { ...DEFAULTS, date: todayISO() };
    }
  }

  function save(data) {
    const next = { ...DEFAULTS, ...data };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {
      /* ignore */
    }
    global.dispatchEvent(
      new CustomEvent("structura:projectchange", { detail: { project: next } }),
    );
    return next;
  }

  function readFromDom(root) {
    const scope = root || document;
    const data = load();
    Object.keys(DEFAULTS).forEach((key) => {
      const el = scope.querySelector(`[data-project-field="${key}"]`);
      if (el) data[key] = el.value;
    });
    return data;
  }

  function writeToDom(data, root) {
    const scope = root || document;
    const src = data || load();
    Object.keys(DEFAULTS).forEach((key) => {
      const el = scope.querySelector(`[data-project-field="${key}"]`);
      if (el && src[key] != null) el.value = src[key];
    });
  }

  function bindAutoSave(root) {
    const scope = root || document;
    writeToDom(load(), scope);
    scope.querySelectorAll("[data-project-field]").forEach((el) => {
      el.addEventListener("change", () => save(readFromDom(scope)));
      el.addEventListener("blur", () => save(readFromDom(scope)));
    });
  }

  function getProjectData() {
    return readFromDom();
  }

  global.StructuraProject = {
    DEFAULTS,
    load,
    save,
    readFromDom,
    writeToDom,
    bindAutoSave,
    getProjectData,
  };
})(typeof window !== "undefined" ? window : globalThis);
