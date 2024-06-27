var natural = require('natural');
const multer = require('multer');

const textDistance = async (text, file1, file2) => {
    const decodeBase64 = async (str) => {
        return Buffer.from(str, 'base64').toString('utf-8');
    };

    let fileText1 = await decodeBase64(file1);
    let fileText2 = await decodeBase64(file2);
    const distance1 = natural.JaroWinklerDistance(text, fileText1);
    const distance2 = natural.JaroWinklerDistance(text, fileText2);

    let distance = (distance1 + distance2) / 2;
    return { text, distance };
};

const formValidate = (req, file, cb) => {

    if (file.mimetype !== 'text/rtf' && file.mimetype !== 'text/plain') {
        return cb(new Error('Error format files'), false);
    } else {
        console.log('Формат файла верен.');
        cb(null, true);
    }
}

const uploadFiles = multer({ dest: 'files', fileFilter: formValidate })
    .fields([{ name: 'file1', maxCount: 1 }, { name: 'file2', maxCount: 1 }])

module.exports = { uploadFiles, textDistance }
