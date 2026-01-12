//スプレッドシートとやり取りする専用の部品
const { google } = require('googleapis');
require('dotenv').config();

// 認証の設定（環境変数のファイルパスを使用）
const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

/**
 * 設定』シートに書いてあるリストを読み取る
 */
async function getMenuSetting () {
    try {
        console.log("1.Google認証を開始します");
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4' , auth: client})

        console.log("2.Google APIへリクエストを送ります。")
        //[設定]シートのA列からF列までを取得
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range:"'設定シート'!A2:F", //１行目は見出しなので2行目から
        });

        console.log("3.データが返ってきました！")
        const rows = response.data.values;
        if(!rows) return [];

        // 取得した行データを、使いやすい「オブジェクトの配列」に変換する
        return rows.map(row => ({
            categoryId: row[0],      // カテゴリ番号
            categoryName: row[1],    // カテゴリ名
            displayName: row[2],     // テスト名（表示用）
            sheetName: row[3],       // 対象シート名（システム用）
            order: parseInt(row[4])|| 0, // 並び順 NAN対策で||0
            status: row[5]           // 状態（公開/非公開）
        })).filter(item => item.status === '公開'); // ★「公開」のものだけを表示対象にする

    }catch (error){
        console.log("設定シートの取得に失敗:",error);
        throw error;
    }
}


/**
 * 指定したシート名（タブ名）から問題データを取得して整形する関数
 * @param {string} sheetName - 例: 'be動詞(am,are)1'
 */
async function getQuestions(sheetName) {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // スプレッドシートIDと範囲（A列〜N列まで全て）を指定
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: `'${sheetName}'!A2:N`, // 1行目はヘッダーなので2行目から取得
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) {
        return [];
    }

    // 取得した行データを、使いやすいオブジェクト形式（JSON）に変換
    const questions = rows.map((row) => {
        // C列(index 2) 〜 L列(index 11) までを選択肢として取得
        // 空文字でないものだけを抽出する
        const choices = row.slice(2, 12).filter(item => item && item.trim() !== '');

        return {
            id: row[0],             // A列: 問題ID
            text: row[1],           // B列: 問題文
            choices: choices,       // C~L列: 選択肢リスト
            correctAnswer: row[12], // M列: 正答
            explanation: row[13]    // N列: 解説
        };
    });

    return questions;
}

module.exports = { getQuestions, getMenuSetting };