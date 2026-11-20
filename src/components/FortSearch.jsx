import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { fortCatalogue } from '../data/fortCatalogue.js';
import { formatMessage } from '../lib/format.js';
import { formatRoute, fortRoute } from '../lib/route.js';
import { searchPlaces, splitOnMatch } from '../lib/search.js';

function Highlighted({ text, query }) {
  const [before, match, after] = splitOnMatch(text, query);
  return <>{before}{match && <mark>{match}</mark>}{after}</>;
}

/**
 * Search every fort from any page (header button, "/" or Ctrl/⌘+K). A combobox: the input
 * keeps focus while ↑ ↓ move through the results, Enter opens one and Esc closes.
 */
export default function FortSearch({ copy, onClose, onOpenFort }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const dialog = useRef(null);
  const input = useRef(null);
  const results = useMemo(() => searchPlaces(fortCatalogue, query), [query]);

  useEffect(() => {
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    input.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  const open = (place) => {
    onOpenFort(place);
    onClose();
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      open(results[active]);
    } else if (event.key === 'Tab') {
      // Keep focus inside the dialog.
      const focusable = [...dialog.current.querySelectorAll('input, button, a[href]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const activeId = results[active] ? `search-result-${active}` : undefined;

  return (
    <div className="search-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialog} className="search-dialog" role="dialog" aria-modal="true" aria-label={copy.searchOpen} onKeyDown={onKeyDown}>
        <div className="search-dialog-head">
          <label className="sr-only" htmlFor="site-search">{copy.searchOpen}</label>
          <input
            ref={input}
            id="site-search"
            className="search-input"
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="site-search-results"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            autoComplete="off"
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActive(0); }}
          />
          <button type="button" className="icon-button" onClick={onClose} aria-label={copy.close}><Icon name="close" size={18} /></button>
        </div>
        <ul id="site-search-results" className="search-results" role="listbox" aria-label={copy.searchOpen}>
          {results.map((place, index) => (
            <li key={place.id} id={`search-result-${index}`} className="search-result" role="option" aria-selected={index === active}>
              <a
                href={formatRoute(fortRoute(place.id))}
                tabIndex={-1}
                onMouseEnter={() => setActive(index)}
                onClick={(event) => { event.preventDefault(); open(place); }}
              >
                <span><Highlighted text={place.name} query={query} /></span>
                {place.district && <small>{place.district}</small>}
              </a>
            </li>
          ))}
        </ul>
        {query.trim() && results.length === 0 && <p className="search-empty">{formatMessage(copy.searchNoResults, { query: query.trim() })}</p>}
        {!query.trim() && <p className="search-hint">{copy.searchHint}</p>}
        <p className="sr-only" aria-live="polite">{query.trim() ? formatMessage(copy.searchResultsCount, { count: results.length }) : ''}</p>
      </section>
    </div>
  );
}
