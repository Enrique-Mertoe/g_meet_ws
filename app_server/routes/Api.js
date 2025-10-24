const express = require('express');
const {jwtAuth} = require("../api/jwt");
const {ApiBuilder} = require("../api/ApiBuilder");

const router = express.Router();

/* GET users listing. */
router.post('/v1', jwtAuth, function (req, res, next) {
    ApiBuilder(req, res).build(b => {
        res.status(b.status).json(b.data)
    })
});
router.post('/auth',function (req, res, next) {
    ApiBuilder(req, res).build(b => {
        res.status(b.status).json(b.data)
    })
});
router.post('/meeting',function (req, res, next) {
    ApiBuilder(req, res).build(b => {
        res.status(b.status).json(b.data)
    })
});

module.exports = router;
