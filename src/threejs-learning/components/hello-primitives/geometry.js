import * as Three from 'three';

export const myBox = new Three.BoxBufferGeometry(8, 8, 8)  //width height depth
export const myCircle =new Three.CircleBufferGeometry(7, 24);  //radius, segments
export const myCone = new Three.ConeBufferGeometry(6, 8, 16);  //radius, height, segments
export const myCylinder = new Three.CylinderBufferGeometry(4, 4, 8, 12); //radiusTop, radiusBottom, height, radialSegments
export const myDodecahedron = new Three.DodecahedronBufferGeometry(7);  //radius

const shape1 = new Three.Shape();
const x = -2.5;
const y = -5;
shape1.moveTo(x + 2.5, y + 2.5);
shape1.bezierCurveTo(x + 2.5, y + 2.5, x + 2, y, x, y);
shape1.bezierCurveTo(x - 3, y, x - 3, y + 3.5, x - 3, y + 3.5);
shape1.bezierCurveTo(x - 3, y + 5.5, x - 1.5, y + 7.7, x + 2.5, y + 9.5);
shape1.bezierCurveTo(x + 6, y + 7.7, x + 8, y + 4.5, x + 8, y + 3.5);
shape1.bezierCurveTo(x + 8, y + 3.5, x + 8, y, x + 5, y);
shape1.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);

const extrudeSettings = {
  steps: 2,
  depth: 2,
  bevelEnabled: true,
  bevelThickness: 1,
  bevelSize: 1,
  bevelSegments: 2,
};
export const myExtrude = new Three.ExtrudeBufferGeometry(shape1, extrudeSettings);
export const myIcosahedron = new Three.IcosahedronBufferGeometry(7);  //radius

const points = [];
for (let i = 0; i < 10; ++i) {
  points.push(new Three.Vector2(Math.sin(i * 0.2) * 3 + 3, (i - 5) * .8));
}
export const myLathe = new Three.LatheBufferGeometry(points)

export const myOctahedron = new Three.OctahedronBufferGeometry(7);  //radius

function klein(v, u, target) {
  u *= Math.PI;
  v *= 2 * Math.PI;
  u = u * 2;

  let x;
  let z;

  if (u < Math.PI) {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(u) * Math.cos(v);
      z = -8 * Math.sin(u) - 2 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v);
  } else {
      x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(v + Math.PI);
      z = -8 * Math.sin(u);
  }

  const y = -2 * (1 - Math.cos(u) / 2) * Math.sin(v);

  target.set(x, y, z).multiplyScalar(0.75);
}

const slices = 25;
const stacks = 25;
export const myParametric = new Three.ParametricGeometry(klein, slices, stacks);

export const myPlane = new Three.PlaneBufferGeometry(9,9,2,2); //width, height, widthSegments, heightSegments

const verticesOfCube = [
  -1, -1, -1,    1, -1, -1,    1,  1, -1,    -1,  1, -1,
  -1, -1,  1,    1, -1,  1,    1,  1,  1,    -1,  1,  1,
];
const indicesOfFaces = [
  2, 1, 0,    0, 3, 2,
  0, 4, 7,    7, 3, 0,
  0, 1, 5,    5, 4, 0,
  1, 2, 6,    6, 5, 1,
  2, 3, 7,    7, 6, 2,
  4, 5, 6,    6, 7, 4,
];
const radius = 7;
const detail = 2;
export const myPolyhedron = new Three.PolyhedronBufferGeometry(verticesOfCube, indicesOfFaces, radius, detail);

export const myRing = new Three.RingBufferGeometry(2,7,18); //innerRadius, outerRadius, segments

const shape = new Three.Shape();
const x1 = -2.5;
const y1 = -5;
shape.moveTo(x1 + 2.5, y1 + 2.5);
shape.bezierCurveTo(x1 + 2.5, y1 + 2.5, x1 + 2, y1, x1, y1);
shape.bezierCurveTo(x1 - 3, y1, x1 - 3, y1 + 3.5, x1 - 3, y1 + 3.5);
shape.bezierCurveTo(x1 - 3, y1 + 5.5, x1 - 1.5, y1 + 7.7, x1 + 2.5, y1 + 9.5);
shape.bezierCurveTo(x1 + 6, y1 + 7.7, x1 + 8, y1 + 4.5, x1 + 8, y1 + 3.5);
shape.bezierCurveTo(x1 + 8, y1 + 3.5, x1 + 8, y1, x1 + 5, y1);
shape.bezierCurveTo(x1 + 3.5, y1, x1 + 2.5, y1 + 2.5, x1 + 2.5, y1 + 2.5);
export const myShape = new Three.ShapeBufferGeometry(shape);

export const mySphere = new Three.SphereBufferGeometry(7,12,8);  //radius, widthSegments, heightSegments
export const myTetrahedron = new Three.TetrahedronBufferGeometry(7);  //radius
export const myTorus = new Three.TorusBufferGeometry(5,2,8,24); //radius, tubeRadius, radialSegments, tubularSegments 
export const myTorusKnot = new Three.TorusKnotBufferGeometry(3.5,1.5,8,64,2,3); //radius, tube, tubularSegments, radialSegments, p, q

class CustomSinCurve extends Three.Curve {
  constructor(scale) {
    super();
    this.scale = scale;
  }
  getPoint(t) {
    const tx = t * 3 - 1.5;
    const ty = Math.sin(2 * Math.PI * t);
    const tz = 0;
    return new Three.Vector3(tx, ty, tz).multiplyScalar(this.scale);
  }
};
const path = new CustomSinCurve(4);
const tubularSegments = 20;
const radius1 = 1;
const radialSegments = 8;
const closed = false;
export const myTube = new Three.TubeBufferGeometry(path, tubularSegments, radius1, radialSegments, closed);

const width = 8;
const height = 8;
const depth = 8;
const thresholdAngle = 15;
export const myEdges = new Three.EdgesGeometry( new Three.BoxGeometry(width, height, depth),thresholdAngle);

const width1 = 8;
const height1 = 8;
const depth1 = 8;
export const myWireframe = new Three.WireframeGeometry(new Three.BoxGeometry(width1, height1, depth1));

//在使用 TextBufferGeometry 创建 文字几何对象之前，需要先加载 3D 字体数据, 由于需要加载外部字体数据文件，所以创建 3D 文字这个过程是异步的

const loader = new Three.FontLoader();
// promisify font loading
function loadFont(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

export async function createText() {
  const font = await loadFont('https://threejsfundamentals.org/threejs/resources/threejs/fonts/helvetiker_regular.typeface.json'); 

    //第一个参数 'three.js' 可以替换成任何其他的英文字母
    //特别注意：由于目前我们加载的 字体数据 只是针对英文字母的字体轮廓描述，并没有包含中文字体轮廓
    //所以如果设置成 汉字，则场景无法正常渲染出文字
    //对于无法渲染的字符，会被渲染成 问号(?) 作为替代
    //第二个参数对应的是文字外观配置
  const geometry = new Three.TextGeometry('three.js', {
    font: font,
    size: 3.0,
    height: .2,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.15,
    bevelSize: .3,
    bevelSegments: 5,
  });
  const material = new Three.MeshPhongMaterial({side: Three.DoubleSide,});   
  const hue = Math.random();
  const saturation = 1;
  const luminance = .5;
  material.color.setHSL(hue, saturation, luminance);
  const mesh = new Three.Mesh(geometry, material);

  //Three.js默认是以文字左侧为中心旋转点，下面的代码是将文字旋转点位置改为文字中心
  //实现的思路是：用文字的网格去套进另外一个网格，通过 2 个网格之间的落差来实现将旋转中心点转移到文字中心位置
  //我们可以对边界框调用 getCenter，将网格位置对象传给它。 getCenter 将盒子的中心值复制进位置对象。 同时它也返回位置对象，这样我们就可以调用 multiplyScalar(-1) 来放置整个对象，这样对象的旋转中心就是对象的中心了
  geometry.computeBoundingBox();
  geometry.boundingBox.getCenter(mesh.position).multiplyScalar(-1);

  //Object3D 是 Three.js 场景图中的标准节点。 Mesh 也是继承自 Object3D
  const text = new Three.Object3D();
  text.add(mesh);
  return text;
}