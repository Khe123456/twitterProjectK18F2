//luu trữ file định nghĩa route(định nghĩa các tuyến đường giúp ứng dụng phân biệt các yêu cấu khác nhau)
import { Router } from 'express'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/user.middlewares'
import { loginController, logoutController, registerController } from '~/controllers/user.controller'
import { error } from 'console'
import { wrapAsync } from '~/utils/handlers'

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
export default userRoute
