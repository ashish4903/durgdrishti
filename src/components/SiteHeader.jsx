import Icon from './Icon.jsx';
import { languages } from '../data/languages.js';

export default function SiteHeader({ copy, requestedLanguage, onChangeLanguage }) {
  return (
    <header className="topbar">
      <a className="brand" href="#/" aria-label={`${copy.brand} home`}>
        <span className="brand-mark"><Icon name="mountain" size={22} /></span>
        <span>{copy.brand}</span>
      </a>
      <div className="topbar-right">
        <span className="topbar-status"><span className="status-dot" />{copy.liveModel}</span>
        <label className="language-select">
          <span className="sr-only">{copy.language}</span>
          <select value={requestedLanguage} onChange={(event) => onChangeLanguage(event.target.value)} aria-label={copy.language}>
            {languages.map((option) => (
              <option key={option.code} value={option.code} lang={option.htmlLang}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
