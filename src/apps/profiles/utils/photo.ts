/** Profile photos are stored this size: plenty for the largest avatar, small enough to upload quickly. */
export const PHOTO_SIZE = 512;

const loadImage = (file: Blob) => new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
    };
    image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('This image could not be read.'));
    };
    image.src = url;
});

/**
 * Turns a picked photo into a square JPEG: the middle of the photo, scaled down. Phones' huge photos become a
 * small upload, and the avatar shows what the preview showed.
 */
export const toSquarePhoto = async (file: Blob): Promise<Blob> => {
    const image = await loadImage(file);
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    if (!side) throw new Error('This image could not be read.');

    const size = Math.min(PHOTO_SIZE, side);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot resize images.');
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, size, size);

    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('This image could not be read.'))), 'image/jpeg', 0.9);
    });
};
