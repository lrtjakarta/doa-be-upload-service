const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: "./repo/doc",
    filename: function(req, file, cb) {
      //Rename file
      cb(null, "akda-" + file.originalname);
    }
  });
  
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 },
}).single("image");

function checkFile(target, pattern){
    var value = 0;
    pattern.forEach(function(word){
      value = value + target.includes(word);
    });
    return (value === 1)
}

var typefile = ['PDF','pdf', 'DOCX','docx'];

exports.uploadDoc = function(req, res, next) {
    upload(req, res, err => {
        if (err){
            res.status(400).json({ status: "error 1", message: "failed upload file", error: err });
        }
        else{
            var checkformatfile = checkFile(req.file.mimetype, typefile);
            if (checkformatfile) {
                res.json(req.file.filename);
            }
            else {
                res.status(400).json({ status: "error 2", message: "unsupported file type" });
            }
        }
    })
}