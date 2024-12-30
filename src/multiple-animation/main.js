import * as THREE from "three";
import studio from "@theatre/studio";
import { getProject, types } from "@theatre/core";
import { createTextMesh } from "./createTextMesh";
import projectState from "../assets/MultipleAnimationProject.theatre-project-state.json";

// Theatre.jsのスタジオを初期化（開発環境でのみGUIを表示）
if (import.meta.env.DEV) {
  studio.initialize();
}

// プロジェクトを取得
const project = getProject("MultipleAnimationProject", { state: projectState }); // 書き出したJSONファイルを参照しアニメーションを初期化

// アニメーションを保存するシートを作成
const kvSheet = project.sheet("KV Animation"); // ロード後自動で再生するキービジュアルアニメーション用のシート
const scrollAnimSheet = project.sheet("Scroll Animation"); // スクロールボタン押下時に再生するアニメーション用のシート
const scrollButtonSheet = project.sheet("Scroll Button Animation"); // スクロールボタンのアニメーション用のシート
const textLoopSheet = project.sheet("Text Loop Animation"); // テキストのループアニメーション用のシート

(async () => {
  // Theatre.jsのロードを待つ
  await project.ready;

  // ロード後、1度だけ再生
  await kvSheet.sequence.play();

  // キービジュアルアニメーション後、ループアニメーションを開始
  textLoopSheet.sequence.play({
    iterationCount: Infinity, // 無限ループ
    direction: "alternate", // 通常再生-逆再生を往復
    rate: 0.8, // 0.8倍速
  });

  // スクロール監視の処理を初期化
  observer.observe(section);
})();

// スクロールボタン押下で再生
const scrollButton = document.querySelector("#scroll-button");
scrollButton.addEventListener("click", () => {
  scrollAnimSheet.sequence.play();
});

let onceFlag = false; // リロード時のスクロール位置に応じて再生を管理するためのフラグ

// スクロールで再生（IntersectionObserverを使用）
const section = document.querySelector("#section-about"); // 交差の監視対象
const observer = new IntersectionObserver(
  (entries) => {
    // Theatre.jsが読み込まれていなければリターン
    if (!project.isReady) {
      return;
    }
    if (entries[0].isIntersecting) {
      // スクロールして交差したときにアニメーションを再生
      scrollAnimSheet.sequence.play();
      scrollButtonSheet.sequence.play();

      onceFlag = true;
    } else {
      if (!onceFlag) {
        return;
      }
      // 上に戻るときは逆再生
      scrollAnimSheet.sequence.play({ direction: "reverse" });
      scrollButtonSheet.sequence.play({ direction: "reverse" });
    }
  },
  {
    root: null, // ビューポートをルート要素とする
    rootMargin: "-80% 0px -20%", // ビューポートの上から80%を判定基準にする
    threshold: 0, // 閾値は0
  },
);

// ---------------------------
// スクロールボタンのアニメーション定義
// ---------------------------
/** シート"KV Animation"の定義 */
const kvScrollButtonObj = kvSheet.object("ScrollButton", {
  scale: types.compound({
    x: types.number(1, { range: [0, 2] }),
    y: types.number(1, { range: [0, 2] }),
  }),
  // 見えないときは押下不可にするため、visibilityを定義
  visibility: types.stringLiteral("visible", {
    visible: "visible",
    hidden: "hidden",
  }),
});
kvScrollButtonObj.onValuesChange((values) => {
  scrollButton.style.scale = `${values.scale.x} ${values.scale.y}`;
  scrollButton.style.visibility = values.visibility;
});

/** シート"Scroll Button Animation"の定義 */
// GUIから入力するためのプロパティを定義
const scrollButtonObj = scrollButtonSheet.object("ScrollButton", {
  // 不透明度
  opacity: types.number(1, { range: [0, 1] }),
  // 透明度0のときに押下不可にするため、visibilityも定義
  visibility: types.stringLiteral("visible", {
    visible: "visible",
    hidden: "hidden",
  }),
});

// GUIからの入力を反映
scrollButtonObj.onValuesChange((values) => {
  scrollButton.style.opacity = values.opacity;
  scrollButton.style.visibility = values.visibility;
});

/**
 * Three.jsのセットアップ
 */
// シーンを作成
const scene = new THREE.Scene();
scene.background = new THREE.Color("#1d1d26");

// ---------------------------
// テキストのアニメーション定義
// ---------------------------
// テキストメッシュを作成
const text = createTextMesh("U");
const period = createTextMesh(".");
const text2 = createTextMesh("Stack");
const textGroup = new THREE.Group();
textGroup.add(text);
textGroup.add(period);
textGroup.add(text2);
scene.add(textGroup);

/** シート"KV Animation"の定義 */
// GUIから入力ができるよう変更させる回転を定義
const textObjProps = {
  rotation: types.compound({
    x: types.number(0, { range: [-1, 1] }), // −1回転 〜 1回転 の想定
    y: types.number(0, { range: [-1, 1] }),
    z: types.number(0, { range: [-1, 1] }),
  }),
  position: types.compound({
    px: types.number(0, { range: [-100, 100] }),
    py: types.number(0, { range: [-100, 100] }),
    pz: types.number(0, { range: [-100, 100] }),
  }),
  scale: types.number(1, { range: [0, 2] }),
};

const textObj = kvSheet.object("Text", textObjProps);
const text2Obj = kvSheet.object("Text2", textObjProps);
const periodObj = kvSheet.object("Period", textObjProps);

// GUIからの入力をオブジェクトに反映
textObj.onValuesChange((values) => {
  const { px, py, pz } = values.position;
  text.position.set(px, py, pz);
  text.scale.set(values.scale, values.scale, values.scale);
});

periodObj.onValuesChange((values) => {
  const { px, py, pz } = values.position;
  period.position.set(px, py, pz);
  period.scale.set(values.scale, values.scale, values.scale);
});

text2Obj.onValuesChange((values) => {
  const { px, py, pz } = values.position;
  text2.position.set(px, py, pz);
  text2.scale.set(values.scale, values.scale, values.scale);
});

/** シート"Scroll Animation"の定義 */
const textGroupObj = scrollAnimSheet.object("TextGroup", textObjProps);
textGroupObj.onValuesChange((values) => {
  const { x, y, z } = values.rotation;
  textGroup.rotation.set(x * 2 * Math.PI, y * 2 * Math.PI, z * 2 * Math.PI);
  const { px, py, pz } = values.position;
  textGroup.position.set(px, py, pz);
});

/** シート"Text Loop Animation"の定義 */
const textLoopObj = textLoopSheet.object("TextGroup", {
  posY: types.number(0, { range: [-10, 10] }),
});
textLoopObj.onValuesChange((value) => {
  textGroup.position.y = value.posY;
});

// ---------------------------
// キューブのアニメーション定義
// ---------------------------
// キューブのメッシュ
const material = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  emissive: "#ffffff",
});
const geometry = new THREE.BoxGeometry(6, 6, 6);
const cube = new THREE.Mesh(geometry, material);
scene.add(cube); // Three.jsのシーンに追加

/** シート"KV Animation"の定義 */
// GUIから入力できるよう、変更させたいプロパティを定義
const cubeObj = kvSheet.object("Cube", {
  rotation: types.compound({
    x: types.number(cube.rotation.x, { range: [-1, 1] }),
    y: types.number(cube.rotation.y, { range: [-1, 5] }),
    z: types.number(cube.rotation.z, { range: [-1, 1] }),
  }),
  position: types.compound({
    px: types.number(cube.position.x, { range: [-100, 100] }),
    py: types.number(cube.position.y, { range: [-100, 100] }),
    pz: types.number(cube.position.z, { range: [-100, 100] }),
  }),
  scale: types.compound({
    sx: types.number(cube.scale.x, { range: [0, 4] }),
    sy: types.number(cube.scale.y, { range: [0, 4] }),
    sz: types.number(cube.scale.z, { range: [0, 4] }),
  }),
  color: types.rgba(),
});

// GUIからの入力をオブジェクトに反映
cubeObj.onValuesChange((values) => {
  const { x, y, z } = values.rotation;
  cube.rotation.set(x * 2 * Math.PI, y * 2 * Math.PI, z * 2 * Math.PI);
  const { px, py, pz } = values.position;
  cube.position.set(px, py, pz);
  const { sx, sy, sz } = values.scale;
  cube.scale.set(sx, sy, sz);
  material.color = values.color;
});

/**
 * ライティング
 */
// 環境光源
const ambientLight = new THREE.AmbientLight("#ffffff", 1);
scene.add(ambientLight);

// 矩形ライト
const rectAreaLight = new THREE.RectAreaLight("#fff", 10, 50, 50);
rectAreaLight.position.set(-20, 40, 10);
rectAreaLight.lookAt(new THREE.Vector3(0, 0, 0)); // 座標原点の方を照らす
scene.add(rectAreaLight);

/**
 * カメラ
 */
const camera = new THREE.PerspectiveCamera(
  45,
  document.body.clientWidth / window.innerHeight, // document.body.clientWidth：スクロールバーを幅含まない横幅
  1,
  1000,
);
camera.position.z = 45;

/**
 * レンダラー
 */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.render(scene, camera);

const app = document.querySelector("#app");
app.appendChild(renderer.domElement);

/**
 * 毎フレーム時に実行されるループイベント
 */
const tick = () => {
  // レンダリング
  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};
tick();

/**
 * リサイズ時の処理
 */
const onResize = () => {
  // ウィンドウのサイズを取得
  const width = document.body.clientWidth; // スクロールバーを含まない横幅
  const height = window.innerHeight;

  // レンダラーのサイズを調整する
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // カメラのアスペクト比を正す
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};
// 初期化
onResize();
// リサイズイベント発生時に実行
window.addEventListener("resize", onResize);
