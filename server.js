const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const Jimp = require("jimp");
const crypto = require("crypto");
const cors = require("cors");

const uploadRoute = require("./routes/uploadRoute");

const app = express();
const PORT = 2080;

// cors
app.use(cors());

// Middleware untuk parsing form-data
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(express.json({ limit: "100mb" }));

function isValidImageFile(filename) {
  // Define the regex pattern
  const pattern = new RegExp("\\.(jpg|jpeg|png|gif|bmp|tiff|webp)$", "i");

  // Test the filename against the pattern
  return pattern.test(filename);
}

// Fungsi untuk menghasilkan hash dari buffer file
const generateFileHash = (buffer) => {
  return crypto.createHash("md5").update(buffer).digest("hex");
};

// Middleware dinamis untuk menentukan lokasi penyimpanan berdasarkan URL
const dynamicStorage = (req, file, cb) => {
  const userPath = req.params[0]; // Path dinamis diambil dari URL parameter
  const uploadPath = path.join(__dirname, "uploads", userPath);

  // Membuat direktori jika belum ada
  fs.mkdirSync(uploadPath, { recursive: true });

  cb(null, uploadPath);
};

// Konfigurasi multer storage
const storage = multer.diskStorage({
  destination: dynamicStorage,
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const originalName = file.originalname;
    const fileExt = path.extname(originalName);
    const baseName = path.basename(originalName, fileExt);
    // cb(null, `${baseName}-${uniqueSuffix}${fileExt}`);
    cb(null, `${uniqueSuffix}${fileExt}`);
  },
});

// Inisialisasi multer dengan konfigurasi storage
const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, "uploads")));

// Fungsi untuk memeriksa duplikasi file
const isDuplicateFile = async (uploadPath, buffer) => {
  const files = fs.readdirSync(uploadPath);
  const fileHashes = files.map((file) => {
    const fileBuffer = fs.readFileSync(path.join(uploadPath, file));
    return generateFileHash(fileBuffer);
  });
  const currentFileHash = generateFileHash(buffer);
  return fileHashes.includes(currentFileHash);
};

app.use("/old", uploadRoute);

app.post("/chunk/*", upload.single("file"), async (req, res) => {
  res.status(200).json({
    message: "Chunk uploaded successfully",
    filename: req.file.filename,
  });
});

// Endpoint untuk mengunggah multiple files dengan path dinamis
app.post("/multiple/*", upload.array("files", 10), async (req, res) => {
  const { fileType } = req.query;

  const { final, totalChunks, name, filenames } = req.body;

  const uploadPath = path.join(__dirname, "uploads", req.params[0]);
  const uploadedFiles = [];

  if (final) {
    const arrFilenames = filenames.split(",");
    const finalPath = path.join(uploadPath, name);
    const writeStream = fs.createWriteStream(finalPath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(uploadPath, arrFilenames[i]);
      console.log("chunk path", chunkPath);
      if (!fs.existsSync(chunkPath)) {
        return res.status(400).json({ error: `Missing chunk: ${i}` });
      }
      const data = fs.readFileSync(chunkPath);
      writeStream.write(data);
      fs.unlinkSync(chunkPath);
    }

    writeStream.end();

    uploadedFiles.push({
      uploadedName: name,
    });
  } else {
    // Batasan 10 file untuk sekali upload
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }

    for (const file of req.files) {
      console.log("is valid filename", isValidImageFile(file.originalname));
      if (isValidImageFile(file.originalname)) {
        const buffer = fs.readFileSync(file.path);
        // Membuat thumbnail
        const thumbnailPath = path.join(
          uploadPath + "/thumbnail",
          `thumb-${file.filename}`
        );
        const image = await Jimp.read(buffer);
        await image.resize(200, Jimp.AUTO).writeAsync(thumbnailPath);

        uploadedFiles.push({
          originalName: file.originalname,
          uploadedName: file.filename,
          thumbnailName: `thumb-${file.filename}`,
        });
      } else {
        uploadedFiles.push({
          originalName: file.originalname,
          uploadedName: file.filename,
        });
      }
    }
  }

  res.status(200).json({
    message: "Files uploaded successfully",
    path: req.params[0],
    uploadedFiles,
  });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
