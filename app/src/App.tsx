import { useEffect, useState } from 'react';
import type { TemplateManifest } from './engine/types';
import { useT } from './i18n';
import { navigate, useRoute } from './router';
import { track } from './services/analytics';
import { loadCatalog } from './services/catalog';
import { getProject, type Project } from './services/projects';
import { useAppState } from './services/store';
import { BrandKit } from './screens/BrandKit';
import { Editor } from './screens/Editor';
import { Home } from './screens/Home';
import { Onboarding } from './screens/Onboarding';
import { Projects } from './screens/Projects';
import { Settings } from './screens/Settings';
import { TemplateDetail } from './screens/TemplateDetail';
import { Icon, PaywallHost, type IconName } from './ui/common';

export function App() {
  const { t, lang } = useT();
  const onboarded = useAppState((s) => s.onboarded);
  const [templates, setTemplates] = useState<TemplateManifest[] | null>(null);
  const route = useRoute();

  useEffect(() => {
    loadCatalog().then(setTemplates);
    if (!localStorage.getItem('lamsa.firstOpen')) {
      localStorage.setItem('lamsa.firstOpen', String(Date.now()));
      track('first_open');
    }
    track('app_open');
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  if (!templates) return <div className="splash"><span className="brandmark-logo big"><Icon name="play" size={34} /></span></div>;

  if (!onboarded) return <Onboarding templates={templates} />;

  const [head, arg] = route;
  let screen: React.ReactNode;
  let tab: string | null = null;
  if (head === 't' && arg) {
    const m = templates.find((x) => x.id === arg);
    screen = m ? <TemplateDetail key={m.id} m={m} /> : <NotFound />;
  } else if (head === 'edit' && arg) {
    screen = <EditorRoute key={arg} id={arg} templates={templates} />;
  } else if (head === 'projects') {
    screen = <Projects templates={templates} />;
    tab = 'projects';
  } else if (head === 'brand') {
    screen = <BrandKit />;
    tab = 'brand';
  } else if (head === 'settings') {
    screen = <Settings />;
    tab = 'settings';
  } else {
    screen = <Home templates={templates} />;
    tab = 'home';
  }

  const tabs: { id: string; path: string; icon: IconName; label: string }[] = [
    { id: 'home', path: '/', icon: 'home', label: t('nav.home') },
    { id: 'projects', path: '/projects', icon: 'folder', label: t('nav.projects') },
    { id: 'brand', path: '/brand', icon: 'brand', label: t('nav.brand') },
    { id: 'settings', path: '/settings', icon: 'gear', label: t('nav.settings') },
  ];

  return (
    <div className={`app ${tab ? 'with-tabs' : ''}`}>
      {screen}
      {tab && (
        <nav className="tabbar">
          {tabs.map((x) => (
            <button key={x.id} className={tab === x.id ? 'on' : ''} onClick={() => navigate(x.path, true)} aria-current={tab === x.id}>
              <Icon name={x.icon} size={22} />
              <span>{x.label}</span>
            </button>
          ))}
        </nav>
      )}
      <PaywallHost />
    </div>
  );
}

function EditorRoute({ id, templates }: { id: string; templates: TemplateManifest[] }) {
  const [p, setP] = useState<Project | null | undefined>(undefined);
  useEffect(() => {
    getProject(id).then((x) => setP(x ?? null));
  }, [id]);
  if (p === undefined) return <div className="splash" />;
  const m = p && templates.find((x) => x.id === p.templateId);
  if (!p || !m) return <NotFound />;
  return <Editor m={m} initial={p} />;
}

function NotFound() {
  const { t } = useT();
  return (
    <div className="empty-state">
      <p>404</p>
      <button className="btn primary" onClick={() => navigate('/', true)}>{t('nav.home')}</button>
    </div>
  );
}
