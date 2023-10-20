//3
import { Request, Response } from 'express'
import User from '~/models/schema/user.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/user.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.request'

export const loginController = (req: Request, res: Response) => {
  //nếu ko import 2 thk này nó sẽ hiểu mình dang xài của FetchAPI chứ ko phải express
  const { email, password } = req.body
  if (email === 'test@gmail.com' && password === '123456') {
    //do mình ko có database(dô đây móc ra để ktra) nên ms làm cái cùi này
    return res.json({
      message: 'Login successfully',
      result: [
        { name: 'Điệp', yob: 1999 },
        { name: 'Hùng', yob: 2003 },
        { name: 'Được', yob: 1994 }
      ]
    })
  }
  return res.status(400).json({
    message: 'Login failed', //message ở đây hiểu là error
    result: []
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    const result = await usersService.register(req.body)

    return res.json({
      message: 'Register successfully',
      result
    })
  } catch (error) {
    res.status(400).json({
      message: 'Register failed',
      error
    })
  }
}
