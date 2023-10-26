//hàm tiện ích mã hóa password sử dụng công nhệ crypto(mã hóa theo chuẩn SHA256)
import { createHash } from 'crypto'
import { config } from 'dotenv'

//tạo 1 hàm nhận vào chuỗi là mã hóa theo chuẩn là sha256
function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}
//hàm nhận vào password và trả về password đã mã hóa

export function hashPassword(password: string) {
  return sha256(password + process.env.PASSWORD_SECRET) //Mật khẩu bí mật lưu trong .env
}
