const PRIZE_AMOUNTS = [
  10000, 20000, 30000, 50000, 100000,
  150000, 250000, 500000, 750000, 1000000,
  1500000, 2500000, 5000000, 7500000, 10000000,
];

const SAFETY_LINE_INDICES = [4, 9];

const QUIZ_QUESTIONS = [
  {
    text: "SRE の略として正しいものはどれ？",
    choices: [
      "Site Reliability Engineering",
      "System Resource Estimation",
      "Service Recovery Environment",
      "Secure Runtime Execution",
    ],
    answerIndex: 0,
    friendHint: "Google が提唱した役割の名前だよ。「サイト」の信頼性を支える仕事だ。",
  },
  {
    text: "SLO は何の略？",
    choices: [
      "Service Level Objective",
      "System Load Optimizer",
      "Server Logging Option",
      "Service Latency Output",
    ],
    answerIndex: 0,
    friendHint: "目標値（Objective）を表す言葉だったはず。SLA とは別物だよ。",
  },
  {
    text: "SLI が表すものはどれ？",
    choices: [
      "サービスレベルの実測指標",
      "顧客との契約上の罰則",
      "サーバーの物理設置場所",
      "ログ転送の暗号化方式",
    ],
    answerIndex: 0,
    friendHint: "I は Indicator。実際に測る「指標」のことだね。",
  },
  {
    text: "エラーバジェットの説明として最も適切なのは？",
    choices: [
      "SLO で許容される失敗の余地",
      "障害対応にかける予算",
      "テストの失敗許容数",
      "クラウド費用の上限",
    ],
    answerIndex: 0,
    friendHint: "100% から SLO を引いた「許される失敗の量」を予算に見立てたものだよ。",
  },
  {
    text: "SRE という考え方を最初に体系化・提唱した企業は？",
    choices: ["Google", "Amazon", "Microsoft", "Netflix"],
    answerIndex: 0,
    friendHint: "オライリーの「SRE 本」を出した検索エンジンの会社だね。",
  },
  {
    text: "可用性 99.9%（スリーナイン）の年間ダウンタイムは、おおよそどれくらい？",
    choices: ["約 8.7 時間", "約 52 分", "約 3.6 日", "約 5 分"],
    answerIndex: 0,
    friendHint: "365日 × 0.1% を時間で考えてみて。1日弱より少し短いくらいだよ。",
  },
  {
    text: "SRE における「トイル（Toil）」とは？",
    choices: [
      "自動化できる手作業の繰り返し運用",
      "新機能の設計作業",
      "障害のポストモーテム",
      "本番環境への初回デプロイ",
    ],
    answerIndex: 0,
    friendHint: "手作業で繰り返しが多く、自動化すべき運用作業のことだったよ。",
  },
  {
    text: "ポストモーテム（振り返り）で最も重視される姿勢は？",
    choices: [
      "Blameless（非難しない）",
      "担当者の責任を明確化する",
      "原因究明より復旧速度を優先する",
      "再発防止策は書かない",
    ],
    answerIndex: 0,
    friendHint: "個人を責めず、仕組みの問題として学ぶ文化が大事と言われているね。",
  },
  {
    text: "MTTR が表すものはどれ？",
    choices: [
      "平均修復時間",
      "最大同時接続数",
      "メモリ転送レート",
      "月間トラフィック総量",
    ],
    answerIndex: 0,
    friendHint: "Mean Time To Repair / Recovery。直すまでの平均時間だよ。",
  },
  {
    text: "可観測性（Observability）の「3本柱」と呼ばれるのは？",
    choices: [
      "メトリクス・ログ・トレース",
      "CPU・メモリ・ディスク",
      "認証・認可・監査",
      "開発・検証・本番",
    ],
    answerIndex: 0,
    friendHint: "Metrics, Logs, Traces の3つが定番の柱だよ。",
  },
  {
    text: "Netflix が広めた、本番環境でインスタンスをランダムに停止させるカオスエンジニアリングのツールは？",
    choices: ["Chaos Monkey", "Kraken", "Godzilla", "Gremlin Bot"],
    answerIndex: 0,
    friendHint: "「いたずらザル」がランダムにサーバーを落とすイメージのやつだね。",
  },
  {
    text: "サーキットブレーカーパターンの主な目的は？",
    choices: [
      "カスケード障害（障害の連鎖）を防ぐ",
      "電源を物理的に遮断する",
      "ログ量を削減する",
      "デプロイを高速化する",
    ],
    answerIndex: 0,
    friendHint: "失敗が続いたら呼び出しを遮断して、障害が連鎖するのを止める仕組みだよ。",
  },
  {
    text: "Google が示す「4つのゴールデンシグナル」に含まれないものは？",
    choices: [
      "コスト",
      "レイテンシ",
      "トラフィック",
      "サチュレーション",
    ],
    answerIndex: 0,
    friendHint: "Latency・Traffic・Errors・Saturation の4つ。お金の話は入っていないよ。",
  },
  {
    text: "SRE 本では、SRE が運用（オペレーション）作業に費やす時間の上限を何%としている？",
    choices: ["50%", "20%", "80%", "10%"],
    answerIndex: 0,
    friendHint: "残りはエンジニアリングに使うべき、という有名な「半分ルール」だよ。",
  },
  {
    text: "分散システムで「リーダー選出」や状態の合意に使われる、Paxos より理解しやすいとされる合意アルゴリズムは？",
    choices: ["Raft", "Gossip", "Bcrypt", "Dijkstra"],
    answerIndex: 0,
    friendHint: "「いかだ」という意味の名前。理解しやすさを売りにしたコンセンサスアルゴリズムだよ。",
  },
];
