export const ASPECT_RATIO = 16 / 9;
export const VIRTUAL_WIDTH = 1000;
export const VIRTUAL_HEIGHT = 562;

function computeGameSize(): { width: number; height: number } {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w / h > ASPECT_RATIO) {
    // Window is wider than target ratio – height is the constraint
    return { width: Math.round(h * ASPECT_RATIO), height: h };
  }
  // Window is taller than target ratio – width is the constraint
  return { width: w, height: Math.round(w / ASPECT_RATIO) };
}

const size = computeGameSize();
export const GAME_WIDTH = size.width;
export const GAME_HEIGHT = size.height;
export const PIXEL_RATIO = size.height / VIRTUAL_HEIGHT;

export const PX = (x: number): number => x * PIXEL_RATIO;

export const FONTS = {
  family: '"Fredoka One", "Trebuchet MS", sans-serif',
  emoji: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
};
