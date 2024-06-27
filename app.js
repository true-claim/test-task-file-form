const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs')
const { textDistance, uploadFiles } = require('./helpers.js')

const app = express();
const PORT = 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Validation
const validatorRest = async (req, res, next) => {
  console.log('Rest запрос...')
  const { text, file1, file2 } = req.body

  if (!text || !file1 || !file2) {
    console.log('Json заполнены не полностью.')
    throw new Error('Error data json')
  }

  console.log('Валидация Rest data - успех.')
}

const validatorWeb = async (req, res) => {
  console.log('Web запрос...')
  const { text } = req.body;

  if (!text || !req.files || !req.files.file1 || !req.files.file2) {
    console.log('Форма заполнена не полностью.')
    throw new Error('Error data input')
  }
  console.log('Валидация Web data - успех.')
};

//Services
const serviceRest = async (req, res) => {
  console.log('Работаю с json...')
  const { text, file1, file2 } = req.body;
  const response = await textDistance(text, file1, file2);
  return response;
};

const serviceWeb = async (req, res) => {
  console.log('Работаю с файлами...')

  const { text } = req.body;
  const file1 = fs.readFileSync(req.files.file1[0].path, 'base64');
  const file2 = fs.readFileSync(req.files.file2[0].path, 'base64');
  const response = await textDistance(text, file1, file2);

  const resultFilePath = path.join(__dirname, `${text}.txt`);
  fs.writeFileSync(resultFilePath, `Для запроса "${response.text}" сходство (расстояние) Джаро-Винклера равно ${response.distance} `);

  return res.download(resultFilePath, 'Ответ на запрос.txt', (err) => {
    if (err) {
      console.log('Ошибка при отправке файла с результатами:', err);
      return res.render('form', { error: "Ошибка при отправке файла с результатами." });
    }
  });
};

const routers = async (req, res, next) => {
  if (req.accepts('html')) {
    try {
      await validatorWeb(req, res, next)
      const result = await serviceWeb(req, res, next)
      return result;
    } catch (e) {
      console.log(e.message)
      if (e.message === 'Error data input') {
        return res.render('form', { error: "Заполните все поля формы." });
      } else if (e.message === 'Error format file') {
        return res.render('form', { error: "Неверный формат файлов. Только txt и rtf" });
      }
      return res.render('form', { error: "Внутренняя ошибка Web Api" });
    }
  }

  if (req.accepts('json')) {
    try {
      await validatorRest(req, res, next)
      const response = await serviceRest(req, res)
      return res.status(200).json({ "Присланный текст": response.text, "Совпадение": response.distance, "Алгоритм": "Сходство Джаро-Винклера" })
    } catch (e) {
      console.log(e.message)
      if (e.message === 'Error data json') {
        return res.status(500).json({ "error": "Заполните все поля" });
      }
      return res.status(500).json({ "error": "Внутренняя ошибка сервера Rest Api" });
    }
  }

  return res.status(406).send('Not Acceptable');
}

app.post('/', uploadFiles, routers)
app.use((err, req, res, next) => {
  return res.render('form', { error: "Не верный формат файла." });
});

app.get('/', (req, res) => {
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.json({
      help: "Отправьте запрос с данными. Файлы кодируйте в Base64.",
      example: {
        text: "Текстовая строка",
        file1: "0KHQvtC00LXRgNC20LjQvNC+0LUg0L/QtdGA0LLQvtCz0L4g0YTQsNC50LvQsC4=",
        file2: "0KHQvtC00LXRgNC20LjQvNC+0LUg0LLRgtC+0YDQvtCz0L4g0YTQsNC50LvQsC4="
      }
    });
  } else {
    res.render('form', { error: null });
  }
})

app.listen(PORT, () => console.log(`Сервер запустился: http://localhost:${PORT}`))
