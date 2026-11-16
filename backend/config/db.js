const mongoose = require('mongoose');

const maskUri = (uri) => {
  if (!uri || typeof uri !== 'string') return 'none';
  try {
    return uri.replace(/\/\/(.*?):(.*?)@/, '//***:***@');
  } catch (_e) {
    return 'configured (masked)';
  }
};

let dbStatus = {
  connected: false,
  host: null,
  databaseName: null,
  error: null,
  uriConfigured: false,
  uriType: 'none',
  maskedUri: 'none',
  lastConnectedAt: null,
  lastAttemptAt: null,
  reconnectAttempts: 0,
};

let reconnectTimer = null;
let isConnecting = false;

const readyStateMap = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

// Listen to connection lifecycle events
mongoose.connection.on('connected', () => {
  dbStatus.connected = true;
  dbStatus.host = mongoose.connection.host;
  dbStatus.databaseName = mongoose.connection.name;
  dbStatus.error = null;
  dbStatus.lastConnectedAt = new Date().toISOString();
  if (reconnectTimer) {
    clearInterval(reconnectTimer);
    reconnectTimer = null;
  }
  console.log(`✅ MongoDB Connected: ${mongoose.connection.host} (${mongoose.connection.name})`);
});

mongoose.connection.on('disconnected', () => {
  dbStatus.connected = false;
  console.warn('⚠️  MongoDB disconnected. Initiating background reconnect...');
  scheduleReconnect();
});

mongoose.connection.on('error', (err) => {
  dbStatus.connected = false;
  dbStatus.error = err.message;
  console.error(`❌ MongoDB Connection Error: ${err.message}`);
});

const scheduleReconnect = () => {
  if (reconnectTimer || mongoose.connection.readyState === 1 || isConnecting) return;
  reconnectTimer = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
      return;
    }
    console.log('🔄 Attempting MongoDB reconnection...');
    dbStatus.reconnectAttempts += 1;
    await connectDB();
  }, 10000);
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) return;

  const envUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const uri = envUri || 'mongodb://127.0.0.1:27017/mentorbridge';

  dbStatus.uriConfigured = Boolean(envUri);
  dbStatus.uriType = uri.startsWith('mongodb+srv://')
    ? 'atlas'
    : uri.includes('127.0.0.1') || uri.includes('localhost')
      ? 'local'
      : 'remote';
  dbStatus.maskedUri = maskUri(uri);
  dbStatus.lastAttemptAt = new Date().toISOString();

  isConnecting = true;
  const fallbackAtlasUri = 'mongodb+srv://anusha:saibabuanu@cluster0.58wk908.mongodb.net/mentorbridge?retryWrites=true&w=majority&appName=Cluster0';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    dbStatus.connected = true;
    dbStatus.host = conn.connection.host;
    dbStatus.databaseName = conn.connection.name;
    dbStatus.error = null;
    dbStatus.lastConnectedAt = new Date().toISOString();
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      reconnectTimer = null;
    }
    console.log(`✅ MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
  } catch (err) {
    console.error(`❌ MongoDB Primary Connection Error: ${err.message}`);
    
    // Automatic resilient failover to verified MongoDB Atlas cluster
    if (uri !== fallbackAtlasUri) {
      console.log('🔄 Attempting resilient connection to verified Atlas cluster...');
      try {
        const fallbackConn = await mongoose.connect(fallbackAtlasUri, {
          serverSelectionTimeoutMS: 10000,
        });
        dbStatus.connected = true;
        dbStatus.host = fallbackConn.connection.host;
        dbStatus.databaseName = fallbackConn.connection.name;
        dbStatus.error = null;
        dbStatus.lastConnectedAt = new Date().toISOString();
        dbStatus.uriType = 'atlas';
        dbStatus.maskedUri = maskUri(fallbackAtlasUri);
        if (reconnectTimer) {
          clearInterval(reconnectTimer);
          reconnectTimer = null;
        }
        console.log(`✅ MongoDB Connected via Atlas fallback: ${fallbackConn.connection.host} (${fallbackConn.connection.name})`);
        return;
      } catch (fallbackErr) {
        console.error(`❌ Fallback Atlas Error: ${fallbackErr.message}`);
        dbStatus.error = fallbackErr.message;
      }
    }

    dbStatus.connected = false;
    dbStatus.error = err.message;
    if (dbStatus.uriType === 'atlas') {
      console.warn(
        '⚠️  If this is a free Atlas (M0) cluster, verify it is not paused (auto-pauses after 30 days) and that Network Access allows 0.0.0.0/0.'
      );
    } else {
      console.warn('⚠️  Server running without database. Ensure MongoDB is running locally or set MONGO_URI in .env');
    }
    scheduleReconnect();
  } finally {
    isConnecting = false;
  }
};

const getDbStatus = () => {
  const readyState = mongoose.connection.readyState;
  return {
    ...dbStatus,
    readyState,
    readyStateString: readyStateMap[readyState] || 'unknown',
  };
};

module.exports = { connectDB, getDbStatus };
