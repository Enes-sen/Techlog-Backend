const Comment = require("../models/comment");
const Post = require("../models/post");

const getAll = async (req, res) => {
  const postId = req.params.id;
  try {
    const comments = await Comment.find({ post: postId }).populate("user").populate("post");
    return res.status(200).json({ success: true, comments });
  } catch (err) {
    console.log(err.message);
    return res.json({
      success: false,
      message: err.message,
    });
  }
};

const addNewComment = async (req, res) => {
  const newComment = await new Comment({ ...req.body });
  try {
    await newComment.save();
    return res.status(201).json({ success: true, message: 'Yorum başarıyla eklendi.', addedComment: newComment });
  } catch (err) {
    console.log(err.message);
    return res.json({
      success: false,
      message: err.message,
    });
  }
};

const deleteAComment = async (req, res) => {
  const commentId = req.params.id;
  try {
    const comment = await Comment.findById(commentId);
    const post = await Post.findByIdAndUpdate(
      comment.post,
      {
        $pull: { comments: commentId },
        $inc: { commentCount: -1 },
      },
      { new: true }
    );

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    console.log("Deleted comment:", deletedComment, 'from post:', post);

    res.json({
      success: true,
      message: "Deleted this comment: " + deletedComment + ' from this post ' + post,
      updatedPost: post,
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.message,
    });
  }
};
const addCommentLike = async (req, res) => {
  const { id, userid } = req.params;

  try {
    const comment = await Comment.findById(id);

    if (!comment.likes.includes(userid)) {
      comment.likes.push(userid);
      comment.likeCount = comment.likes.length;
      await comment.save();

      return res.json({
        success: true,
        message: "Yorum beğenisi eklendi.",
      });
    } else {
      return res.json({
        success: false,
        message: "Bu kullanıcı zaten bu yorumu beğenmiş.",
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

const deleteCommentLike = async (req, res) => {
  const { id, userid } = req.params;

  try {
    let comment = await Comment.findById(id);
    if (!comment.likes.includes(userid) || comment.likes.length <= 0 || comment.likeCount <= 0) {
      if (comment.likes.length === 0) {
        comment.likeCount = 0;
        await comment.save();
      }

      return res.json({
        success: false,
        message: "Beğeni yapmadığınız için beğeni kaldıramazsınız.",
      });
    } else {
      comment = await Comment.findByIdAndUpdate(
        id,
        { $pull: { likes: userid }, $inc: { likeCount: -1 } },
        { new: true }
      );
      return res.json({
        success: true,
        message: "Beğeni başarıyla kaldırıldı.",
      });
    }
  } catch (err) {
    console.log("err:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


module.exports = {
  getAll,
  addNewComment,
  deleteAComment,
  deleteCommentLike,
  addCommentLike
};
