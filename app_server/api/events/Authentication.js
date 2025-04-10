const {now} = require("mongoose");
const User = require("../../database/models/User");
const bcrypt = require('bcryptjs');
const {generateAuthToken, generateRefreshToken} = require("../jwt");
const Session = require("../../database/models/Session");
const {v4: uuidv4} = require('uuid');


const AuthRes = ({
                     ok = false,
                     message, data
                 }) => {
    return {
        ok,
        data: data,
        message: message
    }
}

const validateInput = (...args) => {
    for (let arg in args)
        if (!args[arg])
            return false
    return true;
}

const signIn = async data => {
    const {email, password} = data;
    if (!email || !password) {
        return AuthRes({message: "Email and password required"});
    }

    const user = await User.findByEmail(email.toLowerCase());
    if (!user) {
        return AuthRes({message: "User account not found"});
    }
    const isValidPassword = await user.verify(password);
    if (!isValidPassword) {
        return AuthRes({message: "Invalid password"});
    }

    return AuthRes({
        ok: true,
        message: "Login successful",
        data: {
            auth_token: generateAuthToken(user._id),
            refresh_token: generateRefreshToken(user._id),
            user: {
                email: user.email,
                name: user.fullName,
                profile_url: user.profileUrl || null
            }
        }
    });
}

const SignUp = async ({data}) => {
    const {firstName, lastName, email, password} = data;

    if (!firstName || !lastName || !email || !password) {
        return AuthRes({message: "All fields are required"});
    }

    // Check if user already exists
    const exists = await User.emailExists(email.toLowerCase());
    if (exists) {
        return AuthRes({message: "Email already registered"});
    }

    try {
        const newUser = new User({firstName, lastName, email, password});
        await newUser.save();

        return AuthRes({
            ok: true,
            message: "Account created successfully",
            data: {
                auth_token: generateAuthToken(newUser._id),
                refresh_token: generateRefreshToken(newUser._id),
                user: {
                    id: newUser._id,
                    name: newUser.fullName,
                    profile_url: newUser.profileUrl || null // if you later add it
                }
            }
        });
    } catch (err) {
        console.error("Signup error:", err);
        return AuthRes({message: "Something went wrong during registration"});
    }
};

const SessionManagement = async data => {
    const {ses_id, user_id, ip_address, user_agent, payload} = data;
    if (!validateInput(ses_id, ip_address, user_agent, payload)) {
        return AuthRes({message: "All fields are required"});
    }
    try {
        const exists = await Session.findBySessionId(ses_id);
        if (exists) {
            return AuthRes({ok: true, data: exists});
        }
        const newSession = new Session({
            id: uuidv4(),
            ses_id,
            user_id,
            ip_address,
            user_agent,
            payload,
            last_activity: Date.now(),
        });
        await newSession.save();

        return AuthRes({
            ok: true,
            message: "Session saved",
            data: newSession
        });
    } catch (err) {
        console.error("Session error:", err);
        return AuthRes({message: "Something went wrong during session creation"});
    }
};
const SessionGet = async data => {
    const {ses_id} = data;
    if (!validateInput(ses_id)) {
        return AuthRes({message: "All fields are required"});
    }
    try {
        const sess = await Session.findBySessionId(ses_id);

        return AuthRes({ok: true, data: sess});

    } catch (err) {
        console.error("Session error:", err);
        return AuthRes({message: "Something went wrong during session creation"});
    }
};


const SessionUpdate = async data => {
    const {ses_id, payload} = data;
    if (!validateInput(ses_id, payload)) {
        return AuthRes({message: "All fields are required"});
    }
    try {
        const exists = await Session.findBySessionId(ses_id);
        if (!exists) {
            return AuthRes({ok: false, message: "no session found"});
        }
        exists.payload = payload;
        exists.last_activity = Date.now();
        await exists.save();

        return AuthRes({
            ok: true,
            message: "Session updated",
            data: exists
        });
    } catch (err) {
        console.error("Session error:", err);
        return AuthRes({message: "Something went wrong during session creation"});
    }
};

const ApiAuth = async ({action, data}) => {
    if (!["signin", "password-reset",
        "session-update",
        "session-init", "session-get"].includes(action))
        return AuthRes({message: "Invalid Auth request"});
    if (action === "signin")
        return await signIn(data)
    if (action === "session-init")
        return await SessionManagement(data)
    if (action === "session-get")
        return await SessionGet(data)
    if (action === "session-update")
        return await SessionUpdate(data)

}
module.exports = ApiAuth