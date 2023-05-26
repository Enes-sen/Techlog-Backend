const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    imageUrl:{
        type: String,
    },
    title : {
        type : String,
        required:[true,"Please provide a title"],
        minlength : [5,"Please provide title at least 10 characters"]
    },
    content : {
        type : String,
        required : [true,"Please provide a content"],
        minlength : [10,"Please provide content at least 20 characters"]
    },
    createdAt : {
        type : Date,
        default : Date.now
    },
    likeCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    likes : [
        {
            type : mongoose.Schema.ObjectId,
            ref : "User"
        }
    ],
    
    user : {
        type : mongoose.Schema.ObjectId,
        ref : "User",
        required : true
    },
    commentCount  : {
        type:Number,
        default : 0
    },
    
    comments: [
        {
            type: mongoose.Schema.ObjectId, 
            ref: 'Comment' 
        }
    ]
});


PostSchema.virtual("likesCount").get(function() {
    return this.likes.length;
});


module.exports  = mongoose.model("Post", PostSchema);