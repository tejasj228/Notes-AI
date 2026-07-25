// Server-side random color/size for new notes (ported from backend utils)
const COLORS = ['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'];
const SIZES = ['small', 'medium', 'large'];
const SIZE_WEIGHTS = { small: 0.45, medium: 0.45, large: 0.1 };

let lastSizes = [];

export const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const getRandomSize = () => {
  let pool = SIZES.filter((s) => !lastSizes.includes(s));
  if (pool.length === 0) pool = SIZES;

  let sum = 0;
  const r = Math.random();
  for (const size of pool) {
    sum += SIZE_WEIGHTS[size];
    if (r <= sum) {
      lastSizes.push(size);
      if (lastSizes.length > 2) lastSizes.shift();
      return size;
    }
  }
  const choice = pool[Math.floor(Math.random() * pool.length)];
  lastSizes.push(choice);
  if (lastSizes.length > 2) lastSizes.shift();
  return choice;
};
