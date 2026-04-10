const mongoose = require('mongoose');

const userDetailSchema = new mongoose.Schema(
  {
    uid);

const userDetails = mongoose.model('userdetails', userDetailSchema);
module.exports = userDetails;
