/**
 * Back-office — publier un template sans mise à jour de l'app.
 * 1. Importer l'export Bodymovin (JSON) d'After Effects
 * 2. L'outil repère les calques #txt_ / #img_ / #col_ et crée la fiche
 * 3. Compléter nom, catégorie, gratuit/Pro, textes EN/AR, photo d'exemple
 * 4. Vérifier l'aperçu (anglais et arabe) puis publier
 */
import { useEffect, useMemo, useState } from 'react';
import { buildManifest, prepareTemplate, type PreparedTemplate } from '../engine/prepare';
import type { CategoryId, Lang, LottieAnimation, TemplateManifest, Usage } from '../engine/types';
import { TRACKS } from '../media/music';
import { CATEGORIES, loadCatalog, registerTemplate, type LocalTemplate } from '../services/catalog';
import { db } from '../services/db';
import { Player, useResolved } from '../ui/Player';
import { previewContent } from '../ui/TemplateCard';

const USAGES: { id: Usage; fr: string }[] = [
  { id: 'real-estate', fr: 'Immobilier' },
  { id: 'retail', fr: 'Commerce' },
  { id: 'creator', fr: 'Créateur' },
  { id: 'personal', fr: 'Perso' },
];
const CAT_FR: Record<CategoryId, string> = {
  'real-estate': 'Immobilier', promos: 'Promos et soldes', food: 'Restauration', beauty: 'Beauté et mode', events: 'Fêtes et événements', quotes: 'Textes et citations',
};
const TARGETS: Record<CategoryId, [number, number]> = { 'real-estate': [15, 3], promos: [12, 3], food: [10, 2], beauty: [8, 2], events: [8, 2], quotes: [7, 2] };

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const readFile = (f: File, as: 'text' | 'dataURL') =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    as === 'text' ? r.readAsText(f) : r.readAsDataURL(f);
  });

interface Form {
  id: string;
  nameEn: string;
  nameAr: string;
  category: CategoryId;
  usages: Usage[];
  tags: string;
  pro: boolean;
  music: string;
  publishedAt: string;
  en: Record<string, string>;
  ar: Record<string, string>;
  samples: Record<string, string>;
  labels: Record<string, { en: string; ar: string }>;
}

export function AdminApp() {
  const [catalog, setCatalog] = useState<TemplateManifest[]>([]);
  const [prepared, setPrepared] = useState<PreparedTemplate | null>(null);
  const [fileName, setFileName] = useState('');
  const [form, setForm] = useState<Form | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const refresh = () => loadCatalog(true).then(setCatalog);
  useEffect(() => {
    refresh();
  }, []);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setError('');
    setStatus('');
    try {
      const json = JSON.parse(await readFile(f, 'text')) as LottieAnimation;
      if (!json.layers || !json.fr) throw new Error("Ce fichier n'est pas un export Bodymovin / Lottie.");
      const p = prepareTemplate(json);
      setPrepared(p);
      setFileName(f.name);
      const name = (json.nm || f.name.replace(/\.json$/, '')).trim();
      setForm({
        id: slug(name),
        nameEn: name,
        nameAr: '',
        category: 'real-estate',
        usages: ['real-estate'],
        tags: '',
        pro: true,
        music: TRACKS[0].id,
        publishedAt: new Date().toISOString().slice(0, 10),
        en: { ...p.aeTexts },
        ar: { ...p.aeTexts },
        samples: { ...p.embeddedSamples },
        labels: Object.fromEntries([...p.texts, ...p.photos, ...p.colors].map((s) => [s.key, s.label])),
      });
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  };

  const manifest = useMemo(() => {
    if (!prepared || !form) return null;
    const p: PreparedTemplate = {
      ...prepared,
      texts: prepared.texts.map((t) => ({ ...t, label: form.labels[t.key] || t.label })),
      photos: prepared.photos.map((t) => ({ ...t, label: form.labels[t.key] || t.label })),
      colors: prepared.colors.map((t) => ({ ...t, label: form.labels[t.key] || t.label })),
    };
    return buildManifest(p, {
      id: form.id || 'template',
      name: { en: form.nameEn, ar: form.nameAr || form.nameEn },
      category: form.category,
      usages: form.usages,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      pro: form.pro,
      music: form.music || null,
      publishedAt: form.publishedAt,
      defaults: { en: form.en, ar: form.ar },
      samples: form.samples,
    });
  }, [prepared, form]);

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const idTaken = !!form && catalog.some((t) => t.id === form.id);

  const publishDev = async () => {
    if (!manifest || !prepared) return;
    setStatus('Publication…');
    setError('');
    try {
      const samples = Object.fromEntries(Object.entries(form!.samples).filter(([, v]) => v.startsWith('data:')));
      const res = await fetch('/api/publish', { method: 'POST', body: JSON.stringify({ manifest, lottie: prepared.lottie, samples }) });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error);
      setStatus(`✓ « ${manifest.id} » est en ligne : il apparaît dans l'app au prochain chargement du catalogue.`);
      refresh();
    } catch (e: any) {
      setError(`Publication impossible (${e?.message || e}). Sur un hébergement statique, utilisez « Télécharger les fichiers ».`);
      setStatus('');
    }
  };

  const publishLocal = async () => {
    if (!manifest || !prepared) return;
    const local: LocalTemplate = { manifest, lottie: prepared.lottie };
    await db.put('localTemplates', manifest.id, local);
    setStatus(`✓ « ${manifest.id} » ajouté sur cet appareil (test). Ouvrez l'app dans ce navigateur pour le voir.`);
    refresh();
  };

  const download = () => {
    if (!manifest || !prepared) return;
    const dl = (name: string, data: string) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      a.download = name;
      a.click();
    };
    dl(`${manifest.id}.json`, JSON.stringify(prepared.lottie));
    dl(`${manifest.id}.manifest.json`, JSON.stringify(manifest, null, 1));
    setStatus('Fichiers téléchargés : déposez le JSON dans catalog/templates/ et ajoutez le manifeste à catalog.json.');
  };

  const removeLocal = async (id: string) => {
    await db.del('localTemplates', id);
    refresh();
  };
  const [localIds, setLocalIds] = useState<string[]>([]);
  useEffect(() => {
    db.keys('localTemplates').then((k) => setLocalIds(k.map(String))).catch(() => {});
  }, [catalog]);

  const stats = Object.entries(TARGETS).map(([cat, [target, free]]) => {
    const list = catalog.filter((t) => t.category === cat);
    return { cat: cat as CategoryId, n: list.length, free: list.filter((t) => !t.pro).length, target, targetFree: free };
  });

  return (
    <div className="admin">
      <header>
        <h1>Back-office · Templates</h1>
        <a href="./">← Ouvrir l'app</a>
      </header>

      <section className="panel">
        <h2>1. Importer un export After Effects</h2>
        <p className="hint">
          Exportez la composition avec <b>Bodymovin</b> ou <b>LottieFiles</b> (JSON, images « Include in json »).
          Nommez les calques modifiables : <code>#txt_titre</code> (calque texte, de préférence en boîte), <code>#img_photo1</code> (calque image),
          <code>#img_logo</code> (logo du kit de marque), <code>#col_principale</code> (calques de forme dont la couleur change).
        </p>
        <label className="drop">
          <input type="file" accept=".json,application/json" onChange={(e) => onFile(e.target.files?.[0])} />
          <span>{fileName || 'Choisir le fichier JSON…'}</span>
        </label>
        {error && <p className="err">{error}</p>}
      </section>

      {prepared && form && manifest && (
        <>
          <section className="panel">
            <h2>2. Fiche générée</h2>
            <div className="report">
              <div><b>{prepared.report.texts}</b> textes</div>
              <div><b>{prepared.report.photos}</b> photos</div>
              <div><b>{prepared.report.colors}</b> couleurs</div>
              <div><b>{prepared.report.duration.toFixed(1)} s</b> durée</div>
              <div><b>{prepared.report.format}</b> {manifest.width}×{manifest.height}</div>
              <div><b>{prepared.hasLogo ? 'oui' : 'non'}</b> logo</div>
            </div>
            {prepared.report.warnings.length > 0 ? (
              <ul className="warnings">{prepared.report.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}</ul>
            ) : (
              <p className="ok">✓ Aucun effet incompatible détecté.</p>
            )}
          </section>

          <div className="cols">
            <section className="panel">
              <h2>3. Informations</h2>
              <div className="grid2">
                <label>Identifiant<input value={form.id} onChange={(e) => set({ id: slug(e.target.value) })} /></label>
                <label>Date de publication<input type="date" value={form.publishedAt} onChange={(e) => set({ publishedAt: e.target.value })} /></label>
                <label>Nom (anglais)<input value={form.nameEn} onChange={(e) => set({ nameEn: e.target.value })} /></label>
                <label>Nom (arabe)<input dir="rtl" value={form.nameAr} onChange={(e) => set({ nameAr: e.target.value })} /></label>
                <label>Catégorie
                  <select value={form.category} onChange={(e) => set({ category: e.target.value as CategoryId })}>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{CAT_FR[c.id]}</option>)}
                  </select>
                </label>
                <label>Musique par défaut
                  <select value={form.music} onChange={(e) => set({ music: e.target.value })}>
                    <option value="">Aucune</option>
                    {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.name.en}{t.pro ? ' (Pro)' : ''}</option>)}
                  </select>
                </label>
                <label className="wide">Mots-clés (séparés par des virgules)<input value={form.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="villa, listing, luxe" /></label>
              </div>
              {idTaken && <p className="warn">Cet identifiant existe déjà : la publication remplacera le template existant.</p>}
              <div className="checks">
                {USAGES.map((u) => (
                  <label key={u.id}><input type="checkbox" checked={form.usages.includes(u.id)}
                    onChange={(e) => set({ usages: e.target.checked ? [...form.usages, u.id] : form.usages.filter((x) => x !== u.id) })} /> {u.fr}</label>
                ))}
                <label className="pro"><input type="checkbox" checked={form.pro} onChange={(e) => set({ pro: e.target.checked })} /> Template Pro (payant)</label>
              </div>

              <h3>Textes par défaut</h3>
              {prepared.texts.map((t) => (
                <div className="textrow" key={t.key}>
                  <div className="textkey"><code>#txt_{t.key}</code><span>max {t.maxChars} car. · {t.maxLines} ligne(s)</span></div>
                  <input placeholder="Libellé EN" value={form.labels[t.key]?.en || ''} onChange={(e) => set({ labels: { ...form.labels, [t.key]: { ...form.labels[t.key], en: e.target.value } } })} />
                  <input placeholder="Libellé AR" dir="rtl" value={form.labels[t.key]?.ar || ''} onChange={(e) => set({ labels: { ...form.labels, [t.key]: { ...form.labels[t.key], ar: e.target.value } } })} />
                  <input placeholder="Texte anglais" value={form.en[t.key] || ''} onChange={(e) => set({ en: { ...form.en, [t.key]: e.target.value } })} />
                  <input placeholder="Texte arabe" dir="rtl" value={form.ar[t.key] || ''} onChange={(e) => set({ ar: { ...form.ar, [t.key]: e.target.value } })} />
                </div>
              ))}

              {prepared.photos.length > 0 && <h3>Photos d'exemple (aperçu du catalogue)</h3>}
              {prepared.photos.map((p) => (
                <div className="textrow" key={p.key}>
                  <div className="textkey"><code>#img_{p.key}</code><span>{p.w}×{p.h}</span></div>
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) set({ samples: { ...form.samples, [p.key]: await readFile(f, 'dataURL') } });
                  }} />
                  {form.samples[p.key] && <img className="samplethumb" src={form.samples[p.key]} alt="" />}
                </div>
              ))}
            </section>

            <section className="panel preview">
              <h2>4. Aperçu</h2>
              <div className="seg">
                <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>Anglais</button>
                <button className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')}>Arabe</button>
              </div>
              <AdminPreview manifest={manifest} lottie={prepared.lottie} lang={lang} />
              <p className="hint">Testez avec des textes longs : le texte rétrécit automatiquement pour ne jamais déborder.</p>
              <div className="actions">
                <button className="primary" onClick={publishDev}>Publier dans le catalogue</button>
                <button onClick={publishLocal}>Tester sur cet appareil</button>
                <button onClick={download}>Télécharger les fichiers</button>
              </div>
              {status && <p className="ok">{status}</p>}
            </section>
          </div>
        </>
      )}

      <section className="panel">
        <h2>Catalogue en ligne · {catalog.length} templates · {catalog.filter((t) => !t.pro).length} gratuits ({catalog.length ? Math.round((catalog.filter((t) => !t.pro).length / catalog.length) * 100) : 0} %)</h2>
        <div className="targets">
          {stats.map((s) => (
            <div key={s.cat}>
              <b>{CAT_FR[s.cat]}</b>
              <div className="bar"><i style={{ width: `${Math.min(100, (s.n / s.target) * 100)}%` }} /></div>
              <span>{s.n} / {s.target} · {s.free} / {s.targetFree} gratuits</span>
            </div>
          ))}
        </div>
        <table>
          <thead><tr><th>Template</th><th>Catégorie</th><th>Format</th><th>Durée</th><th>Textes</th><th>Photos</th><th>Offre</th><th>Publié</th><th /></tr></thead>
          <tbody>
            {catalog.map((t) => (
              <tr key={t.id}>
                <td><b>{t.name.en}</b><br /><span dir="rtl">{t.name.ar}</span></td>
                <td>{CAT_FR[t.category]}</td>
                <td>{t.format}</td>
                <td>{t.duration} s</td>
                <td>{t.texts.length}</td>
                <td>{t.photos.length}</td>
                <td>{t.pro ? 'Pro' : 'Gratuit'}</td>
                <td>{t.publishedAt}</td>
                <td>{localIds.includes(t.id) && <button onClick={() => removeLocal(t.id)}>Retirer (local)</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">Les statistiques d'export par template viennent de l'outil d'analytics (Firebase / Mixpanel) une fois branché : faites des variantes de ceux qui marchent.</p>
      </section>
    </div>
  );
}

function AdminPreview({ manifest, lottie, lang }: { manifest: TemplateManifest; lottie: LottieAnimation; lang: Lang }) {
  // feed the prepared JSON to the shared template cache
  const content = useMemo(() => previewContent(manifest, lang), [manifest, lang]);
  const m = useMemo(() => ({ ...manifest, version: Date.now() }), [manifest]);
  registerTemplate(m, lottie);
  const { animation, error } = useResolved(m, content, 0.6, 250);
  return (
    <div className="admin-player" style={{ maxWidth: manifest.width >= manifest.height ? 520 : 300 }}>
      <Player animation={animation} aspect={manifest.width / manifest.height} dpr={1.5} />
      {error && <p className="err">{error}</p>}
    </div>
  );
}
