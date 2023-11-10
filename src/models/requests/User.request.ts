//=> lưu vào thư mục models => requests=> sau này có req nào cần định nghĩa body thì nhét vào đây

import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enums'

//những định nghĩa liên quan đến class user
export interface RegisterReqBody {
  //interface: dùng để định nghĩa
  name: string //toàn là chuỗi do ở đây là định nghĩa giá trị
  email: string //mà giá trị là do người dùng đưa lên = json
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface loginReqBody {
  email: string
  password: string
}

export interface logoutReqBody {
  refresh_token: string
}

export interface TokenPayLoad extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
}

export interface VerifyEmailReqBody {
  email_verify_token: string
}

export interface VerifyForgotPasswordReqBody {
  forgot_password_token: string
}

export interface ResetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}

export interface UpdateMeReqBody {
  name?: string
  date_of_birth?: string //vì ngta truyền lên string dạng ISO8601, k phải date
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}
export interface GetProfileReqParams extends ParamsDictionary {
  username: string
}

export interface FollowReqBody {
  followed_user_id: string
}
export interface UnfollowReqParams {
  user_id: string
}
//thêm import
import { ParamsDictionary } from 'express-serve-static-core'
//cho UnfollowReqParams kế thừa ParamsDictionary
export interface UnfollowReqParams extends ParamsDictionary {
  user_id: string
}

export interface ChangePasswordReqBody {
  old_password: string
  password: string
  confirm_password: string
}
export interface RefreshTokenReqBody {
  refresh_token: string
}

//ta làm luôn cho GetProfileReqParams

//vì đây là route patch nên ngta truyền thiếu 1 trong các prop trên cũng k sao
