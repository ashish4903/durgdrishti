import { useEffect, useState } from 'react';

const interestOptions = [
  ['history', 'interestHistory'],
  ['architecture', 'interestArchitecture'],
  ['openLandscape', 'interestOpenLandscape'],
  ['waterfalls', 'interestWaterfalls'],
  ['challenging', 'interestChallenging'],
  ['quieter', 'interestQuieter'],
  ['flowers', 'interestFlowers'],
  ['photography', 'interestPhotography'],
];

export default function VisitorProfileForm({ copy, profile, onSave, onDismiss, onClear, storageWarning }) {
  const [name, setName] = useState(profile?.name ?? '');
  const [ageRange, setAgeRange] = useState(profile?.ageRange ?? '');
  const [trekCount, setTrekCount] = useState(profile?.trekCount ?? '');
  const [visitedForts, setVisitedForts] = useState(profile?.visitedForts ?? '');
  const [interests, setInterests] = useState(profile?.interests ?? []);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);
  const toggleInterest = (interest) => {
    setInterests((current) => current.includes(interest)
      ? current.filter((value) => value !== interest)
      : [...current, interest]);
  };
  const submit = (event) => {
    event.preventDefault();
    onSave({
      name: name.trim(),
      ageRange,
      trekCount: trekCount === '' ? '' : Math.min(500, Math.max(0, Number(trekCount))),
      visitedForts: visitedForts.trim(),
      interests,
    });
  };

  return (
    <div className="profile-overlay" onMouseDown={(event) => event.target === event.currentTarget && onDismiss()}>
      <section className="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title">
        <div className="profile-dialog-heading">
          <div>
            <span className="section-kicker">{copy.profileSetupTitle}</span>
            <h2 id="profile-dialog-title">{copy.profileSetupTitle}</h2>
            <p>{copy.profileSetupIntro}</p>
          </div>
          <button type="button" className="profile-dialog-close" onClick={onDismiss} aria-label={copy.profileSkip}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="profile-fields">
            <label>
              <span>{copy.profileNameLabel}</span>
              <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.profileNamePlaceholder} maxLength={60} />
            </label>
            <label>
              <span>{copy.profileAgeLabel}</span>
              <select value={ageRange} onChange={(event) => setAgeRange(event.target.value)}>
                <option value="">{copy.profileAgePrompt}</option>
                <option value="under18">{copy.ageUnder18}</option>
                <option value="18to24">{copy.age18to24}</option>
                <option value="25to34">{copy.age25to34}</option>
                <option value="35to44">{copy.age35to44}</option>
                <option value="45to54">{copy.age45to54}</option>
                <option value="55plus">{copy.age55plus}</option>
              </select>
            </label>
            <label>
              <span>{copy.treksCompletedLabel}</span>
              <input type="number" min="0" max="500" step="1" value={trekCount} onChange={(event) => setTrekCount(event.target.value)} />
            </label>
            <label className="profile-field-wide">
              <span>{copy.visitedFortsLabel}</span>
              <input value={visitedForts} onChange={(event) => setVisitedForts(event.target.value)} placeholder={copy.visitedFortsPlaceholder} maxLength={240} />
            </label>
          </div>
          <fieldset className="profile-interest-options">
            <legend>{copy.profileInterestsLabel}</legend>
            {interestOptions.map(([value, labelKey]) => (
              <label key={value}>
                <input type="checkbox" checked={interests.includes(value)} onChange={() => toggleInterest(value)} />
                <span>{copy[labelKey]}</span>
              </label>
            ))}
          </fieldset>
          <p className="profile-privacy-note">{copy.profilePrivacyNote}</p>
          {storageWarning && <p className="profile-storage-warning" role="status">{copy.profileStorageWarning}</p>}
          <div className="profile-dialog-actions">
            {profile && onClear && <button type="button" className="profile-clear-button" onClick={onClear}>{copy.profileClear}</button>}
            <span />
            <button type="button" className="profile-skip-button" onClick={onDismiss}>{copy.profileSkip}</button>
            <button type="submit" className="profile-save-button">{copy.profileSave}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
