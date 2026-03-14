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
