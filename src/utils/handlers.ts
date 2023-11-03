//hàm bọc try-catch cũng là hàm tiện ích=> utils
//tạo 1 hàm cho chuẩn try-catch để bắt lỗi ở requa=eshandler: middleware hoặc controlller nếu hàm có async=> chỉ cần gọi WrapAsync để bọc lại(tránh việc phải dùng try-catch nhìu lần làm code xấu)
import { RequestHandler, NextFunction, Response, Request } from 'express'

export const wrapAsync =
  <P>(func: RequestHandler<P>) =>
  async (req: Request<P>, res: Response, next: NextFunction) => {
    //đặ trưng của async(do registercontroller là async nên ở đây phải async) thì sẽ đưa về 1 Promise=>await
    try {
      await func(req, res, next) //là cái hàm registercontroller sau khi đã đc bọc lai wrapAsync(registerController)
    } catch (error) {
      next(error)
    }
  }
