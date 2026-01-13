# 📚 Google Sheets Linked Quiz System

GoogleスプレッドシートをCMS（管理画面）として活用した、学習用クイズアプリケーションです。
塾の生徒様が、PCやスマホからいつでも手軽に学習できる環境を構築しました。

## 🌐 Live Demo
**[アプリを体験する](https://quiz-app-six-teal-44.vercel.app/)**
> ※バックエンドはRender（無料プラン）を使用しているため、初回アクセス時はサーバーの起動に15〜30秒ほどかかる場合があります。

---

## 📝 開発の背景と課題解決
従来、本クイズ運用はGoogleフォームで行われていましたが、「より学習に特化したUIの提供」と「運用の柔軟性向上」を目指し、本アプリの開発に至りました。

すでに講師側が使い慣れているGoogleエコシステム（スプレッドシート等）をそのまま管理画面として利用できるため、**「運用コストを最小限に抑えつつ、リッチな学習体験を提供する」**仕組みを実現しました。

## 🎯 こだわった設計思想（エンジニアとしての工夫）

- **完全メンテナンスフリーな「動的カテゴリ生成」**
  当初はシート名を固定して読み込む設計でしたが、将来的なカテゴリ増加を見据え、スプレッドシートのタブ名を自動検知してメニューに反映するロジックを実装しました。これにより、非エンジニアの講師の方のみで「カテゴリ追加から問題更新まで」を完結できるシステムにしました。
- **実用性を重視したAPIの抽象化**
  複雑な認証プロセスやGoogle Sheets APIの操作をバックエンド（Node.js）側に隠蔽し、フロントエンドからはシンプルなエンドポイントでデータを取得できるよう設計。保守性と拡張性を両立させています。
- **実務レベルの環境管理とデプロイフロー**
  `.env`ファイルを活用し、ローカル開発環境と本番環境（Vercel/Render）の接続先を自動切り替えする仕組みを構築。ヒューマンエラーによるURLミスを排除し、安全かつ迅速なデプロイフローを確立しました。

## ✨ 主な機能とUX
- **リアルタイム同期**: スプレッドシートの更新が即座にアプリ側へ反映されます。
- **学習特化型UI**: 1問1答のカードUI、進捗バー、間違いのみを解き直す「復習モード」を搭載。
- **レスポンシブ対応**: スマートフォン、タブレット、PCのすべてのデバイスに最適化。
- **堅牢な通信**: API通信のタイムアウト制御や、分かりやすいエラーメッセージ表示を実装。

## 🛠 使用技術
| Layer | Technology |
| :--- | :--- |
| **Frontend** | Vue.js 3 (Composition API), Vite, Tailwind CSS, Vercel |
| **Backend** | Node.js, Express, Render |
| **Data Source** | Google Sheets API v4 |

## 🏗 システム構成
```text
[ Google Sheets ]  <-- (API) -->  [ Node.js (Render) ]  <-- (API) -->  [ Vue.js (Vercel) ]
      (DB)                             (Backend)                         (Frontend)

<img width="999" height="883" alt="image" src="https://github.com/user-attachments/assets/2cfbd678-ab19-439b-92cb-38b621b3ce0f" /><img width="964" height="951" alt="image" src="https://github.com/user-attachments/assets/e8ad462c-9740-4e0a-b0d3-bc4de13d2582" /><img width="987" height="958" alt="image" src="https://github.com/user-attachments/assets/e66f4b40-3374-42ab-a4ab-aa461cbd71c5" />
