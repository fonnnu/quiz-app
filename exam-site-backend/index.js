const express = require('express');
const cors = require('cors');
const { getQuestions, getMenuSetting } = require('./sheets'); // 作ったsheets.jsを読み込む
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 動作確認用
app.get('/', (req, res) => {
    res.send('バックエンドサーバー稼働中！');
});

// 問題取得API
// 使い方: /api/questions?category=be動詞(am,are)1
app.get('/api/questions', async (req, res) => {
    try {
        // URLの ?category=... の部分を取得
        const sheetName = req.query.category;

        if (!sheetName) {
            return res.status(400).json({ error: 'カテゴリ（シート名）を指定してください' });
        }

        // スプレッドシートからデータを取得
        const questions = await getQuestions(sheetName);
        
        // フロントエンドに返す
        res.json(questions);

    } catch (error) {
        console.error('エラー発生:', error);
        res.status(500).json({ error: 'データの取得に失敗しました。鍵の設定などを確認してください。' });
    }
});

// カテゴリ一覧API（スプレッドシートのタブ名を返す）
app.get('/api/categories', async (req, res) => {
    try {
        console.log("設定シートからメニュー情報を取得中...");
        //sheet.jsの関数を実行
        const menuData = await getMenuSetting();
        //取得した詳細データをそのままフロントエンドに送る
        res.json(menuData);

    } catch (error) {
        console.error('カテゴリ取得エラー:', error);
        res.status(500).json({ error: 'メニューの取得に失敗しました。' });
    }
});

app.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});