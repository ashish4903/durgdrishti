import { useEffect, useState } from 'react';
import FortFinder from './components/FortFinder.jsx';
import FortDashboard from './components/FortDashboard.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import SiteHeader from './components/SiteHeader.jsx';
import TabBar from './components/TabBar.jsx';
import VisitorProfileForm from './components/VisitorProfileForm.jsx';
import { forts } from './data/forts.js';
import { useHashRoute } from './hooks/useHashRoute.js';
import { useLanguage } from './hooks/useLanguage.js';
import { useVisitorProfile } from './hooks/useVisitorProfile.js';
import {
  defaultSelection,
  findCataloguePlace,
  findMappedLocation,
  resolveInsightLocation,
  routeExists,
  selectionForRoute,
} from './lib/fortSelection.js';
import { formatRoute, fortRoute, placeRoute, tabForRoute } from './lib/route.js';
import AtlasPage from './pages/AtlasPage.jsx';
import FortPage from './pages/FortPage.jsx';
import HomeHero from './pages/HomeHero.jsx';
import HomePage from './pages/HomePage.jsx';

const siteTitle = 'DurgDrishti — Fort & Trail Intelligence';

function App() {
  const { language, requestedLanguage, copy, changeLanguage } = useLanguage();
  const visitor = useVisitorProfile();
  const [route, navigate] = useHashRoute(routeExists);
  const address = formatRoute(route);

  // The fort being looked at. A fort address sets it; it is kept while browsing other pages so
  // the atlas still highlights it, and "compare alternative" can change it on the fort page.
  const [selection, setSelection] = useState(() => ({ ...defaultSelection, ...selectionForRoute(route) }));
  const [selectionAddress, setSelectionAddress] = useState(address);
  if (selectionAddress !== address) {
    // Adjusting state while rendering (instead of in an effect) avoids one frame showing the
    // previous fort: https://react.dev/learn/you-might-not-need-an-effect
    setSelectionAddress(address);
    const change = selectionForRoute(route);
    if (change) setSelection((current) => ({ ...current, ...change }));
  }

  // Departure window, weekend surge and the litter pledge stay the same from fort to fort.
  const [slot, setSlot] = useState('alpine');
  const [surge, setSurge] = useState(false);
  const [pledged, setPledged] = useState(false);
  const planner = { slot, setSlot, surge, setSurge, pledged, setPledged };

  const isFortPage = route.page === 'fort' || route.page === 'place';
  const insightLocation = isFortPage ? resolveInsightLocation(selection) : null;
  const selectedMappedLocation = findMappedLocation(selection.mappedLocationId);
  const selectedFortId = (selectedMappedLocation
    ? forts.find((item) => item.id === selectedMappedLocation.forecastId)?.id
    : forts.find((item) => item.id === selection.fortId)?.id) ?? selection.fortId;

  // The fort's name in the browser tab and in history and bookmarks.
  const fortName = insightLocation?.name;
  useEffect(() => {
    document.title = fortName ? `${fortName} · DurgDrishti` : siteTitle;
  }, [fortName]);

  const openFort = (place) => navigate(fortRoute(place.id));
  const openMappedLocation = (id) => {
    if (findMappedLocation(id)) {
      navigate(placeRoute(id));
      return;
    }
    // The atlas map also offers insights for catalogue forts that have no separate map record;
    // their id is the catalogue id with "atlas:" in front, so open the catalogue page instead.
    const place = findCataloguePlace(id.replace(/^atlas:/, ''));
    navigate(place ? fortRoute(place.id) : { page: 'insights' });
  };
  const compareAlternative = (fortId) => setSelection((current) => ({ ...current, fortId, mappedLocationId: null }));

  return (
    <div className="app-shell">
      <SiteHeader copy={copy} requestedLanguage={requestedLanguage} onChangeLanguage={changeLanguage} />

      <main id="top">
        {route.page === 'home' && <HomeHero copy={copy} />}
        <TabBar copy={copy} activeTab={tabForRoute(route)} />

        {route.page === 'home' && (
          <HomePage
            copy={copy}
            visitorProfile={visitor.profile}
            profileStorageWarning={visitor.storageWarning}
            onEditProfile={visitor.openSetup}
            onOpenFort={openFort}
            onNavigate={navigate}
          />
        )}
        {(route.page === 'explore' || route.page === 'insights') && (
          <AtlasPage
            copy={copy}
            page={route.page}
            visitorProfile={visitor.profile}
            selection={{ selectedFortId, mappedLocationId: selection.mappedLocationId }}
            onPlanLocation={openMappedLocation}
            onGetInsights={openFort}
          />
        )}
        {isFortPage && insightLocation && (
          <FortPage
            copy={copy}
            language={language}
            location={insightLocation}
            selection={selection}
            planner={planner}
            onCompareAlternative={compareAlternative}
          />
        )}
        {route.page === 'dashboard' && <FortDashboard copy={copy} language={language} onGetInsights={openFort} />}
        {route.page === 'photo' && <FortFinder copy={copy} />}
      </main>

      {visitor.setupOpen && (
        <VisitorProfileForm
          copy={copy}
          profile={visitor.profile}
          onSave={visitor.save}
          onDismiss={visitor.dismiss}
          onClear={visitor.profile ? visitor.clear : null}
          storageWarning={visitor.storageWarning}
        />
      )}

      <SiteFooter copy={copy} />
    </div>
  );
}

export default App;
