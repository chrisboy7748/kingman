# Outils Claude Code installés dans ce projet

Tout ce qui est listé ici est gratuit et versionné dans le dépôt : il suffit d'ouvrir
Claude Code dans ce dossier (ou une session claude.ai/code sur ce dépôt) pour en profiter.

## Skills (`.claude/skills/`)

| Groupe | Skills | Source |
|---|---|---|
| GSAP (officiel GreenSock) | gsap-core, gsap-timeline, gsap-scrolltrigger, gsap-plugins, gsap-utils, gsap-react, gsap-frameworks, gsap-performance | `greensock/gsap-skills` (MIT) |
| Remotion (vidéo en React) | remotion-best-practices, remotion-create, remotion-render, remotion-studio, remotion-captions, remotion-multimedia, remotion-markup, remotion-maps, remotion-interactivity, remotion-docs, remotion-upgrade, remotion-saas | `remotion-dev/skills` |
| Anthropic | frontend-design, algorithmic-art, canvas-design, theme-factory, web-artifacts-builder, webapp-testing, slack-gif-creator | `anthropics/skills` (Apache 2.0) |

Remotion est gratuit pour les indépendants et les structures de 3 personnes maximum.

Mettre à jour les skills : `npx skills update -p`
Lister les skills : `npx skills list`

## Connecteurs MCP (`.mcp.json`)

| Connecteur | Rôle | À faire de votre côté |
|---|---|---|
| playwright | Navigateur piloté : tester le site, captures d'écran | Rien (Node.js requis) |
| chrome-devtools | Performances, console, réseau, audit Lighthouse | Avoir Google Chrome installé |
| context7 | Documentation à jour (GSAP, Three.js, Tailwind…) | Rien. Ajouter « use context7 » dans vos demandes |
| figma | Maquettes Figma → code | Taper `/mcp`, choisir figma, se connecter. Plan gratuit : 6 appels/mois |

Vérifier l'état des connecteurs : `/mcp` dans Claude Code.

## À installer vous-même (sur votre ordinateur)

**Blender MCP** (nécessite Blender + `uv`) :

1. Télécharger `addon.py` depuis https://github.com/ahujasid/blender-mcp
2. Blender → Edit → Preferences → Add-ons → Install → choisir `addon.py` → l'activer
3. Dans un terminal : `claude mcp add blender --scope user -- uvx blender-mcp`
4. Dans Blender : touche N → onglet BlenderMCP → Connect
