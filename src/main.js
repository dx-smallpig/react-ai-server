require('module-alias/register');
const express = require('express');
const cors = require('cors');
const loadInterfaces = require('./interface');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

loadInterfaces(app);


app.listen(port, () => {
  console.log(`服务器已启动， 运行于${port}端口`);
});
