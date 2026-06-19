const PRIZE_AMOUNTS = [10000, 50000, 100000, 500000, 1000000, 10000000];

const SAFETY_LINE_INDICES = [2, 5];

const QUESTIONS_PER_DIFFICULTY = 2;

const QUIZ_QUESTIONS = [
  {
    difficulty: "easy",
    text: "SLO の略は？",
    choices: [
      { text: "Service Level Objective", correct: true, keep: true, audience: 60 },
      { text: "System Load Optimizer", keep: true, audience: 22 },
      { text: "Server Live Output", audience: 10 },
      { text: "Secure Login Operation", audience: 8 },
    ],
    friendHint: "SLO の O は Objective（目標）。間違いなく Service Level Objective だよ。",
  },
  {
    difficulty: "easy",
    text: "「トイル（Toil）」とはどんな作業？",
    choices: [
      { text: "自動化できるのに繰り返す手作業", correct: true, keep: true, audience: 55 },
      { text: "新機能を生み出す創造的な開発作業", audience: 12 },
      { text: "障害時にだけ行う緊急対応作業", keep: true, audience: 25 },
      { text: "コードレビューなどの確認作業", audience: 8 },
    ],
    friendHint: "トイルは“自動化できるのに手でやってる繰り返し作業”。一番上で合ってるはず。",
  },
  {
    difficulty: "easy",
    text: "「SRE（Site Reliability Engineering）」を最初に提唱した企業は？",
    choices: [
      { text: "Google", correct: true, keep: true, audience: 64 },
      { text: "Amazon", keep: true, audience: 18 },
      { text: "Microsoft", audience: 10 },
      { text: "Netflix", audience: 8 },
    ],
    friendHint: "SRE Book を出したのは Google。自信あるよ。",
  },
  {
    difficulty: "easy",
    text: "SRE Book で、SRE が手作業の運用（トイル）に使う時間は全体の何%以下に抑えるべきとされる？",
    choices: [
      { text: "50%以下", correct: true, keep: true, audience: 52 },
      { text: "ほぼ0%", audience: 12 },
      { text: "90%以上", keep: true, audience: 28 },
      { text: "100%", audience: 8 },
    ],
    friendHint: "エンジニアリングに半分以上って話だから、運用は50%以下だと思う。",
  },
  {
    difficulty: "easy",
    text: "ポストモーテム（障害振り返り）で重視される文化は？",
    choices: [
      { text: "個人を責めない（Blameless）", correct: true, keep: true, audience: 58 },
      { text: "犯人を特定して責任を問う", keep: true, audience: 26 },
      { text: "二度と振り返りはしない", audience: 9 },
      { text: "上司だけで原因を決める", audience: 7 },
    ],
    friendHint: "ポストモーテムは Blameless ＝個人を責めない、が鉄則。それで間違いない。",
  },
  {
    difficulty: "medium",
    text: "SLI / SLO / SLA の関係として正しいのは？",
    choices: [
      { text: "SLI=指標、SLO=目標、SLA=顧客と契約", correct: true, keep: true, audience: 47 },
      { text: "3つともほぼ同じ意味の用語", audience: 13 },
      { text: "SLAが指標で、SLIが顧客契約", audience: 18 },
      { text: "SLOは契約、SLAは社内目標", keep: true, audience: 22 },
    ],
    friendHint: "SLI が指標、SLO が目標、SLA が顧客との契約。最初の選択肢が正しいと思う。",
  },
  {
    difficulty: "medium",
    text: "オンコールのアラート設計で推奨される考え方は？",
    choices: [
      { text: "対応が必要な事象だけ通知する", correct: true, keep: true, audience: 50 },
      { text: "ログはすべてアラートにする", keep: true, audience: 26 },
      { text: "アラートは多いほど安心できる", audience: 14 },
      { text: "夜間の通知はすべて無視する", audience: 10 },
    ],
    friendHint: "アラートは actionable なものだけ、が定石。“対応が必要な事象だけ通知”が正解じゃないかな。",
  },
  {
    difficulty: "medium",
    text: "DORA の「Four Keys」に含まれないものは？",
    choices: [
      { text: "従業員の残業時間", correct: true, keep: true, audience: 54 },
      { text: "デプロイ頻度", keep: true, audience: 20 },
      { text: "変更のリードタイム", audience: 14 },
      { text: "変更失敗率", audience: 12 },
    ],
    friendHint: "Four Keys はデプロイ頻度・リードタイム・変更失敗率・復旧時間。残業時間は入ってないよ。",
  },
  {
    difficulty: "medium",
    text: "SRE Book が提唱する監視の「4大シグナル（Four Golden Signals）」に含まれるのは？",
    choices: [
      { text: "レイテンシ / トラフィック / エラー / サチュレーション", correct: true, keep: true, audience: 48 },
      { text: "CPU / メモリ / ディスク / ネットワーク", keep: true, audience: 33 },
      { text: "朝 / 昼 / 夕 / 夜", audience: 11 },
      { text: "過去 / 現在 / 未来 / 予測", audience: 8 },
    ],
    friendHint: "4大シグナルはレイテンシ・トラフィック・エラー・サチュレーション。CPU…のと迷うけど1番目。",
  },
  {
    difficulty: "medium",
    text: "レイテンシ監視で「p99」が表すのは？",
    choices: [
      { text: "99%のリクエストが収まる応答時間", correct: true, keep: true, audience: 45 },
      { text: "全リクエストの平均応答時間", audience: 17 },
      { text: "99%の確率で落ちない指標", keep: true, audience: 30 },
      { text: "サーバー99台ぶんの処理量", audience: 8 },
    ],
    friendHint: "p99 は“99%のリクエストが収まる応答時間”。可用性の99%とは別物だよ。",
  },
  {
    difficulty: "hard",
    text: "SLO 99.9%（スリーナイン）の年間ダウンタイム許容は約どれくらい？",
    choices: [
      { text: "約8.8時間", correct: true, keep: true, audience: 38 },
      { text: "約53分", audience: 18 },
      { text: "約3.7日", audience: 14 },
      { text: "約8.8分", keep: true, audience: 30 },
    ],
    friendHint: "365日の0.1%だから年で8時間ちょっと。約8.8時間だと思うけど自信は半々。",
  },
  {
    difficulty: "hard",
    text: "「バーンレート」アラートの利点は？",
    choices: [
      { text: "バジェット消費速度で早期に検知できる", correct: true, keep: true, audience: 42 },
      { text: "CPU使用率を直接監視できる", audience: 16 },
      { text: "コストの消費速度を表せる", keep: true, audience: 31 },
      { text: "バッテリー残量がわかる指標", audience: 11 },
    ],
    friendHint: "バーンレートはエラーバジェットの消費速度。コストの話と紛らわしいけど1番目。",
  },
  {
    difficulty: "hard",
    text: "SRE Book で、過負荷時にシステム全体の崩壊を防ぐため「あえて一部のリクエストを捨てる」手法は？",
    choices: [
      { text: "ロードシェディング", correct: true, keep: true, audience: 40 },
      { text: "オートスケール", audience: 13 },
      { text: "ロードバランシング", keep: true, audience: 37 },
      { text: "キャッシュクリア", audience: 10 },
    ],
    friendHint: "“あえて捨てる”ならロードシェディング。ロードバランシングと間違えやすいから注意。",
  },
  {
    difficulty: "hard",
    text: "障害時のリトライで「指数バックオフ＋ジッター」を使う主な理由は？",
    choices: [
      { text: "再試行の集中を避けて負荷を分散する", correct: true, keep: true, audience: 41 },
      { text: "リトライを一切させなくする", keep: true, audience: 28 },
      { text: "CPUの発熱を下げられる", audience: 19 },
      { text: "ログを自動で暗号化できる", audience: 12 },
    ],
    friendHint: "バックオフ＋ジッターはリトライの同時殺到を避けるため。負荷を分散、が正解かな。",
  },
  {
    difficulty: "hard",
    text: "DORA の研究が示した、ソフトウェアデリバリの「スピード」と「安定性」の関係は？",
    choices: [
      { text: "トレードオフではなく両立できる", correct: true, keep: true, audience: 39 },
      { text: "速くすると必ず壊れてしまう", keep: true, audience: 31 },
      { text: "速さと安定はまったく無関係", audience: 12 },
      { text: "遅くするほど安定性が増す", audience: 18 },
    ],
    friendHint: "DORA の有名な結論は“速さと安定は両立する”。トレードオフじゃない、で合ってるはず。",
  },
];
