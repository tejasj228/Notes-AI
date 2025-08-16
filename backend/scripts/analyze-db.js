const mongoose = require('mongoose');
require('dotenv').config();

async function analyzeDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notes-ai', {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('✅ Connected to MongoDB for analysis');
    
    const db = mongoose.connection.db;
    
    // Get database stats
    const dbStats = await db.stats();
    console.log('\n📊 Database Stats:');
    console.log(`- Database Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Collections: ${dbStats.collections}`);
    console.log(`- Objects: ${dbStats.objects}`);
    
    // Check Notes collection
    try {
      const notesStats = await db.collection('notes').stats();
      console.log('\n📝 Notes Collection:');
      console.log(`- Documents: ${notesStats.count}`);
      console.log(`- Size: ${(notesStats.size / 1024).toFixed(2)} KB`);
      console.log(`- Average Document Size: ${(notesStats.avgObjSize / 1024).toFixed(2)} KB`);
    } catch (e) {
      const notesCount = await db.collection('notes').countDocuments();
      console.log('\n📝 Notes Collection:');
      console.log(`- Documents: ${notesCount}`);
    }
    
    // Check ChatMessages collection
    try {
      const chatStats = await db.collection('chatmessages').stats();
      console.log('\n💬 ChatMessages Collection:');
      console.log(`- Documents: ${chatStats.count}`);
      console.log(`- Size: ${(chatStats.size / 1024).toFixed(2)} KB`);
      console.log(`- Average Document Size: ${(chatStats.avgObjSize / 1024).toFixed(2)} KB`);
    } catch (e) {
      const chatCount = await db.collection('chatmessages').countDocuments();
      console.log('\n💬 ChatMessages Collection:');
      console.log(`- Documents: ${chatCount}`);
    }
    
    // Check indexes
    console.log('\n🗂️  Notes Indexes:');
    const notesIndexes = await db.collection('notes').indexes();
    notesIndexes.forEach(index => {
      console.log(`- ${JSON.stringify(index.key)} (${index.name})`);
    });
    
    console.log('\n🗂️  ChatMessages Indexes:');
    const chatIndexes = await db.collection('chatmessages').indexes();
    chatIndexes.forEach(index => {
      console.log(`- ${JSON.stringify(index.key)} (${index.name})`);
    });
    
    // Test query performance
    console.log('\n⚡ Performance Tests:');
    
    // Test notes query
    const start1 = Date.now();
    await db.collection('notes').find({ isTrashed: false }).limit(50).toArray();
    console.log(`- Notes query: ${Date.now() - start1}ms`);
    
    // Test chat history query
    const start2 = Date.now();
    await db.collection('chatmessages').find({}).limit(50).toArray();
    console.log(`- Chat messages query: ${Date.now() - start2}ms`);
    
    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Add memory monitoring
console.log('🔍 Starting Database Performance Analysis...');
console.log(`📊 Initial Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);

analyzeDatabase()
  .then(() => {
    console.log(`📊 Final Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
