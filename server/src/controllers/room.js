const Room = require('../models/room');

async function createRoomId(req, res) {


    // generating unique 6 digit id 


    function generateId(){
         let id = Math.floor(Math.random() * 900000) + 100000;
         return id;
    }

    // check with db
    let permaId ;
    let cnt = 900001;
    while(cnt--){
        const id = generateId();
        const roomID = await Room.findOne({roomId:id});
        if(!roomID){
            permaId = id;
            break;
        }
    }

    // not the best method will add caching later

    if(cnt == 0){
        return res.status(500).json({msg:"Sorry no more rooms availabe will fix it shortly"});
    }

    return res.status(201).json({ Id: permaId });
}
async function getRoomInfo(roomId) {
    const room = await Room.findOne({ roomId });
    return room?.shapes || {};
}


async function bulkUpdate(updates) {
    try {
        await Promise.all(
            updates.map(({ roomId, shapes }) =>
                Room.findOneAndUpdate(
                    { roomId },
                    { $set: { shapes } },
                    { upsert: true, new: true }
                )

            )
        );
        console.log('Updated successfully');
    } catch (err) {
        console.error('Bulk update error:', err);
    }
}


module.exports = { createRoomId, getRoomInfo, bulkUpdate };