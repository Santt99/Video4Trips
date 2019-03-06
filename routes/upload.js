const express = require('express')
const router = express.Router()
const multer  = require('multer')
const upload = multer({ dest: __dirname + '/../files' })
const fs = require('fs')

 
router.post('/', upload.array('files'), function (req, res, next) {
    let files = req.files
    
    deleteFilesFromDirectory(__dirname + '/../files/')
    res.write("Done")
    res.end()
})

function deleteFilesFromDirectory(path){
    fs.readdir(path, (err, files) => {
        if (err) throw err;
        for (const file of files) {
          fs.unlink(path + file, err => {
            if (err) throw err;
          })
        }
    })   
}
module.exports = router