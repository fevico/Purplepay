import * as yup from 'yup'

export const userSchema = yup.object({
    email: yup.string().email("Invalid email").required("Email is missing!"),
    password: yup.string().min(6, 'Password must be at least 6 characters').required("Email is missing!"),
  });