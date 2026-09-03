const MAX_EDGE = 384;
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

export function compressProfileImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choisissez une image JPG, PNG ou GIF.'));
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      reject(new Error('Image trop lourde (max 8 Mo).'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Impossible de traiter cette image.'));
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Impossible de lire cette image.'));
    };
    image.src = objectUrl;
  });
}
