import User from '~/models/schema/user.schema'
import databaseService from './database.services'
import { RegisterReqBody } from '~/models/requests/User.request'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enums'

class UsersService {
  //hàm nhận vào user_Id và bỏ vào payload de tạo access_Token
  private signAcessToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.ACESS_TOKEN_EXPIRE_IN }
    })
  }

  //hàm nhận vào user_Id và bỏ vào payload de tạo refresh_Token
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: { expiresIn: process.env.ACESS_TOKEN_EXPIRE_IN }
    })
  }

  async checkEmailExist(email: string) {
    const users = await databaseService.users.findOne({ email })
    return Boolean(users)
  }
  async register(payload: RegisterReqBody) {
    //biến thành object để khi viết code và đọc nó tường minh hơn//payload: là cái dữ liệu đưa lên đưa về

    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const user_id = result.insertedId.toString()

    return result
  }
}
const usersService = new UsersService()
export default usersService
