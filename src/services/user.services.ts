import User from '~/models/schema/user.schema'
import databaseService from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.request'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import RefreshToken from '~/models/schema/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'
import { resetPasswordValidator } from '~/middlewares/user.middlewares'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'
import { Follower } from '~/models/schema/followers.schema'
import axios from 'axios'

class UsersService {
  //hàm nhận vào user_Id(để định danh mình là ai) và bỏ vào payload để tạo access_Token
  private signAcessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    //userid phải viết thường mà trong Doc viết hoa => sai nặng
    //mình kí thì phải giấu=> private//Hàm kí access: token-type: accessToken
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      options: { expiresIn: process.env.ACESS_TOKEN_EXPIRE_IN }, //ACESS_TOKEN_EXPIRE_IN: lưu cái hết hạn của accessToken //15m: 15 phút
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }

  //hàm nhận vào user_Id và bỏ vào payload de tạo refresh_Token
  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken, verify },
      options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }
  //hàm sign email verify token
  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken, verify },
      options: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRETE_EMAIL_VERIFY_TOKEN as string
    })
  }
  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken, verify },
      options: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN },
      privateKey: process.env.JWT_SECRETE_FORGOT_PASSWORD_TOKEN as string
    })
  }

  //ký access_token và refresh
  private signAcessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([
      //ko cần dùng asyn await vì bản chất nó cũng chỉ để return về 1 Promise. còn thk nào xài mình thì nó tự động asyn await
      //Promise.all: kí cả 2 thằng 1 lúc cho lẹ do nó k ảnh hưởng tới nhau
      this.signAcessToken({ user_id, verify }), //dùng kĩ thuật phân rã (mảng thì ngoặc vuông, oject thì ngoặc nhọn) lấy access và refresh
      this.signRefreshToken({ user_id, verify }) //ở đây là cái mảng=>ngoặc vuông
    ])
  }

  async checkEmailExist(email: string) {
    //checkemail cấm trùng
    const users = await databaseService.users.findOne({ email }) //email:email nhưng 2 giá trị giống nhau thì email là đủ
    return Boolean(users) //có null: ép kiểu thành boolean =>false, object=> true
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    //regiaster nhận vào payload và payload đc dc=inh95 nghĩa = registerrequestbody
    //biến thành object để khi viết code và đọc nó tường minh hơn//payload: là cái dữ liệu đưa lên đưa về

    const result = await databaseService.users.insertOne(
      new User({
        //payload lúc này có name,email,pwd,confirmpwd,date_of_birth
        ...payload, //phân rã cái payload //bug:trong payload có dateofbirth, trong users cũng có date ofbirthoverride
        _id: user_id,
        username: `user${user_id.toString()}`,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth), //=>override dateofbirth sẽ lấy giá trị cuar dob kia, string ép kiểu thành Date(do người dùng đưa lên = json)
        password: hashPassword(payload.password) //khi tạo tkhoan thì payload đã có password=>ta sẽ độ lại pwd = hashpsd và pwd nó đưa lên cho mình
      })
    )

    const [access_token, refresh_token] = await this.signAcessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
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
    //giả lập gửi mail
    console.log(email_verify_token)

    return { access_token, refresh_token } //trả cái object trả về access và refreshToken
  }
  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    //login nhận vào 1 user_id(dùng để tạo access và refreshToken)
    const [access_token, refresh_token] = await this.signAcessAndRefreshToken({
      user_id,
      verify
    })
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
  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return { message: USERS_MESSAGES.LOGOUT_SUCCESS }
  }

  async verifyEmail(user_id: string) {
    //update lại user
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          verify: UserVerifyStatus.Verified,
          email_verify_token: '',
          updated_at: '$$NOW'
        }
      }
    ])
    //tạo ra access_token và refresh_token
    const [access_token, refresh_token] = await this.signAcessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    //lưu refresh_token vào db
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id)
      })
    )
    return { access_token, refresh_token }
  }

  async resendEmailVerify(user_id: string) {
    //tạo ra email_verify_token
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified
    })

    //update lai server
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token: '',
          updated_at: '$$NOW'
        }
      }
    ])
    //giả lập gửi lại mail

    console.log(email_verify_token)

    return { message: USERS_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESS }
  }
  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({
      user_id,
      verify
    })
    //update lai user
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token,
          updated_at: '$$NOW'
        }
      }
    ])
    //giả lap gui email
    console.log(forgot_password_token)

    return { message: USERS_MESSAGES.CHECK_EMAIL_TO_REST_PASSWORD }
  }
  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    //tìm user thông qua user_id và cập nhật lại password và forgot_password_token
    //tất nhiên là lưu password đã hash rồi
    //ta không cần phải kiểm tra user có tồn tại không, vì forgotPasswordValidator đã làm rồi
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: '$$NOW'
        }
      }
    ])
    //nếu bạn muốn ngta đổi mk xong tự động đăng nhập luôn thì trả về access_token và refresh_token
    //ở đây mình chỉ cho ngta đổi mk thôi, nên trả về message
    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    }
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          // projection: loại bỏ những thk ko muốn cho người dùng thấy
          password: 0, // projection=> tăng tính bảo mật(password, emailverifytoken,...)
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user // sẽ k có những thuộc tính nêu trên, tránh bị lộ thông tin
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    //payload là những gì người dùng đã gữi lên ở body request
    //có vấn đề là người dùng gữi date_of_birth lên dưới dạng string iso8601
    //nhưng ta cần gữi lên mongodb dưới dạng date
    //nên
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    //mongo cho ta 2 lựa chọn update là updateOne và findOneAndUpdate
    //findOneAndUpdate thì ngoài update nó còn return về document đã update
    //cập nhật _payload lên db
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      [
        {
          $set: {
            ..._payload,
            updated_at: '$$NOW'
          }
        }
      ],
      {
        returnDocument: 'after', //trả về document sau khi update, nếu k thì nó trả về document cũ
        projection: {
          //chặn các property k cần thiết
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user //đây là document sau khi update
  }
  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          create_at: 0,
          update_at: 0
        }
      }
    )
    if (user == null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async follow(user_id: string, followed_user_id: string) {
    //kiểm tra xem đã follow hay chưa
    const isFollowed = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    //nếu đã follow thì return message là đã follow
    if (isFollowed != null) {
      return {
        message: USERS_MESSAGES.FOLLOWED // trong message.ts thêm
      }
    }
    //chưa thì thêm 1 document vào collection followers
    await databaseService.followers.insertOne(
      new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
    )
    return {
      message: USERS_MESSAGES.FOLLOW_SUCCESS //trong message.ts thêm
    }
  }

  async unfollow(user_id: string, followed_user_id: string) {
    //kiểm tra xem đã follow hay chưa
    const isFollowed = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    //nếu chưa follow thì return message là "đã unfollow trước đó" luôn
    if (isFollowed == null) {
      return {
        message: USERS_MESSAGES.ALREADY_UNFOLLOWED // trong message.ts thêm
      }
    }
    //nếu đang follow thì tìm và xóa document đó
    const result = await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    //nếu xóa thành công thì return message là unfollow success
    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS // trong message.ts thêm
    }
  }
  async changePassword(user_id: string, password: string) {
    //tìm user thông qua user_id
    //cập nhật lại password và forgot_password_token
    //tất nhiên là lưu password đã hash rồi
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: '',
          updated_at: '$$NOW'
        }
      }
    ])
    //nếu bạn muốn ngta đổi mk xong tự động đăng nhập luôn thì trả về access_token và refresh_token
    //ở đây mình chỉ cho ngta đổi mk thôi, nên trả về message
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS // trong message.ts thêm
    }
  }

  async refreshToken(user_id: string, verify: UserVerifyStatus, refresh_token: string) {
    //tạo access và refresh_token mới
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAcessToken({
        user_id: user_id,
        verify
      }),
      this.signRefreshToken({
        user_id: user_id,
        verify
      })
    ])
    //vì một người đăng nhập ở nhiều nơi khác nhau, nên họ sẽ có rất nhiều document trong collection refreshTokens
    //ta không thể dùng user_id để tìm document cần update, mà phải dùng token, đọc trong RefreshToken.schema.ts
    await databaseService.refreshTokens.deleteOne({ token: refresh_token }) //xóa refresh
    //insert lại document mới
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: new_refresh_token })
    )
    return { access_token: new_access_token, refresh_token: new_refresh_token }
  }

  //getOAuthGoogleToken dùng code nhận đc để yêu cầu google tạo id_token
  private async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID, //khai báo trong .env bằng giá trị trong file json
      client_secret: process.env.GOOGLE_CLIENT_SECRET, //khai báo trong .env bằng giá trị trong file json
      redirect_uri: process.env.GOOGLE_REDIRECT_URI, //khai báo trong .env bằng giá trị trong file json
      grant_type: 'authorization_code'
    }
    //giờ ta gọi api của google, truyền body này lên để lấy id_token
    //ta dùng axios để gọi api `npm i axios`
    const { data } = await axios.post(`https://oauth2.googleapis.com/token`, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded' //kiểu truyền lên là form
      }
    }) //nhận đc response nhưng đã rã ra lấy data
    return data as {
      access_token: string
      id_token: string
    }
  }

  //dùng id_token để lấy thông tin của người dùng
  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo`, {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    //ta chỉ lấy những thông tin cần thiết
    return data as {
      id: string
      email: string
      email_verified: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  //xài ở oAuth
  async oAuth(code: string) {
    //dùng code lấy bộ token từ google
    const { access_token, id_token } = await this.getOAuthGoogleToken(code)
    const userInfor = await this.getGoogleUserInfo(access_token, id_token)
    //userInfor giống payload mà ta đã check jwt ở trên
    if (!userInfor.email_verified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFIED, // trong message.ts thêm GMAIL_NOT_VERIFIED: 'Gmail not verified'
        status: HTTP_STATUS.BAD_REQUEST //thêm trong HTTP_STATUS
      })
    }
    //kiểm tra email đã đăng ký lần nào chưa bằng checkEmailExist đã viết ở trên
    const user = await databaseService.users.findOne({ email: userInfor.email })
    //nếu tồn tại thì cho login vào, tạo access và refresh token
    if (user) {
      const [access_token, refresh_token] = await this.signAcessAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      }) //thêm user_id và verify
      //thêm refresh token vào database
      await databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: user._id, token: refresh_token }))
      return {
        access_token,
        refresh_token,
        new_user: 0, //đây là user cũ
        verify: user.verify
      }
    } else {
      //random string password
      const password = Math.random().toString(36).substring(1, 15)
      //chưa tồn tại thì cho tạo mới, hàm register(đã viết trước đó) trả về access và refresh token
      const data = await this.register({
        email: userInfor.email,
        name: userInfor.name,
        password: password,
        confirm_password: password,
        date_of_birth: new Date().toISOString()
      })
      return {
        ...data,
        new_user: 1, //đây là user mới
        verify: UserVerifyStatus.Unverified
      }
    }
  }
}
//trong dó projection giúp ta loại bỏ lấy về các thuộc tính như password, email_verify_token, forgot_password_token

const usersService = new UsersService()
export default usersService
