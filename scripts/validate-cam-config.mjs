// Lightweight validation of the CAM edition build config.
// Verifies that:
//   - the JSON is well-formed (same parser electron-builder uses for .json files)
//   - all required overrides are present and distinct from the base edition
//
// electron-builder itself is what ultimately validates field semantics at build
// time; this script catches structural mistakes early without running a full
// package pipeline (next build + prisma + electron-builder).
//
// Note: electron-builder 26.x does NOT unwrap `package.json.build` when a
// separate config file uses `extends: "./package.json"`; it merges the whole
// package.json and fails with `unknown property 'build'`. This config is
// therefore self-contained and intentionally does not use `extends`.
//
// Run with: node scripts/validate-cam-config.mjs
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const camPath = path.join(root, "electron-builder.cam.json")
const cam = JSON.parse(fs.readFileSync(camPath, "utf8"))
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
const build = pkg.build || {}

if (cam.extends) {
  throw new Error(
    "electron-builder.cam.json must not use `extends`; electron-builder 26.x does not unwrap package.json.build",
  )
}

const required = [
  "appId",
  "productName",
  "artifactName",
  "extraMetadata",
  "linux",
  "win",
  "deb",
  "directories",
]
for (const key of required) {
  if (!(key in cam)) {
    throw new Error(`Missing override: ${key}`)
  }
}

const mustDiffer = [
  ["appId", cam.appId, build.appId],
  ["productName", cam.productName, build.productName],
  ["directories.output", cam.directories.output, build.directories?.output],
  ["artifactName", cam.artifactName, build.artifactName],
]
for (const [field, value, base] of mustDiffer) {
  if (value === base) {
    throw new Error(`${field} must differ from base (${value})`)
  }
}

if (cam.extraMetadata.camEdition !== true) {
  throw new Error("extraMetadata.camEdition must be true")
}
if (!cam.linux.executableName) {
  throw new Error("linux.executableName must be set")
}
if (!cam.deb?.packageName) {
  throw new Error("deb.packageName must be set at the top level (not under linux)")
}

if (!Array.isArray(cam.win.target) || cam.win.target.length === 0) {
  throw new Error("win.target must be configured (portable expected)")
}
const portableTarget = cam.win.target.find((t) => t.target === "portable")
if (!portableTarget) {
  throw new Error("win.target must include a portable entry for the CAM Windows package")
}
if (!Array.isArray(portableTarget.arch) || !portableTarget.arch.includes("x64")) {
  throw new Error("win.target portable arch must include x64")
}

const requiredScripts = [
  "desktop:package:linux:cam",
  "desktop:package:win:cam",
]
for (const name of requiredScripts) {
  if (!pkg.scripts?.[name]) {
    throw new Error(`${name} script missing in package.json`)
  }
  if (!pkg.scripts[name].includes("--config electron-builder.cam.json")) {
    throw new Error(`${name} must pass --config electron-builder.cam.json`)
  }
}

console.log("[ok] CAM edition config is structurally valid")
console.log("     appId          =", cam.appId)
console.log("     productName    =", cam.productName)
console.log("     artifactName   =", cam.artifactName)
console.log("     executableName =", cam.linux.executableName)
console.log("     deb.packageName=", cam.deb.packageName)
console.log("     win.target     =", JSON.stringify(cam.win.target))
console.log("     output dir     =", cam.directories.output)
console.log("     extraMetadata  =", JSON.stringify(cam.extraMetadata))
console.log("     build script   =", pkg.scripts["desktop:package:linux:cam"])
console.log("     build script   =", pkg.scripts["desktop:package:win:cam"])
