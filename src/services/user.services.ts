import User from '~/models/schema/user.schema'
import databaseService from './database.services'
import { RegisterReqBody } from '~/models/requests/User.request'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enums'
import RefreshToken from '~/models/schema/RefreshToken.schema'
import { ObjectId } from 'mongodb'

class UsersService {
  //hàm nhận vào user_Id(để định danh mình là ai) và bỏ vào payload để tạo access_Token
  private signAcessToken(user_id: string) {
    //userid phải viết thường mà trong Doc viết hoa => sai nặng
    //mình kí thì phải giấu=> private//Hàm kí access: token-type: accessToken
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      options: { expiresIn: process.env.ACESS_TOKEN_EXPIRE_IN } //ACESS_TOKEN_EXPIRE_IN: lưu cái hết hạn của accessToken //15m: 15 phút
    })
  }

  //hàm nhận vào user_Id và bỏ vào payload de tạo refresh_Token
  private signRefreshToken(user_id: string) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN }
    })
  }

  //ký access_token và refresh
  async signAcessAndRefreshToken(user_id: string) {
    return Promise.all([
      //ko cần dùng asyn await vì bản chất nó cũng chỉ để return về 1 Promise. còn thk nào xài mình thì nó tự động asyn await
      //Promise.all: kí cả 2 thằng 1 lúc cho lẹ do nó k ảnh hưởng tới nhau
      this.signAcessToken(user_id), //dùng kĩ thuật phân rã (mảng thì ngoặc vuông, oject thì ngoặc nhọn) lấy access và refresh
      this.signRefreshToken(user_id) //ở đây là cái mảng=>ngoặc vuông
    ])
  }

  async checkEmailExist(email: string) {
    //checkemail cấm trùng
    const users = await databaseService.users.findOne({ email }) //email:email nhưng 2 giá trị giống nhau thì email là đủ
    return Boolean(users) //có null: ép kiểu thành boolean =>false, object=> true
  }
  async register(payload: RegisterReqBody) {
    //regiaster nhận vào payload và payload đc dc=inh95 nghĩa = registerrequestbody
    //biến thành object để khi viết code và đọc nó tường minh hơn//payload: là cái dữ liệu đưa lên đưa về

    const result = await databaseService.users.insertOne(
      new User({
        //payload lúc này có name,email,pwd,confirmpwd,date_of_birth
        ...payload, //phân rã cái payload //bug:trong payload có dateofbirth, trong users cũng có date ofbirthoverride
        date_of_birth: new Date(payload.date_of_birth), //=>override dateofbirth sẽ lấy giá trị cuar dob kia, string ép kiểu thành Date(do người dùng đưa lên = json)
        password: hashPassword(payload.password) //khi tạo tkhoan thì payload đã có password=>ta sẽ độ lại pwd = hashpsd và pwd nó đưa lên cho mình
      })
    )
    const user_id = result.insertedId.toString() //lấy cái id(mã) để bem ra acess và refresh Token
    const [access_token, refresh_token] = await this.signAcessAndRefreshToken(user_id)
    //Promise.all: kí cả 2 thằng 1 lúc cho lẹ do nó k ảnh hưởng tới nhau
    // this.signAcessToken(user_id), //dùng kĩ thuật phân rã (mảng thì ngoặc vuông, oject thì ngoặc nhọn) lấy access và refresh
    //   this.signRefreshToken(user_id) //ở đây là cái mảng=>ngoặc vuông

    //lưu refresh_token vào database
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token } //trả cái object trả về access và refreshToken
  }
  async login(user_id: string) {
    //login nhận vào 1 user_id(dùng để tạo access và refreshToken)
    const [access_token, refresh_token] = await this.signAcessAndRefreshToken(user_id)
    //Promise.all: kí cả 2 thằng 1 lúc cho lẹ do nó k ảnh hưởng tới nhau
    // this.signAcessToken(user_id), //dùng kĩ thuật phân rã (mảng thì ngoặc vuông, oject thì ngoặc nhọn) lấy access và refresh
    //   this.signRefreshToken(user_id) //ở đây là cái mảng=>ngoặc vuông
    //lưu refresh_token vào database
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )

    return { access_token, refresh_token }
  }
}
const usersService = new UsersService()
export default usersService
