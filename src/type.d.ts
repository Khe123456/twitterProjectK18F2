///file này dùng để dinh nghĩa lại Req truyền lên từ client (nhung thk muốn làm rõ)
import { Request } from 'express'
declare module 'express' {
  interface Request {
    user?: User
  }
}
