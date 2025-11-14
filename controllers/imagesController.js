const path = require("path");
const multer = require("multer");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: "./repo/img",
  filename: function (req, file, cb) {
    //Rename file
    cb(null, "akda-" + file.originalname + "-" + Date.now() + ".png");
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024, fieldSize: 5 * 1024 * 1024 },
}).single("image");

function checkFile(target, pattern) {
  var value = 0;
  pattern.forEach(function (word) {
    value = value + target.includes(word);
  });
  return value === 1;
}

var typefile = ["JPG", "jpg", "png", "PNG", "gif", "jpeg", "JPEG", "svg"];

exports.uploadImage = function (req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      res
        .status(400)
        .json({ status: "error 1", message: "failed upload file", error: err });
    } else {
      var checkformatfile = checkFile(req.file.mimetype, typefile);
      if (checkformatfile) {
        res.json(`/repo/img/${req.file.filename}`);
      } else {
        res
          .status(400)
          .json({ status: "error 2", message: "unsupported file type" });
      }
    }
  });
};

exports.uploadImageBase64 = function (req, res, next) {
  const { filedata, rootfile, filename } = req.body;

  const dir = `./uploads/${rootfile}`;
  if (!fs.existsSync(dir)) {
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) {
        // console.log("err 1", err)
        res.status(400).send(err);
      } else {
        console.log("create foler", `${dir}/${filename}`);
        fs.writeFile(
          `${dir}/${filename}`,
          filedata,
          { encoding: "base64" },
          function (err) {
            if (err) {
              //   console.log("err 2", err)
              res.status(400).send(err);
            } else {
              res.json(`${dir}/${filename}`);
            }
          }
        );
      }
    });
  } else {
    console.log("update foler", `${dir}/${filename}`);
    fs.writeFile(
      `${dir}/${filename}`,
      filedata,
      { encoding: "base64" },
      function (err) {
        if (err) {
          //   console.log("err 3", err)
          res.status(400).send(err);
        } else {
          res.json(`${dir}/${filename}`);
        }
      }
    );
  }
};

exports.deleteImage = async function (req, res, next) {
  if (req.body.fileName && req.body.fileLocation) {
    var checkformatfile = await checkFile(req.body.fileName, typefile);
    if (checkformatfile) {
      fs.unlink(req.body.fileLocation, (err) => {
        if (err) {
          res.json({
            status: "error",
            message: "failed delete" + req.body.fileName,
            error: err,
          });
        } else {
          res.json({
            status: "success",
            message: "success delete" + req.body.fileName,
          });
        }
      });
    } else {
      res.json({ status: "error", message: "unsupported file type" });
    }
  } else {
    res.json({ status: "error", message: "access denied" });
  }
};
