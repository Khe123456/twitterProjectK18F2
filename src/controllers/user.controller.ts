//src/controllers: Chứa các file nhận request, gọi đến service để xử lý logic nghiệp vụ, trả về response
//3
import { Request, Response } from 'express'
import User from '~/models/schema/user.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody, loginReqBody, logoutReqBody } from '~/models/requests/User.request'
import { ErrorWithStatus } from '~/models/Errors'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'

export const loginController = async (req: Request<ParamsDictionary, any, loginReqBody>, res: Response) => {
  //dù lả controller hay middleware thì bản chất nó vẫn là request handler=> có next vẫn đúng(với mỗi req handle thì chúng ta sẽ có 3 tham số là req, res, next. nếu ko dùng next thì ko cần khai báo vẫn đc)
  //nếu ko import 2 thk này nó sẽ hiểu mình dang xài của FetchAPI chứ ko phải express
  //lấy user_id từ user của request
  const user = req.user as User //lấy user ra từ req(param,body,query)
  const user_id = user._id as ObjectId //object_id //code như vậy vì chưa định nghĩa bên trong req có gì(type.d.ts)
  //dùng user_id để tạo access_token và refresh_token //vì muốn kí 1 chữ ký thì token mặc định đc dùng để định danh 1 đối tượng. mà user_id phải định danh đối tượng=>(dấu cái user_id vào trong payload của token)=> mún kí 1 access và refreshtoken phải user_id. Nếu hồi này mình ko lưu thk user lại thì chỗ này mình phải query để lấy(trong user.middleware dòng 42: req.user = user)
  const result = await usersService.login(user_id.toString()) //.toString( vì khi tạo hàm login ta sẽ truyền user_id dưới dạng string nhưng controller thì user_id lấy từ _id mà _id là 1 objectid(id tạo từ mongo) => đúng là phải toString()) //login này sẽ tạo access và refresh token //login này chưa làm(tạo acess và refresh token)
  //response access_token và refresh_token cho client:vì nó dnhap thành công. nếu ko tcong: dính lỗi bên validation
  res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  //req:params, responsebody, requestbody
  const result = await usersService.register(req.body) //phải định nghĩa ko thì nó là any => nta mún ytruyen62 vào gì cũn được
  //=> lưu vào thư mục models => requests=> sau này có req nào cần định nghĩa body thì nhét vào đây
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, logoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  //logout se nhận vào refreshToken để tìm và xóa
  const result = await usersService.logout(refresh_token)
  res.json(result)
}
