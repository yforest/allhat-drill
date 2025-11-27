ALL HAT — wpcms README
======================

目的
----
このファイルは `wpcms`（WordPress 配置ディレクトリ）で行った CORS / JWT 関連の変更点と、
本番導入時の注意事項・手順をまとめたものです。

変更内容（開発時）
------------------
- **.htaccess（wpcms/.htaccess）に追加した CORS ブロック**
  - 開発用に `http://localhost:5173` を許可する設定を追加しました。
  - 追加例:
    <IfModule mod_headers.c>
      Header set Access-Control-Allow-Origin "http://localhost:5173"
      Header set Access-Control-Allow-Methods "POST, GET, OPTIONS, PUT, DELETE"
      Header set Access-Control-Allow-Credentials "true"
      Header set Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With"
    </IfModule>
  - 目的: Vite（WSL → Windows ブラウザ）から WordPress REST API / JWT エンドポイントへアクセスするための開発用設定。

- **wp-config.php（wpcms/wp-config.php）での JWT 設定**
  - `JWT_AUTH_SECRET_KEY` を `AUTH_KEY` 等の直後に定義しました（プラグインが初期化時に読み取れるように）。
  - 開発時に `JWT_AUTH_CORS_ENABLE` を利用していた場合がありますが、本番では不要（または `false`）にすることを推奨します。

本番環境での推奨設定（重要）
-----------------------------
- **CORS の制御**
  - 絶対に `Access-Control-Allow-Origin: *` と `Access-Control-Allow-Credentials: true` を同時に使わないでください（ブラウザが拒否しますしセキュリティリスクが高いです）。
  - 本番では必ずフロントの正規ドメインを明示的に指定してください（例: `https://app.example.com`）。
  - 本番用例（.htaccess）:
    <IfModule mod_headers.c>
      Header set Access-Control-Allow-Origin "https://app.example.com"
      Header set Access-Control-Allow-Methods "POST, GET, OPTIONS, PUT, DELETE"
      Header set Access-Control-Allow-Credentials "true"
      Header set Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With"
    </IfModule>

- **JWT シークレット**
  - `JWT_AUTH_SECRET_KEY` は `wp-config.php` の認証ユニークキー（`AUTH_KEY` / `SECURE_AUTH_KEY` 等）の直後に定義してください。
  - シークレットは公開リポジトリに絶対に含めないでください。可能なら環境変数やシークレットマネージャで管理してください。

- **`JWT_AUTH_CORS_ENABLE` の扱い**
  - 推奨: 本番では `JWT_AUTH_CORS_ENABLE` を削除するか `false` にしてください。CORS は `.htaccess`（またはウェブサーバ設定）で一元管理する方が確実です。

デプロイ手順（概要）
-------------------
1. `wpcms/wp-config.php` のバックアップを作成:
2. `wp-config.php` に `JWT_AUTH_SECRET_KEY` を認証キー直後に追加（または既存位置を確認）。
3. `.htaccess` を本番用に修正（開発用 localhost 設定を本番ドメインに置換）。
4. サイトキャッシュ（LiteSpeed/プラグイン/CDN）をクリア。
5. JWT プラグインを一度「無効化」→「有効化」して設定を反映。
6. 動作確認:
- REST API ルート:
  ```
  curl -I 'https://hitobou.com/allhat/drill/wpcms/wp-json/'
  ```
- JWT トークン取得（テストユーザーで実行）:
  ```
  curl -v -H "Content-Type: application/json" \
    -X POST \
    -d '{"username":"YOUR_USER","password":"YOUR_PASS"}' \
    'https://hitobou.com/allhat/drill/wpcms/wp-json/jwt-auth/v1/token'
  ```

検証ポイント
-------------
- `curl` の応答が `200` で `token` を含む JSON であること。
- ブラウザの DevTools → Network → 対象リクエストのレスポンスヘッダに `Access-Control-Allow-Origin` が正しく表示されていること。
- `wp-content/debug.log` に致命的な PHP エラーが記録されていないこと（必要に応じ `WP_DEBUG` を一時有効にしてログを確認）。

ロールバック手順
----------------
- 変更に問題があれば、保存しておいたバックアップを戻す: