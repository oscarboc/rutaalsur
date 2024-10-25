const fs = require('fs');
const multer = require("multer");

const maxSize = 4 * 1000 * 1000;

const fileFilter = (req, file, cb) => {

    console.log(file.mimetype);
    
    const allowedMimes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        req.fileTypeInvalid = 'El archivo no es un excel únicamente xls, xlsx';
        return cb(null, false, req.fileTypeInvalid)
    }

};


const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        const collection = req.originalUrl.split('/').pop();

        const pathStorage = `${__dirname}/../storage/${collection}/`;
        fs.mkdirSync(pathStorage, { recursive: true });
        cb(null, pathStorage);
    },
    filename: function (req, file, cb) {

        const ext = file.originalname !== 'blob' ? file.originalname.split(".").pop() : file.mimetype.split("/").pop();
        const filename = `file-${Date.now()}.${ext}`;

        cb(null, filename);
    },

});

const uploadMiddleware = multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter
});

module.exports = uploadMiddleware;
