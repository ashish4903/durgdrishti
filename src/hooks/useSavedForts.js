import { useState } from 'react';
import { isSaved, readSavedForts, toggleSaved, writeSavedForts } from '../lib/savedForts.js';

/** The visitor's trek list (this browser only). */
export function useSavedForts() {
  const [list, setList] = useState(readSavedForts);

  /** Adds or removes a fort; returns true when it is now saved. */
  const toggle = (entry) => {
    const next = toggleSaved(list, entry);
    setList(next);
    writeSavedForts(next);
    return isSaved(next, entry.address);
  };

  return { list, isSaved: (address) => isSaved(list, address), toggle };
}
