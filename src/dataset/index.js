const Minio = require('minio');
const mysql = require('mysql2/promise');
const { ChromaClient } = require('chromadb');

const minioClient = new Minio.Client({
  endPoint: '127.0.0.1', // 服务器地址
  port: 9000,
  useSSL: false,
  accessKey: 'J7mP133ZPbfVjn7zXkNn',
  secretKey: 'Txj3ov1W3vIcbQPcCBmZFS9h6CQJYR1oCYCx3gZA'
});

const sqlClient = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'rootpassword',
  database: 'react-ai',
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10, // 连接池的最大连接数
  queueLimit: 0 // 等待队列的最大长度，0 表示无限
});

const chromaClient = new ChromaClient({
  path: "http://localhost:8000"
});

module.exports = {minioClient, sqlClient, chromaClient};