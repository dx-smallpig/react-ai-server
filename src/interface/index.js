const fs = require('fs');
const path = require('path');

function findSync(startPath, result) {
  let files = fs.readdirSync(startPath);
  files.forEach(file => {
    let fPath = path.join(startPath, file);
    let stats = fs.statSync(fPath);
    // 当前是文件夹继续递归遍历
    if (stats.isDirectory()) findSync(fPath, result);
    if (stats.isFile()) {
      let fileUrl = fPath.replace(/\\/g, '/');
      result.push({
        fileUrl,
        paths: fileUrl.split('/'),
        fileName: file,
      });
    }
  });
}

function loadInterfaces(app) {
  const dir = path.join(__dirname, './module'); // 接口文件所在的目录
  const files = []; // 目录下的所有文件
  findSync(dir, files);
  files.forEach(item => {
    fs.readFile(item.fileUrl, 'utf8', err => {
      if (err) return console.log('读取文件失败,内容是' + err);
      let i = item.paths.indexOf('module') + 1;
      let modeulName = item.paths.slice(i).join('/').split('.')[0];
      app.use(`/api/${modeulName}`, require(item.fileUrl));
    });
  });
}

module.exports = loadInterfaces;