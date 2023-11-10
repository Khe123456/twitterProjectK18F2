//Đây là app tổng
import express, { NextFunction, Response, Request } from 'express'
import userRoute from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.route'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import { UPLOAD_DIR } from './constants/dir'
import staticRouter from './routes/staticroute'
config()

const router = express.Router()
const app = express()
const port = process.env.PORT || 4000
initFolder()
app.use(express.json()) //dịch các json //lỗi distructuring do app ko biết mình xài log ra toàn là json nên phải khai báo cho nó hiểu

//const PORT = 4000
databaseService.connect()

//route local host: 3000/
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/users', userRoute)
//localhost:3000/users/tweets
app.use('/medias', mediasRouter) //route handler
//app.use('/static', express.static(UPLOAD_DIR)) //nếu muốn thêm tiền tố, ta sẽ làm thế này
app.use('/static', staticRouter)
//vậy thì nghĩa là vào localhost:4000/static/blablabla.jpg

app.use(defaultErrorHandler) //fix lỗi lluon6 hiện status 400//hàm tập hợp tất cả các lỗi về cùng 1 chỗ //error handler tổng. hàm xử lý lỗi phải nằm cuối cùng, nhưng ko đc nằm sau listen

app.listen(port, () => {
  console.log(`server dang chay tren port ${port}`)
})
