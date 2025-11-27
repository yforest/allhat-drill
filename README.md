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

wpcms — Production セキュリティ＆運用メモ
-----------------------------------

- **HTTPS**: 本番は必ず `https` を使用する。JWT や認証情報、アップロードされたファイルの送受信は TLS を前提にする。

- **JWT シークレット管理**:
  - `JWT_AUTH_SECRET_KEY` は `wp-config.php` に直書きする場合でも安全な長くランダムな文字列にする。
  - 可能であれば環境変数やホストのシークレット管理機能（例：ホスティングの Secret Manager）を使い、コードリポジトリに平文で置かない。

- **CORS 制限**:
  - 開発時は `Access-Control-Allow-Origin: http://localhost:5173` のように限定するが、本番ではフロントドメインのみを許可する。
  - ワイルドカード `*` は使用しない。必要に応じて認証済みユーザーのみ許可する設定にする。

- **ACF / REST 公開制御**:
  - ACF フィールドを REST に公開する場合は、必要最小限に留める。
  - 敏感なフィールドは公開しないか、`register_rest_field` や `permission_callback` で認証済みユーザーのみアクセスできるようにする。
  - プラグイン「ACF to REST API」を使う場合は、公開範囲を確認して不要なフィールド公開をオフにする。

- **ファイルアップロード**:
  - MIME タイプチェック、拡張子チェック、ファイルサイズ上限をサーバー側でも必ず実施する。
  - 可能であればアップロード直後にウイルススキャンや画像の再エンコードを行う。
  - アップロード先のパス名は推測できないものにし、直接の実行権限がないディレクトリを使う。

- **認証トークンの扱い（フロントエンド）**:
  - 公開クライアントでは `localStorage` にトークンを置くと XSS により盗まれるリスクがある。可能であれば `httpOnly` クッキーを用いたセッションや短寿命のトークン＋リフレッシュの設計を検討する。
  - JavaScript で扱う場合は最小権限、短い有効期限、トークンの定期ローテーションを行う。

- **ログとデバッグ**:
  - 本番で `WP_DEBUG` は `false` にする。エラーログは安全な場所に集約し、機密情報が出力されないようにする。

- **レート制限 / ブルートフォース対策**:
  - JWT トークンエンドポイントや投稿 API にはレート制限を設ける。ログイン試行や大量の POST を検出して防御する。

- **権限チェック**:
  - REST 経由で投稿やメディアを作る API は、ユーザー権限（`current_user_can('edit_posts')` など）を厳密に確認すること。
  - 公開 API を作る場合は CSRF / 権限制御を厳格に。

- **運用（アップデート）**:
  - WordPress本体、テーマ、プラグインは定期的に更新する。互換性テストを行ったうえでロールアウトする。

## Production: セキュリティと運用メモ

- HTTPS の徹底: 本番環境では必ず TLS（https）を使用する。JWT やファイルアップロードは TLS を前提とする。
- JWT シークレット管理:
  - `JWT_AUTH_SECRET_KEY` は長くランダムな文字列を使用する。
  - 可能なら環境変数やホストの Secret Manager を使い、リポジトリに平文で置かない。
- CORS の制限:
  - 開発時の `http://localhost:5173` 許可は OK。だが本番ではフロントの正当なドメインのみ許可し、`*` は避ける。
- ACF / REST 公開制御:
  - REST に公開する ACF フィールドは最小限にする。敏感なフィールドは `permission_callback` で認証ユーザーのみに制限する。
  - 「ACF to REST API」等のプラグインを利用する場合は、公開範囲の確認と不要フィールドの除外を行う。
- ファイルアップロード対策:
  - サーバー側で MIME/拡張子/サイズのチェック、ウイルススキャン、必要なら画像の再エンコードを行う。
  - アップロード先は実行権限を与えないディレクトリにし、予測困難なファイル名を採用する。
- 認証トークンの扱い:
  - `localStorage` は XSS に弱いため、可能なら `httpOnly` クッキー採用や短寿命トークン＋リフレッシュの設計を検討する。
- ログとデバッグ:
  - 本番で `WP_DEBUG` を true にしない。エラーログに機密情報が残らないようにする。
- レート制限・ブルートフォース対策:
  - JWT 発行 API（ログイン）や投稿 API にはレート制限を設ける。
- 権限チェック:
  - 投稿/メディア作成 API は必ず `current_user_can()` 等で権限を確認する。