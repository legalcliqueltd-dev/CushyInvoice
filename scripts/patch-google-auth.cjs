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

let content = fs.readFileSync(gradlePath, "utf8");

const next = content
  .replace(/jcenter\(\)/g, "mavenCentral()")
  .replace(/proguard-android\.txt/g, "proguard-android-optimize.txt");

if (next !== content) {
  fs.writeFileSync(gradlePath, next);
  console.log("[patch-google-auth] Applied Android Gradle fixes.");
} else {
  console.log("[patch-google-auth] No changes needed.");
}
