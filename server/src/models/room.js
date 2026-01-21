const mongoose = require('mongoose');
const roomSchema = new mongoose.Schema({
    roomId:{
        type:String,
        required:true,
        unique:true,
    },
    shapes:{
        type:Map,
        of:mongoose.Schema.Types.Mixed,
        default:{}
    }
},{timestamps:true});

const Room = mongoose.model("Room",roomSchema);

module.exports = Room;