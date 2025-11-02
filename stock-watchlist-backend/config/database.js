import mongoose from 'mongoose';

// Database configuration settings
export const databaseConfig = {
  // MongoDB connection options
  options: {
    maxPoolSize: 10, // Maximum number of connections in the pool
    serverSelectionTimeoutMS: 5000, // How long to wait before timing out
    socketTimeoutMS: 45000, // How long to wait before timing out socket operations
    family: 4, // Use IPv4, skip trying IPv6
    retryWrites: true, // Retry writes on failure
    w: 'majority', // Write concern - wait for majority of replica set members
    authSource: 'admin', // Authentication database
    ssl: process.env.NODE_ENV === 'production', // Use SSL in production
    tlsAllowInvalidCertificates: false, // Don't allow invalid certificates
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    minPoolSize: 5, // Minimum number of connections to maintain
  },

  // Connection retry configuration
  retry: {
    maxRetries: 5,
    retryDelayMs: 5000,
    backoffMultiplier: 2
  },

  // Database performance settings
  performance: {
    bufferMaxEntries: 0, // Disable mongoose buffering
    bufferCommands: false, // Disable mongoose buffering
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      dbName: 'stockwatchlist_dev',
      debug: true,
      autoIndex: true, // Build indexes automatically
      maxPoolSize: 5
    },
    
    test: {
      dbName: 'stockwatchlist_test',
      debug: false,
      autoIndex: false, // Don't build indexes in test
      maxPoolSize: 2
    },
    
    production: {
      dbName: 'stockwatchlist_prod',
      debug: false,
      autoIndex: false, // Disable auto indexing in production
      maxPoolSize: 10,
      ssl: true,
      authSource: 'admin'
    }
  };

  return configs[env] || configs.development;
};

// Get MongoDB URI based on environment
export const getMongoURI = () => {
  const envConfig = getEnvironmentConfig();
  
  // Priority: MONGODB_URI > DATABASE_URL > Local MongoDB
  let uri = process.env.MONGODB_URI || 
            process.env.DATABASE_URL || 
            `mongodb://localhost:27017/${envConfig.dbName}`;

  // Add database name if not included in URI
  if (!uri.includes('/') || uri.endsWith('/')) {
    uri = uri.replace(/\/$/, '') + `/${envConfig.dbName}`;
  }

  return uri;
};

// Merge configuration options
export const getMergedConfig = () => {
  const envConfig = getEnvironmentConfig();
  
  return {
    ...databaseConfig.options,
    ...envConfig,
    dbName: envConfig.dbName
  };
};

// Database connection health check
export const healthCheck = {
  // Check if database is connected
  isConnected: () => {
    return mongoose.connection.readyState === 1;
  },

  // Get connection status
  getStatus: () => {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return states[mongoose.connection.readyState] || 'unknown';
  },

  // Get detailed connection info
  getConnectionInfo: () => {
    const conn = mongoose.connection;
    
    return {
      readyState: conn.readyState,
      host: conn.host,
      port: conn.port,
      name: conn.name,
      collections: Object.keys(conn.collections),
      models: Object.keys(mongoose.models)
    };
  }
};

// Database event handlers
export const setupEventHandlers = () => {
  const conn = mongoose.connection;

  conn.on('connecting', () => {
    console.log('🔄 Connecting to MongoDB...');
  });

  conn.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
  });

  conn.on('open', () => {
    console.log('📂 MongoDB connection opened');
  });

  conn.on('disconnecting', () => {
    console.log('⚠️ MongoDB disconnecting...');
  });

  conn.on('disconnected', () => {
    console.log('❌ MongoDB disconnected');
  });

  conn.on('close', () => {
    console.log('📴 MongoDB connection closed');
  });

  conn.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error);
  });

  conn.on('fullsetup', () => {
    console.log('🎯 MongoDB replica set fully connected');
  });

  conn.on('all', () => {
    console.log('🌐 MongoDB connected to all servers');
  });

  conn.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
  });
};