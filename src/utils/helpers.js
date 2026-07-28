import { COLORS, SIZES, SIZE_WEIGHTS } from './constants';

// Track last sizes for randomization
let lastSizes = [];

// Get random color
export const getRandomColor = () => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};

// Get random size with weights and avoid repetition
export const getRandomSize = () => {
  let filteredSizes = SIZES.filter(size => !lastSizes.includes(size));
  if (filteredSizes.length === 0) filteredSizes = SIZES;
  
  let sum = 0, random = Math.random();
  for (let i = 0; i < filteredSizes.length; i++) {
    sum += SIZE_WEIGHTS[SIZES.indexOf(filteredSizes[i])];
    if (random <= sum) {
      lastSizes.push(filteredSizes[i]);
      if (lastSizes.length > 2) lastSizes.shift();
      return filteredSizes[i];
    }
  }
  
  const choice = filteredSizes[Math.floor(Math.random() * filteredSizes.length)];
  lastSizes.push(choice);
  if (lastSizes.length > 2) lastSizes.shift();
  return choice;
};

// Solid neo-brutalist block colors — vivid, readable with black ink on top
export const NOTE_COLORS = {
  purple: '#B7A2FF',
  teal: '#5EEAD4',
  blue: '#7CA0FF',
  green: '#8FE388',
  orange: '#FF9F45',
  red: '#FF7A7A',
  yellow: '#FFD23F',
  brown: '#D9A874',
  indigo: '#9B9CFF',
};

// Single source of truth for a note/folder color (solid, no gradient)
export const getNoteColor = (color) => NOTE_COLORS[color] || NOTE_COLORS.purple;

// Kept for backwards compatibility — now returns a flat colour block
export const getNoteBackground = (color) => getNoteColor(color);
export const getNoteHoverBackground = (color) => getNoteColor(color);
export const getColorPickerBackground = (color) => getNoteColor(color);
export const getFolderColor = (color) => getNoteColor(color);

// Note size styles for CSS Grid — mobile also respects size (it used to force
// every note to the same span regardless of content, which is exactly what
// caused image/text overlap on phones for content-heavy notes).
export const getSizeStyles = (size, isMobile = false) => {
  const sizeMap = {
    small: { gridRowEnd: 'span 1', minHeight: '150px' },
    medium: { gridRowEnd: 'span 2', minHeight: '150px' },
    large: { gridRowEnd: 'span 3', minHeight: '150px' }
  };
  return sizeMap[size] || sizeMap.medium;
};

// Decide a note's card size from how much it actually contains, so the bento
// grid grows to fit the content (title + text + images + keywords) instead of
// using a size assigned once at random that content can later overflow/clip.
export const computeNoteSize = (title, content, keywordsCount = 0) => {
  const text = stripHtml(content || '');
  const len = (title || '').length + text.length;
  const images = extractImageSrcs(content, 4).length;
  const score = len + images * 260 + Math.max(0, keywordsCount - 1) * 20;
  if (score > 420 || images >= 2) return 'large';
  if (score > 130 || images >= 1) return 'medium';
  return 'small';
};

// Note size classes (kept for compatibility)
export const getSizeClasses = (size) => {
  const sizeMap = {
    small: 'row-span-1',
    medium: 'row-span-2', 
    large: 'row-span-3'
  };
  return sizeMap[size] || sizeMap.medium;
};

// Extract image sources from HTML content (regex — safe on server & client)
export const extractImageSrcs = (html, max = 2) => {
  if (!html) return [];
  const srcs = [];
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = re.exec(html)) && srcs.length < max) {
    srcs.push(match[1]);
  }
  return srcs;
};

// Strip HTML tags to plain text (regex — safe on server & client)
export const stripHtml = (html) =>
  (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Resize image before inserting
export const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Insert image at caret position in contentEditable
export const insertImageAtCaret = (editorRef, imageUrl) => {
  const editor = editorRef.current;
  if (!editor) return;
  
  const img = document.createElement('img');
  img.src = imageUrl;
  img.style.maxWidth = '96%';
  img.style.maxHeight = '220px';
  img.style.display = 'block';
  img.style.margin = '16px 0';
  img.style.border = '3px solid var(--ink)';
  
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
    let range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(img);
    range.setStartAfter(img);
    range.setEndAfter(img);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    editor.insertBefore(img, editor.firstChild);
  }
};

// Handle image insertion
export const handleInsertImage = async (editorRef, setContent) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const resizedDataUrl = await resizeImage(file);
    insertImageAtCaret(editorRef, resizedDataUrl);
    setContent(editorRef.current.innerHTML);
  };
  input.click();
};

// Filter notes based on search term
export const filterNotes = (notes, searchTerm) => {
  if (!searchTerm) return notes;
  
  return notes.filter(note => 
    (note.title && note.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (
      (
        Array.isArray(note.keywords)
          ? note.keywords.join(', ')
          : (typeof note.keywords === 'string' ? note.keywords : '')
      )
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    ) ||
    (note.content &&
      stripHtml(note.content).toLowerCase().includes(searchTerm.toLowerCase()))
  );
};