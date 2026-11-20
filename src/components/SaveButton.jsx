import Icon from './Icon.jsx';

/** Adds a fort to the visitor's trek list on this device, or removes it. */
export default function SaveButton({ copy, saved, onToggle, compact = false }) {
  return (
    <button
      type="button"
      className={compact ? 'icon-button save-button' : 'button-quiet save-button'}
      aria-pressed={saved}
      aria-label={compact ? (saved ? copy.savedFort : copy.saveFort) : undefined}
      onClick={onToggle}
    >
      <Icon name="bookmark" size={18} />
      {!compact && (saved ? copy.savedFort : copy.saveFort)}
    </button>
  );
}
