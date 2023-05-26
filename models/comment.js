const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Post = require("./post");

const CommentSchema = new Schema({
   content : {
        type : String,
        required : [true,"Please provide a content"],
        minlength : [20,"Please provide content at least 20 characters"]
    },
    createdAt : {
        type : Date,
        default : Date.now
    },
    likeCount : {
        type : Number,
        default : 0,
        min: 0
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
     post: {
        type : mongoose.Schema.ObjectId,
        ref : "Post",
        required : true
    }

});
CommentSchema.virtual("likesCount").get(function() {
    return this.likes.length;
});
CommentSchema.pre("save",async function(next){


    if (!this.isModified("user")) return next();

    try {
    
        const post = await Post.findById(this.post);

        post.comments.push(this.id);
        post.commentCount += 1;
        await post.save();
        next();
    }
    catch(err) {
        console.log("err:",err.message);
        next(err);
    }
 
});
CommentSchema.pre("remove", async function (next) {
    try {
      const post = await Post.findById(this.post);
  
      // Yorumun post.comments dizisinden kaldırılması
      post.comments.pull(this.id);
      post.commentCount -= 1;
      await post.save();
  
      next();
    } catch (err) {
      console.log("err:", err.message);
      next(err);
    }
  });
  


module.exports = mongoose.model("Comment",CommentSchema);