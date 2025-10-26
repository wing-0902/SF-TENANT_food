# SF-TENANT_food

SF 食品企画用注文管理ツール．主に雨天時の使用を想定．

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 有識者へ

こういうコマンドで開発環境を設定します．

pnpmとかは自分で入れてください．クラウドIDEやったらデフォで使えるかと．

| コマンド                   | 実行                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | 依存関係をインストール（最初にすること）                            |
| `pnpm dev`             | `localhost:4321`に開発サーバーを開始      |
| `pnpm build`           | `./dist/`に成果物を出力          |
| `pnpm preview`         | デプロイ前にプレビューしましょう     |
| `pnpm astro ...`       | Astro用のコマンドラインツールです．勝手に調べてくれ． |
| `pnpm astro -- --help` | Astro用のコマンドのヘルプを見るためのコマンド．                     |

## Astroについて

ここ見とけ．

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).