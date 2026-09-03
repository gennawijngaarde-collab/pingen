function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image overlay load failed'));
    img.src = src;
  });
}

/**
 * Superpose un titre lisible sur l'image du Pin (style Pinterest).
 * Passe par le proxy serveur pour éviter les blocages CORS.
 */
export async function composePinOverlay(imageUrl: string, overlayText?: string): Promise<string> {
  const text = overlayText?.trim();
  if (!text || typeof document === 'undefined') return imageUrl;

  const proxyUrl = `/api/ai/image?proxy=${encodeURIComponent(imageUrl)}`;
  const img = await loadImage(proxyUrl);

  const width = img.naturalWidth || 768;
  const height = img.naturalHeight || 1344;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageUrl;

  ctx.drawImage(img, 0, 0, width, height);

  const pad = Math.round(width * 0.07);
  const fontSize = Math.round(width * 0.075);
  ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const lines = wrapLines(ctx, text, width - pad * 2);
  const lineHeight = Math.round(fontSize * 1.15);
  const blockHeight = lines.length * lineHeight + pad;
  const top = height - blockHeight - pad;

  const gradient = ctx.createLinearGradient(0, top - pad, 0, height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.35, 'rgba(0,0,0,0.45)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, top - pad, width, height - top + pad);

  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 12;
  lines.forEach((line, index) => {
    ctx.fillText(line, pad, top + index * lineHeight);
  });

  return canvas.toDataURL('image/jpeg', 0.88);
}
