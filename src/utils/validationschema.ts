import * as yup from 'yup'

export const userSchema = yup.object({
    email: yup.string().email("Invalid email").required("Email is missing!"),
    password: yup.string().min(6, 'Password must be at least 6 characters').required("Email is missing!"),
  });

  export const updateProfile = yup.object({
    name: yup.string().required("Name is missing!"),
    email: yup.string().email("Invalid email").required("Email is missing!"),
    phone: yup.string().required("Phone is missing!"),
    address: yup.string().required("Address is missing!"),
  })