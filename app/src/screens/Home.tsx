import { useMemo, useState } from 'react';
import type { Format, TemplateManifest } from '../engine/types';
import { useT } from '../i18n';
import { categoriesFor, newThisWeek, relevance } from '../services/catalog';
import { isPro, useAppState } from '../services/store';
import { Icon, ProBadge, requirePro } from '../ui/common';
import { TemplateCard } from '../ui/TemplateCard';
import { navigate } from '../router';

const FORMATS: (Format | 'all')[] = ['all', '9:16', '1:1', '4:5', '16:9'];

export function Home({ templates }: { templates: TemplateManifest[] }) {
  const { t, L, lang } = useT();
  const usage = useAppState((s) => s.usage);
  const pro = useAppState((s) => isPro(s));
  const [q, setQ] = useState('');
  const [format, setFormat] = useState<Format | 'all'>('all');

  const sorted = useMemo(() => [...templates].sort((a, b) => relevance(b, usage) - relevance(a, usage)), [templates, usage]);
  const fresh = useMemo(() => new Set(newThisWeek(templates).map((x) => x.id)), [templates]);
  const filtering = q.trim() !== '' || format !== 'all';

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sorted.filter((m) => {
      if (format !== 'all' && m.format !== format) return false;
      if (!needle) return true;
      const hay = [m.name.en, m.name.ar, m.category, ...m.tags].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [sorted, q, format]);

  const open = (m: TemplateManifest) => navigate(`/t/${m.id}`);
  const newOnes = sorted.filter((m) => fresh.has(m.id));
  const trending = [...templates].sort((a, b) => b.trending - a.trending).slice(0, 8);

  return (
    <div className="screen home">
      <header className="topbar">
        <div className="brandmark">
          <span className="brandmark-logo"><Icon name="play" size={16} /></span>
          <span>Lamsa</span>
        </div>
        {!pro && (
          <button className="btn pro-cta" onClick={() => requirePro('template')}>
            <ProBadge small /> {lang === 'ar' ? 'جرّب مجاناً' : 'Try free'}
          </button>
        )}
      </header>

      <div className="search">
        <Icon name="search" size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.search')} type="search" enterKeyHint="search" />
      </div>
      <div className="chips" role="tablist">
        {FORMATS.map((f) => (
          <button key={f} role="tab" aria-selected={format === f} className={`chip ${format === f ? 'on' : ''}`} onClick={() => setFormat(f)}>
            {f === 'all' ? t('home.all') : <><span className={`ratio r${f.replace(':', '-')}`} />{f}</>}
          </button>
        ))}
      </div>

      {filtering ? (
        <section>
          <h2 className="section-title">{t('home.results')} <span className="dim">{results.length}</span></h2>
          {results.length ? (
            <div className="grid">{results.map((m) => <TemplateCard key={m.id} m={m} isNew={fresh.has(m.id)} onOpen={() => open(m)} />)}</div>
          ) : (
            <p className="empty">{t('home.empty')}</p>
          )}
        </section>
      ) : (
        <>
          {newOnes.length > 0 && (
            <section>
              <h2 className="section-title"><Icon name="sparkle" size={18} /> {t('home.new')}</h2>
              <div className="row">{newOnes.map((m) => <TemplateCard key={m.id} m={m} size="lg" isNew onOpen={() => open(m)} />)}</div>
            </section>
          )}
          <section>
            <h2 className="section-title">{t('home.trending')}</h2>
            <div className="row">{trending.map((m) => <TemplateCard key={m.id} m={m} isNew={fresh.has(m.id)} onOpen={() => open(m)} />)}</div>
          </section>
          {categoriesFor(usage).map((c) => {
            const list = sorted.filter((m) => m.category === c.id);
            if (!list.length) return null;
            return (
              <section key={c.id}>
                <h2 className="section-title"><span aria-hidden>{c.emoji}</span> {L(c.name)} <span className="dim">{list.length}</span></h2>
                <div className="row">{list.map((m) => <TemplateCard key={m.id} m={m} isNew={fresh.has(m.id)} onOpen={() => open(m)} />)}</div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
