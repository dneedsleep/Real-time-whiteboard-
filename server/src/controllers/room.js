const Room = require('../models/room');
const Counter = require('../models/counter')



async function createRoomId(req, res) {
    let roomId;
    await Counter.findOneAndUpdate(
        { id: "autoval" },
        { "$inc": { "seq": 1 } },
        { new: true }
    ).then(async function (cd) {
        if (cd == null) {
            const newVal = new Counter({ id: "autoval", seq: 1 });
            newVal.save();
            roomId = 1
        } else {
            roomId = cd.seq;
        }
    }).catch(function (err) {
        res.status(500).json({ err: err });
    })

    console.log(roomId);
    res.status(201).json({ Id: roomId });

}


async function getRoomInfo(roomId) {
    const room = await Room.findOne({ roomId:roomId });
    return room?.shapes || {};
}


async function bulkUpdate(updates) {
    try {
        await Promise.all(
            updates.map(({ roomId, shapes }) =>
                Room.findOneAndUpdate(
                    { roomId:roomId},
                    { $set: { shapes } },
                    { upsert: true, new: true }
                )

            )
        );
        //console.log('Updated successfully');
    } catch (err) {
        console.error('Bulk update error:', err);
    }
}


module.exports = { createRoomId, getRoomInfo, bulkUpdate };