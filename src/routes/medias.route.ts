import { Router } from 'express'
import { uploadImageController } from '~/controllers/medias.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/user.middlewares'
import { wrapAsync } from '~/utils/handlers'
const mediasRouter = Router()

mediasRouter.post('/upload-image', accessTokenValidator, verifiedUserValidator, wrapAsync(uploadImageController))
//import { uploadImageController } from '~/controllers/medias.controllers'

export default mediasRouter

//uploadSingleImageController chưa làm
