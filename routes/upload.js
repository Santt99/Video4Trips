const express = require('express')
const router = express.Router()
const multer  = require('multer')
const upload = multer({ dest: __dirname + '/../files' })
const fs = require('fs')
const exif = require('exiftool')
const clone = require('clone')
const imageDownload = require('image-download');
const imageType = require('image-type');
const  Jimp = require('jimp');
const concat = require('ffmpeg-concat')

var FfmpegCommand = require('fluent-ffmpeg');

const url = 'http://gcsproject-api.000webhostapp.com/staticmap.php/?'
let center = 'center='
let zoomSize = '&zoom=4'
let size = '17'
let imgsize = 'size=1024x576'
let mark ='&maptype=mapnik&markers='




router.post('/', upload.array('files'), async (req, res, next) => {
    let files = req.files
    await makeVideo(files,async (videosMetadata)=>{
        
        let mapVideos = []
        let photoVideos = []
        let videoOrder = []
        for(let video of videosMetadata){
            if(video.typeofVideo == 'map'){
                mapVideos.push(video)
            }else{
                photoVideos.push(video)
            }
        }
        for(let video of mapVideos){
            if(video.position == 'none'){
                videoOrder.push(video.path)
                continue
            }else{
                videoOrder.push(video.path)
                for(let videoPhoto of photoVideos){
                    if(video.position == videoPhoto.position){
                        videoOrder.push(video.path)
                        videoOrder.push(video.path)
                    }
                }
            }
        }
        console.log(videoOrder)
        await concat({
            output: 'test.mp4',
            videos: videoOrder,
            transition: {
                name: 'directionalWipe',
                duration: 500
            }
            })
        
    })
    
    await deleteFilesFromDirectory(files)
    res.write("Done")
    res.end()
})
let a = 0
let rescalePhoto = async function (image) {
    let file = {
        path: '',
        type: '',
        position: '',
        typeofVideo: ''
    }
    if(image.extension = 'image'){
        Jimp.read(image.path, (err, lenna) => {
            if (err) throw err;
            lenna
            .resize(1024, 576) // resize
            .quality(100) // set JPEG quality
            .write(__dirname + `/../files/i${a}.png`); // save
            file.path = __dirname + `/../files/i${a}.png`
            file.type = 'image'
            file.position = image.position
            file.typeofVideo = 'photo'
            a++ 
        });
        
        
    }else{
        file.path = __dirname + `/../files/v${a}.png`
        file.type = 'video'
        file.position = image.position
        file.typeofVideo = 'photo'
    }
    return file
}
let generateVideosFromImages = async function(file){
    return new Promise( (resolve, reject) =>{
        let videoTemplate = {
            path: '',
            position: '',
            typeofVideo: ''
        }
        FfmpegCommand()
                .input(file.path)
                .loop(4)
                .save(__dirname + `/../files/v${a}.mp4`)
                .on('end', () =>{ 
                })
        videoTemplate.position = file.position
        videoTemplate.path = (__dirname + `/../files/v${a}.mp4`)
        videoTemplate.typeofVideo = file.typeofVideo
        a++
        resolve(videoTemplate) 
    })
        
}
async function cocatenateVideo(files){
    
        
    
    
}
async function makeVideo(files, callback){
    let filesMetaData = []
    let videosMetadata = []
    let a = 0
    for (let file of files){  
        filesMetaData.push(await extractMetadata(file))  
    }

    //Oreder files
    filesMetaData = await orderFiles(filesMetaData)

    //Rescale image
    let rescaledImages = []
    for (let image of filesMetaData) {
        rescaledImages.push(await rescalePhoto(image))
    }

    //Download Map Images
    await downloadMapImages(rescaledImages,filesMetaData)

    
    //Make Videos From Images
    for(let image of rescaledImages){
        videosMetadata.push(await generateVideosFromImages(image))
    }
    callback(videosMetadata)
    
}

async function downloadMapImages(rescaledImages,filesMetaData){
    let completeUrlsToExtractmapImages = [url + center + filesMetaData[0].position  +
    zoomSize + '&'+ imgsize + size + mark + filesMetaData[0].position +
    ',lightblue2' + '|' + filesMetaData[filesMetaData.length - 1].position + ',lightblue3']
    for(file of filesMetaData){
        completeUrlsToExtractmapImages.push(url + center + file.position  +
        zoomSize + '&'+ imgsize + size + mark + file.position +
            ',lightblue2')
    }
    for (let i = 0; i < completeUrlsToExtractmapImages.length; i++) {
        await imageDownload(completeUrlsToExtractmapImages[i]).then(buffer => {
            const type = imageType(buffer);
            fs.writeFile(__dirname + `/../files/m${a}.` + type.ext, buffer,  async (err) => {
                
                console.log(err ? err : 'done!')
            });
            let file = {
                path: '',
                type: '',
                position: '',
                typeofVideo: ''
            }
            file.path = __dirname + `/../files/m${a}.png`
            file.type = 'image'
            file.typeofVideo = 'map'
            if(i > 0){
                file.position = filesMetaData[i - 1].position
            }else{
                file.position = 'none'
            }
            
            rescaledImages.push(file)
            a++
        });
        
    }
}

async function deleteFilesFromDirectory(files){
    return new Promise(resolve => {
        for (const file of files) {
            fs.unlink(file.path, err => {
            if (err) throw err;
            })
        }
        resolve('resolved');
    })
}
 
async function convertGpsPosition(gps){
    gps = gps.split(' ')
    let gpsLocation = new Array()
    for(let j = 0; j < 2; j++){
        gpsLocation.push(parseFloat(gps[0+(j*5)]) + (parseFloat(gps[2+(j*5)])/60) + (parseFloat(gps[3+(j*5)])/3600))
    }
    return gpsLocation[0] + ',' + (gpsLocation[1])
}
async function orderFiles(files){
    let temp
    for (let current = 0; current < files.length; current++) {
        if(current != files.length - 1){
            if(files[current].dateOfCreation > files[current + 1].dateOfCreation){
                temp = files[current]
                files[current] = files[current + 1]
                files[current + 1] = temp
            }
        }
    }
    return files
}
async function formatDates(date){
    let newDate = []
    date = date.split(' ')
    let ymD = date[0].split(":")
    ymD = ymD.join('')
    let hMS = date[1].split(":")
    hMS = hMS.join('')
    newDate.push(ymD)
    newDate.push(hMS)
    newDate = newDate.join('')
    return newDate
}
async function extractMetadata(file){
    let File = {
        path: '',
        position: '',
        dateOfCreation: '',
        extension: ''
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
                        metadata.mimeType = metadata.mimeType.split('/')
                        tempFileMetadata.path = file.path
                        tempFileMetadata.extension = metadata.mimeType[0]
                        tempFileMetadata.dateOfCreation = await formatDates(metadata.createDate)
                        if(metadata.gpsPosition != undefined){
                            tempFileMetadata.position = await convertGpsPosition(metadata.gpsPosition)
                        }else{
                            if(metadata.gpsLatitude == undefined){
                                console.log(`This Image: ${metadata} does not have gps location`)
                            }else{
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