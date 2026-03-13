# FacturNow — Logo Assets

## Structure à copier dans ton projet

```
public/
  logo/
    icon.svg          ← icône seule (navbar, app icon)
    favicon.svg       ← onglet navigateur
    logo.svg          ← logo complet fond clair
    logo-white.svg    ← logo complet fond sombre
components/
  Logo.tsx            ← composant React prêt à l'emploi
```

## Utilisation

```tsx
// Navbar (fond clair)
<Logo variant="full" theme="light" width={160} height={40} />

// Navbar (dark mode)
<Logo variant="full" theme="dark" width={160} height={40} />

// Favicon seule
<Logo variant="icon" width={32} height={32} />
```

## next.config.js — SVG support

Installe le package :
  npm install @svgr/webpack

Puis dans next.config.js :
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};
module.exports = nextConfig;
```

## Couleurs principales

| Token          | Valeur    | Usage                  |
|----------------|-----------|------------------------|
| primary        | #5A59ED   | Couleur principale     |
| primary-light  | #6C6BF0   | Hover / gradient start |
| primary-dark   | #4A49D4   | Gradient end           |
| primary-deep   | #3330B8   | Ombre éclair           |
| white          | #FFFFFF   | Éclair / texte dark    |
