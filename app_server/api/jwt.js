const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const {expressjwt} = require("express-jwt");
// const {expressJwt} = require('express-jwt');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const generateAuthToken = (userId) => {
    // return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    return jwt.sign({userId}, JWT_SECRET, {expiresIn: '1h'});
};

const generateRefreshToken = (userId) => {
    console.log(process.env.REFRESH_SECRET ?? "oo")
    return jwt.sign({userId}, process.env.REFRESH_SECRET, {expiresIn: '7d'});
};

const verifyJWT = (token) => {

    jwt.verify(token, process.env.JWT_SECRET, (err, userId) => {
        console.log(err)
        if (err) return res.sendStatus(403)

        req.user = user

        next()
    })
}
const jwtAuth = expressjwt({secret: JWT_SECRET, algorithms: ['HS256']});
module.exports = {generateRefreshToken, verifyJWT, generateAuthToken, jwtAuth}