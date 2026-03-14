const fs = require("fs");
const path = require("path");

const gradlePath = path.join(
  process.cwd(),
  "node_modules",
  "@deldev",
  "capacitor-google-auth",
  "android",
  "build.gradle"
);

if (!fs.existsSync(gradlePath)) {
  console.log("[patch-google-auth] Plugin gradle file not found, skipping.");
  process.exit(0);
}

const content = fs.readFileSync(gradlePath, "utf8");
let next = content
  .replace(/jcenter\(\)/g, "mavenCentral()")
  .replace(/proguard-android\.txt/g, "proguard-android-optimize.txt")
  // Remove any previously misplaced facebook dependency lines (e.g. in buildscript.dependencies)
  .replace(/^\s*implementation\s+["']com\.facebook\.android:facebook-login:[^"']+["']\s*\r?\n/gm, "");

const facebookDependency =
  ' implementation "com.facebook.android:facebook-login:17.0.2"';

if (!next.includes("com.facebook.android:facebook-login")) {
  if (
    next.includes(
      'implementation "com.google.android.gms:play-services-auth:$gmsPlayServicesAuthVersion"'
    )
  ) {
    next = next.replace(
      'implementation "com.google.android.gms:play-services-auth:$gmsPlayServicesAuthVersion"',
      'implementation "com.google.android.gms:play-services-auth:$gmsPlayServicesAuthVersion"\n' +
        facebookDependency
    );
  } else {
    next = next.replace(
      /(dependencies\s*\{[\s\S]*?implementation\s+project\(':capacitor-android'\))/m,
      `$1\n${facebookDependency}`
    );
  }
}

if (next !== content) {
  fs.writeFileSync(gradlePath, next);
  console.log("[patch-google-auth] Applied Android Gradle fixes.");
} else {
  console.log("[patch-google-auth] No changes needed.");
}
