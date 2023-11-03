//=> lưu vào thư mục models => requests=> sau này có req nào cần định nghĩa body thì nhét vào đây

import { JwtPayload } from 'jsonwebtoken'
import { TokenType } from '~/constants/enums'

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
