///file này dùng để dinh nghĩa lại Req truyền lên từ client (nhung thk muốn làm rõ)(khi 1 client truyền lên thì req ko có user=> cần độ lại cho có=declare)
import { Request } from 'express'
import { TokenPayLoad } from './models/requests/User.request'
declare module 'express' {
  interface Request {
    user?: User //trong 1 req có thể có or ko có user
    decode_authorization?: TokenPayLoad
    decoded_refresh_token?: TokenPayLoad
    decoded_email_verify_token?: TokenPayLoad
    decoded_forgot_password_token?: TokenPayload
    decode_forgot_password_token?: TokenPayLoad
  }
}
