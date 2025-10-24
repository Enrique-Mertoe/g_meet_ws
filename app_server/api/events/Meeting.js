const Meeting = require("../../database/models/Meeting");
const User = require("../../database/models/User");
const { v4: uuidv4 } = require('uuid');

const MeetingRes = ({
    ok = false,
    message,
    data
}) => {
    return {
        ok,
        data: data,
        message: message
    };
};

const validateInput = (...args) => {
    for (let arg in args)
        if (!args[arg])
            return false;
    return true;
};

// Create instant meeting
const createInstantMeeting = async (data) => {
    const { userId, title } = data;

    if (!userId) {
        return MeetingRes({ message: "User ID is required" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return MeetingRes({ message: "User not found" });
        }

        // Check if user already has an active meeting as host
        const existingActiveMeeting = await Meeting.findOne({
            hostId: userId,
            status: 'active'
        });

        if (existingActiveMeeting) {
            return MeetingRes({
                message: "You already have an active class. Please end it before starting a new one.",
                data: {
                    activeMeetingId: existingActiveMeeting.meetingId,
                    activeMeetingTitle: existingActiveMeeting.title
                }
            });
        }

        const meeting = new Meeting({
            meetingId: uuidv4().substring(0, 12),
            title: title || `${user.fullName}'s Meeting`,
            hostId: userId,
            type: 'instant',
            status: 'active',
            startedAt: new Date(),
            participants: [{
                userId: userId,
                role: 'host',
                joinedAt: new Date()
            }]
        });

        await meeting.save();

        return MeetingRes({
            ok: true,
            message: "Instant meeting created",
            data: {
                meetingId: meeting.meetingId,
                title: meeting.title,
                status: meeting.status,
                hostId: meeting.hostId,
                startedAt: meeting.startedAt,
                participants: meeting.participants
            }
        });
    } catch (err) {
        console.error("Create instant meeting error:", err);
        return MeetingRes({ message: "Failed to create instant meeting" });
    }
};

// Schedule a meeting
const scheduleMeeting = async (data) => {
    const { userId, title, description, scheduledAt, duration, settings } = data;

    if (!userId || !title || !scheduledAt) {
        return MeetingRes({ message: "User ID, title, and scheduled time are required" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return MeetingRes({ message: "User not found" });
        }

        const meeting = new Meeting({
            meetingId: uuidv4().substring(0, 12),
            title,
            description,
            hostId: userId,
            scheduledAt: new Date(scheduledAt),
            duration,
            type: 'scheduled',
            status: 'scheduled',
            settings: settings || {},
            participants: []
        });

        await meeting.save();

        return MeetingRes({
            ok: true,
            message: "Meeting scheduled successfully",
            data: {
                meetingId: meeting.meetingId,
                title: meeting.title,
                description: meeting.description,
                scheduledAt: meeting.scheduledAt,
                duration: meeting.duration,
                status: meeting.status,
                hostId: meeting.hostId
            }
        });
    } catch (err) {
        console.error("Schedule meeting error:", err);
        return MeetingRes({ message: "Failed to schedule meeting" });
    }
};

// Get meeting details
const getMeeting = async (data) => {
    const { meetingId } = data;

    if (!meetingId) {
        return MeetingRes({ message: "Meeting ID is required" });
    }

    try {
        const meeting = await Meeting.findByMeetingId(meetingId)
            .populate('hostId', 'firstName lastName email profileUrl')
            .populate('participants.userId', 'firstName lastName email profileUrl');

        if (!meeting) {
            return MeetingRes({ message: "Meeting not found" });
        }

        return MeetingRes({
            ok: true,
            data: meeting
        });
    } catch (err) {
        console.error("Get meeting error:", err);
        return MeetingRes({ message: "Failed to get meeting details" });
    }
};

// Join meeting
const joinMeeting = async (data) => {
    const { meetingId, userId, password } = data;

    if (!meetingId || !userId) {
        return MeetingRes({ message: "Meeting ID and User ID are required" });
    }

    try {
        const meeting = await Meeting.findByMeetingId(meetingId);

        if (!meeting) {
            return MeetingRes({ message: "Meeting not found" });
        }

        // Check if meeting is active or can be started
        if (meeting.status === 'ended') {
            return MeetingRes({ message: "This meeting has ended" });
        }

        if (meeting.status === 'cancelled') {
            return MeetingRes({ message: "This meeting has been cancelled" });
        }

        // Check password if required
        if (meeting.settings.requirePassword && meeting.settings.password !== password) {
            return MeetingRes({ message: "Incorrect meeting password" });
        }

        // Check max participants
        if (meeting.activeParticipantsCount >= meeting.settings.maxParticipants) {
            return MeetingRes({ message: "Meeting has reached maximum capacity" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return MeetingRes({ message: "User not found" });
        }

        // If meeting is scheduled and user is host, start it
        if (meeting.status === 'scheduled' && meeting.hostId.toString() === userId.toString()) {
            meeting.start();
        }

        // Add participant
        const added = meeting.addParticipant(userId);
        if (!added) {
            return MeetingRes({ message: "You are already in this meeting" });
        }

        await meeting.save();
        await meeting.populate('hostId', 'firstName lastName email profileUrl');
        await meeting.populate('participants.userId', 'firstName lastName email profileUrl');

        return MeetingRes({
            ok: true,
            message: "Joined meeting successfully",
            data: {
                meetingId: meeting.meetingId,
                title: meeting.title,
                status: meeting.status,
                hostId: meeting.hostId,
                participants: meeting.participants,
                settings: meeting.settings
            }
        });
    } catch (err) {
        console.error("Join meeting error:", err);
        return MeetingRes({ message: "Failed to join meeting" });
    }
};

// Leave meeting
const leaveMeeting = async (data) => {
    const { meetingId, userId } = data;

    if (!meetingId || !userId) {
        return MeetingRes({ message: "Meeting ID and User ID are required" });
    }

    try {
        const meeting = await Meeting.findByMeetingId(meetingId);

        if (!meeting) {
            return MeetingRes({ message: "Meeting not found" });
        }

        const removed = meeting.removeParticipant(userId);
        if (!removed) {
            return MeetingRes({ message: "You are not in this meeting" });
        }

        // If host leaves and there are other participants, transfer host role
        if (meeting.hostId.toString() === userId.toString() && meeting.activeParticipantsCount > 0) {
            const nextHost = meeting.participants.find(p => !p.leftAt && p.userId.toString() !== userId.toString());
            if (nextHost) {
                meeting.hostId = nextHost.userId;
                nextHost.role = 'host';
            }
        }

        // If no active participants, end the meeting
        if (meeting.activeParticipantsCount === 0) {
            meeting.end();
        }

        await meeting.save();

        return MeetingRes({
            ok: true,
            message: "Left meeting successfully",
            data: {
                meetingId: meeting.meetingId,
                status: meeting.status,
                activeParticipants: meeting.activeParticipantsCount
            }
        });
    } catch (err) {
        console.error("Leave meeting error:", err);
        return MeetingRes({ message: "Failed to leave meeting" });
    }
};

// End meeting (host only)
const endMeeting = async (data) => {
    const { meetingId, userId } = data;

    if (!meetingId || !userId) {
        return MeetingRes({ message: "Meeting ID and User ID are required" });
    }

    try {
        const meeting = await Meeting.findByMeetingId(meetingId);

        if (!meeting) {
            return MeetingRes({ message: "Meeting not found" });
        }

        // Check if user is the host
        if (meeting.hostId.toString() !== userId.toString()) {
            return MeetingRes({ message: "Only the host can end the meeting" });
        }

        const ended = meeting.end();
        if (!ended) {
            return MeetingRes({ message: "Meeting is not active" });
        }

        await meeting.save();

        return MeetingRes({
            ok: true,
            message: "Meeting ended successfully",
            data: {
                meetingId: meeting.meetingId,
                status: meeting.status,
                endedAt: meeting.endedAt,
                duration: meeting.duration
            }
        });
    } catch (err) {
        console.error("End meeting error:", err);
        return MeetingRes({ message: "Failed to end meeting" });
    }
};

// Get user's upcoming meetings
const getUpcomingMeetings = async (data) => {
    const { userId } = data;

    if (!userId) {
        return MeetingRes({ message: "User ID is required" });
    }

    try {
        const meetings = await Meeting.findUpcomingByUser(userId)
            .populate('hostId', 'firstName lastName email profileUrl')
            .limit(20);

        return MeetingRes({
            ok: true,
            data: meetings
        });
    } catch (err) {
        console.error("Get upcoming meetings error:", err);
        return MeetingRes({ message: "Failed to get upcoming meetings" });
    }
};

// Get user's recent meetings
const getRecentMeetings = async (data) => {
    const { userId, limit } = data;

    if (!userId) {
        return MeetingRes({ message: "User ID is required" });
    }

    try {
        const meetings = await Meeting.findRecentByUser(userId, limit || 10)
            .populate('hostId', 'firstName lastName email profileUrl');

        return MeetingRes({
            ok: true,
            data: meetings
        });
    } catch (err) {
        console.error("Get recent meetings error:", err);
        return MeetingRes({ message: "Failed to get recent meetings" });
    }
};

// Get active meetings for user
const getActiveMeetings = async (data) => {
    const { userId } = data;

    if (!userId) {
        return MeetingRes({ message: "User ID is required" });
    }

    try {
        const meetings = await Meeting.find({
            status: 'active',
            $or: [
                { hostId: userId },
                { 'participants.userId': userId, 'participants.leftAt': { $exists: false } }
            ]
        })
        .populate('hostId', 'firstName lastName email profileUrl')
        .populate('participants.userId', 'firstName lastName email profileUrl');

        return MeetingRes({
            ok: true,
            data: meetings
        });
    } catch (err) {
        console.error("Get active meetings error:", err);
        return MeetingRes({ message: "Failed to get active meetings" });
    }
};

// Main API handler
const ApiMeeting = async ({ action, data }) => {
    const validActions = [
        "create-instant",
        "schedule",
        "get",
        "join",
        "leave",
        "end",
        "upcoming",
        "recent",
        "active"
    ];

    if (!validActions.includes(action)) {
        return MeetingRes({ message: "Invalid meeting request" });
    }

    switch (action) {
        case "create-instant":
            return await createInstantMeeting(data);
        case "schedule":
            return await scheduleMeeting(data);
        case "get":
            return await getMeeting(data);
        case "join":
            return await joinMeeting(data);
        case "leave":
            return await leaveMeeting(data);
        case "end":
            return await endMeeting(data);
        case "upcoming":
            return await getUpcomingMeetings(data);
        case "recent":
            return await getRecentMeetings(data);
        case "active":
            return await getActiveMeetings(data);
        default:
            return MeetingRes({ message: "Action not implemented" });
    }
};

module.exports = ApiMeeting;