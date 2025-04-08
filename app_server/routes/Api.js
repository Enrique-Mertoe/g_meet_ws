const express = require('express');
const ApiBuilder = require("../api/ApiBuilder");

const router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    ApiBuilder(req, res).build(b => {
        res.status(b.status).json(b.data)
    })

});

module.exports = router;
