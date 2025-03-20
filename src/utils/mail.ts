import nodemailer from 'nodemailer';
import { MailtrapClient } from "mailtrap";

const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAIL_TRAP_USER,
      pass: process.env.MAIL_TRAP_PASS,
    },
  });

  const ENDPOINT = "https://send.api.mailtrap.io/";
  const MAILTRAP_TOKEN = process.env.MAILTRAP_TOKEN!;

  interface MailtrapClientConfig {
    endpoint: string;
    token: string;
  }
  
  const clientConfig: MailtrapClientConfig = {
    endpoint: ENDPOINT,
    token: MAILTRAP_TOKEN
  }

  const client = new MailtrapClient(clientConfig);


export const sendVerificationToken = async(email: string, token: string)=>{

  const VERIFICATION_EMAIL = process.env.VERIFICATION_EMAIL as string;

  const sender = {
    email: VERIFICATION_EMAIL || "onboarding@email.propease.ca",
    name: "Purplepay",
  };
  const recipients = [
    {
      email,
    }
  ];
  
  client
  .send({
    from: sender,
    to: recipients,
    template_uuid: "f9a74832-8f39-46be-a435-76cffb4d01bc",
    template_variables: {
      "otp": token,
    }
  })
  
}

export const ForgetPasswordToken = async(email: string, token: string, name: string)=>{
   

  const VERIFICATION_EMAIL = process.env.VERIFICATION_EMAIL as string;

  const sender = {
    email: VERIFICATION_EMAIL || "onboarding@email.propease.ca",
    name: "Purplepay",
  };
  const recipients = [
    {
      email,
    }
  ];


  client
  .send({
    from: sender,
    to: recipients,
    template_uuid: "f6d872d6-1c12-46c1-a115-54929ef4572f",
    template_variables: {
      "user_name": name,
      "otp": token,
    }
  })

  // await transport.sendMail({
  //   from: "no-reply@example.com",
  //   to:email,
  //   subject: "Verify your account",
  //   html: `Kindly use the otp to reset your password ${token}`,
  // });
}

// export const sendResetPasswordMail = async(email: string, fisrtName: string)=>{
   
//   await transport.sendMail({
//     from: "no-reply@example.com",
//     to:email,
//     subject: "Verify your account",
//     html: `Hello! ${fisrtName} Your pasword has been updated successfully you can now sign in with your new password`,
//   });
// }





// const client = new MailtrapClient({ endpoint: ENDPOINT, token: TOKEN });


const mail = {
    sendVerificationToken,
    ForgetPasswordToken,
    // sendResetPasswordMail
};
export default mail
