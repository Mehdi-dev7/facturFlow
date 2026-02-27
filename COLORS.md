# Guide des Couleurs FacturNow

## 🎨 Palette de couleurs

- **Primary** : `#4f46e5` (Indigo)
- **Secondary** : `#6366f1` (Indigo clair)
- **Accent** : `#06b6d4` (Cyan)
- **Success** : `#10b981` (Vert)
- **Warning** : `#f59e0b` (Orange)
- **Danger** : `#ef4444` (Rouge)

---

## ✅ Comment utiliser les couleurs

### 1. **Classes Tailwind (recommandé pour les couleurs simples)**

```tsx
// Backgrounds
<div className="bg-primary">       // Fond indigo
<div className="bg-secondary">     // Fond indigo clair
<div className="bg-accent">        // Fond cyan

// Texte
<p className="text-primary">       // Texte indigo
<p className="text-secondary">     // Texte indigo clair
<p className="text-accent">        // Texte cyan

// Bordures
<div className="border-primary">   // Bordure indigo
```

### 2. **Classes de gradient personnalisées**

```tsx
// Gradient de fond
<div className="bg-gradient-primary">  // Indigo → Indigo clair
<div className="bg-gradient-accent">   // Cyan → Indigo

// Gradient de texte
<h1 className="text-gradient">         // Texte avec gradient Indigo → Cyan
```

### 3. **Styles inline (pour les cas complexes)**

```tsx
// Couleur simple
<div style={{ backgroundColor: 'rgb(79, 70, 229)' }}>

// Gradient personnalisé
<div style={{ 
  background: 'linear-gradient(to right, rgb(79, 70, 229), rgb(99, 102, 241))' 
}}>

// Avec opacité
<div style={{ 
  backgroundColor: 'rgba(79, 70, 229, 0.1)',
  borderColor: 'rgba(79, 70, 229, 0.2)' 
}}>
```

---

## ❌ Pourquoi les variables CSS ne marchent pas avec les gradients ?

### Le problème

Les variables CSS dans `globals.css` sont au format RGB sans `rgb()` :
```css
--primary: 79 70 229;  /* Format pour Tailwind v4 */
```

Ce format fonctionne avec Tailwind pour :
- ✅ `bg-primary` → `background-color: rgb(79 70 229)`
- ✅ `text-primary` → `color: rgb(79 70 229)`
- ✅ `border-primary` → `border-color: rgb(79 70 229)`

**MAIS** ne fonctionne PAS avec les gradients CSS natifs :
- ❌ `linear-gradient(to right, var(--primary), var(--secondary))`
  → Résultat : `linear-gradient(to right, 79 70 229, 99 102 241)` ❌ Invalide !

### La solution

Pour les gradients, on doit utiliser :
1. **Classes utilitaires prédéfinies** : `.text-gradient`, `.bg-gradient-primary`
2. **Styles inline avec rgb()** : `rgb(79, 70, 229)`
3. **Variables RGB** (ajoutées) : `var(--primary-rgb)`

---

## 📝 Exemples pratiques

### Bouton avec gradient
```tsx
<Button className="bg-gradient-primary hover:opacity-90">
  Mon bouton
</Button>
```

### Titre avec gradient de texte
```tsx
<h1 className="text-gradient">
  Mon titre coloré
</h1>
```

### Badge avec opacité
```tsx
<div 
  className="px-4 py-2 rounded-full border"
  style={{ 
    backgroundColor: 'rgba(79, 70, 229, 0.1)', 
    borderColor: 'rgba(79, 70, 229, 0.2)' 
  }}
>
  <span style={{ color: 'rgb(79, 70, 229)' }}>
    Badge
  </span>
</div>
```

### Gradient personnalisé
```tsx
<div style={{
  background: 'linear-gradient(135deg, rgb(79, 70, 229), rgb(6, 182, 212))'
}}>
  Contenu
</div>
```

---

## 🎯 Bonnes pratiques

1. **Privilégier les classes Tailwind** pour les couleurs simples
2. **Utiliser les classes utilitaires** (`.text-gradient`, `.bg-gradient-primary`) pour les gradients courants
3. **Utiliser les styles inline** uniquement pour les cas spécifiques (opacité, gradients custom)
4. **Rester cohérent** : toujours utiliser les mêmes valeurs RGB

---

## 🔧 Variables disponibles

### Format Tailwind (pour classes)
```css
--primary: 79 70 229
--secondary: 99 102 241
--accent: 6 182 212
```

### Format RGB (pour styles inline)
```css
--primary-rgb: rgb(79 70 229)
--secondary-rgb: rgb(99 102 241)
--accent-rgb: rgb(6 182 212)
```

Utilisation :
```tsx
<div style={{ color: 'var(--primary-rgb)' }}>
  Texte indigo
</div>
```
