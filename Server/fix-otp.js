const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/travelhomes').then(async () => {
  const result = await mongoose.connection.db.collection('registers').updateMany(
    { otpVerified: false },
    { $set: { otpVerified: true } }
  );
  console.log('Matched:', result.matchedCount, '| Updated:', result.modifiedCount);
  await mongoose.disconnect();
}).catch(err => {
  console.error(err.message);
  process.exit(1);
});
