// src/lib/encrypt.ts
// Chiffrement AES-256-GCM pour stocker les credentials de paiement en base
// Format stocké : "iv_hex:tag_hex:encrypted_hex"

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? "";
  if (hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY manquante ou invalide (doit être 64 chars hex = 32 bytes). " +
        "Génère-la avec : node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

/** Chiffre une chaîne en AES-256-GCM. Retourne "iv:tag:ciphertext" en hex. */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96 bits recommandé pour GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag(); // 128 bits d'authentification

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/** Déchiffre une chaîne produite par encrypt(). Lance si invalide. */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Format de ciphertext invalide");

  const [ivHex, tagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}
