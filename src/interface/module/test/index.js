const express = require('express');
const router = express.Router();
const multiparty = require('multiparty');
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { Ollama } = require("@langchain/community/llms/ollama");
const { minioClient } = require('../../../dataset/index');

router.post('/upload', async (req, res) => {
  try {
    const form = new multiparty.Form();
    form.parse(req, async function (err, fields, files) {
      const loader = new TextLoader(files.file[0].path);
      const docs = await loader.load();
      
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
      });

      const splitDocs = await textSplitter.splitDocuments(docs);
      const vectorStore = await Chroma.fromDocuments(
        splitDocs,
        new OllamaEmbeddings({
          model: "nomic-embed-text",
          baseUrl: "http://localhost:11434"
        }),
        { collectionName: "knowledge_base" }
      );

    });

    res.status(200).json({ message: "File processed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { question } = req.body;
  
  try {
    const vectorStore = await Chroma.fromExistingCollection(
      new OllamaEmbeddings({
        model: "nomic-embed-text",
        baseUrl: "http://localhost:11434"
      }),
      { collectionName: "knowledge_base" }
    );

    const results = await vectorStore.similaritySearch(question, 3);
    
    const ollama = new Ollama({
      baseUrl: "http://localhost:11434",
      model: "deepseek-r1:1.5b"
    });

    const context = results.map(doc => doc.pageContent).join("\n");
    const ollamaStream = await ollama.stream(
      `基于上下文：${context}\n回答问题：${question}，如果不知道直接回复不知道`
    );
    let buffer = '';
    for await (const chunk of ollamaStream) {
      buffer += chunk;
      if (buffer.includes('</think>')) {
        res.write(`data: ${JSON.stringify({content: chunk, type: 'answer'})}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({content: chunk, type: 'thinking'})}\n\n`);
      }
    }
    console.log(buffer);
    res.write('event: end\ndata: {}\n\n'); 
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/uploadMinio', async (req, res) => {
  const form = new multiparty.Form();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send(err.message);
    
    const file = files.file[0];
    const bucketName = 'react-ai';
    const objectName = `uploads/${file.originalFilename}`;

    try {
      // 检查存储桶是否存在
      const isExist = await minioClient.bucketExists(bucketName);
      if (!isExist) await minioClient.makeBucket(bucketName);
      
      // 上传文件
      await minioClient.fPutObject(bucketName, objectName, file.path);
      const url = `http://${minioClient.endPoint}:${minioClient.port}/${bucketName}/${objectName}`;
      res.send({ url });
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
});

module.exports = router;
