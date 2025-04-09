const express = require('express');
const ApiBuilder = require("../api/ApiBuilder");

const router = express.Router();

/* GET users listing. */
router.post('/v1', function (req, res, next) {
    ApiBuilder(req, res).build(b => {
        res.status(b.status).json(b.data)
    })

});

module.exports = router;
