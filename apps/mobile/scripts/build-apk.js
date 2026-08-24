#!/usr/bin/env node
/**
 * Build local de l'APK Android, sans passer par EAS (donc sans quota cloud).
 *
 * Pourquoi ce script plutôt qu'un simple `gradlew assembleRelease` :
 *   - `JAVA_HOME` global pointe volontairement sur Java 8 (d'autres outils de la
 *     machine en dépendent) alors que Gradle/AGP exigent le JDK 17 : on le
 *     surcharge uniquement pour ce process.
 *   - Sous Windows, la socket UDP de verrouillage de Gradle échoue en
 *     `BindException: Address already in use` si la JVM part sur la pile IPv6 ;
 *     `-Djava.net.preferIPv4Stack=true` évite ça.
 *   - Le dossier `android/` est généré par `expo prebuild` et n'est pas versionné :
 *     on le régénère s'il manque.
 *
 * Usage : node scripts/build-apk.js [--debug] [--aab] [--clean]
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mobileDir = path.resolve(__dirname, '..');
const androidDir = path.join(mobileDir, 'android');
const isWindows = process.platform === 'win32';

const args = process.argv.slice(2);
const variant = args.includes('--debug') ? 'Debug' : 'Release';
const bundle = args.includes('--aab');
const clean = args.includes('--clean');

function fail(message) {
  console.error('\n[build-apk] ' + message + '\n');
  process.exit(1);
}

/** Premier chemin existant parmi les candidats (les motifs `*` sont résolus par listing). */
function firstExisting(candidates) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate.includes('*')) {
      const dir = path.dirname(candidate);
      const prefix = path.basename(candidate).replace('*', '');
      if (!fs.existsSync(dir)) continue;
      const match = fs
        .readdirSync(dir)
        .filter((name) => name.startsWith(prefix))
        .sort()
        .pop();
      if (match) return path.join(dir, match);
    } else if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolveJdk17() {
  const current = process.env.FF_JAVA_HOME || process.env.JAVA_HOME;
  if (current && /(-|_)?17/.test(path.basename(current)) && fs.existsSync(current)) return current;
  const found = firstExisting([
    'C:/Java/jdk-17*',
    'C:/Program Files/Eclipse Adoptium/jdk-17*',
    'C:/Program Files/Java/jdk-17*',
    '/usr/lib/jvm/java-17-openjdk-amd64',
    '/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home',
  ]);
  if (!found) {
    fail(
      'JDK 17 introuvable. Installe-le ou expose son chemin via FF_JAVA_HOME.\n' +
        'Gradle/AGP refusent de compiler avec Java 8.'
    );
  }
  return found;
}

function resolveAndroidSdk() {
  const localAppData = process.env.LOCALAPPDATA;
  const found = firstExisting([
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    'C:/Android',
    localAppData ? path.join(localAppData, 'Android', 'Sdk') : null,
    process.env.HOME ? path.join(process.env.HOME, 'Android', 'Sdk') : null,
    process.env.HOME ? path.join(process.env.HOME, 'Library', 'Android', 'sdk') : null,
  ]);
  if (!found) fail('SDK Android introuvable. Renseigne ANDROID_HOME.');
  return found;
}

const javaHome = resolveJdk17();
const androidSdk = resolveAndroidSdk();

const env = Object.assign({}, process.env, {
  JAVA_HOME: javaHome,
  ANDROID_HOME: androidSdk,
  ANDROID_SDK_ROOT: androidSdk,
  GRADLE_OPTS: (process.env.GRADLE_OPTS ? process.env.GRADLE_OPTS + ' ' : '') + '-Djava.net.preferIPv4Stack=true',
});

console.log('[build-apk] JAVA_HOME    = ' + javaHome);
console.log('[build-apk] ANDROID_HOME = ' + androidSdk);

if (!fs.existsSync(androidDir)) {
  console.log('[build-apk] android/ absent -> expo prebuild');
  const prebuild = spawnSync(
    isWindows ? 'npx.cmd' : 'npx',
    ['expo', 'prebuild', '--platform', 'android', '--no-install'],
    { cwd: mobileDir, env, stdio: 'inherit' }
  );
  if (prebuild.status !== 0) fail('expo prebuild a échoué.');
}

/**
 * Le flag IPv4 doit atteindre la JVM du *daemon* Gradle, pas seulement le launcher :
 * on le pose donc dans `gradle.properties` plutôt qu'en `-Dorg.gradle.jvmargs=...`
 * (impossible à passer en ligne de commande sous Windows : la valeur contient des
 * espaces et `shell: true` la découperait). Opération idempotente, rejouée après
 * chaque `expo prebuild` qui régénère `android/`.
 */
function ensureIpv4JvmArg() {
  const propsPath = path.join(androidDir, 'gradle.properties');
  if (!fs.existsSync(propsPath)) return;
  const content = fs.readFileSync(propsPath, 'utf8');
  if (content.includes('java.net.preferIPv4Stack')) return;
  const lines = content.split(/\r?\n/);
  let patched = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*org\.gradle\.jvmargs\s*=/.test(lines[i])) {
      lines[i] = lines[i].trimEnd() + ' -Djava.net.preferIPv4Stack=true';
      patched = true;
      break;
    }
  }
  if (!patched) lines.push('org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -Djava.net.preferIPv4Stack=true');
  fs.writeFileSync(propsPath, lines.join('\n'));
  console.log('[build-apk] gradle.properties : -Djava.net.preferIPv4Stack=true ajoute (evite BindException sous Windows)');
}

ensureIpv4JvmArg();

const tasks = [];
if (clean) tasks.push('clean');
tasks.push(bundle ? 'bundle' + variant : 'assemble' + variant);

const gradlew = path.join(androidDir, isWindows ? 'gradlew.bat' : 'gradlew');
console.log('[build-apk] gradlew ' + tasks.join(' '));

const build = spawnSync(gradlew, tasks, {
  cwd: androidDir,
  env,
  stdio: 'inherit',
  shell: isWindows,
});
if (build.status !== 0) fail('Le build Gradle a échoué (voir la sortie ci-dessus).');

const outputDir = bundle
  ? path.join(androidDir, 'app', 'build', 'outputs', 'bundle', variant.toLowerCase())
  : path.join(androidDir, 'app', 'build', 'outputs', 'apk', variant.toLowerCase());

if (fs.existsSync(outputDir)) {
  const artifacts = fs.readdirSync(outputDir).filter((name) => /\.(apk|aab)$/.test(name));
  for (const name of artifacts) {
    const full = path.join(outputDir, name);
    const mb = (fs.statSync(full).size / (1024 * 1024)).toFixed(1);
    console.log('\n[build-apk] OK -> ' + full + ' (' + mb + ' Mo)');
  }
  if (!bundle && artifacts.length) {
    console.log('[build-apk] Installer sur un appareil/émulateur branché :');
    console.log('            adb install -r "' + path.join(outputDir, artifacts[0]) + '"');
  }
} else {
  fail('Build terminé mais aucun artefact trouvé dans ' + outputDir);
}
