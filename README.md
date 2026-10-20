# スライム牧場

GitHubで改修・自動テストを行い、GitHub Pagesへ公開します。
セーブはプレイヤーのブラウザ内に保存し、GitHubへ送信しません。

## 公開・テスト

1. **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定。
2. `main` へpushするとビルド・構文検査・ブラウザテストを実行。
3. 全テストが成功した場合だけPagesへ公開。
4. テスト結果とキャプチャはActionsの `browser-test-results` artifactで確認。
5. PRではテストのみ実行。公開はしません。

公開先（設定・デプロイ成功後）：https://spf33yk.github.io/SlimeRanch/

Actions：https://github.com/spf33yk/SlimeRanch/actions

参考：[GitHub公式手順](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## GASからのセーブ移行

**普段使うGAS版・ブラウザを残したまま、最初にJSONを取得してください。**
GASとPagesは[保存領域が別](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)なので、
URLを開くだけでは引き継げません。

1. GASの既存 `index.html` の `</body>` 直前に
   [`migration/GasSaveExport.html`](migration/GasSaveExport.html) の全文を追加。
   この小さい機能だけでよく、新UIや画像の追加は不要です。
2. 既存デプロイのバージョンを更新し、**同じURL・同じブラウザ・同じプロファイル**で開く。
   別のテストURLを作らず、元の資産・個体・ステージが表示されることを確認。
3. ページ下部の「セーブJSONを書き出す」でJSONを保管。
   保存できない場合は、表示されるJSONをコピーして `.json` に保存。
4. GitHub版の **歯車 → セーブの引き継ぎ → JSONを読み込む** を選択。
5. 表示されたステージ・個体数を確認して読み込み。
6. 魔素・モンスター・相棒・ステージ・宝箱・装備を確認して移行完了。

GAS側のセーブは消しません。GitHub側も読み込み前のデータを
`slimeRanchCodex1:beforeImport` に退避し、設定画面から書き出せます。
既存の保存キーと構造を維持しています。音量・BGM選択は端末設定として扱います。
実際のセーブJSONはリポジトリにコミットしないでください。

GASに追加できない場合、元ゲームのフレームの開発者ツールで取得した
`JSON.stringify(g)` の通常JSONも読み込めます。
HTML記号 `<` / `>` を含むセーブは拒否します。名前で使っている場合は元ゲームで
変更し、該当名が最近のログから消えた後に再出力してください。

## 開発

Node.js 24 / pnpm 11.25.0

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm exec playwright install chromium
pnpm test
pnpm serve
```

ローカルURL：`http://127.0.0.1:4173/SlimeRanch/`

既存Edgeを使う場合は環境変数 `PLAYWRIGHT_EXECUTABLE_PATH` に
`msedge.exe` のパスを設定できます。CIではPlaywrightのChromiumを使います。

## 構成

- 直下HTML：GAS形式を残した編集ソース。直接ブラウザで開かない。
- `SaveTransfer.html`：バックアップ・読み込み・失敗時の保護。
- `scripts/build.cjs`：include展開とBase64素材のファイル抽出。
- `dist/`：公開用生成物。編集・コミット不要。
- `tests/`：PC・スマホ表示、採集、バトル、メディア、セーブの自動テスト。
- `.github/workflows/pages.yml`：テスト成功後に公開。
- `migration/`：GAS側で移行用JSONを書き出す追加コード。

Pagesでは画像・音声・動画を通常ファイルで配信し、GASへの通信は不要です。

## 改修順序

1. UI大幅アップデート
2. クリア条件
3. アセンション
4. バランス調整

初期版はGit履歴 `bd74dbe` に残っています。
