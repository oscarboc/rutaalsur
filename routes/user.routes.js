const Router = require('express')
const { getUsers, inhabilitarUser, changePassword } = require('../controllers/user.controller')

const router = Router();


router.get('/getusers', getUsers);
router.get('/inhabilitarUser/:id/:activo', inhabilitarUser)
router.get('/changePassword/:email', changePassword)

module.exports = router;