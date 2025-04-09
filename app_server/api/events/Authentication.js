const {now} = require("mongoose");
const User = require("../../database/models/User");
const bcrypt = require('bcryptjs');
const {generateAuthToken, generateRefreshToken} = require("../jwt");


const AuthRes = ({
                     ok = false,
                     message, data
                 }) => {
    return {
        ok: false,
        data: data,
        message: message
    }
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
                id: user._id,
                name: user.fullName, // from virtual field
                profile_url: user.profileUrl || null // if applicable
            }
        }
    });
}

const SignUp = async ({ data }) => {
    const { firstName, lastName, email, password } = data;

    if (!firstName || !lastName || !email || !password) {
        return AuthRes({ message: "All fields are required" });
    }

    // Check if user already exists
    const exists = await User.emailExists(email.toLowerCase());
    if (exists) {
        return AuthRes({ message: "Email already registered" });
    }

    try {
        const newUser = new User({ firstName, lastName, email, password });
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
        return AuthRes({ message: "Something went wrong during registration" });
    }
};

const ApiAuth = async ({action, data}) => {
    if (!["signin", "password-reset"].includes(action))
        return AuthRes({message: "Invalid Auth request"});
    if (action === "signin")
        return await signIn(data)

}
module.exports = ApiAuth