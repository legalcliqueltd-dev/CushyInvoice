const fs = require("fs");
const path = require("path");

function patchGradleFile(filePath, label, extraTransform) {
  if (!fs.existsSync(filePath)) {
    console.log(`[patch] ${label} not found, skipping.`);
    return;
  }
  let content = fs.readFileSync(filePath, "utf8");
  let next = content
    .replace(/jcenter\(\)/g, "mavenCentral()")
    .replace(/proguard-android\.txt/g, "proguard-android-optimize.txt");
  if (extraTransform) {
    next = extraTransform(next);
  }
  if (next !== content) {
    fs.writeFileSync(filePath, next);
    console.log(`[patch] Applied fixes to ${label}.`);
  } else {
    console.log(`[patch] ${label} already patched.`);
  }
}

// Patch @deldev/capacitor-google-auth
const googleAuthGradle = path.join(
  process.cwd(), "node_modules", "@deldev", "capacitor-google-auth", "android", "build.gradle"
);
patchGradleFile(googleAuthGradle, "@deldev/capacitor-google-auth", (content) => {
  let next = content.replace(
    /^\s*implementation\s+["']com\.facebook\.android:facebook-login:[^"']+["']\s*\r?\n/gm, ""
  );
  const fbDep = '    implementation "com.facebook.android:facebook-login:17.0.2"';
  if (!next.includes("com.facebook.android:facebook-login")) {
    next = next.replace(
      /(dependencies\s*\{[\s\S]*?implementation\s+project\(':capacitor-android'\))/m,
      `$1\n${fbDep}`
    );
  }
  return next;
});

// Create stub ios directory for @deldev/capacitor-google-auth so cap sync doesn't crash
const googleAuthIosDir = path.join(
  process.cwd(), "node_modules", "@deldev", "capacitor-google-auth", "ios"
);
if (!fs.existsSync(googleAuthIosDir)) {
  fs.mkdirSync(googleAuthIosDir, { recursive: true });
  console.log("[patch] Created stub ios directory for @deldev/capacitor-google-auth.");
} else {
  console.log("[patch] @deldev/capacitor-google-auth ios directory already exists.");
}

// Also remove iOS from the plugin's capacitor declaration so cap sync doesn't try to process it
const googleAuthPkgPath = path.join(
  process.cwd(), "node_modules", "@deldev", "capacitor-google-auth", "package.json"
);
if (fs.existsSync(googleAuthPkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(googleAuthPkgPath, "utf8"));
    if (pkg.capacitor && pkg.capacitor.ios) {
      delete pkg.capacitor.ios;
      fs.writeFileSync(googleAuthPkgPath, JSON.stringify(pkg, null, 2) + "\n");
      console.log("[patch] Removed iOS platform declaration from @deldev/capacitor-google-auth.");
    }
  } catch (e) {
    console.log("[patch] Could not patch google-auth package.json:", e.message);
  }
}

// Patch @capacitor/browser
const browserGradle = path.join(
  process.cwd(), "node_modules", "@capacitor", "browser", "android", "build.gradle"
);
patchGradleFile(browserGradle, "@capacitor/browser");

// Patch @capacitor/filesystem
const fsGradle = path.join(
  process.cwd(), "node_modules", "@capacitor", "filesystem", "android", "build.gradle"
);
patchGradleFile(fsGradle, "@capacitor/filesystem");

// Patch @capacitor/splash-screen
const splashGradle = path.join(
  process.cwd(), "node_modules", "@capacitor", "splash-screen", "android", "build.gradle"
);
patchGradleFile(splashGradle, "@capacitor/splash-screen");

// Patch @capacitor/app
const appGradle = path.join(
  process.cwd(), "node_modules", "@capacitor", "app", "android", "build.gradle"
);
patchGradleFile(appGradle, "@capacitor/app");

// Patch @capawesome/capacitor-apple-sign-in
const appleSignInGradle = path.join(
  process.cwd(), "node_modules", "@capawesome", "capacitor-apple-sign-in", "android", "build.gradle"
);
patchGradleFile(appleSignInGradle, "@capawesome/capacitor-apple-sign-in");
