const { createRoomId } = require('../controllers/room');
const express = require('express');
const router = express();


router.get('/create',createRoomId)


module.exports = router;