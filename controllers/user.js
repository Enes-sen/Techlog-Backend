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
        message: "Parola en az 6 karakter içermelidir.",
      });
    }

    const newUser = await User.create({ name, email, password });
    res.status(201).json({ success: true, newUser });
    console.log(newUser);
  } catch (err) {
    console.log("Hata mesajı: " + err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.json({
        success: false,
        message: "Geçersiz e-posta formatı.",
      });
    }

    if (!user) {
      return res.json({
        success: false,
        message: "Bu e-postaya sahip kullanıcı bulunamadı.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.json({
        success: false,
        message: "Yanlış parola.",
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
      message: "Giriş başarısız.",
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
      err: "Geçersiz bir e-posta adresi gönderdiniz.",
    });
  }

  if (!user) {
    return res.json({
      success: false,
      err: "Bu e-posta adresiyle ilişkili bir kullanıcı bulunamadı.",
    });
  }

  const resetPasswordToken = await user.getResetPasswordToken();
  await user.save();

  const emailTemplate = `
    <h3>Şifrenizi Sıfırlayın</h3>
    <p>Bu belirteç: ${resetPasswordToken} 1 saat içinde geçerli olacaktır.</p>
  `;

  // Calculate time to expire
  const timeToExpire = user.resetPasswordExpire - Date.now();
  const minutesToExpire = timeToExpire / 1000 / 60; // Convert time interval from milliseconds to minutes
  const minutesLeft = 60 - minutesToExpire;

  try {
    await sendEmail({
      from: process.env.SMTP_USER,
      to: resetEmail,
      subject: "Şifre Sıfırlama Belirteci",
      html: emailTemplate,
    });

    return res.status(200).json({
      success: true,
      message: "E-posta gönderildi.",
      data: user,
      timeToExpire: minutesLeft,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.save();

    console.log("Error message: " + err);

    return res.json({
      success: false,
      err: "E-posta gönderme işlemi başarısız oldu:",
      error: err,
    });
  }
};

const changePassword = async (req, res) => {
  const { resetPasswordToken, password } = req.body;

  if (!resetPasswordToken) {
    return res.json({
      success: false,
      message: "Lütfen geçerli bir belirteç sağlayın.",
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
        message: "Geçersiz belirteç veya oturum süresi doldu.",
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
      message: "Şifre başarıyla değiştirildi.",
      data: user,
    });
  } catch (err) {
    console.log("Error message: " + err);
    return res.json({
      success: false,
      message: "Şifre değiştirme başarısız oldu.",
    });
  }
};

const logout = async (req, res, next) => {
  return res.json({
    success: true,
    message: "Çıkış başarılı.",
  });
};

const sendMail = async (req, res) => {
  const { message, subject, email } = req.body;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.json({
      success: false,
      err: "Geçersiz bir e-posta adresi gönderdiniz veya bu bir e-posta adresi değil.",
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
    console.log("Error message: " + err);
    return res.json({
      success: false,
      err: "E-posta gönderme işlemi başarısız oldu:",
      error: err,
    });
  }
};

const findUserById = async (req, res) => {
  const id = req.params.id;

  try {
    const foundUser = await User.findById(id);
    res.json({
      success: true,
      data: foundUser,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
};

const uploadPhoto = async (req, res, next) => {
  try {
    // If the photo upload is successful, the file path will be available in req.savedImage
    if (req.savedImage) {
      // Update the user with the file path
      const userId = req.params.id;
      const photoUrl = path.join('public/uploads', req.savedImage);
      console.log("Photo request:", photoUrl);

      const user = await User.findByIdAndUpdate(userId, {
        "profile_image": photoUrl
      }, {
        new: true,
        runValidators: true
      });

      // Return a successful response
      return res.status(200).json({ success: true, message: "Fotoğraf başarıyla yüklendi", user });
    } else {
      // If the photo upload fails
      throw new Error("Fotoğraf yükleme işlemi başarısız oldu");
    }
  } catch (err) {
    // Return an error response in case of an error
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getUserImage = (req, res) => {
  const fileName = req.params.filename;
  const imagePath = path.join(__dirname, '../public/uploads', fileName);
  res.sendFile(imagePath);
};

const getAll = async (req, res) => {
  try {
    const users = await User.find({});
    res.json({
      success: true,
      users
    });
  } catch (err) {
    console.log("Error message:" + err.message);
    res.json({
      success: false,
      message: err.message
    });
  }
};

module.exports = {
  register,
  login,
  findUserById,
  forgotPassword,
  changePassword,
  logout,
  getUserImage,
  getAll,
  sendMail,
  uploadPhoto,
};
