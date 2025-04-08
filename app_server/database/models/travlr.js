const mongoose = require('mongoose');

// Define the trip schema
const tripSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, // Ensuring code uniqueness
    name: { type: String, required: true, index: true },
    length: { type: String, required: true },
    start: { type: Date, required: true },
    resort: { type: String, required: true },
    perPerson: { type: Number, required: true }, // Changed from String to Number for proper data handling
    image: { type: String, required: true },
    description: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now } // Adding a field to track the last update time
});

tripSchema.index({ start: 1, resort: 1 });

module.exports = mongoose.model('trips', tripSchema);