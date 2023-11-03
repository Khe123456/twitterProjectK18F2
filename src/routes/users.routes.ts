//luu trữ file định nghĩa route(định nghĩa các tuyến đường giúp ứng dụng phân biệt các yêu cấu khác nhau)
import { Router } from 'express'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/user.middlewares'
import {
  emailVerifyTokenController,
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  verifyForgotPasswordTokenController
} from '~/controllers/user.controller'
import { error } from 'console'
import { wrapAsync } from '~/utils/handlers'
import { wrap } from 'module'

const userRoute = Router()
/*
1 login cần có:(post lên cho mình 1 email và password)
des: đăng nhập
path: /users/login
method: POST
body: {email, password} //khi mà validate/đăng nhập ta sẽ dùng email và password
*/

userRoute.get('/login', loginValidator, wrapAsync(loginController)) //loginValidator là nằm trong middleware, còn loginController là trong Controller//khi truy cập vào login se lập tức chạy loginvalidator(middleware) ròi mới tới controller

// Description: Register new user
//Path: /register(đường dẫn)
//Method: POST
/*
body:{
    name: string
    email: string
    password: string
    confirm_password: string (đặt tên = _ do thuộc tính  trong mongo là testcase)
    date_of_birth: string theo chuẩn ISO 8601 (do đưa lên theo kiểu json=> string)
}
*/
userRoute.post('/register', registerValidator, wrapAsync(registerController)) //đặt hàm xử lý lỗi trên app tổng(index)=> app.use(defaultErrorHandler)
//do registercontrolller(có asyn=> cần dùng try-catch, dùng hàm wrapAsyn có khuôn cấu trúc sẵn try-catch bọc lại)

/*
  des: lougout(đăng xuất)
  path: /users/logout
  method: POST
  Headers: {Authorization: 'Bearer <access_token>'}
  body: {refresh_token: string}
  */
userRoute.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController)) //ta sẽ thêm middleware sau
/**
 des: verify email token
 khui nguoi dung dki ho se nhan dc mail co link dạng
 http://localhost:3000/users/verify-email?token=<email_verify_token>
 neu ma em nhap vao link thi se tao ra req gui len mail_verify_token len server
 server ktra  email_verify_token co hop le hay ko
 thi tu decoded_email_verify_token lay ra user_id
 va va0 user_id đó de update email_verify_token thành ''(rỗng), verify = 1, update_at
 path: /users/verify-email
 method:POST
 body: {email_verify_token: string}
 */
userRoute.post('/verify-email', emailVerifyTokenValidator, wrapAsync(emailVerifyTokenController))

/*
des: resend email verify token
khi mail thất lạc hoac email_verify_token hết hạn thì người dùng có nhu cầu resend email_verify_token

method: post
path: /uers/resend-verify-email
headers: {Authorization: "Bearer <access_token>"}// dang nhap dc mới resend //do truyền access nên header hợp lý hơn
body: {}
*/
userRoute.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendEmailVerifyController))

/*
des: khi người dùng quên mat khau ho gừi email de xin mình tạo cho họ 1 cái forgot-password
path: /users/forgot-password
method: POST
body: {email: string}
*/
userRoute.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))

/*
Khi nguoi dung nhap vao link trong email de reset password họ sẽ gửi 1 req kem fforgotpaassword len server 
server se kiem tra forgotpassword_token co hop le hay ko
sau do chuyen huong nguyoi dung den trang reset password
path: /users/verify-forgot-password
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen đc
body: {forgot_password_token: string}
*/
userRoute.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordTokenController)
)
export default userRoute

/*
des: reset password
path: '/reset-password'
method: POST
Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen đc
body: {forgot_password_token: string, password: string, confirm_password: string}
*/
userRoute.post(
  '/reset-password',
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator,
  wrapAsync(resetPasswordController)
)
