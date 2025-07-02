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

// Note background gradients
export const getNoteBackground = (color) => {
  const backgrounds = {
    teal: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #0f766e 100%)',
    brown: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #a16207 100%)',
    yellow: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #d97706 100%)',
    blue: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #1e40af 100%)',
    purple: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #7c3aed 100%)',
    green: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #059669 100%)',
    orange: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #ea580c 100%)',
    red: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #dc2626 100%)',
    indigo: 'linear-gradient(45deg, #242424 0%, #242424 60%, #2a2a2a 80%, #4f46e5 100%)'
  };
  return backgrounds[color] || backgrounds.purple;
};

// Note hover background gradients
export const getNoteHoverBackground = (color) => {
  const backgrounds = {
    teal: 'linear-gradient(45deg, #0f766e 0%, #0f766e 60%, #134e4a 80%, #242424 100%)',
    brown: 'linear-gradient(45deg, #a16207 0%, #a16207 60%, #b45309 80%, #242424 100%)',
    yellow: 'linear-gradient(45deg, #d97706 0%, #d97706 60%, #ea580c 80%, #242424 100%)',
    blue: 'linear-gradient(45deg, #1e40af 0%, #1e40af 60%, #1e3a8a 80%, #242424 100%)',
    purple: 'linear-gradient(45deg, #7c3aed 0%, #7c3aed 60%, #6b21a8 80%, #242424 100%)',
    green: 'linear-gradient(45deg, #059669 0%, #059669 60%, #047857 80%, #242424 100%)',
    orange: 'linear-gradient(45deg, #ea580c 0%, #ea580c 60%, #c2410c 80%, #242424 100%)',
    red: 'linear-gradient(45deg, #dc2626 0%, #dc2626 60%, #b91c1c 80%, #242424 100%)',
    indigo: 'linear-gradient(45deg, #4f46e5 0%, #4f46e5 60%, #4338ca 80%, #242424 100%)'
  };
  return backgrounds[color] || backgrounds.purple;
};

// Color picker backgrounds
export const getColorPickerBackground = (color) => {
  const backgrounds = {
    teal: 'linear-gradient(45deg, #0f766e, #14b8a6)',
    brown: 'linear-gradient(45deg, #a16207, #d97706)',
    yellow: 'linear-gradient(45deg, #d97706, #f59e0b)',
    blue: 'linear-gradient(45deg, #1e40af, #3b82f6)',
    purple: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
    green: 'linear-gradient(45deg, #059669, #10b981)',
    orange: 'linear-gradient(45deg, #ea580c, #f97316)',
    red: 'linear-gradient(45deg, #dc2626, #ef4444)',
    indigo: 'linear-gradient(45deg, #4f46e5, #6366f1)'
  };
  return backgrounds[color] || backgrounds.purple;
};

// Folder colors
export const getFolderColor = (color) => {
  const colors = {
    teal: '#14b8a6',
    brown: '#d97706',
    yellow: '#f59e0b',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    green: '#10b981',
    orange: '#f97316',
    red: '#ef4444',
    indigo: '#6366f1'
  };
  return colors[color] || colors.purple;
};

// Note size classes
export const getSizeClasses = (size) => {
  const sizeMap = {
    small: 'row-span-1',
    medium: 'row-span-2', 
    large: 'row-span-3'
  };
  return sizeMap[size] || sizeMap.medium;
};

// Extract image sources from HTML content
export const extractImageSrcs = (html, max = 2) => {
  if (!html) return [];
  const div = document.createElement('div');
  div.innerHTML = html || '';
  const imgs = Array.from(div.querySelectorAll('img'));
  return imgs.slice(0, max).map(img => img.src);
};

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
  img.style.margin = '16px auto';
  img.style.borderRadius = '10px';
  img.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
  
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
      (
        (() => {
          const div = document.createElement('div');
          div.innerHTML = note.content || '';
          return (div.textContent || div.innerText || '');
        })()
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    )
  );
};