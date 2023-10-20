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
import usersService from '~/services/user.services'
import { validate } from '~/utils/validation'
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  //req: yêu cầu từ client gửi lên server, res: cái mà mình trả về cho nó. res và ko phải reject(báo hiệu rằng yêu cầu lên server đã thất bại) vì server ko bao giờ reject
  const { email, password } = req.body //do email và password sẽ đc lưu trong body của req//ở đây xài kỹ thuật distructuring(gán các thuộc tính từ 1 đói tượng vào các biến riêng biệt) cho đẹp //trong req có body và trong body có email và password
  if (!email || !password) {
    //dang lẽ phải check email và pass rất kỹ nhưng đây là demo chỉ cần coi nó có phải chuỗi rỗng hay ko
    return res.status(400).json({
      //nếu ko có email và pass sẽ res cái này(400 là lỗi về chuẩn validator(giá trị truyền lên/ 401: lỗi liên quan đến quyền truy cập)=> o đây 400 là hợp lý nhất còn bạn muốn để số nhiu cũn đc
      message: 'Missing email or password '
    })
  }
  next() //nếu ko có lỗi thì mình sẽ next ở đây
}

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        }
      }
    },

    email: {
      notEmpty: true,
      isEmail: true,
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const isExist = await usersService.checkEmailExist(value)
          if (isExist) {
            throw new Error('Email already exists')
          }
          return true
        }
      }
    },

    password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
          //returnScore: true; //thuoc tinh trả về số điểm cho độ mạnh password
        }
      },
      errorMessage: `password mus be at least 8 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol`
    },
    confirm_password: {
      notEmpty: true,
      isString: true,
      isLength: {
        options: {
          min: 8,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
          //returnScore: true; //thuoc tinh trả về số điểm cho độ mạnh password
        }
      },
      errorMessage: `confirm_password mus be at least 8 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol`,
      custom: {
        options: (value, { req }) => {
          //request nằm trong trường hiện tại của em//value đại diện cho confirmpassword do nó nằm trong trường confirmpassword
          if (value !== req.body.password) {
            throw new Error('confirm_password does not match password')
          }
          return true
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true, //nhập theo fomat ngày thàng năm
          strictSeparator: true // dấu gạch ngang
        }
      } //khi chuyển du lieu len database nen chuan hanh iso string
    }
  })
)
