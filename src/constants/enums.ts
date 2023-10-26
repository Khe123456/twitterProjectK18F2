//Sau này cứ có enum thì bỏ dô //enum ko thay đổi=> lưu trong constant(hằng số)
export enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực email
  Banned // bị khóa
}

export enum TokenType {
  //chuyển những thk này thành 1 số bất kì thay vì ghi quỵt tẹt tên nó ra : acess là 0, refresh là 1
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerificationToken
}
