import Icon from '../components/Icon.jsx';
import { fortCatalogue } from '../data/fortCatalogue.js';

/** The home page banner, shown above the main tabs. */
export default function HomeHero({ copy }) {
  return (
    <section className="hero home-hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" />{copy.eyebrow}</div>
        <h1>{copy.homeTitle}</h1>
        <p>{copy.homeIntro}</p>
        <div className="hero-stamp"><Icon name="compass" size={16} /><span>{copy.regionStamp}</span><span className="stamp-divider" /><span>{fortCatalogue.length} {copy.indexedForts}</span></div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="contour contour-one" /><div className="contour contour-two" /><div className="contour contour-three" />
        <div className="hero-sun" /><div className="hero-ridge ridge-back" /><div className="hero-ridge ridge-front" />
        <span className="hero-coordinate">SAHYADRI · MH</span>
      </div>
    </section>
  );
}
