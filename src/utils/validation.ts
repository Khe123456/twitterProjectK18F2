//utill: lưu hàm tiện ích
import express, { NextFunction, Request, Response } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  //hàm validate nhận vào checkSchema=> biến cụm thành middleware
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req) //lấy từng đoạn check lỗi:name, email,...
    //hàm run là promise => phải đợi => await

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    res.status(400).json({ errors: errors.mapped() })
  }
}
