import type { Markup, PageScale, Size } from "./pdf-annotation-engine";

export type LocalProjectSummary = {
  id: string;
  name: string;
  sourceName: string;
  sourceKind: "pdf" | "image";
  pageCount: number;
  markupCount: number;
  measurementCount: number;
  sourceSize: number;
  createdAt: string;
  updatedAt: string;
};

export type LocalProjectState = {
  pageSizes: Record<number, Size>;
  scales: Record<number, PageScale>;
  markups: Markup[];
  layerVisibility: Record<string, boolean>;
  activeLayer: string;
  measurementSettings: {
    precision: number;
    snapEnabled: boolean;
    gridSnapEnabled: boolean;
    gridSpacing: number;
  };
  removedSourceAnnotationRefs: string[];
};

export type LocalProjectDocument = {
  sourceBytes: ArrayBuffer;
  imageType?: "png" | "jpeg";
};

export type LocalProjectSnapshot = {
  summary: LocalProjectSummary;
  document: LocalProjectDocument;
  state: LocalProjectState;
};

const DATABASE_NAME = "structura-pro-workspace";
const DATABASE_VERSION = 1;
const SUMMARY_STORE = "project-summaries";
const DOCUMENT_STORE = "project-documents";
const STATE_STORE = "project-states";

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("The project database request failed."));
  });
}

function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("The project database transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("The project database transaction was cancelled."));
  });
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("On-device project storage is not available in this browser."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SUMMARY_STORE)) {
        database.createObjectStore(SUMMARY_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(DOCUMENT_STORE)) {
        database.createObjectStore(DOCUMENT_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(STATE_STORE)) {
        database.createObjectStore(STATE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("The project database could not be opened."));
  });
}

export async function listLocalProjects() {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(SUMMARY_STORE, "readonly");
    const summaries = await requestResult(transaction.objectStore(SUMMARY_STORE).getAll()) as LocalProjectSummary[];
    return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } finally {
    database.close();
  }
}

export async function saveLocalProject(snapshot: LocalProjectSnapshot) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([SUMMARY_STORE, DOCUMENT_STORE, STATE_STORE], "readwrite");
    transaction.objectStore(SUMMARY_STORE).put(snapshot.summary);
    transaction.objectStore(DOCUMENT_STORE).put({ id: snapshot.summary.id, ...snapshot.document });
    transaction.objectStore(STATE_STORE).put({ id: snapshot.summary.id, ...snapshot.state });
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function updateLocalProjectState(
  summary: LocalProjectSummary,
  state: LocalProjectState,
) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([SUMMARY_STORE, STATE_STORE], "readwrite");
    transaction.objectStore(SUMMARY_STORE).put(summary);
    transaction.objectStore(STATE_STORE).put({ id: summary.id, ...state });
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function getLocalProject(id: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([SUMMARY_STORE, DOCUMENT_STORE, STATE_STORE], "readonly");
    const [summary, document, state] = await Promise.all([
      requestResult(transaction.objectStore(SUMMARY_STORE).get(id)),
      requestResult(transaction.objectStore(DOCUMENT_STORE).get(id)),
      requestResult(transaction.objectStore(STATE_STORE).get(id)),
    ]);
    if (!summary || !document || !state) return null;
    const storedDocument = document as LocalProjectDocument & { id: string };
    const storedState = state as LocalProjectState & { id: string };
    return {
      summary: summary as LocalProjectSummary,
      document: {
        sourceBytes: storedDocument.sourceBytes,
        imageType: storedDocument.imageType,
      },
      state: {
        pageSizes: storedState.pageSizes,
        scales: storedState.scales,
        markups: storedState.markups,
        layerVisibility: storedState.layerVisibility,
        activeLayer: storedState.activeLayer,
        measurementSettings: storedState.measurementSettings,
        removedSourceAnnotationRefs: storedState.removedSourceAnnotationRefs,
      },
    } satisfies LocalProjectSnapshot;
  } finally {
    database.close();
  }
}

export async function deleteLocalProject(id: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([SUMMARY_STORE, DOCUMENT_STORE, STATE_STORE], "readwrite");
    transaction.objectStore(SUMMARY_STORE).delete(id);
    transaction.objectStore(DOCUMENT_STORE).delete(id);
    transaction.objectStore(STATE_STORE).delete(id);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}
