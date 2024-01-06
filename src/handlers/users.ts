import { comparePassword, createToken, hashPassword } from "../auth";
import prisma from "../db";
import { sendEmailVerification, sendPasswordReset } from "../util/emailHandler";
import {
  validateEmail,
  validatePasswordReset,
  validateSignIn,
  validateUser,
} from "../validators/user";

/*============================   REGISTRATION     ============================*/

/*============================   REGISTER USER     ============================*/
export const createNewUser = async (req, res) => {
  const { error } = validateUser(req.body);

  if (error) return res.status(400).json({ message: error.message });
  const { username, email, password } = req.body;

  const hashedPassword = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  });

  const token = createToken(newUser);
  console.log(token);
  await sendEmailVerification({ user: newUser });

  res
    .header("Authorization", `Bearer ${token}`)
    .status(201)
    .json({ message: "user created" });
};

/*============================   EMAIL VERIFICATION      ============================*/
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  const user = await prisma.user.findUnique({
    where: {
      emailVerificationToken: token,
    },
  });

  if (!user) return res.status(400).json({ message: "invalid token" });

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
    },
  });

  res.json({ message: "email verified" }).status(200);
};
/*============================  RESEND EMAIL VERIFICATION   ============================*/
export const resendEmailVerification = async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) return res.status(400).json({ message: "user not found" });

  sendEmailVerification({ user });

  res.json({ message: "email sent" }).status(200);
};
/*============================   Sign  In   ============================*/
export const signIn = async (req, res) => {
  const { error } = validateSignIn(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const { email, password, rememberMe } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid email or password." });

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid)
    return res.status(400).json({ message: "Invalid email or password." });
  const token = createToken(user, rememberMe);
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
  });
  let cookieOptions: any = {};
  if (rememberMe) {
    cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
  }

  res.status(200).send({ name: user.username });
};

/*============================   SIGN OUT     ============================*/
export const signOut = async (req, res) => {
  res.status(200).json({ message: "signed out" });
};

/*============================   CURRENT USER  (HTTP ONLY COOKIE)    ============================*/
export const currentUser = async (req, res) => {
  res.status(200).json({ name: req.user.name });
};

/*============================   GET USER     ============================*/
export const getUser = async (req, res) => {
  const email = req.body;
  const user = await prisma.user.findUnique({
    where: email,
  });
  if (!user) return res.status(200).json({ message: "user not found" });

  res.status(200).json({
    token: user.webAuthenToken,
  });
};

/*============================   ACCOUNT  RECOVERY     ============================*/

/*============================   SEND PASSWORD RESET LINK     ============================*/
export const sendPasswordResetLink = async (req, res) => {
  const { error } = validateEmail(req.body.email);
  if (error) return res.status(400).json({ message: error.message });

  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user)
    return res.status(400).json({
      message:
        "The email you entered does not match any account. Please check and try again",
    });

  await sendPasswordReset({ user });

  res.send(
    "A password reset link has been sent to your email address. The link will expire in 3 minutes."
  );
};
/*============================   RESET PASSWORD     ============================*/

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const user = await prisma.user.findUnique({
    where: {
      passwordResetToken: token,
    },
  });
  if (!user || user.passwordResetTokenExpires < new Date(Date.now())) {
    return res.status(400).json({ message: "invalid token" });
  }
  const { password, confirmPassword } = req.body;
  const { error } = validatePasswordReset(password, confirmPassword);
  if (error) return res.status(400).json({ message: error.message });

  if (password !== confirmPassword)
    return res.status(400).json({ message: "passwords do not match" });

  const oldPassword = await comparePassword(password, user.password);
  if (oldPassword)
    return res
      .status(400)
      .json({ message: "password cannot be the same as the old password" });

  const hashedPassword = await hashPassword(password);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
    },
  });

  res.json({ message: "password reset successful" }).status(200);
};
