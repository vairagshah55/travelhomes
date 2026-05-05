const Trip = require("../../models/Trip");
const { ConflictError } = require("../../shared/errors");

async function create(input) {
  const exists = await Trip.findOne({ tripId: input.tripId });
  if (exists) throw new ConflictError("Trip with this ID already exists");

  const data = await Trip.create({
    ...input,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
  });
  return { data };
}

async function list() {
  const data = await Trip.find().sort({ startDate: -1 });
  return { data };
}

async function listToday() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  const data = await Trip.find({ startDate: { $gte: start, $lte: end } }).sort({ startDate: 1 });
  return { data };
}

async function listEndingThisWeek() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  const end = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - today.getDay() + 6,
    23,
    59,
    59,
  );
  const data = await Trip.find({ endDate: { $gte: start, $lte: end } }).sort({ endDate: 1 });
  return { data };
}

module.exports = { create, list, listToday, listEndingThisWeek };
