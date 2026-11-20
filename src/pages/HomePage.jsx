import Icon from '../components/Icon.jsx';
import RecommendedForts from '../components/RecommendedForts.jsx';
import { formatMessage } from '../lib/format.js';

const actions = [
  { page: 'explore', className: 'home-action-explore', icon: 'map', title: 'homeExploreTitle', body: 'homeExploreBody' },
  { page: 'insights', className: 'home-action-insights', icon: 'compass', title: 'homeInsightsTitle', body: 'homeInsightsBody' },
  { page: 'photo', className: 'home-action-photo', icon: 'shield', title: 'homePhotoTitle', body: 'homePhotoBody' },
];

/** The home page below the tabs: where to start, the visitor profile and suggested forts. */
export default function HomePage({ copy, visitorProfile, profileStorageWarning, onEditProfile, onOpenFort, onNavigate }) {
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
      <RecommendedForts copy={copy} profile={visitorProfile} onOpenFort={onOpenFort} />
      <details className="home-about">
        <summary>{copy.homeAboutTitle}</summary>
        <p>{copy.homeAboutBody}</p>
      </details>
    </section>
  );
}
