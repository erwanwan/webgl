import { useEffect, useRef } from "react";
import * as Three from "three";
import { uid } from 'uid';
import { MapControls } from 'three/examples/jsm/controls/OrbitControls';
import * as geolib from 'geolib';
import Stats from 'three/examples/jsm/libs/stats.module';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { Water } from 'three/examples/jsm/objects/Water';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
// import { getTerrain, getOsmData, objToGltf } from './getData';
import * as GeoTIFF from 'geotiff';
import html2canvas from 'html2canvas';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import {interpolateHsl} from "d3-interpolate";
//model
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// bloom
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
import {FXAAShader} from 'three/examples/jsm/shaders/FXAAShader'

//sky
import { Sky } from 'three/examples/jsm/objects/Sky';

import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';

//outline
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';

import worker_script from './web-worker';

import './index.less'
// getTerrain();

// getOsmData(data);
// objToGltf();

const center = [104.0620386,30.5846394];
let aniLineGroup = [];
let waterGroup = [];
let labelGroup = [];
const lineLenArr = [];
let percent = 0;
let buildingLineGroup = [];
let buildingGroup = [];
const buildingHeightArr = [];
const stertBuildingLine = false;

// Create worker
var myWorker = new Worker(worker_script);

// Send message to worker
// myWorker.postMessage('Hello!');

// // Receive message from worker
// myWorker.onmessage = function(e) {
//   console.log(e.data);
// }

const init = (canvas,statsDom)=>{
  if (!canvas) {
    return;
  }
  //创建一个渲染器
  const renderer = new Three.WebGLRenderer({canvas,antialias: true}); //后面一个参数是抗锯齿
  renderer.setClearColor('#000')
  //创建一个css2d渲染器
  // const labelRenderer = new CSS2DRenderer();
  // labelRenderer.domElement.style.position = 'absolute';
  // labelRenderer.domElement.style.top = '0px';
  // document.body.appendChild( labelRenderer.domElement );
  

  //创建镜头
  const camera = new Three.PerspectiveCamera(25, 2, 1, 1000);
  camera.position.set(40,10,0);
  // const camera = new Three.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 100, 2000000 );
	// 			camera.position.set( 0, 100, 2000 );


  //创建灯光
  const light0 = new Three.AmbientLight(0xfafafa, 1)

  const light1 = new Three.PointLight(0xfafafa, 0.6)
  light1.position.set(200, 90, 40)

  const light2 = new Three.PointLight(0xfafafa, 0.6)
  light2.position.set(200, 90, -40)
  

  //创建场景
  const scene = new Three.Scene();
  // scene.background = new Three.Color(0x222222);
  scene.add(light0);
  scene.add(light1);
  scene.add(light2);

  //创建流动的街道的group
  aniLineGroup = new Three.Group();
  
  //创建water的group
  waterGroup = new Three.Group();

  //创建label的group
  labelGroup = new Three.Group();

  //创建建筑上下移动的线条的group
  buildingLineGroup = new Three.Group();

  //冲击波建筑
  buildingGroup = new Three.Group();

  scene.add(aniLineGroup);
  scene.add(waterGroup);
  scene.add(labelGroup);
  scene.add(buildingLineGroup);
  scene.add(buildingGroup);



  //创建gridHelper
  //创建一个尺寸为 60 和 每个维度细分 160 次的坐标格. 颜色可选.
  // const gridHelper = new Three.GridHelper(60, 160, new Three.Color(0x555555), new Three.Color(0x333333))  //size -- 坐标格尺寸. 默认为 10. divisions -- 坐标格细分次数. 默认为 10.colorCenterLine -- 中线颜色. colorGrid -- 坐标格网格线颜色
  // scene.add(gridHelper)

  // let geometry = new Three.BoxGeometry(1,1,1)
  // let material = new Three.MeshBasicMaterial({color: 0x00ff00})
  // let mesh = new Three.Mesh(geometry, material)

  // const axes = new Three.AxesHelper();
  //     axes.material.depthTest = false;
  //     axes.renderOrder = 1;
  //     mesh.add(axes);
  // scene.add(mesh)

  //创建mapControls
  const mapControl = new MapControls( camera, renderer.domElement);
  mapControl.enableDamping = true
  mapControl.dampingFactor = 0.25
  mapControl.screenSpacePanning = false
  mapControl.maxDistance = 800

  mapControl.update();
 
  //创建性能查看器
  let stats;
  if (statsDom) {
    stats = new Stats();
    statsDom.appendChild(stats.dom);
  }

  


  return {
    renderer,
    camera,
    scene,
    mapControl,
    stats,
    
  }
};




//计算个点位相对于中心点位
const GPSRelativePosition = (objPosi, centerPosi) => {

  // Get GPS distance
  let dis = geolib.getDistance(objPosi, centerPosi)

  // Get bearing angle
  let bearing = geolib.getRhumbLineBearing(objPosi, centerPosi)

  // Calculate X by centerPosi.x + distance * cos(rad)
  let x = centerPosi[0] + (dis * Math.cos(bearing * Math.PI / 180))

  // Calculate Y by centerPosi.y + distance * sin(rad)
  let y = centerPosi[1] + (dis * Math.sin(bearing * Math.PI / 180))

  // Reverse X (it work) 
  return [-x / 100, y / 100]
}


const genShape = (points, center) => {
  const shape = new Three.Shape();
  const positionArr = [];
  points.forEach((point, index)=>{
    const position = GPSRelativePosition(point, center);
    positionArr.push(position);
    if (index===0) {
      shape.moveTo(position[0], position[1]) //移动到某个点
    } else {
      shape.lineTo(position[0], position[1])
    }
  })
  return {shape, positionArr};
}

const genGeometry = (shape, setting) => {
  const geometry = new Three.ExtrudeGeometry( shape, setting);  //从一个形状路径中，挤压出一个BufferGeometry
  geometry.computeBoundingBox();   //计算当前 bufferGeometry 的外边界矩形boundingBox(3维包围盒)

  return geometry
}

// const MATERAL = new Three.MeshPhongMaterial();
const texture = new Three.TextureLoader().load(require("./assets/wall2.png").default);
// const texture = new Three.TextureLoader().load(require("./assets/light-building.jpg").default);
texture.center.set(.5, .5);
texture.rotation = Three.MathUtils.degToRad(180);
texture.wrapS = Three.RepeatWrapping;
texture.wrapT = Three.RepeatWrapping;
const MATERAL = new Three.MeshPhongMaterial({map: texture});
// const MATERAL = new Three.MeshBasicMaterial({map: texture});

// const LINE_MATERAL = new Three.LineBasicMaterial({color: 0x254360});
// const LINE_MATERAL = new Three.LineBasicMaterial( { vertexColors: true } );
const LINE_MATERAL = new LineMaterial( {
  // color: 0x254360,
  linewidth: 3, // in pixels
  vertexColors: true,  //color设置，启用顶点颜色渲染
  //resolution:  // to be set by renderer, eventually
  // dashed: true,
  // dashScale: 1,
  // dashSize:1,
  // gapSize:2
  // alphaToCoverage: true,
} );
LINE_MATERAL.resolution.set(window.innerWidth, window.innerHeight);

const BASIC_LINE_MATERAL = new LineMaterial( {
  color: 0x254360,
  linewidth: 3, // in pixels
  // vertexColors: true,  //color设置，启用顶点颜色渲染
  //resolution:  // to be set by renderer, eventually
  // dashed: true,
  // dashScale: 1,
  // dashSize:1,
  // gapSize:2
  // alphaToCoverage: true,
} );
BASIC_LINE_MATERAL.resolution.set(window.innerWidth, window.innerHeight)

const BUILDING_LINE_MATERAL = new LineMaterial( {
  linewidth: 3, // in pixels
  vertexColors: true,  //color设置，启用顶点颜色渲染
} );
BUILDING_LINE_MATERAL.resolution.set(window.innerWidth, window.innerHeight);

const BUILDING_LINE_MATERAL1 = new LineMaterial( {
  color: '00ffff',
  linewidth: 1, // in pixels
});
BUILDING_LINE_MATERAL1.resolution.set(window.innerWidth, window.innerHeight);


const addBuilding = (data,scene, camera) => {
  const {geometry:{coordinates = []}, properties} = data;
  const level = properties['building:levels'] || 1;  //有的数据缺失 所以补一个最小的
  const height = properties.height;
  let heightLevel = 0.04;
  if (height) {
    const heightLevelReal = (height / level) / 100;
    if (heightLevelReal > heightLevel) {
      heightLevel = heightLevelReal
    }
  }
  // console.log(height, properties)

  let shape;
  const holes = [];
  let positionArr = [];
  coordinates.forEach((points,index)=>{
    if (index===0) {
      
      // shape= genShape(points, center);
      const result = genShape(points, center);
      shape = result.shape;
      positionArr = result.positionArr;
    } else {
      holes.push( genShape(points, center).shape)
    }
  })

  holes.forEach((hole)=>{
    shape.holes.push(hole);
  })
  
  const geometry = genGeometry(shape, {
    curveSegments: 1,
    depth: heightLevel * level, 
    // depth: 0.05 * level, 
    bevelEnabled: false
  });
  

  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);

  //添加box3Helper
  if (!geometry.boundingBox) {
    genGeometry.computeBoundingBox();
  }

  const box3 = geometry.boundingBox;
  
  let helper;
  if (isFinite(box3.max.x)) {
    helper = new Three.Box3Helper(box3, 0xffff00);
    //更新线框辅助对象与 box3 属性保持一致
    helper.updateMatrixWorld();

    helper.name = properties.name || 'building';
    helper.info = properties
  }

  if (properties.name && properties.name!=='金融城') {
    const spritePosition = geolib.getCenter(coordinates[0]);
    const spritePoint = GPSRelativePosition(spritePosition, center);

    const html = `<div class="sprite-layer ${uid()}">${properties.name}</div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    const element = document.body.lastChild;
    element.style.zIndex = -1;
    html2canvas(element, {
      backgroundColor: "transparent",
      width: element.clientWidth, //dom 原始宽度
      height: element.clientHeight,
      useCORS: true, // 【重要】开启跨域配置
      logging:false
    }).then(canvas => {
      let texture = new Three.CanvasTexture(canvas);
      texture.needsUpdate = true;

      let spriteMaterial = new Three.SpriteMaterial({
        map: texture,
      });
      let sprite = new Three.Sprite(spriteMaterial);
      // sprite.name = properties.name;
      sprite.position.set(-spritePoint[0],heightLevel*level+0.5,spritePoint[1]);
      sprite.scale.set(0.5*element.clientWidth/element.clientHeight, 0.5, 0.5*element.clientWidth/element.clientHeight);
      labelGroup.add(sprite);
      document.body.removeChild(element);
    },(err)=>{
      console.log(err)
      console.log(properties.name)
      document.body.removeChild(element);
    });

  }

  //生成建筑上面的流动线条
  // if (heightLevel*level >=1 && properties.name!=='金融城' && (properties.name || '').indexOf('中海国际')<0) {
  if (properties.name==='新世纪环球中心') {
    const lineHightArr = [];
    const limit = Math.floor(heightLevel*level / 0.25);
    for (let i = 1; i< limit; i++) {
      lineHightArr.push(heightLevel*level* i / limit)
    }

    lineHightArr.forEach((height) => {
      const linePositons = positionArr.map((point)=>{
        return [point[0], point[1], height]
        // return new Three.Vector3(point[0]+0.01, point[1]+0.01, height)
      });

      // const curve = new Three.CatmullRomCurve3(linePositons);
      // const points = curve.getPoints( 50 );
      

      // const linePoints = points.reduce((acc, point)=>{
      //   acc.push(point.x, point.y, point.z);
      //   return acc;
      // }, [])

      const linePoints = linePositons.flat();
    
      const geometry = new LineGeometry();
      geometry.setPositions( linePoints );

      geometry.rotateX(Math.PI /2 )
      geometry.rotateZ(Math.PI);
      // geometry.scale(1,10,1);
      // geometry.translateX(0.1)
  
      const colors = getColorsArr(linePoints.length / 3, ["#fc5531", "#254360"], 3);
      geometry.setColors( colors );
  
      const line = new Line2( geometry, BUILDING_LINE_MATERAL );
      line.computeLineDistances();
      // line.translateX(0.1)
      // scene.add(line)
      // line.layers.set(1);
      // aniLineGroup.layers.set(1)
      aniLineGroup.add(line);
      lineLenArr.push({colors, index: 0})
    })    
  }

  //生成建筑上下移动的光带
  if (properties.name==='金融城' || properties['@id']==='way/475895965') {
    // const linePositons = positionArr.map((point)=>{
    //   return [point[0], point[1], 0]
    // })
    // const linePoints = linePositons.flat();
  
    // const geometry = new LineGeometry();
    // geometry.setPositions( linePoints );
    // geometry.rotateX(Math.PI /2 )
    // geometry.rotateZ(Math.PI);

    

    // const line = new Line2( geometry, BUILDING_LINE_MATERAL1 );
    // line.computeLineDistances();
    // line.material.transparent = true;
    // line.material.opacity = 0;
    // buildingLineGroup.add(line);
    // buildingHeightArr.push({height: heightLevel*level, lineHeight: 0, step: 0.01})

    let ShaderBar = {
      uniforms: {
        boxH: { value: -5.0 },
        beamLength: {value: 1.0},
      },
      vertexShader: `
          varying vec3 vColor;
          varying float v_pz; 

          void main(){
          vColor = color;
          v_pz = position.y; 
              gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
          }
      `,
      fragmentShader: `
          uniform float	boxH;
          uniform float	beamLength;
          varying vec3	vVertexNormal;
          varying vec3 vColor;
          varying float v_pz; 

          float plot ( float pct){
          return  smoothstep(pct - beamLength, pct, v_pz) - smoothstep(pct, pct+0.02, v_pz);
          }

          void main(){
          float f1 = plot(boxH);
          vec4 b1 = mix(vec4(1.0, 1.0, 1.0, 1.0), vec4(f1,f1,f1,1.0), 0.8);

          gl_FragColor = mix(vec4(vColor,1.0), b1, f1);
          gl_FragColor = vec4(gl_FragColor.r, gl_FragColor.g, gl_FragColor.b, 0.9);
          }
      `
    };

    // const colors = getColorsArr(geometry.attributes.position.count, ["#fc5531", "#254360"], 1);

    const colors = []
    for (var i = 0; i < geometry.attributes.position.count; i+=15) {
      var r = Math.random() * 0.8
      var g = Math.random() * 0.7
      var b = Math.random() * 0.5

      for(let i=0;i<15;i++) {
        colors.push(r, g, b)
      }
    }

    geometry.setAttribute('color', new Three.Float32BufferAttribute( colors, 3 ));
    const material = new Three.ShaderMaterial({
        uniforms: ShaderBar.uniforms,
        vertexShader: ShaderBar.vertexShader,
        fragmentShader: ShaderBar.fragmentShader,
        vertexColors: ShaderBar,
    });
    const cube = new Three.Mesh(geometry, material)
  
    buildingGroup.add(cube);
    
    if (properties.name!=='金融城') {
      return {helper};
    }

    //制作指示和名称
    const spritePosition = geolib.getCenter(coordinates[0]);
    const spritePoint = GPSRelativePosition(spritePosition, center);

    const cylinder = new Three.CylinderBufferGeometry(0.3, 0, 0.6, 4 );

    // const cylinderMaterial = new Three.MeshBasicMaterial({color: '#cfff3b'})
    const ShaderBar1 = {
      uniforms: {
        cylinderH: { value: 0.6 },
        cykinderColor: {value: new Three.Color('#cfff3b')},
        time: {value: 0.0},
      },
      vertexShader: `
          varying vec3 v_position; 

          void main(){
            v_position = position; 
            gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
          }
      `,
      fragmentShader: `
          uniform float	cylinderH;
          uniform vec3	cykinderColor;
          uniform float	time;
          varying vec3	v_position;

          void main(){
            float op = 0.6;
            if (v_position.y+0.3 >= cylinderH - time) {   //中间是0所以要加高度的一半
              op = 0.8;
            }
            gl_FragColor = vec4(cykinderColor.r, cykinderColor.g, cykinderColor.b, op);
          }
      `
    };

    const cylinderMaterial = new Three.ShaderMaterial({
      uniforms: ShaderBar1.uniforms,
      vertexShader: ShaderBar1.vertexShader,
      fragmentShader: ShaderBar1.fragmentShader,
      transparent: true
      // vertexColors: ShaderBar,
    });

    const cylinderMesh = new Three.Mesh(cylinder, cylinderMaterial);
    cylinderMesh.name="cylinder";
    cylinderMesh.position.set(-spritePoint[0],heightLevel*level+1,spritePoint[1])
    labelGroup.add(cylinderMesh);

    const html = `<div class="sprite-layer1">${properties.name}</div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    const element = document.body.lastChild;
    element.style.zIndex = -1;

   
    html2canvas(element, {
      backgroundColor: "transparent",
      width: element.offsetWidth, //dom 原始宽度
      height: element.offsetHeight,
      useCORS: true, // 【重要】开启跨域配置
      logging:false
    }).then(canvas => {
      let texture = new Three.CanvasTexture(canvas);
      texture.needsUpdate = true;

      let spriteMaterial = new Three.SpriteMaterial({
        map: texture,
      });
      let sprite = new Three.Sprite(spriteMaterial);
      sprite.name = properties.name;
      sprite.position.set(-spritePoint[0],heightLevel*level+1.8,spritePoint[1]);
      sprite.scale.set(0.5*element.offsetWidth/element.offsetHeight, 0.5, 0.5*element.offsetWidth/element.offsetHeight);
      labelGroup.add(sprite);
      document.body.removeChild(element);
    },(err)=>{
      console.log(err)
      console.log(properties.name)
      document.body.removeChild(element);
    });



    return {helper};
  }

  //纹理流动效果
  if ((properties.name || '').indexOf('中海国际')>-1) {
    // geometry.rotateZ(Math.PI);
    // geometry.rotateX(-Math.PI / 2);


    const ShaderBar = {
      uniforms: {
        time: { value: 1 },
        //可以流动的竖条纹
        colorTexture: {value: new Three.TextureLoader().load("https://model.3dmomoda.com/models/47007127aaf1489fb54fa816a15551cd/0/gltf/22E46ED4F3C1AB2036C7CC26E419986D.png")},
        // colorTexture: {value: colorTexture},
        //蓝色的背景
        // colorTexture1: {value: new Three.TextureLoader().load("https://model.3dmomoda.com/models/da5e99c0be934db7a42208d5d466fd33/0/gltf/73740C1707B264008C18C0DACF097220.png")}
        colorTexture1: {value: new Three.TextureLoader().load(require('./assets/texture-flow.png').default)}
        // colorTexture1: {value: new Three.TextureLoader().load("https://model.3dmomoda.com/models/ab9edcfbba24487b9617507e29b1d274/0/gltf/19661E47809F6B251732F07BCB48DAD7.png")}
        // colorTexture1: {value: new Three.TextureLoader().load("https://model.3dmomoda.com/models/da5e99c0be934db7a42208d5d466fd33/0/gltf/1970F21D711C8BF1FCC5C6DFF831E0E8.jpg")}
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 fNormal;
        varying vec3 vPosition;
        void main()
        {
            vUv = uv;
            fNormal=normal;
            vPosition=position;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        uniform sampler2D colorTexture;  
        uniform sampler2D colorTexture1;
        varying vec3 fNormal;
        varying vec3 vPosition;
        void main( void ) {
            vec2 position = vUv;
            vec3 tempNomal= normalize(fNormal);
            float power=step(0.95,abs(tempNomal.y));
            vec4 colorb=texture2D(colorTexture1,vec2(position.xy));
            vec4 colora = texture2D(colorTexture,vec2(vUv.x,fract(vUv.y+time))); 
          
            if(power>0.95){
                gl_FragColor =colorb;
            }else{
                gl_FragColor =colorb+colorb*colora; 
            }         
        }
      `
    };
  
    ShaderBar.uniforms.colorTexture.value.wrapS = ShaderBar.uniforms.colorTexture.value.wrapT = Three.RepeatWrapping;
    ShaderBar.uniforms.colorTexture1.value.wrapS = ShaderBar.uniforms.colorTexture1.value.wrapT = Three.RepeatWrapping;
  
    // ShaderBar.uniforms.colorTexture.value.wrapS = ShaderBar.uniforms.colorTexture.value.wrapT = Three.ClampToEdgeWrapping;
    // ShaderBar.uniforms.colorTexture1.value.wrapS = ShaderBar.uniforms.colorTexture1.value.wrapT = Three.ClampToEdgeWrapping;
    ShaderBar.uniforms.colorTexture1.value.rotation = Three.MathUtils.degToRad(180);
    // ShaderBar.uniforms.colorTexture.value.repeat.set(0.8,0.8);
    // ShaderBar.uniforms.colorTexture1.value.repeat.set(0.5,0.5);

    const material = new Three.ShaderMaterial({
      uniforms: ShaderBar.uniforms,
      vertexShader: ShaderBar.vertexShader ,
      fragmentShader: ShaderBar.fragmentShader,
      blending: Three.AdditiveBlending,
      blendSrcAlpha: Three.OneFactor,
      transparent:false,
      depthTest: true,
      // side: Three.DoubleSide,
      //polygonOffset:true

    });

    const cube = new Three.Mesh(geometry, material)
  
    buildingGroup.add(cube)



    return {helper};
  }  

  return {geometry,helper};
};

const addAnimatedLine = (geometry) => {
  const aniLine = new Three.Line(geometry, new Three.LineDashedMaterial({color: 0x00ffff}))  //每一条线需要单独生成materia不能共用，不然子啊更改某条线的材质的时候会影响其他的
  aniLine.material.dashSize = 0;
  aniLine.material.gapSize = 10000; //gapsize设的很大的时候看不见线
  aniLine.material.transparent = true;
  return aniLine;
};

const getColorsArr = (count, colorArr, limit = 10) => {
  // const rgbInterpolate = interpolateHsl("#00ffff", "#254360");
  const rgbInterpolate = interpolateHsl(colorArr[0], colorArr[1]);
  // const colorArray = new Array(count);
  const colorArray = [];
  for (let index = 0; index < count; index++) {
    const t = index / (count/limit) < 1 ?index / (count/limit): 1;
    // const t = index / count;
    const rgb = rgbInterpolate(t);
    const rgbValue = rgb.match(/\d+/g);
    // 从 "rgb(1,2,3)" 字符串里 提取出 1,2,3 并 归一化（ 0.0 ~ 1.0）
    const r = Number(rgbValue[0]) / 255;
    const g = Number(rgbValue[1]) / 255;
    const b = Number(rgbValue[2]) / 255;

    colorArray[3 * index] =  r;
    colorArray[3 * index + 1] = g;  
    colorArray[3 * index + 2] =  b;
  }
  return colorArray
}

const addRoad = (data,scene) => {
  const {geometry:{coordinates = []}} = data;

  if (!coordinates[0][1]) {  //检查是否是个二维数组
    return 
  }

  const pointsArr = [];
  coordinates.map((point)=>{
    if (!point[0] || !point[1]) {
      return;
    }

    const position = GPSRelativePosition(point, center);
    // pointsArr.push(new Three.Vector3(position[0], position[1], 0))

    //有宽度的线的点位数据
    pointsArr.push(position[0], position[1], 0);

  });

  // const geometry = new Three.BufferGeometry().setFromPoints(pointsArr);
  // geometry.rotateX(Math.PI /2 )
  // geometry.rotateZ(Math.PI)
  // geometry.colorsNeedUpdate = true; 

  // //采用顶点着色
  // const colors = getColorsArr(pointsArr.length);
  // geometry.setAttribute( 'color', new Three.Float32BufferAttribute( colors, 3 ));
  
  
  // const line = new Three.Line( geometry, LINE_MATERAL );
  // line.computeLineDistances();
  // //虚线做动画的时候用这个
  // // scene.add( line );


  // //顶点着色的时候
  // aniLineGroup.add(line);
  // lineLenArr.push(colors)  //暂时用来存放各个线条的color数组


  //绘制有宽度的道路
  const geometry = new LineGeometry();
  geometry.setPositions( pointsArr );
  geometry.rotateX(Math.PI /2 )
  geometry.rotateZ(Math.PI);

  

  // const line = new Line2( geometry, LINE_MATERAL );
  let line = new Line2( geometry, BASIC_LINE_MATERAL );
  line.computeLineDistances();

  const {instanceDistanceEnd:{data: distanceData}} = geometry.attributes || {}
  const lineLen = distanceData.array[distanceData.count*distanceData.stride - 1];
  let colors = [];
  if (lineLen>5) {  //太短的路不做动画
    //有宽度的线的顶点着色的color数组
    colors = getColorsArr(pointsArr.length / 3, ["#00ffff", "#254360"]);
    geometry.setColors( colors );
    line = new Line2( geometry, LINE_MATERAL );
    // console.log(line)
  }
  // if (lineLen>15) {
  //   line.layers.set(1);
  // }
  // scene.add( line );
  aniLineGroup.add(line);
  // lineLenArr.push(colors)
  lineLenArr.push({colors, index: 0})  //暂时用来存放各个线条的color数组
  


  //制作道路流动的动画 利用虚线的特性
  // const {lineDistance} = geometry.attributes || {}
  // const lineLen = lineDistance.array[lineDistance.count - 1];
  // if (lineLen>5) {  //太短的路不做动画
  //   const aniLine = addAnimatedLine(geometry);
  //   aniLineGroup.add(aniLine);
  //   lineLenArr.push(lineLen);
  // }
}

const loadTree = (scene) => {
  const manager = new Three.LoadingManager();
	manager.addHandler( /\.dds$/i, new DDSLoader() );

  new MTLLoader( manager )
  .load(require('./model/tree-obj/tree-05.mtl').default, ( materials ) => {
		materials.preload();
    new OBJLoader( manager )
      .setMaterials( materials )
      .load( require('./model/tree-obj/tree-05.obj').default, ( object )=> {
        object.scale.set(0.01,0.01,0.01)
        // console.log(object)
        // const mesh = object.children[0].clone();
        // // mesh.position.set(0.5,0,0)
        // object.add(mesh);
        // scene.add(object)
        // console.log(object)
        // object.position.set(13.5, 0, 6)
        // const copyObj = object.clone();
        // copyObj.position.set(13.2, 0, 6.5);
        // console.log(copyObj)
        for(let i=0;i<5;i++){
          const copyObj = object.clone();
          copyObj.position.set(13+Math.random()*1, 0, 6+Math.random()*1.5);
          scene.add( copyObj )
        }
        for(let i=0;i<8;i++){
          const copyObj = object.clone();
          copyObj.position.set(18.5-Math.random()*1, 0, 6.7+Math.random()*1.2);
          // copyObj.position.set(18.5, 0, 6.7);
          scene.add( copyObj )
        }
        for(let i=0;i<20;i++){
          const copyObj = object.clone();
          copyObj.position.set(13+Math.random()*6, 0, -4-Math.random()*2.5);
          // copyObj.position.set(13, 0, -4);
          // copyObj.position.set(13, 0, -6.5);
          // copyObj.position.set(19, 0, -6.5);
          // copyObj.position.set(19, 0, -4);
          scene.add( copyObj )
        }
        
      },( xhr )=>{
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
      },( error )=>{
        console.log( 'An error happened', error );
      });

	});
}

const loadGltfTree = (scene) => {
  const loader = new GLTFLoader();
  //加载压缩过的文件需要这个
  const dracoLoader = new DRACOLoader();
  //指定包含 WASM/JS 解码库的文件夹的路径。
  // dracoLoader.setDecoderPath( 'https://threejs.org/examples/js/libs/draco/gltf/' );
  dracoLoader.setDecoderPath( '/draco/gltf/' );
  loader.setDRACOLoader( dracoLoader );
  loader.load(require('./model/tree-processed.glb').default,(gltf) => {
      const object = gltf.scene;
      object.scale.set(0.02,0.01,0.02);
      for(let i=0;i<2;i++){
        const copyObj = object.clone();
        copyObj.position.set(13+Math.random()*1, 0, 6+Math.random()*1.5);
        scene.add( copyObj )
      }
      for(let i=0;i<2;i++){
        const copyObj = object.clone();
        copyObj.position.set(18.5-Math.random()*1, 0, 6.7+Math.random()*1.2);
        // copyObj.position.set(18.5, 0, 6.7);
        scene.add( copyObj )
      }

      // gltf.animations; // Array<THREE.AnimationClip>
      // gltf.scene; // THREE.Group
      // gltf.scenes; // Array<THREE.Group>
      // gltf.cameras; // Array<THREE.Camera>
      // gltf.asset; // Object
    },
    // called while loading is progressing
    function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    // called when loading has errors
    function ( error ) {
      console.log( 'An error happened', error );
    }
  )
}
const loadGltfGrass = (scene) => {
  const loader = new GLTFLoader();
  //加载压缩过的文件需要这个
  const dracoLoader = new DRACOLoader();
  //指定包含 WASM/JS 解码库的文件夹的路径。
  // dracoLoader.setDecoderPath( 'https://threejs.org/examples/js/libs/draco/gltf/' );
  dracoLoader.setDecoderPath( '/draco/gltf/' );
  loader.setDRACOLoader( dracoLoader );
  loader.load(require('./model/grass-processed.glb').default,(gltf) => {
      const object = gltf.scene
      object.scale.set(0.07,0.01,0.045)
      object.position.set(15.6, 0, -5.3);
      scene.add(object)
      // for(let i=0;i<20;i++){
      //   const copyObj = object.clone();
      //   copyObj.position.set(13+Math.random()*6, 0, -4-Math.random()*2.5);
      //   // copyObj.position.set(13, 0, -4);
      //   // copyObj.position.set(13, 0, -6.5);
      //   // copyObj.position.set(19, 0, -6.5);
      //   // copyObj.position.set(19, 0, -4);
      //   scene.add( copyObj )
      // }

      // gltf.animations; // Array<THREE.AnimationClip>
      // gltf.scene; // THREE.Group
      // gltf.scenes; // Array<THREE.Group>
      // gltf.cameras; // Array<THREE.Camera>
      // gltf.asset; // Object
    },
    // called while loading is progressing
    function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    // called when loading has errors
    function ( error ) {
      console.log( 'An error happened', error );
    }
  )
}

const updateAnimationLine = () => {
  if (!aniLineGroup.children.length) {
    return;
  }

  aniLineGroup.children.forEach((aniLine, index)=>{
    const dashSize = aniLine.material.dashSize;
    const lineLen = lineLenArr[index];

    if (dashSize>lineLen) {
      aniLine.material.dashSize = 0;
      aniLine.material.opacity = 1;
    } else {
      const step = lineLen > 10 ? 0.1 : 0.01;
      const opacityStep = lineLen > 15 ? 0.001 : 0.0002;
      aniLine.material.dashSize = aniLine.material.dashSize+step;
      aniLine.material.opacity = aniLine.material.opacity > 0 ? aniLine.material.opacity-opacityStep : 0;
    }
  })
}

const updateFatAnimationLine = () => {
  if (!aniLineGroup.children.length) {
    return;
  }
  // console.log(percent)
  percent = percent+0.02;
  if (percent > 1) {
    percent = 0;
  }
  // let flag = true;
  aniLineGroup.children.forEach((aniLine, index)=>{
    const colors = lineLenArr[index];
    if (colors.length) {
      const anchor = Number((percent * (colors.length / 3)).toFixed(0));
      // if (flag) {
      //   console.log(anchor, colors.length / 3)
      //   flag = false
      // }
      const b = colors.slice(anchor * 3);
      const f = colors.slice(0, anchor * 3);
      const newColorArray = [].concat(b, f) ;
      aniLine.geometry.setColors( newColorArray );

      // aniLine.geometry.setAttribute( 'color', new Three.Float32BufferAttribute( newColorArray, 3 ));
      // aniLine.geometry.colorsNeedUpdate = true; 

    } 
  })
}

const updateFatAnimationLineNew = () => {
  if (!aniLineGroup.children.length) {
    return;
  }

  if (percent < 9) {
    percent++;
    return;
  }
  percent = 0;

  aniLineGroup.children.forEach((aniLine, index)=>{
    const lineAttr = lineLenArr[index];
    if (lineAttr.colors.length) {
      // if (lineAttr.count < 8) {
      //   lineAttr.count = lineAttr.count + 1;
      //   return;
      // }
      // lineAttr.count = 1;
      if (lineAttr.index < lineAttr.colors.length / 3 - 1) {
        lineAttr.index = lineAttr.index + 1;
      } else {
        lineAttr.index = 0;
      }

      const b = lineAttr.colors.slice(lineAttr.index * 3);
      const f = lineAttr.colors.slice(0, lineAttr.index * 3);
      const newColorArray = [].concat(b, f) ;

      //模拟复杂的变化运算
      // for(let j=1, total=1; j<=2000000; j++) {
      //   total += j;
      // }

      aniLine.geometry.setColors( newColorArray );

      // aniLine.geometry.setAttribute( 'color', new Three.Float32BufferAttribute( newColorArray, 3 ));
      // aniLine.geometry.colorsNeedUpdate = true; 

    } 
  })
}

const updateFatAnimationLineByWorker = () => {

  if (!aniLineGroup.children.length) {
    return;
  }

  // if (percent < 9) {
  //   percent++;
  //   return;
  // }
  // percent = 0;
  // console.log(555)
  myWorker.postMessage(lineLenArr);
  myWorker.onmessage = (e) => {
    // console.log(e)
    const newColors = e.data;
    aniLineGroup.children.forEach((aniLine, index)=>{
      const lineAttr = lineLenArr[index];
      if (lineAttr.colors.length) {

  
        aniLine.geometry.setColors( newColors[index] );
  
        // aniLine.geometry.setAttribute( 'color', new Three.Float32BufferAttribute( newColorArray, 3 ));
        // aniLine.geometry.colorsNeedUpdate = true; 
  
      } 
    })

  }

  

};

const updateBuildingLine = () => {
  if (!buildingLineGroup.children.length) {
    return;
  }

  buildingLineGroup.children.forEach((line, index)=>{
    // const step = 0.1;
    let { height, lineHeight, step } = buildingHeightArr[index];

    if ((step > 0 && lineHeight + step > height) || (step < 0 && lineHeight + step < 0)) { //需要换向
      buildingHeightArr[index].step = -step;
      step = -step;
    }

    buildingHeightArr[index].lineHeight = lineHeight + step;
    if (step > 0) {
      line.material.opacity =  line.material.opacity > 1 ? 1 : line.material.opacity + step / 2;
    } else {
      line.material.opacity =  line.material.opacity < 0 ? 0 : line.material.opacity + step / 2;
    }

    
    line.translateY(step);
  })
}

const updateBuilding = () => {
  
  if (!buildingGroup.children.length) {
    return;
  }
  

  buildingGroup.children.forEach((cube)=>{
    const uniforms = cube.material.uniforms;
    if (uniforms.boxH) {  //金融城的冲击波
      cube.material.uniforms.boxH.value += 0.1;
      if(cube.material.uniforms.boxH.value > 5) {
        cube.material.uniforms.boxH.value = -5
      }
    }
    if (uniforms.time) {  //中海纹理流动
      cube.material.uniforms.time.value += 0.01
    }
    if (uniforms.time1) {
      if (cube.material.uniforms.time1.value > 0.6*4) {
        cube.material.uniforms.time1.value = -0.6
      } else {
        cube.material.uniforms.time1.value +=0.01;
      }

      if (cube.material.uniforms.r.value > 50) {
        cube.material.uniforms.r.value =0.5
      } else {
        cube.material.uniforms.r.value +=0.3
      }

      if (cube.material.uniforms.rotationAngle.value > 2*Math.PI) {
        cube.material.uniforms.rotationAngle.value = Three.MathUtils.degToRad(0)
      } else {
        cube.material.uniforms.rotationAngle.value +=Three.MathUtils.degToRad(1)
      }
      
    }
  })

  if (!labelGroup.children.length) {
    return
  }

  let sprint;
  let height;
  labelGroup.children.forEach((cube)=>{
    if (cube.name) {
      // console.log(cube)  
      const uniforms = cube.material.uniforms;
      if (uniforms) {  //三棱锥
        if ( uniforms.cylinderH.value < uniforms.time.value) {
          cube.material.uniforms.time.value = 0.0
        } else {
          cube.material.uniforms.time.value += 0.005
        }
        cube.rotation.y+=0.05;
        height = Math.sin(cube.rotation.y) > 0 ? -0.008 : 0.008;
        cube.translateY(height);
      } else {
        sprint = cube
      }
      

    }
  })

  if (sprint) {
    sprint.translateY(height);
  }
    

}

const updatePlane = (scene) => {
  if (!scene.children.length) {
    return;
  }
  scene.children.forEach((cube)=>{
    const uniforms = (cube.material ||{}).uniforms;
    if (uniforms && uniforms.rotationAngle) {
      if (uniforms.rotationAngle.value >= Three.MathUtils.degToRad(359)) {
        cube.material.uniforms.rotationAngle.value = Three.MathUtils.degToRad(0)
      } else {
        cube.material.uniforms.rotationAngle.value = cube.material.uniforms.rotationAngle.value + Three.MathUtils.degToRad(1)
      }
    }
  })
  

}





const loadBuilding = (data,scene, camera) => {
  const {features = []} = data;
  const geometryArr = [];
  const box3HelperArr = [];
  features.forEach((item)=>{
    if (!item.properties) {
      return;
    }
    const {properties, geometry} = item;
    if (properties.building) {
      const {geometry,helper} = addBuilding(item, scene, camera);
      geometry && geometryArr.push(geometry);
      box3HelperArr.push(helper);
    } else if (properties.highway) {
      if (geometry.type==='LineString'&&properties.highway!=='pedestrian'&&properties.highway!=='footway'&&properties.highway!=='path') {  //省略了部分小路
        addRoad(item,scene);
      }
    }
  })
  //将所有的建筑合并成一个可以提高性能
  const mergeGeometry = BufferGeometryUtils.mergeBufferGeometries(geometryArr);
  // const mesh = new Three.Mesh(mergeGeometry, MATERAL);
  // scene.add(mesh);


  let ShaderBar = {
    uniforms: {
      texture1: {value:  new Three.TextureLoader().load(require("./assets/wall2.png").default)},
      time1: {value: -0.6},
      lineColor: {value: new Three.Color('#9ee9ec')},
      //扩散光晕
      r: {value: 0.5},
      width: {value: 1.2},
      lightColor: {value: new Three.Color('#e8a8e0')},

      //扫描光
      angle: {value: Math.PI/90},
      rotationAngle: {value: Three.MathUtils.degToRad(0)},
      lightPosition: {value: new Three.Vector2(-20,20)},
      lightRaduis: {value: 45.0},
      lightColor1:{value: new Three.Color('#ffffff')}
    },
    vertexShader: `
        varying vec3 vPosition; 
        varying vec2 vUv;

        void main(){
          vPosition = position; 
          vUv = uv;
          gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
        }
    `,
    fragmentShader: `
        uniform sampler2D texture1;        
        uniform float time1;        
        uniform vec3 lineColor;        
        uniform vec3 lightColor;        
        uniform float r;        
        uniform float width; 
        uniform float angle;
        uniform float rotationAngle;
        uniform vec2 lightPosition;
        uniform float lightRaduis;    
        uniform vec3 lightColor1;     
        varying vec3 vPosition; 
        varying vec2 vUv;

        float getLeng(float x, float y, float x1, float y1){
          return  sqrt((x-x1)*(x-x1)+(y-y1)*(y-y1));
        }

        void main(){
          float power=step(time1+0.05,abs(vPosition.y));
          float power1=step(time1,abs(vPosition.y));
          if(power<1.0 && power1>0.0) {
            gl_FragColor= vec4(lineColor.r, lineColor.g, lineColor.b, 0.8);
          } else {
            vec4 color=texture2D(texture1,vec2(vUv.x, vUv.y));
            gl_FragColor=color*1.5;
          }
          
          float uLength = getLeng(vPosition.x,vPosition.z, 4.0, 2.0);

          if(uLength>=r && uLength<=r+width) {
            float a = 1.0 - abs(uLength - r - width / 2.0);
            float enda = smoothstep(0.0,1.0,a)+0.2 ;

            gl_FragColor= vec4(lightColor.r*enda, lightColor.g*enda, lightColor.b*enda, 1);
          }

          float len = getLeng(vPosition.x,vPosition.z, lightPosition.x, lightPosition.y);
          float sin1 = abs(vPosition.x- lightPosition.x) / len;
          float sin2 = sin(rotationAngle);
          float sin3 = sin(rotationAngle+angle);

          if(sin1>=sin2 && sin1<=sin3 && len<=lightRaduis) {
            gl_FragColor= vec4(lightColor1.r, lightColor1.g, lightColor1.b, 1);
          }

        }
    `
  };

  ShaderBar.uniforms.texture1.value.wrapS = ShaderBar.uniforms.texture1.value.wrapT = Three.RepeatWrapping;
  ShaderBar.uniforms.texture1.value.center.set(.5, .5);
  ShaderBar.uniforms.texture1.value.rotation = Three.MathUtils.degToRad(180);

  const material = new Three.ShaderMaterial({
    uniforms: ShaderBar.uniforms,
    vertexShader: ShaderBar.vertexShader ,
    fragmentShader: ShaderBar.fragmentShader,
  });
  const mesh = new Three.Mesh(mergeGeometry, material);
  buildingGroup.add(mesh)

  return box3HelperArr
};

const addPlane = (scene) => {
  const geometry = new Three.PlaneGeometry(50,50);
  geometry.rotateY(Math.PI);
  geometry.rotateX(Math.PI/2);
  let ShaderBar = {
    uniforms: {
      planeColor: {value: new Three.Color('#000')},
      pi: {value: Math.PI},
      //扫描光
      angle: {value:Three.MathUtils.degToRad(120)},
      rotationAngle: {value: Three.MathUtils.degToRad(0)},
      lightPosition: {value: new Three.Vector2(10,-10)},
      lightRaduis: {value: 5.0},
      lightColor1:{value: new Three.Color('red')}
    },
    vertexShader: `
        varying vec3 vPosition; 
        varying vec2 vUv;

        void main(){
          vPosition = position; 
          vUv = uv;
          gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
        }
    `,
    fragmentShader: `
        uniform float angle;
        uniform float rotationAngle;
        uniform vec2 lightPosition;
        uniform float lightRaduis;    
        uniform vec3 lightColor1;     
        uniform vec3 planeColor;     
        uniform float pi;     
        varying vec3 vPosition; 
        varying vec2 vUv;

        float getLeng(float x, float y, float x1, float y1){
          return  sqrt((x-x1)*(x-x1)+(y-y1)*(y-y1));
        }

        void main(){
          float len = getLeng(vPosition.x,vPosition.z, lightPosition.x, lightPosition.y);
          float angle1 = asin(-((vPosition.z- lightPosition.y) / len));
          float angle2=angle1;
          if (vPosition.x - lightPosition.x < 0.0) {
            angle2 = pi - angle1;
          }

          if (angle1<0.0 && vPosition.x - lightPosition.x >= 0.0) {
            angle2 = 2.0*pi + angle1;
          }


          if (lightRaduis-0.05<=len && len<=lightRaduis) {
             gl_FragColor= vec4(lightColor1.r, lightColor1.g, lightColor1.b, 1);
          } else if(((angle2>=rotationAngle && angle2<=rotationAngle+angle) || (rotationAngle+angle>=2.0*pi && angle2+2.0*pi<=rotationAngle+angle)) && len<lightRaduis-0.05){
            float a = (angle2 - rotationAngle) / angle;
            if (rotationAngle+angle>=2.0*pi && angle2<pi) {
              a = (angle2+2.0*pi - rotationAngle) / angle;
            }
            float op = 0.15 + smoothstep(0.0,0.8,a)*0.6 ;

            gl_FragColor= vec4(lightColor1.r, lightColor1.g, lightColor1.b, op);
          } else {
             gl_FragColor= vec4(planeColor.r, planeColor.g, planeColor.b, 0);
          }
        }
    `
  };
  const material = new Three.ShaderMaterial({
    uniforms: ShaderBar.uniforms,
    vertexShader: ShaderBar.vertexShader ,
    fragmentShader: ShaderBar.fragmentShader,
    transparent: true
  });
  const mesh = new Three.Mesh(geometry, material);
  mesh.position.set(0,0.01,0)
  scene.add(mesh)

}

const getGeoJson = () => {
  const loader = new Three.FileLoader();
  return new Promise((resolve)=>{
    loader.load(require('./geoJson/chengdu.geojson').default, resolve)
  })
}

const loadGeodata = async(scene, camera)=>{
  const data = await getGeoJson();
  const geoData = JSON.parse(data);
  const box3HelperArr = loadBuilding(geoData, scene, camera);
  // await loadWater();
  // await loadTerrain(scene);
  return box3HelperArr
}

const getWaterJson = () => {
  const loader = new Three.FileLoader();
  return new Promise((resolve)=>{
    loader.load(require('./geoJson/chengdu_water.geojson').default, resolve)
  })
}

const addWater = (data) => {
  const {geometry:{coordinates = []}, properties} = data;

  let shape;
  const holes = [];
  coordinates.forEach((points,index)=>{
    if (index===0) {
      shape = genShape(points, center).shape;
    } else {
      holes.push(genShape(points, center).shape)
    }
  })
  holes.forEach((hole)=>{
    shape.holes.push(hole);
  })

  const geometry = genGeometry(shape, {
    curveSegments: 1,
    depth: 0.01,  
    bevelEnabled: false
  });
  

  geometry.rotateX(Math.PI / 2);
  geometry.rotateZ(Math.PI);

  return geometry
};


const loadWater = async () => {
  const WATER_TEXTURE_NORMAL = new Three.TextureLoader().load(require('./assets/waternormals.jpg').default, (texture)=>{
    texture.wrapS = texture.wrapT = Three.RepeatWrapping;
  });
  const config = {
    textureWidth: 512,
		textureHeight: 512,
    waterNormals: WATER_TEXTURE_NORMAL,
    sunDirection: new Three.Vector3(),
    alpha: 1.0,
    sunColor: 0xffffff,
    waterColor: 0xa6c8fa,
    distortionScale: 3.7,
    fog: false
  };

  const data = await getWaterJson();
  const waterData = JSON.parse(data);

  waterData.features.forEach((item)=>{
    if (item.properties.natural === 'water' && item.geometry.type==='Polygon') {
      const waterGeometry = addWater(item);

      const water = new Water(waterGeometry, config);

      waterGroup.add(water)
    }
  })

};

const loadTerrain = async (scene) => {
  const response = await fetch(require("./geoJson/chengdu-terrain.tif").default);
  const arrayBuffer = await response.arrayBuffer();
  const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
  const tiffImage = await tiff.getImage();

  // const start = [104.0439,30.5679];  //box的左下角  纬度是y坐标，经度是x坐标
  const start = [103.9823,30.5207];  //box的左下角  纬度是y坐标，经度是x坐标
  const end = [104.2197, 30.6186];  //box的右上角

  const leftBottom = GPSRelativePosition(start, center);
  const rightTop = GPSRelativePosition(end, center);

  const width = Math.abs(leftBottom[0] - rightTop[0]);
  const height = Math.abs(leftBottom[1] - rightTop[1]);

  console.log(width, height)

  const geometry = new Three.PlaneGeometry(width, height, width-1, height-1);
  
  const data = await tiffImage.readRasters({width: Math.floor(width), height: Math.floor(height), resampleMethod: 'bilinear', interleave: true});
  console.log(geometry, data, geometry.isBufferGeometry)
  const position = geometry.attributes.position;

  // const vector = new Three.Vector3();

  //  for ( let i = 0, l = position.count; i < l; i ++ ){

  //     vector.fromBufferAttribute( position, i );
      
  //     console.log(vector);
   
  //  }


  // data.forEach((point, index)=>{
    // if (geometry.vertices[index]) {
    //   geometry.vertices[index].z = point / 30  
    // }
    // })

    data.forEach((point,index)=>{
      if (index <= position.count) {
        position.array[3*index+2] = point / 30;  //30是平缓值，不让数据太大
      }
    })
  geometry.attributes.position.needsUpdate = true;

  geometry.rotateX(Math.PI /2 );
  geometry.rotateY(Math.PI);
  geometry.rotateZ(Math.PI);

  const mesh = new Three.Mesh(geometry, new Three.MeshPhongMaterial({color: 0xff9900, side: Three.DoubleSide, wireframe: true}))
  mesh.position.y = -16;
  scene.add(mesh)

};

const updateWater = () => {
  if (!waterGroup.children.length) {
    return;
  }

  waterGroup.children.forEach((water)=>{
    water.material.uniforms[ 'time' ].value += 1.0 / 100;
  })
}


const addSky = (scene, renderer) => {
  // Add Sky
  const sky = new Sky();
  sky.scale.setScalar( 70 );
  scene.add( sky );

  const sun = new Three.Vector3();

  /// GUI

  const effectController = {
    turbidity: 2,
    rayleigh: 6,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.001,
    elevation: 2,
    azimuth: -90,
    exposure: renderer.toneMappingExposure
  };

  // const uniforms = sky.material.uniforms;
  // uniforms[ 'turbidity' ].value = effectController.turbidity;
  // uniforms[ 'rayleigh' ].value = effectController.rayleigh;
  // uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
  // uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

  // const phi = Three.MathUtils.degToRad( 90 - effectController.elevation );
  // const theta = Three.MathUtils.degToRad( effectController.azimuth );

  // sun.setFromSphericalCoords( 1, phi, theta );

  // uniforms[ 'sunPosition' ].value.copy( sun );

  // renderer.toneMappingExposure = effectController.exposure;


  function guiChanged() {

    const uniforms = sky.material.uniforms;
    uniforms[ 'turbidity' ].value = effectController.turbidity;
    uniforms[ 'rayleigh' ].value = effectController.rayleigh;
    uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
    uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

    const phi = Three.MathUtils.degToRad( 90 - effectController.elevation );
    const theta = Three.MathUtils.degToRad( effectController.azimuth );

    sun.setFromSphericalCoords( 1, phi, theta );

    uniforms[ 'sunPosition' ].value.copy( sun );

    renderer.toneMappingExposure = effectController.exposure;

  }

  const gui = new GUI();

  gui.add( effectController, 'turbidity', 0.0, 20.0, 0.1 ).onChange( guiChanged );
  gui.add( effectController, 'rayleigh', 0.0, 100, 0.001 ).onChange( guiChanged );
  gui.add( effectController, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( guiChanged );
  gui.add( effectController, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( guiChanged );
  gui.add( effectController, 'elevation', 0, 90, 0.1 ).onChange( guiChanged );
  gui.add( effectController, 'azimuth', - 180, 180, 0.1 ).onChange( guiChanged );
  gui.add( effectController, 'exposure', 0, 1, 0.0001 ).onChange( guiChanged );

  guiChanged();


};

const addSkyBox = (scene, renderer) => {
  const loader = new Three.CubeTextureLoader();
  const texture = loader.load([
    // require("./assets/sky-px.png").default,
    // require("./assets/sky-nx.png").default,
    // require("./assets/sky-py.png").default,
    // require("./assets/sky-ny.png").default,
    // require("./assets/sky-pz.png").default,
    // require("./assets/sky-nz.png").default,
    require("../../images/light/px.jpg").default,
    require("../../images/light/nx.jpg").default,
    require("../../images/light/py.jpg").default,
    require("../../images/light/ny.jpg").default,
    require("../../images/light/pz.jpg").default,
    require("../../images/light/nz.jpg").default,
  ]);
  texture.mapping = Three.CubeRefractionMapping;
  scene.background = texture;
};

// const addSkyBox = (scene) => {
//   const skyGeometry = new Three.BoxBufferGeometry( 300, 300, 300 );
//   const loader =  new Three.TextureLoader();
//   const texture = [
//     loader.load(require('../../images/light/px.jpg').default),
//     loader.load(require('../../images/light/nx.jpg').default),
//     loader.load(require('../../images/light/py.jpg').default),
//     loader.load(require('../../images/light/ny.jpg').default),
//     loader.load(require('../../images/light/pz.jpg').default),
//     loader.load(require('../../images/light/nz.jpg').default)
//   ];
//   console.log(texture)
//   const mMaterials = texture.map((item)=>{
//     return new Three.MeshBasicMaterial({
//       map: item,//将图片纹理贴上
//       side: Three.BackSide/*镜像翻转，如果设置镜像翻转，那么只会看到黑漆漆的一片，因为你身处在盒子的内部，所以一定要设置镜像翻转。*/
//     })
//   })
//   const skyBox = new Three.Mesh(skyGeometry,mMaterials);
//   scene.add(skyBox);

// }







const Building = () => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const statsRef = useRef(null);
  const raycasterRef = useRef(new Three.Raycaster());
  const mouseRef = useRef(new Three.Vector2());
  const box3HelperArrRef = useRef(null);
  const outLinePassRef = useRef(null);
  // const textareaRef = useRef()

  const clickCanvas = (event) => {
    // mouseRef.current.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	  // mouseRef.current.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    const mouse = {
      x: ( event.clientX / window.innerWidth ) * 2 - 1,
      y: - ( event.clientY / window.innerHeight ) * 2 + 1
    }
    // 通过摄像机和鼠标位置更新射线
	  raycasterRef.current.setFromCamera(mouse, cameraRef.current );
    // 计算物体和射线的焦点
	  const intersects = raycasterRef.current.intersectObjects( box3HelperArrRef.current );
	  // const intersects = raycasterRef.current.intersectObjects( buildingGroup.children );

    // const clickObject = intersects[0].object || {};
    console.log(intersects[0] ? intersects[0].object : '')
    // intersects[0].object.material.color.set( 0xff0000 );
    if (intersects[0]) {
      outLinePassRef.current.selectedObjects = [intersects[0].object]
    }
  }

  useEffect(async ()=>{
    const {renderer, camera, scene, mapControl, stats,labelRenderer } = init(canvasRef.current, statsRef.current);
    rendererRef.current = renderer;
    cameraRef.current = camera;
    sceneRef.current = scene;

    const resizeHandle = () => {
      //根据窗口大小变化，重新修改渲染器的视椎
      if (rendererRef.current === null) {
        return;
      }
      const canvas = rendererRef.current.domElement
      cameraRef.current.aspect = canvas.clientWidth / canvas.clientHeight
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setPixelRatio(window.devicePixelRatio);
      rendererRef.current.setSize(canvas.clientWidth, canvas.clientHeight, false)

      // labelRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
   
    resizeHandle();
    const box3HelperArr = await loadGeodata(scene, camera);
    box3HelperArrRef.current = box3HelperArr;
    addPlane(scene);
    // loadTree(scene);
    loadGltfTree(scene);
    loadGltfGrass(scene);
    // addSkyBox(scene)

    // renderer.outputEncoding = Three.sRGBEncoding;
		// renderer.toneMapping = Three.ACESFilmicToneMapping;
		// renderer.toneMappingExposure = 0.5;
    // addSky(scene, renderer);
    
    // addSkyBox(scene)

    //创建 RenderPass
    const renderScene = new RenderPass( scene, camera )

    //创建 bloomPass
    const el = rendererRef.current.domElement;
    // const  bloomPass = new UnrealBloomPass( new Three.Vector2( el.offsetWidth, el.offsetHeight  ), 1.5, 0.4, 0.85 );
    // // bloomPass.renderToScreen = true;
    // bloomPass.renderToScreen = true;
    // bloomPass .threshold = 0.3;
    // bloomPass .strength = 2;
    // bloomPass .radius = 0.3;

    const effectFXAA = new ShaderPass( FXAAShader )
    effectFXAA.uniforms.resolution.value.set( 1 / window.innerWidth, 1 / window.innerHeight );

    //创建outlinePass
    let outlinePass = new OutlinePass( new Three.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
    const textureLoader = new Three.TextureLoader();
		textureLoader.load( require('./assets/tri_pattern.jpg').default, function ( texture ) {
			outlinePass.patternTexture = texture;
			texture.wrapS = Three.RepeatWrapping;
			texture.wrapT = Three.RepeatWrapping;
		} );
    const params = {
      edgeStrength: 3.0,
      edgeGlow: 0.0,
      edgeThickness: 1.0,
      pulsePeriod: 0,
      rotate: false,
      usePatternTexture: false
    };
    outlinePass = Object.assign(outlinePass, params);
    outlinePass.visibleEdgeColor.set( '#ffffff' );
    outlinePass.hiddenEdgeColor.set( '#190a05' );
    outLinePassRef.current = outlinePass;

    //创建 EffectComposer
    const  bloomComposer = new EffectComposer( renderer )
    bloomComposer.setSize( el.offsetWidth,  el.offsetHeight );
    bloomComposer.addPass( renderScene );
    bloomComposer.addPass( effectFXAA )
    // 眩光通道bloomPass插入到composer
    // bloomComposer.addPass( bloomPass );

    //outlinePass加入到composer
    bloomComposer.addPass( outlinePass );

    renderer.autoClear = false

    const update = (time) => {
      // rendererRef.current.render(sceneRef.current,cameraRef.current);

      // //render layer1 boom
      // renderer.clear()
      // camera.layers.set(1)
      bloomComposer.render()

      // //render layer0 normal
      // renderer.clearDepth()
      // camera.layers.set(0)
      // renderer.render(scene,camera)


      // labelRenderer.render(sceneRef.current,cameraRef.current);

      mapControl.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

      // updateAnimationLine(); 
      // updateFatAnimationLine();
      updateFatAnimationLineNew();
      
      updateBuildingLine();
      updateBuilding();
      updatePlane(scene);

      // updateWater();
      
      stats.update();

      window.requestAnimationFrame(update);
    };

    update(0);
    // updateFatAnimationLineByWorker();
    window.addEventListener('resize', resizeHandle);
    return () => {
      window.removeEventListener('resize',resizeHandle)
    }
  },[canvasRef,rendererRef,cameraRef,sceneRef])


  
  return  (
    <>
      <div ref={statsRef}></div>
      <canvas ref={canvasRef} onClick={clickCanvas} ></canvas>
    </>
  )
}

export default Building;