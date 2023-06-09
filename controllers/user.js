const User = require("../models/user.js");
const bcrypt = require("bcryptjs");
const path = require('path');
const jwt = require("jsonwebtoken");
const sendEmail = require("../helpers/sendEmail.js");
const multer = require('multer');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json({
        success: false,
        message: "Bu e-posta adresi zaten kayıtlı.",
      });
    }
    if (password.length < 6) {
      return res.json({
        success: false,
        message: "parola en az 6 karakter içermelidir ",
      });
    }

    const newUser = await User.create({ name, email, password });
    res.status(201).json({ success: true, newUser });
    console.log(newUser);
  } catch (err) {
    console.log("hata mesajı: " + err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};
const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select(
      "+password"
    );
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.json({
        success: false,
        message: "Geçersiz e-posta formatı",
      });
    }
    if (!user) {
      return res.json({
        success: false,
        message: "Bu e-postaya sahip kullanıcı bulunamadı",
      });
    }
    
    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!passwordMatch) {
      return res.json({
        success: false,
        message: "Yanlış parola",
      });
    }

    const token = user.getTokenFromUserModel();
    const decodedToken = jwt.decode(token);
    const expirationTime = decodedToken.exp;
    const remainingTime = expirationTime - Math.floor(Date.now() / 1000); // in seconds
    return res.json({
      success: true,
      loggedInUser: user,
      token: token,
      expiresIn: remainingTime,
    });
  } catch (err) {
    console.log("Error message: " + err);
    return res.json({
      success: false,
      message: "Login unsuccessful",
    });
  }
};

const forgotPassword = async (req, res, next) => {
  const resetEmail = req.body.email;
  const user = await User.findOne({ email: resetEmail });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(resetEmail)) {
    return res.json({
      success: false,
      err: "your sending not a valid e-mail adress",
    });
  }
  if (!user) {
    return res.json({
      success: false,
      err: "there is no such user with that email adress",
    });
  }

  const resetPasswordToken = await user.getResetPasswordToken();

  await user.save();

  const emailTemplate = `
      <h3>Reset Your Password</h3>
      <p>This token: ${resetPasswordToken} will expire in 1 hour</p>
  `;

  // calculate time to expire
  const timeToExpire = user.resetPasswordExpire - Date.now();
  const minutesToExpire = timeToExpire / 1000 / 60; // mili saniye cinsinden zaman aralığını dakika cinsine çevirir
  const minutesLeft = 60 - minutesToExpire;

  try {
    await sendEmail({
      from: process.env.SMTP_USER,
      to: resetEmail,
      subject: "Reset Password Token",
      html: emailTemplate,
    });

    return res.status(200).json({
      success: true,
      message: "Email Sent",
      data: user,
      timeToExpire: minutesLeft,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.save();

    console.log("err message: " + err);

    return res.json({
      success: false,
      err: "email sent operation failed because:",
      error: err,
    });
  }
};

const changePassword = async (req, res) => {
  const { resetPasswordToken, password } = req.body;

  if (!resetPasswordToken) {
    return res.json({
      success: false,
      message: "Please provide a valid token",
    });
  }

  try {
    let user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    console.log(user);

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid Token or Session Expired",
      });
    }

    // Hash the new password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    user = await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: user,
    });
  } catch (err) {
    console.log("Error message: " + err);
    return res.json({
      success: false,
      message: "Failed to change password",
    });
  }
};

const logout = async (req, res, next) => {
  return res.json({
    success: true,
    message: "Logout Successfull",
  });
};
const sendmail = async (req, res) => {
  const { message, subject, email } = req.body;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.json({
      success: false,
      err: "your sending not a valid e-mail adress or this is not a e-mail adress",
    });
  }

  const emailTemplate = `
  <h3>${subject}</h3>
  <p>${message}</p>
  
`;
  try {
    await sendEmail({
      from: email,
      to: process.env.SMTP_USER,
      subject: `${subject}`,
      html: emailTemplate,
    });
    res.json({
      success: true,
      from: email,
      to: process.env.SMTP_USER,
      subject: subject,
    });
  } catch (err) {
    console.log("err message: " + err);
    return res.json({
      success: false,
      err: "email sent operration faild because:",
      error: err,
    });
  }
};
const finduserbyId = async (req,res)=>{
  const id = req.params.id;
  try {
    const finded= await User.findById(id);
    res.json({
      success:true,
      data:finded
    }); 
  } catch (err) {
    console.log(err);
    res.json({
      success:false,
      message:err.message
    })
  }
}



const uploadphoto = async (req, res, next) => {
  try {
    // Fotoğraf yükleme işlemi başarılı olduysa, req.savedImage içerisinde dosya yolu bulunur
    if (req.savedImage) {
      // Dosya yoluyla birlikte kullanıcıyı güncelle
      const userId = req.params.id;
      const photoUrl = path.join('public/uploads', req.savedImage);
      console.log("req of photo:",photoUrl);

      const user = await User.findByIdAndUpdate(userId,{
        "profile_image" :photoUrl
    },{
        new: true,
        runValidators : true
    });

      // Başarılı yanıt döndür
      return res.status(200).json({ success: true, message: "Photo uploaded successfully",user });
    } else {
      // Fotoğraf yükleme işlemi başarısız olduysa
      throw new Error("Photo upload failed");
    }
  } catch (err) {
    // Hata durumunda hata yanıtı döndür
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getUserImage = (req, res) => {
  const fileName = req.params.filename;
  const imagePath = path.join(__dirname, '../public/uploads', fileName);
  res.sendFile(imagePath);
};
const getAll = async (req,res)=>{
  try{
    const users = await User.find({});
    res.json({
      success:true,
      users
    });
  } catch(err)
  {
    console.log("err message:"err.message);
    res.json({
      success:false,
      message:err.mesage
    })
  }
}
module.exports = {
  register,
  login,
  finduserbyId,
  forgotPassword,
  changePassword,
  logout,
  getUserImage,
  getAll,
  sendmail,
  uploadphoto,
};
