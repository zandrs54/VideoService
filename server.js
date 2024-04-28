const { createServer } = require('http');
const { Server } = require('socket.io');
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');


const server = createServer(app);
const io = new Server(server);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/www/index.html');
});

app.get('/video/source/:name', (req, res) => {
    const videoName = req.params.name;
    res.sendFile(__dirname + '/www/videos/' + videoName + '.mp4');
});

app.get('/video/:name/', (req, res) => {
    res.sendFile(__dirname + '/www/watch.html');
});

app.get('/video/source/:name/comments', (req, res) => {
    const videoName = req.params.name;
    if(fs.existsSync(`./www/comments/${videoName}_comments.json`)){
        res.sendFile(__dirname + `/www/comments/${videoName}_comments.json`);
    }
    else {
        fs.writeFile(__dirname + `/www/comments/${videoName}_comments.json`, JSON.stringify([]), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

});


app.post('/video/source/:videoName/addComment', (req, res) => {
    const { date, username, comment } = req.body;
    const videoName = req.params.videoName;
    if(fs.existsSync(`./www/comments/${videoName}_comments.json`)) {
        const jsonData = require(`./www/comments/${videoName}_comments.json`);
        const newComment = {username, date, comment};
        jsonData.push(newComment);
        fs.writeFileSync(__dirname + `/www/comments/${videoName}_comments.json`, JSON.stringify(jsonData));
        res.sendStatus(200);
        console.log(date, username, comment);
    }
    else {
        console.log('Не удалось найти файл с комментариями: ' + videoName);
        fs.writeFile(__dirname + `/www/comments/${videoName}_comments.json`, JSON.stringify([]), (err) => {
            if (err) {
                console.log(err);
            }
        });
        res.sendStatus(200);
    }

    // Обработка ошибки записи файла
});

app.get('/videos/list', (req, res) => {
    fs.readdir('./www/videos', (err, files) => {
        if (err) {
            console.log(err);
        }
        else {
            res.send(files);
        }
    });
});

app.post('/videos/upload', (req, res) => {
    try {
        if (!req.body || !req.body.data) {
            return res.status(400).send('Ошибка: неверные данные');
        }

        const fileData = req.body.data;
        const fileName = req.body.fileName || 'uploaded_file.txt';
        const filePath = path.join(__dirname, 'www', 'videos', fileName);

        // Сохранение данных в файл
        fs.writeFileSync(filePath, fileData, 'base64');

        res.send('Файл успешно загружен');
    } catch (error) {
        console.error('Ошибка при загрузке файла:', error);
        res.status(500).send('Ошибка при загрузке файла');
    }
});

app.post('/videos/delete', (req, res) => {
    const videoName = req.body.videoName;
    console.log(videoName);
    fs.unlink('./www/videos/' + videoName, (err) => {
        if (err) {
            console.log(err);
        }
    });
    res.send(200);
});




server.listen(8080, () => console.log('Server is running'));
