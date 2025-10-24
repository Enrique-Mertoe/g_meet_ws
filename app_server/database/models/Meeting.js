const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ParticipantSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
    leftAt: {
        type: Date,
    },
    role: {
        type: String,
        enum: ['host', 'co-host', 'participant'],
        default: 'participant',
    },
    isMuted: {
        type: Boolean,
        default: false,
    },
    isVideoOff: {
        type: Boolean,
        default: false,
    },
}, { _id: false });

const MeetingSchema = new mongoose.Schema({
    meetingId: {
        type: String,
        required: true,
        unique: true,
        default: () => uuidv4().substring(0, 12),
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    scheduledAt: {
        type: Date,
    },
    startedAt: {
        type: Date,
    },
    endedAt: {
        type: Date,
    },
    duration: {
        type: Number, // in minutes
    },
    status: {
        type: String,
        enum: ['scheduled', 'active', 'ended', 'cancelled'],
        default: 'scheduled',
    },
    type: {
        type: String,
        enum: ['instant', 'scheduled'],
        default: 'instant',
    },
    participants: [ParticipantSchema],
    settings: {
        isWaitingRoomEnabled: {
            type: Boolean,
            default: false,
        },
        isChatEnabled: {
            type: Boolean,
            default: true,
        },
        isScreenShareEnabled: {
            type: Boolean,
            default: true,
        },
        isRecordingEnabled: {
            type: Boolean,
            default: false,
        },
        maxParticipants: {
            type: Number,
            default: 100,
        },
        requirePassword: {
            type: Boolean,
            default: false,
        },
        password: {
            type: String,
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the updatedAt field on save
MeetingSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for active participants count
MeetingSchema.virtual('activeParticipantsCount').get(function () {
    return this.participants.filter(p => !p.leftAt).length;
});

// Static method to find meeting by meetingId
MeetingSchema.statics.findByMeetingId = function (meetingId) {
    return this.findOne({ meetingId });
};

// Static method to find active meetings
MeetingSchema.statics.findActiveMeetings = function () {
    return this.find({ status: 'active' });
};

// Static method to find user's upcoming meetings
MeetingSchema.statics.findUpcomingByUser = function (userId) {
    return this.find({
        $or: [
            { hostId: userId },
            { 'participants.userId': userId }
        ],
        status: 'scheduled',
        scheduledAt: { $gte: new Date() }
    }).sort({ scheduledAt: 1 });
};

// Static method to find user's recent meetings
MeetingSchema.statics.findRecentByUser = function (userId, limit = 10) {
    return this.find({
        $or: [
            { hostId: userId },
            { 'participants.userId': userId }
        ],
        status: { $in: ['ended', 'active'] }
    })
    .sort({ updatedAt: -1 })
    .limit(limit);
};

// Instance method to add participant
MeetingSchema.methods.addParticipant = function (userId, role = 'participant') {
    const existingParticipant = this.participants.find(
        p => p.userId.toString() === userId.toString() && !p.leftAt
    );

    if (existingParticipant) {
        return false; // Already in meeting
    }

    this.participants.push({ userId, role, joinedAt: new Date() });
    return true;
};

// Instance method to remove participant
MeetingSchema.methods.removeParticipant = function (userId) {
    const participant = this.participants.find(
        p => p.userId.toString() === userId.toString() && !p.leftAt
    );

    if (participant) {
        participant.leftAt = new Date();
        return true;
    }
    return false;
};

// Instance method to start meeting
MeetingSchema.methods.start = function () {
    if (this.status === 'scheduled' || this.status === 'ended') {
        this.status = 'active';
        this.startedAt = new Date();
        return true;
    }
    return false;
};

// Instance method to end meeting
MeetingSchema.methods.end = function () {
    if (this.status === 'active') {
        this.status = 'ended';
        this.endedAt = new Date();

        // Mark all participants as left
        this.participants.forEach(p => {
            if (!p.leftAt) {
                p.leftAt = new Date();
            }
        });

        // Calculate actual duration
        if (this.startedAt) {
            this.duration = Math.round((this.endedAt - this.startedAt) / 60000); // in minutes
        }
        return true;
    }
    return false;
};

const Meeting = mongoose.model('Meeting', MeetingSchema);
module.exports = Meeting;