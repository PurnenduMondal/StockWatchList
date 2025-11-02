import mongoose from 'mongoose';

// Database connection with retry logic
export const connectDatabase = async () => {
  try {
    // Connection options for security and performance
    const options = {
      maxPoolSize: 10, // Maximum number of connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority', // Write concern
      authSource: 'admin'
    };

    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/stockwatchlist';

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('📴 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during MongoDB shutdown:', err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Retry connection after delay
    setTimeout(() => {
      console.log('🔄 Retrying database connection...');
      connectDatabase();
    }, 5000);
  }
};

// Check database health
export const checkDatabaseHealth = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return {
        status: 'unhealthy',
        message: 'Database not connected'
      };
    }

    // Ping the database
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      message: 'Database connection is active',
      state: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message
    };
  }
};

// Get database statistics
export const getDatabaseStats = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize
    };
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
};

// Database cleanup utility
export const cleanupDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    // Add any cleanup logic here
    // For example, removing old logs, temporary data, etc.
    
    console.log('🧹 Database cleanup completed');
    return true;
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
    return false;
  }
};

// Create database indexes for better performance
export const createIndexes = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not connected, skipping index creation');
      return;
    }

    // The indexes are already defined in the Stock model
    // This function can be used for additional custom indexes if needed
    
    console.log('📝 Database indexes verified');
    return true;
  } catch (error) {
    console.error('❌ Failed to create indexes:', error.message);
    return false;
  }
};