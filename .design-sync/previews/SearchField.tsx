import { useState } from "react";
import { SearchField } from "focus-client";

/**
 * One line of search over a list that is already loaded.
 *
 * Filtering happens as you type, so the number of results changes without focus
 * moving — the count goes through a polite live region rather than being left
 * for the reader to discover by scrolling. Clearing is a real labelled button,
 * not an overloaded Escape.
 */

export const Empty = () => {
  const [value, setValue] = useState("");
  return <SearchField label="חיפוש פרויקט" value={value} onChange={setValue} />;
};

/** With a term typed, the clear button appears and the count is announced. */
export const WithTerm = () => {
  const [value, setValue] = useState("סורקול");
  return <SearchField label="חיפוש פרויקט" value={value} onChange={setValue} resultCount={3} />;
};

/** A Latin term inside a Hebrew interface keeps its own direction. */
export const LatinTerm = () => {
  const [value, setValue] = useState("Painter Platform");
  return <SearchField label="חיפוש פרויקט" value={value} onChange={setValue} resultCount={1} />;
};

/** No matches is a real answer, and the field says so rather than looking broken. */
export const NoMatches = () => {
  const [value, setValue] = useState("xyzzy");
  return <SearchField label="חיפוש פרויקט" value={value} onChange={setValue} resultCount={0} />;
};
