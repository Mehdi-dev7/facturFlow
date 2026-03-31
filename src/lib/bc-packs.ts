// src/lib/bc-packs.ts
// Packs de recharge pages BC — séparé du fichier "use server" pour éviter l'erreur Next.js
// (un fichier "use server" ne peut exporter que des fonctions async)

export const BC_PAGE_PACKS = [
  { pages: 250,  price: 5,  label: "250 pages" },
  { pages: 500,  price: 10, label: "500 pages" },
  { pages: 1000, price: 20, label: "1 000 pages" },
] as const;

export type BcPackPages = typeof BC_PAGE_PACKS[number]["pages"];
