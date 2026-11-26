/**
 * Generates the static brand images in app/: favicon.ico, icon.svg, apple-icon.png and opengraph-image.png.
 * Static files instead of icon.tsx/opengraph-image.tsx routes: no extra Vercel functions, and the proxy lets
 * files with an extension through, so link previews also work while the coming-soon mode is on.
 *
 * Run after changing the logo: pnpm generate-brand-assets
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import sharp from "sharp";

const APP_DIR = join(process.cwd(), "app");

const ROSE_500 = "#f43f5e";
const PINK_600 = "#db2777";
const ZINC_950 = "#09090b";

// Lucide "cherry", the same icon as components/shared/logo.tsx.
const CHERRY_PATHS = [
  "M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z",
  "M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z",
  "M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12",
  "M22 9c-4.29 0-7.14-2.33-10-7 5.71 0 10 4.67 10 7Z",
];

/** Cherry on the rose gradient. `radius` 0 for the Apple icon, iOS rounds the corners itself. */
function iconSvg({ radius, strokeWidth = 2 }: { radius: number; strokeWidth?: number }): string {
  const paths = CHERRY_PATHS.map((d) => `<path d="${d}"/>`).join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ROSE_500}"/><stop offset="1" stop-color="${PINK_600}"/></linearGradient></defs>`,
    `<rect width="64" height="64" rx="${radius}" fill="url(#g)"/>`,
    `<g transform="translate(14 14) scale(1.5)" fill="none" stroke="#fff" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`,
    `</svg>`,
  ].join("");
}

function png(svg: string, size: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 72 * (size / 64) * 2 })
    .resize(size, size)
    .png()
    .toBuffer();
}

/** ICO container with PNG entries (supported by every current browser). */
function ico(images: Array<{ size: number; data: Buffer }>): Buffer {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = header.length;

  images.forEach(({ size, data }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });

  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

/** Geist (same font as the site) in the weights ImageResponse needs; it only bundles Geist Regular. */
async function geist(weight: 400 | 800): Promise<ArrayBuffer> {
  // Without a browser user agent, Google Fonts answers with TrueType files, which ImageResponse can read.
  const css = await fetch(`https://fonts.googleapis.com/css2?family=Geist:wght@${weight}`).then((response) => response.text());
  const url = css.match(/src: url\((.+?)\)/)?.[1];

  if (!url) {
    throw new Error(`Geist ${weight} not found on Google Fonts`);
  }

  return fetch(url).then((response) => response.arrayBuffer());
}

/**
 * One span per letter: ImageResponse measures words before Geist's contextual alternates (fi, rr) apply,
 * which leaves visible gaps after "Cherry" and "Verifizierte" when the text is set as a whole.
 */
function letters(text: string) {
  return [...text].map((char, index) => <span key={index}>{char === " " ? "\u00a0" : char}</span>);
}

async function openGraphImage(): Promise<Buffer> {
  const [regular, extraBold] = await Promise.all([geist(400), geist(800)]);
  const icon = `data:image/svg+xml;base64,${Buffer.from(iconSvg({ radius: 16 })).toString("base64")}`;

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: ZINC_950,
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(244,63,94,0.35), rgba(9,9,11,0) 65%)",
          color: "white",
          fontFamily: "Geist",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not in the browser */}
        <img src={icon} alt="" width={150} height={150} style={{ borderRadius: 38 }} />

        <div style={{ display: "flex", marginTop: 44, fontSize: 96, fontWeight: 800, letterSpacing: -3 }}>
          {letters("Cherry")}
          <div style={{ display: "flex", color: ROSE_500 }}>{letters("Stream")}</div>
        </div>

        <div style={{ display: "flex", marginTop: 20, fontSize: 36, color: "#a1a1aa" }}>
          {letters("Verifizierte Profile aus der ganzen Schweiz")}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist", data: extraBold, weight: 800, style: "normal" },
      ],
    },
  );

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const rounded = iconSvg({ radius: 16 });
  // Thicker lines at 16 and 32 px, otherwise the stem disappears in the browser tab.
  const small = iconSvg({ radius: 14, strokeWidth: 2.6 });

  await writeFile(join(APP_DIR, "icon.svg"), `${rounded}\n`);
  await writeFile(join(APP_DIR, "apple-icon.png"), await png(iconSvg({ radius: 0 }), 180));
  await writeFile(
    join(APP_DIR, "favicon.ico"),
    ico([
      { size: 16, data: await png(small, 16) },
      { size: 32, data: await png(small, 32) },
      { size: 48, data: await png(rounded, 48) },
    ]),
  );
  await writeFile(join(APP_DIR, "opengraph-image.png"), await openGraphImage());

  console.log("Brand assets written to app/: favicon.ico, icon.svg, apple-icon.png, opengraph-image.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
