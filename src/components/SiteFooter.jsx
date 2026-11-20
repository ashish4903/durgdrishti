import Icon from './Icon.jsx';

export default function SiteFooter({ copy }) {
  return (
    <footer className="footer">
      <a className="footer-brand" href="#/"><span className="brand-mark"><Icon name="mountain" size={17} /></span>{copy.brand}</a>
      <span>{copy.footer}</span>
      <span className="footer-credit">{copy.footerCredit}</span>
    </footer>
  );
}
