//Đây là app tổng
import express, { NextFunction, Response, Request } from 'express'
import userRoute from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'

const app = express()
app.use(express.json()) //dịch các json //lỗi distructuring do app ko biết mình xài log ra toàn là json nên phải khai báo cho nó hiểu

const PORT = 3000
databaseService.connect()

//route local host: 3000/
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/users', userRoute)
//localhost:3000/users/tweets

app.use(defaultErrorHandler) //fix lỗi lluon6 hiện status 400//hàm tập hợp tất cả các lỗi về cùng 1 chỗ //error handler tổng. hàm xử lý lỗi phải nằm cuối cùng, nhưng ko đc nằm sau listen

app.listen(PORT, () => {
  console.log(`server dang chay tren port ${PORT}`)
})
