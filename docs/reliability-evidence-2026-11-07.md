# FIELDNOTE 品質・証拠レポート（2026-11-07）

> **状態：統合PR #349のレビュー段階。公開版mainへのマージ・デプロイは未実施。**
> ここで記す「修正」は統合ブランチ上の修正であり、利用者の現場で安全に動作することの保証ではありません。

## 調査対象と再現可能性

- リポジトリ：`mhinata2010-wq/freedom-building`
- 修正統合PR：[**#349**](https://github.com/mhinata2010-wq/freedom-building/pull/349)、ブランチ：`integration/fieldnote-reliability-gate`
- 元PR：#21、#24、#337、#338、#339、#340、#341、#342、#343
- 参考記録：[#16 UXレビュー](https://github.com/mhinata2010-wq/freedom-building/issues/16)、[#26 検証シナリオ](https://github.com/mhinata2010-wq/freedom-building/issues/26)
- 修正前のmainコミット：`2d67400cd3e21d495a92e6ee2abf228c52b30195`
- 品質チェックの対象コミット：`3e5c5dd6461fae91fd79264727beecc2698779a0`（この文書を追記する前の状態）
- GitHub Actions [FIELDNOTE quality gate](https://github.com/mhinata2010-wq/freedom-building/actions/runs/42378154897) 完了・SUCCESS
- GitHub Actions [Validate MVP](https://github.com/mhinata2010-wq/freedom-building/actions/runs/42378154927) 完了・SUCCESS
- quality gate実行ログ：**81件中78 PASS・0 FAIL・3 TODO**（Node.js 22の`node --test`、`npm run check`）。
- **上記は単体・統合ロジックの自動テスト**であり、Web UIのE2E成功件数ではない。

ローカルまたはCI上での再現手順：

```bash
npm run check
npm test
```

## 機能別の証拠レベル

| 範囲 | 根本問題の関連Issue | 提案コード | 証拠 | 未確認 |
|---|---|---|---|---|
| 休工日・暦日 | #20 | PR #24＋統合PR #349 | Node回帰テスト | 各施工現場の独自カレンダー、祝日設定のE2E |
| 工期変更後のメモ | #19 | PR #21＋#349 | Node回帰テスト | UIテキスト保存 |
| 循環依存・CSV未確認表示・数式先頭文字 | #17 #18 #336 | PR #337＋#349 | NodeでCSV出力比較 | Excel/Google Sheetsで実際に開く |
| タブのSpace操作 | #140、#16(0029) | PR #338＋#349 | Nodeでキーボード判定 | 公開画面のSpace再検証・スクリーンリーダー |
| JSON不正入力 | #30 | PR #339＋#349 | Nodeで型・ID・参照検証 | UIからの読み込み往復・旧データとの互換 |
| 保存失敗、要再解析状態 | #22 #28 | PR #340＋#349 | Nodeで保存失敗／状態復元 | localStorage拒否のUI、更新・離脱確認 |
| 手動確定後の再解析 | #29 | PR #341＋#349 | Nodeで差分保持を検証 | UIでの再編集・Undo/Redo |
| 事前工程の日付 | #31 | PR #342＋#349 | Nodeで工程開始日前を検証 | 休工日との複合UI |
| 60日超のガント | #32 | PR #343＋#349 | Nodeでページ範囲を検証 | 実ブラウザのバー・スクロール・モバイル |

## 実在工事例と架空テストを分離

- 公開事例 R01：[7日間の水回り・内装改修](https://handyman.jp/blog/oono-y/192191)。**公開事実**：4日＋週またぎ3日の工事。**合成テスト**：2026-11-09開始、月〜金稼働、2工程を依存接続。期待終了日2026-11-17。
- 公開事例 R02：[分散日程の水回り改修](https://kyodo.or.jp/jirei/reform-type/20496/)。**公開事実**：2025-03-27、04-18〜19、04-25〜26の施工日。**合成テスト**：工種名を公表されていない第1〜3期間として記録、開始日の保持を確認。
- 実在会社や依頼主が**FIELDNOTEを使用した記録ではありません**。営業的な実績・顧客事例と混同しないこと。
- `FT1107`、`TAB1107`、`UIR1107`等の大量Issueは**入力別テスト記録**。100回の繰り返しを100個の独立した根本原因・顧客クレームと数えないこと。

## 信頼度と未解決の課題

現在の裏付けは「**NodeロジックについてはCIで再現可能**」という段階。実ブラウザの操作・データ復元・現場での採用可否までは保証できない。

明示的な未解決事項：
- [#27](https://github.com/mhinata2010-wq/freedom-building/issues/27)：同じ日に順番のある工事を表現できない。
- [#23](https://github.com/mhinata2010-wq/freedom-building/issues/23)：付箋と工程の矢印の意味が曖昧。
- [#344](https://github.com/mhinata2010-wq/freedom-building/issues/344)：同名工程のCSV先行関係が識別しづらい。
- [#345](https://github.com/mhinata2010-wq/freedom-building/issues/345)：0.5日を5日と誤読する可能性。
- [#347](https://github.com/mhinata2010-wq/freedom-building/issues/347)：200日等の上限超過日数を無言で変更する可能性。
- [#348](https://github.com/mhinata2010-wq/freedom-building/issues/348)：2週間等の表現を認識できない可能性。
- CSV数式開始文字の実際のExcel/Sheets挙動、モバイル実操作、100%/200%表示、障害時UI、Assistive Technologyの確認は未実施。

## リリース判定ゲート

1. **自動テスト**：`npm run check`、`npm test`、既存の「Validate MVP」がすべて成功し、Nodeの検証記録をPRに残す。
2. **画面E2E**：工程カード作成→依存矢印→休工日設定→ドラフト編集→Gantt→CSV/JSON→再読み込み→再編集の順に、一貫して操作し、前後のデータ比較と画面証跡を残す。
3. **失敗時の安全**：localStorage容量超過、壊れたJSON、循環依存、無効日付、休工日がない設定を試す。元データを保持し、誤配布を防ぐ。
4. **互換性**：元データの旧フォーマット、Chrome/スマートフォン、Excel/Google Sheetsで確認。適切に扱えないものは警告・非対応を明示。
5. **現場検証**：施工管理担当5名程度によるタスク完遂・誤操作・所要時間の実測（これは今後の提案目標であり、実績ではない）。
6. **統合操作**：レビュー完了後、明示的なマージ／公開の指示を受けてからmainとGitHub Pagesを更新する。

この品質レポートは将来のCIや現場検証を**代替しない**。改善は必ず「再現可能なテスト＋人間の確認」を伴って完了判定する。
