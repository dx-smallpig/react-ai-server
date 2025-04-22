const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { sqlClient, chromaClient } = require('@/dataset');

router.post('/createDataset', async (req, res) => {
  try {
    const { name, description } = req.body;
    const chroma_name = `kb_${uuidv4()}`;
    const collection = await chromaClient.createCollection({
      name: chroma_name, // 生成唯一集合名称
      metadata: { 
        "hnsw:space": "cosine", // 指定相似度计算方式
        "kb_name": name
      }
    });

    const [result] = await sqlClient.execute(
      `INSERT INTO dataset 
      (id, name, description, chroma_name) 
      VALUES (?, ?, ?, ?)`,
      [collection.id, name, description, chroma_name]
    );

    res.status(201).json({
      id: collection.id,
      name,
      description,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/getDatasetList', async (req, res) => {
  try {
    const [datasetList] = await sqlClient.execute(`SELECT * FROM dataset`);
    res.status(201).json(datasetList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;