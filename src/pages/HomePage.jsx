import Icon from '../components/Icon.jsx';
import RecommendedForts from '../components/RecommendedForts.jsx';
import { formatMessage } from '../lib/format.js';

const actions = [
  { page: 'explore', className: 'home-action-explore', icon: 'map', title: 'homeExploreTitle', body: 'homeExploreBody' },
  { page: 'insights', className: 'home-action-insights', icon: 'compass', title: 'homeInsightsTitle', body: 'homeInsightsBody' },
  { page: 'photo', className: 'home-action-photo', icon: 'shield', title: 'homePhotoTitle', body: 'homePhotoBody' },
];

/** The home page below the tabs: where to start, the visitor profile and suggested forts. */
export default function HomePage({ copy, visitorProfile, profileStorageWarning, onEditProfile, onOpenFort, onNavigate, savedForts }) {
  return (
    <section className="home-hub">
      <div className="home-section-heading">
        <span className="section-kicker">{copy.homeStartKicker}</span>
        <h2>{copy.homeStartTitle}</h2>
      </div>
      <div className="home-action-grid">
        {actions.map((action) => (
          <button type="button" key={action.page} className={`home-action ${action.className}`} onClick={() => onNavigate({ page: action.page })}>
            <span className="home-action-icon"><Icon name={action.icon} size={23} /></span>
            <span className="home-action-copy"><strong>{copy[action.title]}</strong><small>{copy[action.body]}</small></span>
            <Icon name="arrow" size={18} />
          </button>
        ))}
      </div>
      <div className="home-profile-actions">
        <span>{visitorProfile?.name ? formatMessage(copy.profileGreeting, { name: visitorProfile.name }) : copy.profileSetupIntro}</span>
        <button type="button" className="profile-edit-button" onClick={onEditProfile}>{visitorProfile ? copy.profileEdit : copy.profileSetupButton}</button>
      </div>
      {profileStorageWarning && <p className="profile-storage-warning" role="status">{copy.profileStorageWarning}</p>}
      {savedForts.list.length > 0 && (
        <section className="saved-forts" aria-labelledby="saved-forts-title">
          <h2 id="saved-forts-title">{copy.savedFortsTitle}</h2>
          <p>{copy.savedFortsIntro}</p>
          <ul className="saved-list">
            {savedForts.list.map((entry) => (
              <li key={entry.address}>
                <a className="saved-chip" href={entry.address}><Icon name="bookmark" size={16} />{entry.name}</a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <RecommendedForts copy={copy} profile={visitorProfile} onOpenFort={onOpenFort} savedForts={savedForts} />
      <details className="home-about">
        <summary>{copy.homeAboutTitle}</summary>
        <p>{copy.homeAboutBody}</p>
      </details>
    </section>
  );
}
