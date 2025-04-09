const mongoose = require('mongoose');
const argon2 = require('argon2');
const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    profileUrl: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

UserSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        this.password = await argon2.hash(this.password);
    }
    if (this.isModified('email')) {
        this.email = this.email.toLowerCase();
    }
    next();
});
UserSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

UserSchema.methods.verify = async function (candidatePassword) {
    try {
        return await argon2.verify(this.password, candidatePassword);
    } catch (err) {
        return false
    }
};
UserSchema.statics.findByEmail = function (email) {
    return this.findOne({email});
};

// Static method to check if email exists
UserSchema.statics.emailExists = function (email) {
    return this.findOne({email}).then(user => !!user);
};
const User = mongoose.model('User', UserSchema);
module.exports = User

