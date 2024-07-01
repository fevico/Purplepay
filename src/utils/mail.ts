import nodemailer from 'nodemailer';
const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAIL_TRAP_USER,
      pass: process.env.MAIL_TRAP_PASS,
    },
  });

export const sendVerificationToken = async(email: string, token: string)=>{
   
      await transport.sendMail({
        from: "no-reply@example.com",
        to:email,
        subject: "Verify your account",
        html: `Kindly use the otp to verify your account ${token}`,
      });
}

// export const sendForgetPasswordToken = async(email: string, token: string)=>{
   
//   await transport.sendMail({
//     from: "no-reply@example.com",
//     to:email,
//     subject: "Verify your account",
//     html: `Kindly use the otp to reset your password ${token}`,
//   });
// }

// export const sendResetPasswordMail = async(email: string, fisrtName: string)=>{
   
//   await transport.sendMail({
//     from: "no-reply@example.com",
//     to:email,
//     subject: "Verify your account",
//     html: `Hello! ${fisrtName} Your pasword has been updated successfully you can now sign in with your new password`,
//   });
// }

const mail = {
    sendVerificationToken,
    // sendForgetPasswordToken,
    // sendResetPasswordMail
};
export default mail
