// enable-fcm.mjs — run in CI AFTER `npx cap add android` to wire Firebase Cloud
// Messaging into the generated Android project. Idempotent: safe to run twice.
//
//   1. copies google-services.json (repo root) into android/app/
//   2. adds the google-services Gradle classpath to android/build.gradle
//   3. applies the google-services plugin in android/app/build.gradle
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'

const projGradle = 'android/build.gradle'
const appGradle = 'android/app/build.gradle'
const gsSrc = 'google-services.json'
const gsDest = 'android/app/google-services.json'

if (!existsSync(gsSrc)) {
  console.error(
    'ERROR: google-services.json is missing from the repo root.\n' +
    'Download it from the Firebase console and commit it to the repo root.'
  )
  process.exit(1)
}

copyFileSync(gsSrc, gsDest)
console.log('✓ copied google-services.json -> android/app/')

let proj = readFileSync(projGradle, 'utf8')
if (!proj.includes('com.google.gms:google-services')) {
  // Insert the classpath into the FIRST dependencies { } block, which is the
  // buildscript block in Capacitor's generated android/build.gradle.
  proj = proj.replace(
    /dependencies\s*\{/,
    (match) => `${match}\n        classpath 'com.google.gms:google-services:4.4.2'`
  )
  writeFileSync(projGradle, proj)
  console.log('✓ added google-services classpath to android/build.gradle')
} else {
  console.log('• google-services classpath already present')
}

let app = readFileSync(appGradle, 'utf8')
if (!app.includes('com.google.gms.google-services')) {
  app += `\napply plugin: 'com.google.gms.google-services'\n`
  writeFileSync(appGradle, app)
  console.log('✓ applied google-services plugin in android/app/build.gradle')
} else {
  console.log('• google-services plugin already applied')
}

console.log('FCM wiring complete.')
