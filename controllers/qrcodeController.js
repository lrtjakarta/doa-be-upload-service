const path = require("path");
const multer = require("multer");
const fs = require('fs')
const qrcode = require('qrcode')

exports.qrcodeGenerate = function(req, res, next) {
    const { fileName,data } = req.body
    if(fileName){
        console.log("fileName",fileName)
        var dataCodeQRString = JSON.stringify(data)
        qrcode.toFile(`./repo/img/${fileName}.png`, dataCodeQRString,async = (err) => {
            if (err) {
                console.log("err qr code ====>",err)
                res.json({ status: "error", message : "failed generate" + fileName,file:"",error:err });
            }
            else{
                res.json({ status: "success", message : "success generate" + fileName, file : `/repo/img/${fileName}.png`,error:'' });
            }
        })
    }
    else{
        res.json({ status: "error",message : "access denied" });
    }
}