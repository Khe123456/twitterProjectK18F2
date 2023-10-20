import { Router } from 'express'
import { loginValidator, registerValidator } from '~/middlewares/user.middlewares'
import { loginController, registerController } from '~/controllers/user.controller'

const userRoute = Router()
userRoute.get('/login', loginValidator, loginController) //loginValidator là nằm trong middleware, còn loginController là trong Controller//khi truy cập vào login se lập tức chạy loginvalidator(middleware) ròi mới tới controller

// Description: Register new user
//Path: /register
//Method: POST
/*
body:{
    name: string
    email: string
    password: string
    confirm_password: string
    date_of_birth: string theo v=chuẩn ISO 8601
}
*/
userRoute.post('/register', registerValidator, registerController) //register là đẩy dữ liệu lên nên ở đây là .post

export default userRoute
