import { Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  //lỗi từ các noi se dồn ve day(errorHandler tổng)
  //=> ko thể tránh khỏi những lỗi ko có status=> quy về lỗi 500 = HTTP_STATUS.INTERNAL_SERVER_ERROR
  //***kinh nghiệm:.json({message:err.message}) => bug: do lỗi từ các nơi đổ về=> có khả năng ko có message
  //=> err.message=> gửi cho nta undefined => nếu mà gửi cho nta:.json({message:err}): cũng ko đc do ta sẽ gửi luôn message và status=> dư status
  //=> ta cần loại bỏ cái thuộc tính status, còn các thuộc tính còn lại gửi cho người dùng
  //=> lên lodash.com(xài omit) (cài trước: npm i lodash(ra sản phẩm chạy = javascript) và npm install @type/lodash -D(BUILD = TYPE SCRIPT chạy trong dev-dependency))
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ['status'])) //omit có khả năng loại bỏ thuộc tính = cách truyền vào obj(err) và tên của thuộc tính dưới dạng mảng 'status' => cò delete.err=> sẽ tạo ra 1 lỗ thủng chà bá=>ko dùng
  }
  //nếu mà lỗi xún đc đây thì là lỗi mặc định/ mình nhận đc ko phải là errorwithstatus mà là lỗi error bth=> phải biến enumberable về true ms báo lỗi đc
  //set, name, stack , massage vế enumberable true
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfor: omit(err, ['stack'])
  })
} //err.status: lấy cái lỗi của thk mà mình xử lý đc mới hợp lý
