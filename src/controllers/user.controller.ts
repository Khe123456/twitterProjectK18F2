//src/controllers: Chứa các file nhận request, gọi đến service để xử lý logic nghiệp vụ, trả về response
//3
import { Request, Response } from 'express'
import User from '~/models/schema/user.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.request'

export const loginController = async (req: Request, res: Response) => {
  //nếu ko import 2 thk này nó sẽ hiểu mình dang xài của FetchAPI chứ ko phải express
  //lấy user_id từ user của request
  const { user }: any = req
  const user_id = user._id //object_id
  //dùng user_id để tạo access_token và refresh_token
  const result = await usersService.login(user_id.toString()) //login này sẽ tạo access và refresh token
  //response access_token và refresh_token cho client
  res.json({
    message: 'login successfully',
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  //req:params, responsebody, requestbody
  const result = await usersService.register(req.body) //phải định nghĩa ko thì nó là any => nta mún ytruyen62 vào gì cũn được
  //=> lưu vào thư mục models => requests=> sau này có req nào cần định nghĩa body thì nhét vào đây
  return res.json({
    message: 'Register successfully',
    result
  })
}
