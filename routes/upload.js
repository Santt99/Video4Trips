const express = require('express')
const router = express.Router()
const multer  = require('multer')
const upload = multer({ dest: __dirname + '/../files' })
const fs = require('fs')
const exif = require('exiftool')
const clone = require('clone');

router.post('/', upload.array('files'), async (req, res, next) => {
    let files = req.files
    await makeVideo(files)
    
    await deleteFilesFromDirectory(files)
    res.write("Done")
    res.end()
})

function deleteFilesFromDirectory(files){
    return new Promise(resolve => {
        for (const file of files) {
            fs.unlink(file.path, err => {
            if (err) throw err;
            })
        }
        resolve('resolved');
    })
}

    
function convertGpsPosition(gps){
    gps = gps.split(' ')
    gpsLocation = new Array()
    for(let j = 0; j < 2; j++){
        gpsLocation.push(parseFloat(gps[0+(j*5)]) + (parseFloat(gps[2+(j*5)])/60) + (parseFloat(gps[3+(j*5)])/3600))
    }
    return gpsLocation[0] + ',' + (gpsLocation[1])*-1
}
async function makeVideo(files){
        let filesMetaData = []
        for (const file of files) {
            filesMetaData.push(await extractMetadata(file))  
        }
        console.log(filesMetaData);
}
function extractMetadata(file){
    let File = {
        path: '',
        position: '',
        dateOfCreation: ''
    }
    return new Promise( (resolve, reject) =>{
        fs.readFile(file.path, (err, data) => {  
            if (err)
              throw err;
            else {
                exif.metadata(data,async (err, metadata)  => {
                    if (err){
                        throw err;
                    }
                    else{
                        let tempFileMetadata = clone(File)
                        tempFileMetadata.path = file.path
                        tempFileMetadata.dateOfCreation = metadata.createDate
                        if(metadata.gpsPosition != undefined){
                            tempFileMetadata.position = await convertGpsPosition(metadata.gpsPosition)
                        }else{
                            if(metadata.gpsLatitude == undefined){
                                console.log(`This Image: ${metadata} does not have gps location`)
                            }else{
                                console.log(`${metadata.gpsLatitude}, ${metadata.gpsLongitude}`)
                                tempFileMetadata.position = await convertGpsPosition(`${metadata.gpsLatitude}, ${metadata.gpsLongitude}`)
                                return 'error#1'
                            }
                            
                            
                        }
                        resolve(tempFileMetadata)
                    }
                    
                })
                
            }
            
        })
        
    })
}
module.exports = router