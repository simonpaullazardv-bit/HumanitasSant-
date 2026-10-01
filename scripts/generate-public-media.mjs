import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const publicDir = path.join(ROOT, "public");
const outputFile = path.join(ROOT, "src", "data", "public-media.generated.ts");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".svg"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v", ".ogv"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }
  return files;
}

function publicUrl(absolutePath) {
  const relative = path.relative(publicDir, absolutePath).split(path.sep).join("/");
  return `/${relative.split("/").map(encodeURIComponent).join("/")}`;
}

const files = await walk(publicDir);
const images = files
  .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
  .map(publicUrl)
  .filter((url) => url.startsWith("/img/"));
const videos = files
  .filter((file) => VIDEO_EXTENSIONS.has(path.extname(file).toLowerCase()))
  .map(publicUrl)
  .filter((url) => url.startsWith("/videos/"));

images.sort((a, b) => a.localeCompare(b, "fr"));
videos.sort((a, b) => a.localeCompare(b, "fr"));

const content = `/**\n * Fichier généré automatiquement à partir de public/img et public/videos.\n * Ne pas modifier à la main : relancer npm run dev ou npm run build.\n */\n\nexport const LOCAL_PUBLIC_IMAGE_URLS = ${JSON.stringify(images, null, 2)} as const;\n\nexport const LOCAL_PUBLIC_VIDEO_URLS = ${JSON.stringify(videos, null, 2)} as const;\n`;

await writeFile(outputFile, content, "utf8");
console.log(
  `[Humanitas media] ${images.length} images + ${videos.length} vidéos indexées depuis public/.`,
);
