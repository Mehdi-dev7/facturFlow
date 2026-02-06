# Fonts FacturFlow

Ce dossier contient les fonts personnalisées utilisées dans l'application.

## Fonts incluses

### 1. **Cal Sans** (Titres et headings)
- **Fichier** : `CalSans-SemiBold.woff2`
- **Usage** : Titres principaux (h1, h2, h3, etc.)
- **Classe Tailwind** : `font-heading`
- **Source** : [Cal.com](https://github.com/calcom/font)

### 2. **Satoshi** (Éléments UI)
- **Fichier** : `Satoshi-Variable.woff2`
- **Usage** : Boutons, labels, éléments d'interface
- **Classe Tailwind** : `font-ui`
- **Source** : [Fontshare](https://www.fontshare.com/fonts/satoshi)

### 3. **Inter** (Texte principal)
- **Usage** : Corps de texte, paragraphes
- **Classe Tailwind** : `font-sans` (par défaut)
- **Source** : Google Fonts (chargée via next/font/google)

## Configuration

Les fonts sont chargées via `@font-face` dans `src/app/globals.css` :

```css
@font-face {
  font-family: 'Cal Sans';
  src: url('/fonts/CalSans-SemiBold.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Satoshi';
  src: url('/fonts/Satoshi-Variable.woff2') format('woff2');
  font-weight: 300 900;
  font-style: normal;
  font-display: swap;
}
```

## Utilisation

```tsx
// Cal Sans (Titres) - Appliqué automatiquement aux h1-h6
<h1>Mon Titre</h1>

// Ou manuellement
<div className="font-heading">Titre personnalisé</div>

// Inter (Texte - par défaut)
<p>Mon paragraphe</p>

// Satoshi (UI)
<button className="font-ui">Cliquez ici</button>
```

## Page de test

Visitez `/fonts-test` pour voir un aperçu complet de toutes les fonts.
