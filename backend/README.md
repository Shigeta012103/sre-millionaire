# ランキング用バックエンド (AWS CDK)

SRE クイズ・ミリオネアのランキングを保存・取得する最小構成。

- **DynamoDB**: スコア保存（オンデマンド課金）
- **Lambda (Node.js 20)**: `GET`=ランキング取得（正答数→合計時間でソート、上位50件）/ `POST`=スコア登録
- **Lambda Function URL**: 認証なし＋CORS。フロントの `RANKING_API_URL` に設定する

AWS SDK v3 は Lambda ランタイム同梱のため、Lambda 側に依存パッケージは不要。

## API

- `POST <FunctionUrl>` body `{"name": string, "correct": number, "time": number}` → スコア登録
- `GET  <FunctionUrl>` → `{"items": [{"name","correct","time","ts"}, ...]}`（ソート済み・上位50件）

## デプロイ手順

```bash
cd backend/cdk
npm install

# 初回のみ（対象アカウント/リージョンで未実施なら）
npx cdk bootstrap

# デプロイ（リージョン例: ap-northeast-1）
CDK_DEFAULT_REGION=ap-northeast-1 npm run deploy
```

デプロイ完了後、出力される `RankingApiUrl`（`https://xxxx.lambda-url.<region>.on.aws/`）を
フロントの `config.js` の `RANKING_API_URL` に設定し、フロントをデプロイする。

## 削除

```bash
cd backend/cdk
npm run destroy
```
