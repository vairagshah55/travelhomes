const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/travel_admin', {
  serverSelectionTimeoutMS: 2000
}).then(() => {
  console.log('Connected');
  process.exit(0);
}).catch(err => {
  console.error('Connection failed:', err.message);
  process.exit(1);
});
