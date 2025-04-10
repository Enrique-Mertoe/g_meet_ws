const mongoose = require('mongoose');

// Define a schema for the session
const sessionSchema = new mongoose.Schema({
    id: {
        type: String
    },
    ses_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    ip_address: {
        type: String,
        default: null,
    },
    user_agent: {
        type: String,
        default: null,
    },
    payload: {
        type: String,
        required: true,
    },
    last_activity: {
        type: Number,
        required: true,
        default: Date.now,
    },
}, {
    timestamps: true,
    collection: 'sessions',
});
sessionSchema.statics.findBySessionId = function (ses_id) {
    return this.findOne({ses_id});
};
const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;