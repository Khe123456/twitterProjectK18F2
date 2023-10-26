//utill: lưu hàm tiện ích
//lên express-validator : creating own validation runner=>copy về
import express, { NextFunction, Request, Response } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema' //import này phải tự tìm vào cái luồng của nó
import { EntityError, ErrorWithStatus } from '~/models/Errors'
// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  //đây ko phải mảng nên validation ko có s và ko chạy vòng for
  //hàm validate nhận vào checkSchema=> biến cụm thành middleware
  return async (req: Request, res: Response, next: NextFunction) => {
    //gọi hàm validate=>có đc middleware(có next)
    await validation.run(req) //lấy từng đoạn check lỗi:name, email,password,confirmpsw,date_of_birth... rồi lưu vào request
    //hàm run là promise => phải đợi => await **qtrong

    const errors = validationResult(req) //dô validationResult lấy ra, ko có lỗi thì next đi qua controller, còn bị lỗi thì ở lại
    if (errors.isEmpty()) {
      //error gồm lồi bth và lỗi email của mình luôn
      return next()
    }
    const errorObject = errors.mapped()
    const entityError = new EntityError({ errors: {} })
    //xử lý errorObject
    for (const key in errorObject) {
      //lấy message của từng cái lỗi
      const { msg } = errorObject[key]
      //nếu msg có dạng ErrorWithStatus và status !== 422 thì ném cho default error handler
      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg) //có errorMessage thì ném ra cho thk default
      }
      //lưu các lỗi 422 từ errrorObject vào entityError
      entityError.errors[key] = msg
    }
    //ở đây nó xử lý lỗi luôn chứ ko ném về error handler tổng
    next(entityError)
    //res.status(422).json({ errors: errorObject }) //đừng return ra array mà return mapped: có khai báo tên lỗi là gì sẽ báo lỗi đẹp hơn //bị lỗi thì sẽ respone ra 400
  } //mặc định các lỗi 422 mới đúng
}
