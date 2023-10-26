//luu trữ file định nghĩa route(định nghĩa các tuyến đường giúp ứng dụng phân biệt các yêu cấu khác nhau)
import { Router } from 'express'
import { loginValidator, registerValidator } from '~/middlewares/user.middlewares'
import { loginController, registerController } from '~/controllers/user.controller'
import { error } from 'console'
import { wrapAsync } from '~/utils/handlers'

const userRoute = Router()
/*
des: đăng nhập
path: /users/login
method: POST
body: {email, password}
*/

userRoute.get('/login', loginValidator, loginController) //loginValidator là nằm trong middleware, còn loginController là trong Controller//khi truy cập vào login se lập tức chạy loginvalidator(middleware) ròi mới tới controller

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
userRoute.post('/register', registerValidator, wrapAsync(registerController))

export default userRoute
