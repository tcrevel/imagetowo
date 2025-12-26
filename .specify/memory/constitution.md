<!--
Sync Impact Report
==================
Version change: N/A → 1.0.0 (Initial adoption)
Added sections:
  - Vision
  - Principle 1: Security-First API Design
  - Principle 2: Honest AI with Transparency
  - Principle 3: Valid Export Guarantee
  - Principle 4: Mobile-First UX
  - Principle 5: Privacy by Default
  - Definition of Done (MVP)
  - Governance
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated (Constitution Check section)
  - .specify/templates/spec-template.md ✅ updated (Compliance checklist added)
  - .specify/templates/tasks-template.md ✅ updated (Constitution tasks in Phase 1-2)
Follow-up TODOs: None
-->

# ImageToFit Constitution

## Vision

Construire une web app qui transforme une image (upload ou photo) représentant un workout vélo en un fichier `.zwo` importable dans Zwift, Intervals.icu et TrainingPeaks (via import manuel).

L'application permet aux cyclistes de numériser facilement leurs entraînements papier ou captures d'écran en fichiers d'entraînement structurés exploitables par les principales plateformes d'entraînement indoor.

## Core Principles

### I. Security-First API Design

**Statement:** La clé OpenAI est configurée UNIQUEMENT via variable d'environnement `OPENAI_API_KEY`. Elle ne DOIT JAMAIS être exposée côté client ni préfixée `NEXT_PUBLIC_*`.

**Rationale:** Les clés API exposées côté client sont immédiatement compromises. Une fuite entraînerait des coûts imprévus et un abus du service.

**Compliance:**
- Tout appel OpenAI DOIT passer par une API route server-side (`/api/*`)
- Les variables d'environnement sensibles DOIVENT être listées dans `.env.example` sans valeur
- Le build DOIT échouer si une clé sensible est détectée dans le bundle client

### II. Honest AI with Transparency

**Statement:** L'IA ne "devine" pas. Si une information est illisible ou ambiguë, le système DOIT retourner un `warning` explicite, appliquer un fallback sûr (ex: `FreeRide`) et réduire le score `confidence`.

**Rationale:** Un entraînement incorrect peut blesser l'utilisateur ou ruiner une séance. La transparence permet à l'utilisateur de corriger les erreurs avant export.

**Compliance:**
- Le JSON de parsing DOIT inclure `warnings: string[]` et `confidence: number` (0-1)
- Chaque segment ambigu DOIT générer un warning descriptif
- Le fallback par défaut pour un segment illisible est `FreeRide` de durée estimée
- L'UI DOIT afficher les warnings de manière visible avant export

### III. Valid Export Guarantee

**Statement:** L'export `.zwo` DOIT TOUJOURS produire un XML valide conforme au schéma Zwift.

**Rationale:** Un fichier corrompu empêche l'import et frustre l'utilisateur. La validité XML est non-négociable.

**Compliance:**
- L'export DOIT être couvert par des tests unitaires avec validation XML
- Le schéma ZWO DOIT être documenté et les éléments supportés listés
- Aucun caractère non-échappé ne DOIT apparaître dans les attributs XML

### IV. Mobile-First UX

**Statement:** L'interface DOIT être conçue mobile-first avec un flux en 3 étapes : Upload → Analyse/Corrige → Export.

**Rationale:** La majorité des utilisateurs prendront une photo depuis leur téléphone. Le flux doit être fluide sur petit écran.

**Compliance:**
- Le design DOIT être responsive avec breakpoint mobile prioritaire
- Chaque étape DOIT tenir sur un écran sans scroll excessif
- L'édition (durées, %FTP, répétitions, nom) DOIT être accessible et intuitive
- Le niveau de confiance et les warnings DOIVENT être affichés clairement

### V. Privacy by Default

**Statement:** Les images uploadées DOIVENT être supprimées après parsing. Aucun stockage persistant sauf besoin explicite et consentement.

**Rationale:** Les données d'entraînement sont personnelles. Minimiser la rétention réduit les risques RGPD et renforce la confiance.

**Compliance:**
- L'image DOIT être traitée en mémoire et non persistée sur disque/cloud
- Un rate limit DOIT protéger l'endpoint de parsing contre les abus
- La taille maximale d'image DOIT être limitée (ex: 10MB)
- La politique de confidentialité DOIT documenter ce comportement

## Definition of Done (MVP)

Le MVP est considéré complet lorsque les critères suivants sont satisfaits :

| Critère | Description |
|---------|-------------|
| Landing Page | Page `/` présentant le produit avec CTA vers `/app` |
| App Page | Page `/app` avec le flux Upload → Analyse → Export |
| API Parse | `POST /api/parse` accepte une image, retourne JSON canonique |
| API Export | `POST /api/export` accepte JSON canonique, retourne fichier `.zwo` |
| JSON Schema | Schéma Zod validant la structure canonique du workout |
| Tests Export | Tests unitaires validant la génération XML `.zwo` |
| Warnings UI | Affichage des warnings et confidence dans l'interface |
| Mobile Ready | Interface fonctionnelle sur viewport 375px |

## Technical Stack (Guidance)

Cette section est informative et peut évoluer sans changement de version majeure.

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript strict
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **AI:** OpenAI GPT-4 Vision API
- **Deployment:** Vercel (recommandé)

## Governance

### Amendment Procedure

1. Toute modification de principe DOIT être proposée via Pull Request
2. Le changement DOIT inclure une justification claire
3. La version DOIT être incrémentée selon les règles ci-dessous
4. Les templates dépendants DOIVENT être mis à jour dans la même PR

### Versioning Policy

- **MAJOR:** Suppression ou redéfinition incompatible d'un principe existant
- **MINOR:** Ajout d'un nouveau principe ou expansion significative
- **PATCH:** Clarifications, corrections de formulation, ajustements mineurs

### Compliance Review

- Chaque PR touchant au code DOIT être vérifiée contre les principes applicables
- Les violations de principe DOIVENT bloquer le merge
- Un audit trimestriel DEVRAIT vérifier l'alignement code/constitution

**Version**: 1.0.0 | **Ratified**: 2025-12-26 | **Last Amended**: 2025-12-26
