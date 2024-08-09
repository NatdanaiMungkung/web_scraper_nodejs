#!/usr/bin/env node
import { program } from "commander";
import fs from "fs";
import path from "path";
import axios from "axios";
import cheerio from "cheerio";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

program
  .version("1.0.0")
  .description("Fetch web pages and save them to disk with assets")
  .option("-m, --metadata", "Display metadata for the fetched pages")
  .arguments("<urls...>")
  .action(async (urls, options) => {
    for (const url of urls) {
      try {
        const { hostname } = new URL(url);
        const dirPath = path.join(__dirname, hostname);

        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        const response = await axios.get(url);
        let html = response.data;

        // Save assets and update HTML
        html = await saveAssets(html, url, dirPath);

        const filename = path.join(dirPath, "index.html");
        fs.writeFileSync(filename, html);
        console.log(`Saved ${filename}`);

        if (options.metadata) {
          const metadata = getMetadata(html, url, filename);
          console.log(metadata);
        }
      } catch (error) {
        console.error(`Error fetching ${url}: ${error.message}`);
      }
    }
  });

const saveAssets = async (html, baseUrl, dirPath) => {
  const $ = cheerio.load(html);

  async function downloadAsset(assetUrl, elementAttr) {
    try {
      const fullUrl = new URL(assetUrl, baseUrl).href;
      const { pathname } = new URL(fullUrl);
      const assetPath = path.join(dirPath, pathname);
      const assetDir = path.dirname(assetPath);

      if (!fs.existsSync(assetDir)) {
        fs.mkdirSync(assetDir, { recursive: true });
      }

      const response = await axios.get(fullUrl, {
        responseType: "arraybuffer",
      });
      fs.writeFileSync(assetPath, response.data);

      // Update the element's attribute with the new local path
      return path.relative(dirPath, assetPath);
    } catch (error) {
      console.error(`Error downloading asset ${assetUrl}: ${error.message}`);
      return assetUrlว;
    }
  }

  // Handle <img> tags
  for (const img of $("img").toArray()) {
    const src = $(img).attr("src");
    if (src) {
      const newSrc = await downloadAsset(src, "src");
      $(img).attr("src", newSrc);
    }
  }

  // Handle <link> tags (CSS)
  for (const link of $('link[rel="stylesheet"]').toArray()) {
    const href = $(link).attr("href");
    if (href) {
      const newHref = await downloadAsset(href, "href");
      $(link).attr("href", newHref);
    }
  }

  // Handle <script> tags
  for (const script of $("script[src]").toArray()) {
    const src = $(script).attr("src");
    if (src) {
      const newSrc = await downloadAsset(src, "src");
      $(script).attr("src", newSrc);
    }
  }

  return $.html();
};

function getMetadata(html, url, filename) {
  const $ = cheerio.load(html);
  const numLinks = $("a").length;
  const numImages = $("img").length;

  const stats = fs.statSync(filename);
  const lastFetch = stats.mtime.toUTCString();

  return `site: ${new URL(url).hostname}
num_links: ${numLinks}
images: ${numImages}
last_fetch: ${lastFetch}
`;
}

program.parse(process.argv);

export { program };
