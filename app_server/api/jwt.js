// You can replace this with your JWT generation logic
const generateAuthToken = (userId) => {
    // return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    return "dummy-auth-token";
};

const generateRefreshToken = (userId) => {
    // return jwt.sign({ id: userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
    return "dummy-refresh-token";
};

module.exports = {generateRefreshToken, generateAuthToken}