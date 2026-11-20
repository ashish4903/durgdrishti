import Icon from './Icon.jsx';
import { formatRoute } from '../lib/route.js';

const tabs = [
  { page: 'home', icon: 'mountain', label: 'navHome' },
  { page: 'explore', icon: 'map', label: 'navExplorer' },
  { page: 'insights', icon: 'compass', label: 'navInsights' },
  { page: 'dashboard', icon: 'road', label: 'navDashboard' },
  { page: 'photo', icon: 'shield', label: 'navClassifier' },
];

/** The main tabs are links, so each can be opened in a new tab, bookmarked or shared. */
export default function TabBar({ copy, activeTab }) {
  return (
    <nav className="tab-bar" aria-label="Main navigation">
      {tabs.map((tab) => (
        <a
          key={tab.page}
          href={formatRoute({ page: tab.page })}
          className={activeTab === tab.page ? 'tab active' : 'tab'}
          aria-current={activeTab === tab.page ? 'page' : undefined}
        >
          <Icon name={tab.icon} size={20} /><span className="tab-label">{copy[tab.label]}</span>
        </a>
      ))}
    </nav>
  );
}
