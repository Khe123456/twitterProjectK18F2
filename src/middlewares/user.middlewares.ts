//src/middlewares: Chứa các file chứa các hàm xử lý middleware, như validate, check token, sanitize(lọc dữ liệu vd: ngta gữi 10 file, mình lọc lấy 2 file cho lên server thôi )
//2
//ta sẽ làm chức năng đăng nhập ./login
//thì người dùng sẽ truyền email và password vào body
//khi mà đăng nhập, thì client sẽ truy cập /login
//tạo ra 1 req, và bỏ vào trong đó(body) email, password
//làm 1 middleware ktra xem email và password có đc truyền lên hay ko?
// nhét email, password vào trong req.body

//có next là middleware //request ,response và nextfunction là các interface của express cung cấp
import { Request, Response, NextFunction } from 'express' //express chuyên dùng cung cấp các interface để bổ nghĩa các parameter mình đang có
import { checkSchema } from 'express-validator'
import { USERS_MESSAGES } from '~/constants/message'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import usersService from '~/services/user.services'
import { hashPassword } from '~/utils/crypto'
import { validate } from '~/utils/validation'

export const loginValidator = validate(
  checkSchema({
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
            email: value, //value nằm trong email=> nó chính là email
            password: hashPassword(req.body.password)
          })
          if (user === null) {
            throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
          }
          req.user = user
          return true
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
  })
)

export const registerValidator = validate(
  //validate là hàm mới build bên ultils
  //sử dụng công nghệ checkschema chứ ko phải như bên demo kia
  checkSchema({
    //rê chuột vào checkSchema => ctrl enter lấy đc cụm RunnableValidationChains<ValidationChain> đập vào hàm ultils dòng 9
    name: {
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
    },

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
    },
    confirm_password: {
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
    },
    date_of_birth: {
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
  })
)
