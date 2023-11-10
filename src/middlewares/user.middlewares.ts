//src/middlewares: Chứa các file chứa các hàm xử lý middleware, như validate, check token, sanitize(lọc dữ liệu vd: ngta gữi 10 file, mình lọc lấy 2 file cho lên server thôi )
//2
//ta sẽ làm chức năng đăng nhập ./login
//thì người dùng sẽ truyền email và password vào body
//khi mà đăng nhập, thì client sẽ truy cập /login
//tạo ra 1 req, và bỏ vào trong đó(body) email, password
//làm 1 middleware ktra xem email và password có đc truyền lên hay ko?
// nhét email, password vào trong req.body

//có next là middleware //request ,response và nextfunction là các interface của express cung cấp
import { error } from 'console'
import { Request, Response, NextFunction } from 'express' //express chuyên dùng cung cấp các interface để bổ nghĩa các parameter mình đang có
import { ParamSchema, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { PartialRight, capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/message'
import { REGEX_USERNAME } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayLoad } from '~/models/requests/User.request'
import databaseService from '~/services/database.services'
import usersService from '~/services/user.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1 //1 kí tự đặc biệt
      //returnScore: true; //thuoc tinh trả về số điểm cho độ mạnh password
    },
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
  }
}

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 8,
      max: 50
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
      //returnScore: true; //thuoc tinh trả về số điểm cho độ mạnh password
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  },

  custom: {
    //setting để báo lỗi //Manually running validation //viết 1 cái hàm thay thế cho controller=> hàm tiện ích=> lưu vào mục Ultils validation.ts
    options: (value, { req }) => {
      //****value:đại diện cho confirmpassword => nằm trong hàm confirmpwd, req: là req hiện tại
      //bản chất nó giống validate lưu lỗi trong req chứ ko log ra=>cần nhung thk này để báo lỗi
      //request nằm trong trường hiện tại của em//value đại diện cho confirmpassword do nó nằm trong trường confirmpassword
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD) //throw cho qua điểm tập kết lỗi cuối cùng
      } //khi mà throw ra thì bên validate sẽ thấy có lỗi=> log ra lỗi 400(hàm ultils)
      return true
    }
  }
}

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
  }, //ko đc empty
  isString: {
    errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
  },
  trim: true, //xóa dấu cách dư
  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  }
}

const dateOfBirthSchema: ParamSchema = {
  //lấy dữ liệu date_of_birth trên postman:
  //b1:lên 1trang web bất kì, inspect=>code:
  //let a = new Date().TOISOString()=> log a ra=> có cái tgian hiện tại
  isISO8601: {
    options: {
      strict: true, //nhập theo fomat ngày thàng năm
      strictSeparator: true // dấu gạch ngang
    },
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_BE_ISO8601
  } //khi chuyển du lieu len database nen chuan hanh iso string
}

//tí xài cho property avatar và cover_photo
const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_A_STRING
  },
  trim: true, //nên đặt trim dưới này thay vì ở đầu
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH_MUST_BE_LESS_THAN_400
  }
}

const userIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      //check value có phải objectId hay không?
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.INVALID_user_id, //trong message.ts thêm
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      //đổi tên biến thành user luôn cho phù hợp
      const user = await databaseService.users.findOne({
        _id: new ObjectId(value)
      })
      if (user === null) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_FOUND, //fix lại cho nó thông báo chung
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      //nếu vướt qua hết if thì return true
      return true
    }
  }
}

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        }, //trong email đã ktra length ròi nên ko cần length
        trim: true,
        custom: {
          options: async (value, { req }) => {
            //dựa vào email và password tìm đối tượng users tương ứng
            const user = await databaseService.users.findOne({
              //khi đăng nhập sẽ vào database de ktra email có tồn tại ko?
              email: value, //(email đc mô tả = value)value nằm trong email=> nó chính là email
              password: hashPassword(req.body.password) //hashPassword nta gửi lên cho mình có khớp với pwd mà người dùng họ truyền lên đã đc mã hóa lưu trong database ko?
            })
            if (user === null) {
              //nếu ko khớp=>null
              throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT) //ném lỗi 422
            }
            req.user = user //nếu khớp thì mình giữ nó lại(do đã tốn tgian lên database tìm ròi) //req đi qua từng middleware và controller=>req trong middleware chình là req trong controller=>giống như người vận chuyển(đi từ middleware này sang kia=>gửi ké thk user để qua bên kia xài(có thể là trong middleware hoặc controller khác))
            return true //kết thúc phiên ktra //ko có return là sai nặng
          }
        }
      },

      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1 //1 kí tự đặc biệt
            //returnScore: true; //thuoc tinh trả về số điểm cho độ mạnh password
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      }
    },
    ['body']
  )
)

export const registerValidator = validate(
  //validate là hàm mới build bên ultils
  //sử dụng công nghệ checkschema chứ ko phải như bên demo kia
  checkSchema(
    {
      //rê chuột vào checkSchema => ctrl enter lấy đc cụm RunnableValidationChains<ValidationChain> đập vào hàm ultils dòng 9
      name: nameSchema,

      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        }, //trong email đã ktra length ròi nên ko cần length
        trim: true,
        custom: {
          options: async (value, { req }) => {
            //check value có tồn tại trong database k? có thì lụm đầu nó
            const isExist = await usersService.checkEmailExist(value)
            if (isExist) {
              throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS)
            }
            return true
          }
        }
      },

      password: passwordSchema,
      confirm_password: confirmPasswordSchema,

      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        notEmpty: {
          errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            const accessToken = value.split(' ')[1]
            //nếu ko có accessToken thì ném lỗi 401
            if (!accessToken) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED //401
              })
            }
            //nếu có accessToken thì mình phải verify AcessToken
            try {
              const decoded_authorization = await verifyToken({
                token: accessToken,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              //lấy ra decoded_authorization(payload), lưu vào req, để dùng dần
              ;(req as Request).decode_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                //(error as JsonWebTokenError).message sẽ cho chuỗi `accesstoken invalid`, không đẹp lắm
                //ta sẽ viết hóa chữ đầu tiên bằng .capitalize() của lodash
                message: capitalize((error as JsonWebTokenError).message), //viết hoa lỗi ở chữ cái đầu tiên
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
            //
          }
        }
      }
    },
    ['headers']
  )
)
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,

        custom: {
          options: async (value: string, { req }) => {
            //verify refresh_token để lấy decode_refresh_token
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                databaseService.refreshTokens.findOne({ token: value })
              ])
              //tìm refresh_token có tồn tại trong database hay ko?

              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  status: HTTP_STATUS.UNAUTHORIZED //401
                })
              }
              throw error
            }
            return true //nếu không có lỗi thì trả về true
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,

        custom: {
          options: async (value: string, { req }) => {
            //verify refresh_token để lấy decode_refresh_token
            //ktra người dùng có truyền lên email verify token hay ko
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            //verify email_verify_token de lấy decoded_emiail_verify_token
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRETE_EMAIL_VERIFY_TOKEN as string
              })

              //Sau khi verify ta đc payload của email_verify_token: decoded_emiail_verify_token
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  status: HTTP_STATUS.UNAUTHORIZED //401
                })
              }
              throw error
            }
            return true //nếu không có lỗi thì trả về true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            //dựa vào emial tìm đối tượng users tương ứng
            const user = await databaseService.users.findOne({
              email: value
            })
            if (user === null) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        trim: true,

        custom: {
          options: async (value: string, { req }) => {
            //verify refresh_token để lấy decode_refresh_token
            //ktra người dùng có truyền lên forgotpassword token hay ko
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_forgot_password_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRETE_FORGOT_PASSWORD_TOKEN as string
              })

              //Sau khi tìm
              ;(req as Request).decode_forgot_password_token = decoded_forgot_password_token

              const { user_id } = decoded_forgot_password_token
              //dựa vào user_id tìm user
              const user = await databaseService.users.findOne({
                _id: new ObjectId(user_id)
              })
              //nếu user = null => lỗi 404
              if (user === null) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USER_NOT_FOUND,
                  status: HTTP_STATUS.NOT_FOUND //401
                })
              }
              if (user.forgot_password_token !== value) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INCORRECT,
                  status: HTTP_STATUS.UNAUTHORIZED //401
                })
              }
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  status: HTTP_STATUS.UNAUTHORIZED //401
                })
              }
              throw error
            }
            return true //nếu không có lỗi thì trả về true
          }
        }
      }
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
      //forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

//ở hàm này mình dùng middleware thông thường, vì mình k cần xử lý ở 'body' hay 'header'
//mà chỉ cần xử lý decoded_authorization, lấy đc từ middleware accessTokenValidator trước đó
//bỏ async
export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decode_authorization as TokenPayLoad
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    )
  }
  next()
}

//updateMeValidator sẽ có

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        optional: true, //đc phép có hoặc k
        ...nameSchema, //phân rã nameSchema ra
        notEmpty: undefined //ghi đè lên notEmpty của nameSchema
      },
      date_of_birth: {
        optional: true, //đc phép có hoặc k
        ...dateOfBirthSchema, //phân rã nameSchema ra
        notEmpty: undefined //ghi đè lên notEmpty của nameSchema
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.BIO_MUST_BE_A_STRING
        },
        trim: true, //trim phát đặt cuối, nếu k thì nó sẽ lỗi validatior
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.BIO_LENGTH_MUST_BE_LESS_THAN_200
        }
      },
      //giống bio
      location: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.LOCATION_LENGTH_MUST_BE_LESS_THAN_200
        }
      },
      //giống location
      website: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },

          errorMessage: USERS_MESSAGES.WEBSITE_LENGTH_MUST_BE_LESS_THAN_200
        }
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (REGEX_USERNAME.test(value) === false) {
              throw new Error(USERS_MESSAGES.USERNAME_IS_INVALID) //trong message
            }
            //tìm user bằng username
            const user = await databaseService.users.findOne({
              username: value
            })
            //nếu username đã tồn tại thì throw error
            if (user) {
              throw new Error(USERS_MESSAGES.USERNAME_ALREADY_EXISTS) //trong message
            }
            return true
          }
        }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)

//fix lại followValidator
export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: userIdSchema
    },
    ['body']
  )
)
//và thêm unfollowValidator
export const unfollowValidator = validate(
  checkSchema(
    {
      user_id: userIdSchema
    },
    ['params']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value, { req }) => {
            //sau khi qua accestokenValidator thì ta đã có req.decoded_authorization chứa user_id
            //lấy user_id đó để tìm user trong
            const { user_id } = req.decoded_authorization as TokenPayLoad
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
            })
            //nếu không có user thì throw error
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND //401
              })
            }
            //nếu có user thì kiểm tra xem password có đúng không
            const { password } = user
            const isMatch = password === hashPassword(value)
            if (!isMatch) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.OLD_PASSWORD_NOT_MATCH, //trong messages.ts thêm
                status: HTTP_STATUS.UNAUTHORIZED //401
              })
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)
