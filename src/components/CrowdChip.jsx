const labels = { low: 'crowdLow', medium: 'crowdMedium', high: 'crowdHigh' };

/** A crowd level shown with text, colour and shape together, never colour alone. */
export default function CrowdChip({ copy, level }) {
  return <span className={`crowd-chip crowd-${level}`}>{copy[labels[level]]}</span>;
}
