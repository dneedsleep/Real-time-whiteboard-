const mongoose = require('mongoose')

const counterSchema = new mongoose.Schema({
    id:{
        type:String,
    },
    seq:{
        type:Number,
    }
})

const Counter = mongoose.model("Counter",counterSchema)

module.exports = Counter;