//rất khó
//hàm jwt.sign: tạo ra chữ ký: bỏ dô nội dung mà ta muốn gửi cho người dùng: payload:(userid,ngày hết hạn,loại token)      secretOrPrivateKy(chữ kí bí mật),      [options,callback]:(algorithm:'RS256')sau khi kí thì ta muốn nó làm gì, bỏ vào đây, bao gồm options
//jwt.sign(payload, secretOrPrivateKey,[options,callback]) =>làm cái hàm custom lại thay vì sdung trực tiếp
//hàm tạo token bỏ vào utils jwt.ts
import jwt from 'jsonwebtoken'

//làm hàm nhận vào payload, privateKey, options từ đó kí tên
export const signToken = ({
  // =>cái đống này phải là object
  payload,
  privateKey = process.env.JWT_SECRET as string, //đôi khi mún để mặc định: khi kí chỉ cần móc ra(lưu trong env.)nếu như tạo token mà ko đua nó cái gì hết thì đưa ra cái mật khẩu này
  options = { algorithm: 'HS256' } //ko nói gì hết sẽ tự đưa thuật toán HS256
  //ko để callback do kí tên sẽ có khả năng bug=> callback sẽ xu ly và ném ra lỗi=> sử dụng riêng: ko mún nta độ chế lại
}: {
  // dấu : để dịnh nghĩa object
  payload: string | object | Buffer //buffer là kiểu dữ liệu của payload
  privateKey?: string
  options: jwt.SignOptions //rê chuột vào sign tìm cái options copy ra
}) => {
  //Promise<string: biết là kí tên sẽ trả về token=> chuỗi
  return new Promise<string>((resolve, reject) => {
    //server chỉ trả về result nhưng cái này là kí tên=> phải reject nếu lỗi => result(trả về chữ kí) nếu success
    jwt.sign(payload, privateKey, options, (err, token) => {
      //sign là hàm mà thư viện cung cấp //(err, token): callback này giúp ta xử lý lỗi
      if (err) throw reject(err)
      resolve(token as string)
    })
  })
}

//hàm nhận vào token và secretOrPublicKey?
export const verifyToken = ({
  token,
  secretOrPublicKey = process.env.JWT_SECRET as string
}: {
  token: string
  secretOrPublicKey?: string
}) => {
  //trả về JwtPayload(thông tin người gữi req) nếu token hợp lệ
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    //method này sẽ verify token, nếu token hợp lệ thì nó sẽ trả về payload
    //nếu token không hợp lệ thì nó sẽ throw error
    //secretOrPublicKey dùng để verify token
    //nếu token được tạo ra bằng secret|PublicKey thì ta dùng secret|PublicKey key để verify
    //từ đó biết rằng access_token được tạo bởi chính server
    jwt.verify(token, secretOrPublicKey, (error, decoded) => {
      //callback:(error, decoded)
      if (error) throw reject(error)
      resolve(decoded as jwt.JwtPayload)
    })
  })
}
