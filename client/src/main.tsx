import React from "react";
import ReactDOM from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import i18n, {
  applyDocumentLanguage,
  DEFAULT_LANGUAGE,
  isLanguage,
  readStoredLanguage,
} from "./i18n";
import App from "./App";

// Direction is applied before the first render so the layout never starts in
// the wrong direction and visibly flips.
applyDocumentLanguage(readStoredLanguage() ?? DEFAULT_LANGUAGE);

// Keeps the document in step if the language is changed from anywhere else.
i18n.on("languageChanged", (next) => {
  if (isLanguage(next)) applyDocumentLanguage(next);
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root is missing from index.html");
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
