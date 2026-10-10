// Lightweight SVG placeholders for seeded portfolio photos (a few hundred bytes each).
const ICONS: Record<string, string> = {
  photographer: "📷", videographer: "🎥", makeup: "💄", decorator: "💐", planner: "📋",
  dj: "🎧", singer: "🎤", band: "🎷", baker: "🎂", painter: "🎨",
};
const PALETTES = [
  ["#0f6e5a", "#7cc4a9"], ["#8d6a1f", "#f1d58a"], ["#7a2e4d", "#e7a3bf"], ["#2f4fb5", "#9db3f0"],
  ["#c2410c", "#fdba74"], ["#3f3f46", "#a1a1aa"], ["#065f46", "#fcd34d"], ["#6d28d9", "#c4b5fd"],
];

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const clean = key.replace(/\.svg$/, "");
  const [cat, n = "0", ...rest] = clean.split("-");
  const label = decodeURIComponent(rest.join(" ")).slice(0, 28).replace(/[<>&"]/g, "");
  let h = 0;
  for (const c of clean) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [a, b] = PALETTES[h % PALETTES.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="400" height="300" fill="url(#g)"/>
<circle cx="${80 + (h % 240)}" cy="${60 + (h % 150)}" r="${40 + (Number(n) % 5) * 12}" fill="#fff" opacity=".12"/>
<text x="200" y="160" font-size="72" text-anchor="middle">${ICONS[cat] ?? "✨"}</text>
${label ? `<text x="200" y="245" font-size="22" font-family="sans-serif" fill="#fff" text-anchor="middle" opacity=".9">${label}</text>` : ""}
</svg>`;
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
