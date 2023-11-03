//src/controllers: Chứa các file nhận request, gọi đến service để xử lý logic nghiệp vụ, trả về response
//3
import { Request, Response } from 'express'
import User from '~/models/schema/user.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayLoad,
  VerifyEmailReqBody,
  loginReqBody,
  logoutReqBody
} from '~/models/requests/User.request'
import { ErrorWithStatus } from '~/models/Errors'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'
import HTTP_STATUS from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enums'

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

export const emailVerifyTokenController = async (
  req: Request<ParamsDictionary, any, VerifyEmailReqBody>,
  res: Response
) => {
  //nếu mà code vào được đây nghĩa là email_verify_token hợp lệ
  //và mình da lay dc decoded_email_verify_token
  const { user_id } = req.decoded_email_verify_token as TokenPayLoad
  //dua vao user_id tìm user và xem thử nó đã verify chưa?
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (user === null) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }

  //nếu mà verify roi thì ko can verify nữa
  if (user.verify === UserVerifyStatus.Verified && user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  //nếu mà ko khớp email_verify_token
  if (user.email_verify_token !== (req.body.email_verify_token as string)) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INCORRECT,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }
  //nếu mà xún dc day co nghia la user chưa verify
  //mình se update lại user đó
  const result = await usersService.verifyEmail(user_id)
  return res.json({
    message: USERS_MESSAGES.VERIFY_EMAIL_SUCCESS,
    result
  })
}

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  //nếu mà vào đc đây có nghĩa là access_token hộp lệ
  //và mình da ;ấy dc decoded_authorization
  const { user_id } = req.decoded_email_verify_token as TokenPayLoad
  //dua vao user_id tìm user và xem thử nó đã verify chưa?
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (user === null) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  if (user.verify === UserVerifyStatus.Verified && user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  if (user.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_BANNED,
      status: HTTP_STATUS.FORBIDDEN //403
    })
  }
  //nếu mà xún dc day co nghia la user chưa verify: mình sẽ tao lại email_verify_token
  //mình se update lại user đó
  const result = await usersService.resendEmailVerify(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (req: Request, res: Response) => {
  //lấy user_id từ cái user cua req
  const { _id } = req.user as User
  //dùng _id tìm và cap nhat lai user them vao forgot_pwd_token
  const result = await usersService.forgotPassword((_id as ObjectId).toString())
  return res.json(result)
}

export const verifyForgotPasswordTokenController = async (req: Request, res: Response) => {
  //nếu đã đến bước này nghĩa là ta đã tìm có forgot_password_token hợp lệ
  //và đã lưu vào req.decoded_forgot_password_token
  //thông tin của user
  //ta chỉ cần thông báo rằng token hợp lệ
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetPasswordController = async (
  //muồn đổi mật khẩu thì cần user_id và password mới
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
  //next: NextFunction
) => {
  //middleware resetPasswordValidator đã chạy rồi, nên ta có thể lấy đc user_id từ decoded_forgot_password_token
  const { user_id } = req.decoded_forgot_password_token as TokenPayLoad
  const { password } = req.body
  //vào database tìm user thông qua user_id này và cập nhật lại password mới
  //vì vào database nên ta sẽ code ở user.services
  const result = await usersService.resetPassword({ user_id, password }) //ta chưa code resetPassword
  return res.json(result)
}
