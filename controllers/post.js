const Post = require("../models/post");

const getAll = async (req, res) => {
    try {
      const allPosts = await Post.find({}).populate('user');
      res.json({
        success: true,
        posts: allPosts
      });
    } catch (err) {
      console.log("hata: " + err);
      res.status(500).json({
        success: false,
        error: "Server error"
      });
    }
  };
  
const getOne = async (req,res)=>{
    const id = req.params.id;
    const getonepost =  await Post.findOne({_id:id}).populate('user');
    try {
        res.json({
            success:true,
            post:getonepost
        });
    } catch (err) {
        console.log("hata: "+err);
        res.json({
            success:false,
            message:err.message
        });
    }
}
const getAllbyuser = async (req,res) =>{
    const id = req.params.id;
    try {
        const alluserpost = await Post.find({user:id}).populate('user');
        res.json({
            success:true,
            User:id,
            posts:alluserpost
        });
        console.log(id);
    } catch (err) {
        console.log("hata: "+err);
    }
}
const addNewPost = async (req,res)=>{
    const info = req.body;
    console.log("answer of info:",info);
     try {
        if(info){
            const newpost = await Post.create({
                ...info
            });
            if(newpost){
                return res.json({
                    success:true,
                    newpost
                    

                });
            }
        }
     } catch (err) {
        console.log("hata mesajı",err.message);
        return res.json({
            success:false,
            hata:err.message,
            message:"post can't successfully sent"
        })
     }
}
const deleteOne = async (req,res)=>{
    const id = req.params.id;
    try {
        const deletedpost = await Post.findByIdAndDelete({_id:id});
        console.log("Deletedpost:",deletedpost);

        res.json({
            success:true,
            message:"post başarılı bir şekilde silindi",
            deletedone:deletedpost
        })
        
    } catch (err) {
        res.json({
            success:false,
            message:err.message
        })
    }
    
}
const addlike = async (req, res) => {
    const { id, userid } = req.params;
  
    try {
      const post = await Post.findById(id);
  
      
      }
  
      if (!post.likes.includes(userid)) {
        post.likes.push(userid);
        post.likeCount = post.likes.length;
        await post.save();
  
        return res.json({
          success: true,
          message: "Beğeni eklendi.",
        });
      } else {
        return res.json({
          success: false,
          message: "Bu kullanıcı zaten beğeni yapmış.",
        });
      }
    } catch (err) {
      console.log(err.message);
      return res.json({
        success: false,
        message: err.message,
      });
    }
  };
  const deletelike = async (req, res) => {
    const { id, userid } = req.params;
    try {
      let post = await Post.findById(id);
      if (!post.likes.includes(userid) || post.likes.length < 0 || post.likeCount <= 0) {
        if (post.likeCount < 0) {
          post.likeCount = 0;
        }
        return res.json({
          success: false,
          message: "Beğeni yapmadığınız için beğeni kaldıramazsınız"
        });
      } else {
        post = await Post.findByIdAndUpdate(
          id,
          { $pull: { likes: userid }, $inc: { likeCount: -1 } },
          { new: true }
        );
        return res.json({
          success: true,
          message: "Beğeni başarıyla kaldırıldı"
        });
      }
    } catch (err) {
      console.log("err:", err.message);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  };
  
  
  
  
  

module.exports = {
    getAll,
    getAllbyuser,
    addNewPost,
    getOne,
    addlike,
    deletelike,
    deleteOne 
};
