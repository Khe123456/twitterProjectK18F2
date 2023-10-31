//4:cài đặt mongodb
import { log } from 'console'
import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schema/user.schema'
import RefreshToken from '~/models/schema/RefreshToken.schema'
config()
//nếu để id và password o day thì hacker vào đc sẽ lộ mât hết dữ liệu nên mình bảo mật bằng file .env(file này sẽ mặc định ko đc đưa(up) lên trên server(đẩy lên github))(trong file này nếu xài dấu phẩy sẽ bị bug)
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@tweetprojectk18f2.rlxu0hg.mongodb.net/?retryWrites=true&w=majority` //cái duong dẫn náy ko xài nháy đơn và xài templetstring do lát nữa thay đổi giá trị

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
export class DatabaseService {
  //xài class cho biết có ngừi gọi nó(cho rõ nghĩa)
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME) //DB_NAME lưu trong .env là twitter-dev
  }
  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log('Lỗi trong quá trình kết nối mongo', error)
      throw error //throw để cái lỗi sau này bay tới cái nơi tập kết lỗi lớn nhất rồi xử lý sau
    }
  }

  get users(): Collection<User> {
    // ở đây ko mô tả users thì nó sẽ hiểu là Document và mình sẽ ko chấm đc các thuộc tính có sẵn ở trên//Collection này lấy từ monggo nên phải import ở trên  //connect xong phải vào cái hàm users//get là accessorproperty(nên nó sẽ hiểu user là 1 thuộc tính)
    return this.db.collection(process.env.DB_USERS_COLLECTION as string) //DB_USERS_COLLECTION trong .env là users //yên tâm tao tạo ra sure kèo nên mới as string để ko lỗi
  }

  get refreshTokens(): Collection<RefreshToken> {
    // ở đây ko mô tả users thì nó sẽ hiểu là Document và mình sẽ ko chấm đc các thuộc tính có sẵn ở trên//Collection này lấy từ monggo nên phải import ở trên  //connect xong phải vào cái hàm users//get là accessorproperty(nên nó sẽ hiểu user là 1 thuộc tính)
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string) //DB_USERS_COLLECTION trong .env là users //yên tâm tao tạo ra sure kèo nên mới as string để ko lỗi
  } //khi gọi sẽ đưa collection refrestoken nếu database chưa có=> trạo mới, có rồi, móc ra đưa co mình
}
const databaseService = new DatabaseService()
export default databaseService
