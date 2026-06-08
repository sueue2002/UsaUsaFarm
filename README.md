# うさうさふぁーむ

小さなうさぎをなでて増やしていく、スマホ縦持ち向けの1画面クリッカーゲームです。

## 遊び方

`docs/index.html` をブラウザで開くと起動します。草原を「なでる」と、うさぎの数が増えます。増えたうさぎを消費して、にんじん強化またはなでる手強化を少しずつ進めます。

- にんじん強化: レベルを上げて、うさぎの毎秒増加量を伸ばします。
- なでる手強化: レベルを上げて、なでた時の増加量を伸ばします。
- ふぁーむ強化: ふぁーむを広げて、にんじんの毎秒増加量を強化します。
- おともだち: なでる力をもとに、自動でうさぎを増やしてくれます。
- ぴょんっ！/ぴょいっ！/ぴょこっ！: 後半で音程が上がるSEを切り替えます。
- リセット: 保存済みの進行状況を初期化します。

開始時は、なでる操作だけでうさぎが増えます。10回ほどなでると、にんじん強化が解放され、毎秒増加が始まります。

## にんじん段階

にんじんの見た目と名前はレベルに応じて、ふつう、ルビー、ガーネット、トパーズ、エメラルド、サファイア、ダイヤの順に変化します。

## 開発

ビルド手順はありません。GitHub Pages の公開元を `docs/` に設定すると、静的ファイルのみで動作します。

```text
docs/
  index.html
  app/
    app.js
  styles/
    styles.css
  assets/
    rabbits/
      usagi.svg
      usagi_gray.svg
      usagi_brown.svg
      usagi_pink.svg
      usagi_sky.svg
      usagi_gold.svg
    carrots/
      carrot.svg
      carrot_ruby.svg
      carrot_garnet.svg
      carrot_topaz.svg
      carrot_emerald.svg
      carrot_sapphire.svg
      carrot_diamond.svg
      carrot_leaf.svg
```

動作確認は `docs/index.html` を直接ブラウザで開いて行います。

進行状況は `localStorage` に保存されます。
