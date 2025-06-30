// Color options for notes and folders
export const COLORS = ['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'];

// Size options for notes
export const SIZES = ['small', 'medium', 'large'];

// Size weights for random generation
export const SIZE_WEIGHTS = [0.45, 0.45, 0.1];

// Default notes data
export const DEFAULT_NOTES = [
  { 
    id: 1, 
    title: 'Web Development', 
    content: 'Learning React, JavaScript, and CSS for modern web development. Focus on component-based architecture and responsive design.', 
    keywords: ['React', 'JavaScript', 'CSS'], 
    color: 'purple', 
    size: 'medium', 
    order: 0, 
    images: [], 
    folderId: null 
  },
  { 
    id: 2, 
    title: 'Project Ideas', 
    content: 'AI-powered note-taking app, Machine learning for content suggestions, Automation tools for productivity', 
    keywords: ['AI', 'Machine Learning', 'Automation'], 
    color: 'blue', 
    size: 'large', 
    order: 1, 
    images: [], 
    folderId: null 
  },
  { 
    id: 3, 
    title: 'Shopping List', 
    content: 'Groceries: Milk, Bread, Eggs\nHousehold: Cleaning supplies, Paper towels\nPersonal: Shampoo, Toothpaste', 
    keywords: ['Groceries', 'Household', 'Personal'], 
    color: 'green', 
    size: 'small', 
    order: 2, 
    images: [], 
    folderId: null 
  },
  { 
    id: 4, 
    title: 'Meeting Notes', 
    content: 'Project timeline discussion, deliverables for Q4, team responsibilities and deadlines', 
    keywords: ['Timeline', 'Deliverables', 'Team'], 
    color: 'orange', 
    size: 'medium', 
    order: 3, 
    images: [], 
    folderId: null 
  },
  { 
    id: 5, 
    title: 'Book Recommendations', 
    content: 'Programming: Clean Code, Design Patterns\nPsychology: Thinking Fast and Slow\nDesign: Don\'t Make Me Think', 
    keywords: ['Programming', 'Psychology', 'Design'], 
    color: 'teal', 
    size: 'small', 
    order: 4, 
    images: [], 
    folderId: null 
  },
  { 
    id: 6, 
    title: 'Workout Plan', 
    content: 'Monday: Chest and Triceps\nWednesday: Back and Biceps\nFriday: Legs and Shoulders\nCardio: 30 minutes on off days', 
    keywords: ['Fitness', 'Health', 'Exercise'], 
    color: 'red', 
    size: 'medium', 
    order: 5, 
    images: [], 
    folderId: null 
  },
  { 
    id: 7, 
    title: 'Travel Itinerary', 
    content: 'Day 1: Arrive in Paris, visit Eiffel Tower\nDay 2: Louvre Museum, Seine River cruise\nDay 3: Versailles Palace day trip', 
    keywords: ['Vacation', 'Cities', 'Museums'], 
    color: 'indigo', 
    size: 'large', 
    order: 6, 
    images: [], 
    folderId: null 
  },
  { 
    id: 8, 
    title: 'Recipe Collection', 
    content: 'Italian Pasta: Carbonara, Bolognese, Pesto\nPizza dough recipe with fresh herbs\nTiramisu for dessert', 
    keywords: ['Cooking', 'Italian', 'Pasta'], 
    color: 'yellow', 
    size: 'medium', 
    order: 7, 
    images: [], 
    folderId: null 
  },
  { 
    id: 9, 
    title: 'Learning Goals', 
    content: 'Master TypeScript this quarter\nLearn Docker and containerization\nImprove system design skills', 
    keywords: ['Skills', 'Technology', 'Growth'], 
    color: 'brown', 
    size: 'small', 
    order: 8, 
    images: [], 
    folderId: null 
  }
];

// Default folders
export const DEFAULT_FOLDERS = [
  { id: 1, name: 'Work Projects', color: 'blue', createdAt: new Date() },
  { id: 2, name: 'Personal', color: 'green', createdAt: new Date() }
];

// Page types
export const PAGES = {
  NOTES: 'notes',
  TRASH: 'trash',
  FOLDER: 'folder'
};

// Drag and drop settings
export const DRAG_SETTINGS = {
  SCROLL_SPEED: 6,
  SCROLL_ZONE: 80
};

// Image settings
export const IMAGE_SETTINGS = {
  MAX_WIDTH: 800,
  MAX_HEIGHT: 600,
  QUALITY: 0.7,
  POPUP_MAX_WIDTH: 800,
  POPUP_MAX_HEIGHT: 600
};