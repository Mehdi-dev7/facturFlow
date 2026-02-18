#!/usr/bin/env node

/**
 * Script de test pour vérifier la sécurité du cron sync-einvoice-events
 * Usage: node scripts/test-cron.js
 */

const CRON_URL = "http://localhost:3000/api/cron/sync-einvoice-events"

async function testCronSecurity() {
  console.log("🔍 Test de sécurité du cron sync-einvoice-events\n")

  // Test 1: Sans header Authorization (doit échouer)
  console.log("1️⃣ Test sans Authorization header...")
  try {
    const res1 = await fetch(CRON_URL)
    const data1 = await res1.json()
    console.log(`   Status: ${res1.status}`)
    console.log(`   Response:`, data1)
    console.log(res1.status === 401 ? "   ✅ PASS - Accès refusé" : "   ❌ FAIL - Devrait être refusé")
  } catch (err) {
    console.log(`   ❌ ERREUR: ${err.message}`)
  }

  console.log()

  // Test 2: Avec mauvais secret (doit échouer)
  console.log("2️⃣ Test avec mauvais secret...")
  try {
    const res2 = await fetch(CRON_URL, {
      headers: { "Authorization": "Bearer wrong-secret" }
    })
    const data2 = await res2.json()
    console.log(`   Status: ${res2.status}`)
    console.log(`   Response:`, data2)
    console.log(res2.status === 401 ? "   ✅ PASS - Accès refusé" : "   ❌ FAIL - Devrait être refusé")
  } catch (err) {
    console.log(`   ❌ ERREUR: ${err.message}`)
  }

  console.log()

  // Test 3: Avec bon secret (doit réussir ou échouer pour d'autres raisons)
  console.log("3️⃣ Test avec bon secret...")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.log("   ⚠️  CRON_SECRET non défini dans .env.local")
    return
  }

  try {
    const res3 = await fetch(CRON_URL, {
      headers: { "Authorization": `Bearer ${cronSecret}` }
    })
    const data3 = await res3.json()
    console.log(`   Status: ${res3.status}`)
    console.log(`   Response:`, data3)
    
    if (res3.status === 200) {
      console.log("   ✅ PASS - Authentification réussie")
    } else if (res3.status === 500 && data3.error?.includes("SuperPDP")) {
      console.log("   ✅ PASS - Auth OK, erreur SuperPDP attendue (pas de vraies clés)")
    } else {
      console.log("   ⚠️  Statut inattendu (mais auth semble OK)")
    }
  } catch (err) {
    console.log(`   ❌ ERREUR: ${err.message}`)
  }

  console.log("\n🎯 Test terminé!")
}

// Vérifier que le serveur dev tourne
async function checkServer() {
  try {
    const res = await fetch("http://localhost:3000")
    return res.ok
  } catch {
    return false
  }
}

async function main() {
  const serverRunning = await checkServer()
  if (!serverRunning) {
    console.log("❌ Serveur Next.js non accessible sur http://localhost:3000")
    console.log("   Lancez d'abord: npm run dev")
    process.exit(1)
  }

  await testCronSecurity()
}

main().catch(console.error)