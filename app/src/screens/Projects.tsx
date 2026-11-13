import { useEffect, useState } from 'react';
import type { TemplateManifest } from '../engine/types';
import { useT } from '../i18n';
import { navigate } from '../router';
import { deleteProject, duplicateProject, listProjects, type Project } from '../services/projects';
import { Icon } from '../ui/common';

/** Mes projets: reopen, duplicate (e.g. for another property), delete. */
export function Projects({ templates }: { templates: TemplateManifest[] }) {
  const { t, lang } = useT();
  const [items, setItems] = useState<Project[] | null>(null);
  const refresh = () => listProjects().then(setItems);
  useEffect(() => {
    refresh();
  }, []);

  const date = (ms: number) => new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(ms);

  return (
    <div className="screen projects">
      <header className="topbar"><h1>{t('nav.projects')}</h1></header>
      {items && items.length === 0 && (
        <div className="empty-state">
          <Icon name="folder" size={48} />
          <p>{t('p.empty')}</p>
          <button className="btn primary" onClick={() => navigate('/')}>{t('nav.home')}</button>
        </div>
      )}
      <div className="project-list">
        {items?.map((p) => {
          const m = templates.find((x) => x.id === p.templateId);
          return (
            <div className="project" key={p.id}>
              <button className="project-thumb" onClick={() => navigate(`/edit/${p.id}`)} style={{ aspectRatio: m ? String(m.width / m.height) : '9/16' }}>
                {p.thumb ? <img src={p.thumb} alt="" /> : <Icon name="play" size={28} />}
              </button>
              <div className="project-info">
                <strong>{p.title}</strong>
                <span className="dim small">{t('p.edited')} {date(p.updatedAt)}</span>
                <div className="row-btns">
                  <button className="btn small primary" onClick={() => navigate(`/edit/${p.id}`)}>{t('p.open')}</button>
                  <button className="btn small" onClick={async () => { const c = await duplicateProject(p); await refresh(); navigate(`/edit/${c.id}`); }}><Icon name="copy" size={16} /> {t('p.duplicate')}</button>
                  <button className="icon-btn ghost" aria-label={t('p.delete')} onClick={async () => { if (confirm(t('p.confirmDelete'))) { await deleteProject(p.id); refresh(); } }}><Icon name="trash" size={18} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
