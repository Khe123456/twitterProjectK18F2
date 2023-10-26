//=> lưu vào thư mục models => requests=> sau này có req nào cần định nghĩa body thì nhét vào đây
//những định nghĩa liên quan đến class user
export interface RegisterReqBody {
  //interface: dùng để định nghĩa
  name: string //toàn là chuỗi do ở đây là định nghĩa giá trị
  email: string //mà giá trị là do người dùng đưa lên = json
  password: string
  confirm_password: string
  date_of_birth: string
}
