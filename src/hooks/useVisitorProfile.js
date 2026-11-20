import { useState } from 'react';
import {
  readVisitorProfile,
  removeVisitorProfile,
  shouldShowProfileSetup,
  storeProfileDismissed,
  storeVisitorProfile,
} from '../lib/visitorProfile.js';

/** The optional visitor profile (this browser only) and whether its setup dialog is open. */
export function useVisitorProfile() {
  const [profile, setProfile] = useState(readVisitorProfile);
  const [setupOpen, setSetupOpen] = useState(shouldShowProfileSetup);
  const [storageWarning, setStorageWarning] = useState(false);

  return {
    profile,
    setupOpen,
    storageWarning,
    openSetup: () => setSetupOpen(true),
    save: (next) => {
      setProfile(next);
      setSetupOpen(false);
      setStorageWarning(!storeVisitorProfile(next));
    },
    dismiss: () => {
      setSetupOpen(false);
      if (!storeProfileDismissed()) setStorageWarning(true);
    },
    clear: () => {
      setProfile(null);
      setSetupOpen(false);
      setStorageWarning(!removeVisitorProfile());
    },
  };
}
