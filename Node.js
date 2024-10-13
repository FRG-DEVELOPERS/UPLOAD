const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const session = require('express-session');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(session({
    secret: 'temporaryfilesharingsecret',
    resave: false,
    saveUninitialized: true
}));

const activeFiles = {};

app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    const linkId = crypto.randomBytes(5).toString('hex');
    
    activeFiles[linkId] = {
        filename: file.originalname,
        buffer: file.buffer,
        sessionId: req.sessionID
    };

    res.json({ link: linkId });
});

app.get('/:linkId', (req, res) => {
    const file = activeFiles[req.params.linkId];

    if (file && file.sessionId === req.sessionID) {
        res.setHeader('Content-Disposition', `attachment; filename=${file.filename}`);
        res.send(file.buffer);
    } else {
        res.status(404).send('File not available or session expired');
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
