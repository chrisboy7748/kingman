/** "Mes projets" — every creation is saved on the device and can be reopened or duplicated. */
import { defaultContent } from '../engine/apply';
import type { Crop, FontFamily, Lang, TemplateContent, TemplateManifest } from '../engine/types';
import { blobUrl, db, uid } from './db';
import { sampleUrl } from './catalog';
import { getState } from './store';

export type MusicChoice = { kind: 'library'; id: string } | { kind: 'custom'; blobId: string; name: string } | { kind: 'none' };

export interface Project {
  id: string;
  templateId: string;
  templateVersion: number;
  title: string;
  lang: Lang;
  createdAt: number;
  updatedAt: number;
  texts: Record<string, { value: string; family?: FontFamily; color?: string }>;
  photos: Record<string, { blobId: string; crop: Crop } | undefined>;
  colors: Record<string, string>;
  music: MusicChoice;
  thumb?: string;
  exports?: number;
}

export function newProject(m: TemplateManifest, lang: Lang): Project {
  const c = defaultContent(m, lang);
  const now = Date.now();
  return {
    id: uid(),
    templateId: m.id,
    templateVersion: m.version,
    title: m.name[lang],
    lang,
    createdAt: now,
    updatedAt: now,
    texts: c.texts,
    photos: {},
    colors: c.colors,
    music: m.music ? { kind: 'library', id: m.music } : { kind: 'none' },
  };
}

export const saveProject = (p: Project) => db.put('projects', p.id, { ...p, updatedAt: Date.now() });
export const getProject = (id: string) => db.get<Project>('projects', id);

export async function listProjects(): Promise<Project[]> {
  const all = await db.all<Project>('projects');
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function duplicateProject(p: Project): Promise<Project> {
  const copy: Project = { ...structuredClone(p), id: uid(), title: `${p.title} (2)`, createdAt: Date.now(), updatedAt: Date.now(), exports: 0 };
  await saveProject(copy);
  return copy;
}

export async function deleteProject(id: string) {
  const all = await db.all<Project>('projects');
  const target = all.find((p) => p.id === id);
  await db.del('projects', id);
  if (!target) return;
  // garbage-collect blobs no other project uses
  const used = new Set<string>();
  for (const p of all) {
    if (p.id === id) continue;
    for (const ph of Object.values(p.photos)) if (ph) used.add(ph.blobId);
    if (p.music.kind === 'custom') used.add(p.music.blobId);
  }
  const brandLogo = getState().brand.logoBlobId;
  if (brandLogo) used.add(brandLogo);
  for (const ph of Object.values(target.photos)) if (ph && !used.has(ph.blobId)) await db.del('blobs', ph.blobId);
  if (target.music.kind === 'custom' && !used.has(target.music.blobId)) await db.del('blobs', target.music.blobId);
}

/** Project → engine content (blob URLs for photos and logo). */
export async function projectContent(p: Project, m: TemplateManifest): Promise<TemplateContent> {
  const photos: TemplateContent['photos'] = {};
  for (const slot of m.photos) {
    const ph = p.photos[slot.key];
    if (ph) {
      const url = await blobUrl(ph.blobId);
      if (url) photos[slot.key] = { src: url, crop: ph.crop };
    } else if (slot.sample) {
      photos[slot.key] = { src: sampleUrl(slot.sample), crop: { x: 0, y: 0, zoom: 1 } };
    }
  }
  const logoId = getState().brand.logoBlobId;
  const logo = logoId ? await blobUrl(logoId) : undefined;
  return { lang: p.lang, texts: p.texts, photos, colors: p.colors, logo };
}
