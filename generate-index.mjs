// generate-index.mjs — Creates index.html for static hosting (Netlify)
import { readdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

const clientDir = join(process.cwd(), "dist", "client");
const assetsDir = join(clientDir, "assets");

// Find the CSS file
const cssFile = readdirSync(assetsDir).find((f) => f.endsWith(".css"));

// Find the main entry JS (the large index bundle ~594KB)
const jsFiles = readdirSync(assetsDir)
  .filter((f) => f.endsWith(".js"))
  .map((f) => ({ name: f, size: readFileSync(join(assetsDir, f)).length }))
  .sort((a, b) => b.size - a.size);

const mainJs = jsFiles[0]?.name; // largest JS = main bundle

if (!cssFile || !mainJs) {
  console.error("Could not find CSS or main JS:", { cssFile, mainJs });
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>EquiSanum – Bewegungstherapie & Pferdetherapie</title>
    <meta name="description" content="Die Praxis-App von Laura Kupka – Bewegungstherapeutin & Pferdetherapeutin aus Wolfersdorf bei Freising" />
    <meta name="author" content="EquiSanum" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="EquiSanum" />
    <meta name="theme-color" content="#c28f5a" />
    <meta property="og:title" content="EquiSanum – Bewegungstherapie & Pferdetherapie" />
    <meta property="og:description" content="Die Praxis-App von Laura Kupka – Bewegungstherapeutin & Pferdetherapeutin" />
    <meta property="og:type" content="website" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/icons/ios/180.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@300;400;500;600;700&display=swap" />
    <link rel="stylesheet" href="/assets/${cssFile}" />
    <script>
      (function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');})();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${mainJs}"></script>
  </body>
</html>`;

writeFileSync(join(clientDir, "index.html"), html);
console.log(`✅ index.html generated (CSS: ${cssFile}, JS: ${mainJs})`);
