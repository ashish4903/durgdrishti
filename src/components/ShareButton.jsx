import Icon from './Icon.jsx';

/**
 * Shares the current page. Phones get the system share sheet (Web Share API); elsewhere the
 * address is copied to the clipboard and a toast confirms it.
 */
export default function ShareButton({ copy, title, onNotify }) {
  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === 'function' && window.matchMedia?.('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      onNotify(copy.linkCopied);
    } catch {
      onNotify(copy.shareFailed);
    }
  };

  return (
    <button type="button" className="button-quiet share-button" onClick={share}>
      <Icon name="share" size={18} />{copy.share}
    </button>
  );
}
