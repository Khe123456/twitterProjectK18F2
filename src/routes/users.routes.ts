//luu trữ file định nghĩa route(định nghĩa các tuyến đường giúp ứng dụng phân biệt các yêu cấu khác nhau)
import { Router } from 'express'
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/user.middlewares'
import {
  changePasswordController,
  emailVerifyTokenController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  oAuthController,
  refreshTokenController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  unfollowController,
  updateMeController,
  verifyForgotPasswordTokenController
} from '~/controllers/user.controller'
import { error } from 'console'
import { wrapAsync } from '~/utils/handlers'
import { wrap } from 'module'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.request'

const userRoute = Router()
/*
1 login cần có:(post lên cho mình 1 email và password)
des: đăng nhập
path: /users/login
method: POST
body: {email, password} //khi mà validate/đăng nhập ta sẽ dùng email và password
*/

userRoute.post('/login', loginValidator, wrapAsync(loginController)) //loginValidator là nằm trong middleware, còn loginController là trong Controller//khi truy cập vào login se lập tức chạy loginvalidator(middleware) ròi mới tới controller

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

/*
des: get profile của user
path: '/me'
method: get
Header: {Authorization: Bearer <access_token>}
body: {}
*/
userRoute.get('/me', accessTokenValidator, wrapAsync(getMeController))

userRoute.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'avatar',
    'username',
    'cover_photo'
  ]),
  updateMeValidator,
  wrapAsync(updateMeController)
)

/*
des: get profile của user khác bằng unsername
path: '/:username'
method: get
không cần header vì, chưa đăng nhập cũng có thể xem
*/
userRoute.get('/:username', wrapAsync(getProfileController))
//chưa có controller getProfileController, nên bây giờ ta làm

/*
des: Follow someone
path: '/follow'
method: post
headers: {Authorization: Bearer <access_token>}
body: {followed_user_id: string}
*/
userRoute.post('/follow', accessTokenValidator, verifiedUserValidator, followValidator, wrapAsync(followController))

//accessTokenValidator dùng dể kiểm tra xem ngta có đăng nhập hay chưa, và có đc user_id của người dùng từ req.decoded_authorization
//verifiedUserValidator dùng để kiễm tra xem ngta đã verify email hay chưa, rồi thì mới cho follow người khác
//trong req.body có followed_user_id  là mã của người mà ngta muốn follow
//followValidator: kiểm tra followed_user_id truyền lên có đúng định dạng objectId hay không
//  account đó có tồn tại hay không
//followController: tiến hành thao tác tạo document vào collection followers

/*
    des: unfollow someone
    path: '/follow/:user_id'
    method: delete
    headers: {Authorization: Bearer <access_token>}
  g}
    */
userRoute.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapAsync(unfollowController)
)
//unfollowValidator: kiểm tra user_id truyền qua params có hợp lệ hay k?

/*
  des: change password
  path: '/change-password'
  method: PUT
  headers: {Authorization: Bearer <access_token>}
  Body: {old_password: string, password: string, confirm_password: string}
g}
  */
userRoute.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapAsync(changePasswordController)
)
//changePasswordValidator kiểm tra các giá trị truyền lên trên body cớ valid k ?

/*
  des: refreshtoken
  path: '/refresh-token'
  method: POST
  Body: {refresh_token: string}
g}
  */
userRoute.post('/refresh-token', refreshTokenValidator, wrapAsync(refreshTokenController))
//khỏi kiểm tra accesstoken, tại nó hết hạn rồi mà
//refreshController chưa làm

userRoute.get('/oauth/google', wrapAsync(oAuthController))

export default userRoute
