import sendMail from "../middlewares/sendMail.js";
import { User } from "../models/User.js";
import jwt from 'jsonwebtoken';

export const loginUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "❌ Email is required" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email });
    }

    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

    const verifyToken = jwt.sign({ userId: user._id, otp }, process.env.Activation_sec, {
      expiresIn: "5m",
    });

    await sendMail(email, "ChatBot OTP", `Your OTP is: ${otp}`);

    res.status(200).json({
      message: "📧 OTP sent to your email",
      verifyToken,
    });

  } catch (error) {
    console.error("❌ Error in loginUser:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { otp, verifyToken } = req.body;

    if (!otp || !verifyToken) {
      return res.status(400).json({ message: "OTP and token are required." });
    }

    const decoded = jwt.verify(verifyToken, process.env.Activation_sec);

    if (parseInt(decoded.otp) !== parseInt(otp)) {
      return res.status(400).json({ message: "❌ Wrong OTP" });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.Jwt_sec, {
      expiresIn: "5d",
    });

    res.json({
      message: "✅ Logged in Successfully",
      user,
      token,
    });

  } catch (error) {
    console.error("❌ Error in verifyUser:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error("❌ Error in myProfile:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
