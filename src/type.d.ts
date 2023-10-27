///file này dùng để dinh nghĩa lại Req truyền lên từ client (nhung thk muốn làm rõ)
import { Request } from 'express'
import { TokenPayLoad } from './models/requests/User.request'
declare module 'express' {
  interface Request {
    user?: User
    decode_authorization?: TokenPayLoad
    decoded_refresh_token?: TokenPayLoad
  }
}
