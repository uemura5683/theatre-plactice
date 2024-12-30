import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import fontData from "@compai/font-fugaz-one/data/typefaces/normal-400.json"; // @see https://components.ai/docs/typefaces/packages
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

// テキストのマテリアル
const material = new THREE.MeshStandardMaterial({
  color: "#ff9900",
  emissive: "#049ef4",
});

// フォントを読み込む
const font = new FontLoader().parse(fontData);

/**
 * テキストメッシュを作成します。
 * @param text string
 */
export const createTextMesh = (text) => {
  const textGeometry = new TextGeometry(text, {
    font: font,
    size: 6,
    depth: 2.4,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 1,
    bevelSize: 0.5, // 数値が大きいほど膨張した感じになる
    bevelOffset: 0,
    bevelSegments: 5,
  });
  textGeometry.center(); // テキストを中心揃え

  // そのままのTextGeometryだと表面がフラットで綺麗に見えないので、スムースシェーディングになるよう調整
  const textGeometry2 = textGeometry.clone().deleteAttribute("normal");
  const textGeometry3 = BufferGeometryUtils.mergeVertices(textGeometry2);
  textGeometry3.computeVertexNormals();

  return new THREE.Mesh(textGeometry3, material);
};
