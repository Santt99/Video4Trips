const express = require('express')
const router = express.Router()
const multer  = require('multer')
const upload = multer({ dest: __dirname + '/../files' })
router.post('/', upload.array('files'), function (req, res, next) {
    console.log(req.files)
    res.write("Done")
    res.end()
})

module.exports = router