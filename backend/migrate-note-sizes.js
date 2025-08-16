// Script to update existing notes with random sizes
const mongoose = require('mongoose');
const Note = require('./models/Note');
const { getRandomSize, getRandomColor } = require('./utils/helpers');
require('dotenv').config();

const updateExistingNotes = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔍 Finding notes that need size/color updates...');
    
    // Find notes that don't have proper sizes or colors
    const notesToUpdate = await Note.find({
      $or: [
        { size: { $exists: false } },
        { size: null },
        { size: '' },
        { color: { $exists: false } },
        { color: null },
        { color: '' }
      ]
    });

    console.log(`📝 Found ${notesToUpdate.length} notes to update`);

    if (notesToUpdate.length === 0) {
      console.log('✅ All notes already have proper sizes and colors!');
      process.exit(0);
    }

    let updated = 0;
    for (const note of notesToUpdate) {
      try {
        const updates = {};
        
        // Update size if missing or invalid
        if (!note.size || !['small', 'medium', 'large'].includes(note.size)) {
          updates.size = getRandomSize();
        }
        
        // Update color if missing or invalid
        const validColors = ['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'];
        if (!note.color || !validColors.includes(note.color)) {
          updates.color = getRandomColor();
        }

        if (Object.keys(updates).length > 0) {
          await Note.findByIdAndUpdate(note._id, updates);
          console.log(`✅ Updated note "${note.title}" with size: ${updates.size || note.size}, color: ${updates.color || note.color}`);
          updated++;
        }
      } catch (error) {
        console.error(`❌ Error updating note ${note._id}:`, error);
      }
    }

    console.log(`\n🎉 Migration complete! Updated ${updated} notes with random sizes and colors.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run the migration
updateExistingNotes();
