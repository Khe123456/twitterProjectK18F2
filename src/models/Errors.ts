import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/message'

//ở đây thường mình sẽ extend Error để nhận đc báo lỗi ở dòng nào
type ErrorsType = Record<
  string,
  {
    msg: string //quan trọng nhất là cái message thoi
    [key: string]: any //ngoài ra thì muốn thêm bao nhiêu cũng được
  }
>
export class ErrorWithStatus {
  message: string
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}
//không biết lỗi do phần nào, quá nhiều thông tin thừa
//nên ta sẽ tạo ra 1 object lỗi có cấu trúc gần giống như errorObject(EntityError) nhưng có message thông báo là lỗi
// Validation error và chỉ chứa field: msg để dễ dàng xử lý hơn thay vì type, value, msg, path, location
export class EntityError extends ErrorWithStatus {
  //mình kế thừa nó=> cấu trúc cơ bản là messgae và errors//đc tạo = errwithstatus nhưng truyền cho nó cái lỗi là 422
  errors: ErrorsType
  constructor({ message = USERS_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    //entity đẻ ra dành cho validate=> dùng giá trị mặc định: USERS_MESSAGES.VALIDATION_ERROR
    //message?=> có thể để trống để cho ra gtri mặc định
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY }) //422 //message là sử dụng cái message để sẵn ở trên, còn status thì 422:HTTP_STATUS.UNPROCESSABLE_ENTITY
    this.errors = errors
  }
}
