# ローカルサーバ（イベント用）

ローカルPCでゲームを配信し、結果をWebSocketでモニターに即時反映する。

- **静的配信**: ゲーム本体（リポジトリ直下）をそのまま配信
- **`POST /api/ranking`**: スマホからスコア登録 → `scores.json` に保存 → 全モニターへブロードキャスト
- **`GET /api/ranking`**: ランキング取得（正答数→合計時間でソート、上位50件）
- **WebSocket**: モニター（`display.html`）がランキングを購読、登録のたびに即時更新
- **`GET /api/qr`**: ngrok 公開URLのQRコード画像（モニターに表示し、スマホで読み取る）
- `/config.js` を上書きし、フロントの `RANKING_API_URL` をローカルAPIへ向ける

## 使い方

```bash
# 1. 依存インストール
cd server
npm install

# 2. サーバ起動（別ターミナルでも可）
npm start            # http://localhost:5180
# ポートを変えたい場合: PORT=3456 npm start

# 3. 公開トンネルを起動（どちらか／ポートはサーバに合わせる）
ngrok http 5180
#   または警告ページなしの cloudflared:
# cloudflared tunnel --url http://localhost:5180
```

- モニター（会場PC）で **http://localhost:5180/display.html** を開く → ランキング＋QRを表示
- QR は ngrok の公開URLを指す（`PUBLIC_URL` 環境変数で明示指定も可）
- 参加者は QR を読み取り、各自のスマホでプレイ。終了すると結果がモニターに即反映される

## 注意
- ngrok 無料枠は起動ごとにURLが変わる＋初回警告ページあり。固定運用は ngrok 有料 or `cloudflared` 推奨
- 保存は `server/scores.json`（サーバ再起動でも残る）。リセットしたい場合はこのファイルを削除
- PC は常時起動しておくこと
