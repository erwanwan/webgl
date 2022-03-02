import {useCallback, useEffect, useRef, useState} from 'react';
import * as Three from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
// import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
// import { Water } from 'three/examples/jsm/objects/Water.js';

import TWEEN from "@tweenjs/tween.js";
import "./index.less"

import { initRoom} from "./initRoom";
import { addCabinet, addServer } from "./cabinet";
// import { severUsage } from "./serverUsage";
import { heatPlane, disposeHeatMap } from "./heatMap";
import { genCable } from "./cable";
import { genCabinetUsageArea, cabinetUsage } from "./cabinet-usage";
import { genSmoke, genArrow } from "./smoke";
import { genAirWind } from "./airWind";
import { autoCruise } from "./alarmCruise";
import { genWaterLeakAlarm } from "./waterLeakAlarm";

import { dispose, caculatePosition, getTopParent, clearLabel,genServerData } from "./util";

import { PunchCard, Alarm } from "./components";


const BUTTON_TEXTURE = new Three.TextureLoader().load(require('./images/button-close.jpg').default);
const BUTTON_OPEN_TEXTURE = new Three.TextureLoader().load(require('./images/button-open1.jpg').default);

const LINE_TEXTURE_OUT = new Three.TextureLoader().load(require("./images/line-out.jpg").default);
LINE_TEXTURE_OUT.wrapS = Three.RepeatWrapping;
LINE_TEXTURE_OUT.wrapT = Three.RepeatWrapping;

const LINE_TEXTURE_IN = new Three.TextureLoader().load(require("./images/line-in.jpg").default);
LINE_TEXTURE_IN.wrapS = Three.RepeatWrapping;
LINE_TEXTURE_IN.wrapT = Three.RepeatWrapping;

const ARROW_RED = new Three.TextureLoader().load(require("./images/arrow-red.png").default);
ARROW_RED.wrapS = Three.RepeatWrapping;
ARROW_RED.wrapT = Three.RepeatWrapping;
ARROW_RED.repeat.set(4,10.5);
ARROW_RED.center = {x:0.5,y:0.5}
ARROW_RED.rotation = Math.PI;
ARROW_RED.offset.x = -5;

const ARROW_GREEN = new Three.TextureLoader().load(require("./images/arrow-green.png").default);
ARROW_GREEN.wrapS = Three.RepeatWrapping;
ARROW_GREEN.wrapT = Three.RepeatWrapping;
ARROW_GREEN.repeat.set(2,11)


const POSITION_ARR = caculatePosition();
const SERVER_DATA_ARR = POSITION_ARR.map(()=>genServerData());


const init = (canvas, statsDom) => {
  if (!canvas) {
    return;
  }
  //创建一个渲染器
  const renderer = new Three.WebGLRenderer({canvas,antialias: true}); //后面一个参数是抗锯齿
  renderer.setClearColor('#39609B');
  renderer.shadowMap.enabled = true;

  //创建镜头
  const camera = new Three.PerspectiveCamera(45,2,1,1000);
  camera.position.set(-115, 60, 80);
  

  //创建灯光
  const light = new Three.AmbientLight(0xffffff, 0.9);

  const color = 0xFFFFFF;
  const intensity = 0.1;
  const directionLight = new Three.DirectionalLight(color, intensity);
  directionLight.position.set(0, 30, 0);
  directionLight.target.position.set(0, 0, 10);
  directionLight.castShadow = true;
  // directionLight.shadow.mapSize.width = 100;
	// directionLight.shadow.mapSize.height = 100;

  const helper = new Three.DirectionalLightHelper(directionLight);

  //创建场景
  const scene = new Three.Scene();

  scene.add(light);
  scene.add(directionLight);
  scene.add(directionLight.target);
  // scene.add(helper);


  //创建一个css2d渲染器
  const labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize( window.innerWidth, window.innerHeight );
  labelRenderer.domElement.className = 'css2-render'
	document.body.appendChild( labelRenderer.domElement );

  const orbitControls = new OrbitControls(camera, canvas);
  // const orbitControls = new OrbitControls( camera, labelRenderer.domElement );
  //设置OrbitControls观察点的位置
  orbitControls.target.set(0,0,0);
  //设置完需要调用一下 controls.update，这样才真正更新观察点位置
  orbitControls.update();

  //创建outline
  const composer = new EffectComposer( renderer );
  const renderPass = new RenderPass( scene, camera );
  composer.addPass( renderPass );

  let outlinePass = new OutlinePass( new Three.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
  const params = {
    edgeStrength: 2.5, //强度 默认3
    edgeGlow: 0.0,    //强度 默认1
    edgeThickness: 0.8,
    pulsePeriod: 4,  //闪烁频率 默认0 值越大频率越低
    rotate: false,
    usePatternTexture: false  //使用纹理
  };

  outlinePass = Object.assign(outlinePass, params);
  outlinePass.visibleEdgeColor.set( '#2874d1' );  //边缘可见部分发光颜色
  outlinePass.hiddenEdgeColor.set( '#000' );  //边缘遮挡部分发光颜色

  composer.addPass( outlinePass );

  // const textureLoader = new Three.TextureLoader();
  // textureLoader.load( './images/tri_pattern.jpg', function ( texture ) {

  //   outlinePass.patternTexture = texture;
  //   texture.wrapS = Three.RepeatWrapping;
  //   texture.wrapT = Three.RepeatWrapping;

  // } );

  let outlinePassArrow = new OutlinePass( new Three.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
  const paramsArrow = {
    edgeStrength: 0.5, //强度 默认3
    edgeGlow: 0.0,    //强度 默认1
    edgeThickness: 0.05,
    pulsePeriod: 0,  //闪烁频率 默认0 值越大频率越低
    rotate: false,
    usePatternTexture: false  //使用纹理
  };

  outlinePassArrow = Object.assign(outlinePassArrow, paramsArrow);
  outlinePassArrow.visibleEdgeColor.set( '#efec9e' );  //边缘可见部分发光颜色
  outlinePassArrow.hiddenEdgeColor.set( '#000' );  //边缘遮挡部分发光颜色

  composer.addPass( outlinePassArrow );

  

  const effectFXAA = new ShaderPass( FXAAShader );
  effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
  composer.addPass( effectFXAA );


  let stats;
  if (statsDom) {
    stats = new Stats();
    statsDom.appendChild(stats.dom);
  }

  

  return {renderer, camera, scene, orbitControls, stats, labelRenderer, composer, effectFXAA, outlinePass, outlinePassArrow}
};

const addCabinetList = (scene, camera) => {
  const cabinetGroup = new Three.Group();
  cabinetGroup.name="cabinet-group";
  scene.add(cabinetGroup);
  const cabinetObj = addCabinet();
  POSITION_ARR.forEach((item,index)=>{
    const cabinet = cabinetObj.clone();
    cabinet.name=`${index+1}机柜`;
    cabinet.position.set(item.x,0,item.z);
    cabinet.row = item.row;
    cabinetGroup.add(cabinet);

    SERVER_DATA_ARR[index].forEach((item)=>{
      const server = addServer(item);
      if (server) {
        cabinet.add(server)
      }
    })
  })
  camera.layers.enable(1);
};

const addCabinetUsage = (scene) => {
  const usageGroup = new Three.Group();
  usageGroup.name = 'cabinet-usage-group';
  usageGroup.userData.stepArr = [
    {
      p:0.9,
      p1:0.5
    },
    {
      p:0.7,
      p1:0.7
    }
  ]

  scene.add(usageGroup);
  POSITION_ARR.forEach((item)=>{
    const percent = Math.random();
    const serverUsage = cabinetUsage(percent);
    serverUsage.position.set(item.x,7.5,item.z);
    usageGroup.add(serverUsage);
  })
};

const addHeatPlane = (scene) => {
  const heatGroup = new Three.Group();
  heatGroup.name = 'heat-group';
  scene.add(heatGroup);

  const planeCenter = {x:0,z:-3};
  const heatPosition = [
    {
      x: 0,
      z: -3
    },
    {
      x: 5,
      z: -3,
    },
    {
      x: -5,
      z: -3,
    },
    {
      x: 10,
      z: -3,
    },
    {
      x: -10,
      z: -3,
    },
    {
      x: 20,
      z: -3,
    },
    {
      x: -20,
      z: -3,
    },
    {
      x: 30,
      z: -3,
    },
    {
      x: -30,
      z: -3,
    },
  ]
  const plane = heatPlane({width: 80, height:30, planeCenter, heatPosition, id: 'heat-map'});
  heatGroup.add( plane );

};

const addCable = (scene) => {
  const cableGroup = new Three.Group();
  cableGroup.name = 'cable-group';
  scene.add(cableGroup);

  
  let cabinetIndexStart;
  let serverIndexStart;
  let cabinetIndexEnd;
  let serverIndexEnd;
  while(cabinetIndexStart===cabinetIndexEnd && serverIndexStart===serverIndexEnd) {
    cabinetIndexStart = (Math.random()*17).toFixed(0);
    // serverIndexStart = (Math.random()*5).toFixed(0);
    const startServerArr = SERVER_DATA_ARR[cabinetIndexStart].filter((item)=>item.height);
    const startIndex = Math.round(Math.random()*(startServerArr.length -1));
    const serverStart = startServerArr[startIndex];
    serverIndexStart = SERVER_DATA_ARR[cabinetIndexStart].findIndex((item)=>item.index === serverStart.index)
  
    cabinetIndexEnd = (Math.random()*17).toFixed(0);
    // serverIndexEnd = (Math.random()*5).toFixed(0);
    const endServerArr = SERVER_DATA_ARR[cabinetIndexEnd].filter((item)=>item.height);
    const endIndex = Math.round(Math.random()*(endServerArr.length -1));
    const serverEnd = endServerArr[endIndex];
    serverIndexEnd = SERVER_DATA_ARR[cabinetIndexEnd].findIndex((item)=>item.index === serverEnd.index)

  }

  let start = {cabinetIndex: cabinetIndexStart, serverIndex: serverIndexStart}
  let end = {cabinetIndex: cabinetIndexEnd, serverIndex: serverIndexEnd}

  if (Math.ceil((cabinetIndexStart + 1) / 6) >  Math.ceil((cabinetIndexEnd + 1) / 6) ) {
    start = {cabinetIndex: cabinetIndexEnd, serverIndex: serverIndexEnd};
    end = {cabinetIndex: cabinetIndexStart, serverIndex: serverIndexStart}
  }
  // console.log(cabinetIndexStart,serverIndexStart)
  // console.log(cabinetIndexEnd,serverIndexEnd)
  const {cableArr, wire} = genCable({
    start: start,
    end: end,
    // start: {cabinetIndex: 18, serverIndex: 1},
    // end: {cabinetIndex: 1, serverIndex: 1},
    positionArr: POSITION_ARR,
    serverDataArr: SERVER_DATA_ARR,
    textureObj: {
      out: LINE_TEXTURE_OUT,
      in: LINE_TEXTURE_IN
    }
  });

  wire && cableGroup.add(wire);
  cableArr.forEach((item)=>{
    cableGroup.add(item)
  });
}

const lineAnimation = () => {
  LINE_TEXTURE_OUT.offset.x =  LINE_TEXTURE_OUT.offset.x-0.02;
  LINE_TEXTURE_IN.offset.x =  LINE_TEXTURE_IN.offset.x+0.02;
};

const addCabinetUsageArea = (scene) => {
  const cabinetUsageListGroup = new Three.Group;
  cabinetUsageListGroup.name = 'cabinet-usable-area-group';
  scene.add(cabinetUsageListGroup);
  SERVER_DATA_ARR.forEach((serverData,index)=>{
    const cabinetUsage = genCabinetUsageArea(serverData);
    cabinetUsage.position.set(POSITION_ARR[index].x,0,POSITION_ARR[index].z);
    cabinetUsageListGroup.add(cabinetUsage)
  })
};

const addSmoke = (scene, camera) => {
  const {particleGroup, particleFireMesh} = genSmoke(camera);

  const group = new Three.Group();
  group.name = 'smoke';

  const index = Math.round(Math.random()*17);
  const p = POSITION_ARR[index];
  group.position.set(p.x,15,p.z);

  group.add(particleFireMesh)
  group.add(particleGroup.mesh)
  
  const arrow = genArrow();
  const x = 43-p.x
  const z = -40-p.z;
  const yArr = [5,2,-1,-4,-7]
  const arrowArr = [];
  yArr.forEach((y)=>{
    const obj = arrow.clone();
    obj.position.set(x,y,z);
    obj.material = obj.material.clone();
    obj.name="smoke-arrow"
    if(y===5){
      obj.material.color=new Three.Color('#ff9800');
      obj.userData.active = true;
    }
    group.add(obj);
    arrowArr.push(obj)
  })

  scene.add(group);


  return { particleGroup, particleFireMesh, arrowArr}
}

const cabinetAnimation = (scene) => {
  const usageGroup = scene.children.find((child)=>child.name==='cabinet-usage-group')
  if (usageGroup) {
    usageGroup.children.forEach((usageItem)=>{
      const height = usageItem.userData.height;
      if (height < 0.1 ||  (usageItem.userData.loop <0 && !usageItem.userData.up)) {
        return
      }
      const step = height/0.1/23;
      usageItem.children.forEach((item)=>{
        if (item.type==='Mesh') {
          if (usageItem.userData.up) {  //向上生长
            if (item.scale.y + step > height/0.1) {
              item.scale.y = height/0.1
              usageItem.userData.up =  false;
              if (usageItem.userData.firstEnd) {
                usageItem.userData.loop--;
              }
              usageItem.userData.firstEnd = true;

              
            } else {
              let stepPercent = 1;
              if (usageItem.userData.firstEnd) {
                const { p1} = usageGroup.userData.stepArr[usageItem.userData.loop];
                stepPercent = p1;
              }
              item.scale.y = item.scale.y + step*stepPercent
              // console.log(999)
            }
          } else {  //向下
            // console.log(888, usageGroup.userData.loop, item.scale.y, height/0.1)
            if (usageItem.userData.loop<0) {
              return;
            }
            // const p = usageGroup.userData.loop ? 0.7 : 0.8;
            // const p1 = usageGroup.userData.loop ? 0.35 : 0.1
            const { p, p1} = usageGroup.userData.stepArr[usageItem.userData.loop]
            if (item.scale.y <= height/0.1*p) {
              usageItem.userData.up =  true;
            } else {
              item.scale.y = item.scale.y - step*p1
            }
          } 
          item.position.y = item.scale.y*0.1/2 - 15/2
        }
      })
    })
  }
}

const fireArrowAnimation = (scene) => {
  const smokeGroup = scene.children.find((child)=>child.name==='smoke');
  if (smokeGroup) {
    if (smokeGroup.userData.count<10) {
      smokeGroup.userData.count = smokeGroup.userData.count+1;
      return
    }
    smokeGroup.userData.count=0
    
    const arrowArr = smokeGroup.children.filter((item)=>item.name==='smoke-arrow');
    const activeIndex = arrowArr.findIndex((item)=>item.userData.active);
    const nextIndex = activeIndex >= arrowArr.length - 1 ? 0 : activeIndex+1;
    arrowArr.forEach((item,index)=>{
      if (index!==nextIndex) {
        item.userData.active = false;
        item.material.color=new Three.Color('#fdff72');
      } else {
        item.userData.active = true;
        item.material.color=new Three.Color('#ff9800');
      }
    })
  }
}

const addAirWind = (scene) => {
  const group = new Three.Group();
  group.name = 'air-wind-group';
  scene.add(group);

  const { windTop, windBottom } =  genAirWind(ARROW_RED, ARROW_GREEN);

  [-28,-3,23].forEach((z)=>{
    const objBottom = windBottom.clone();
    objBottom.position.z = z;
    group.add(objBottom)
  });

  [-32,-6,20].forEach((z)=>{
    const objTop = windTop.clone();
    objTop.position.z = z;
    group.add(objTop)
  })

}

const airWindAnimation = (scene) => {
  const windGroup = scene.children.find((child)=>child.name==='air-wind-group');
  if (windGroup) {  
    ARROW_GREEN.offset.x = ARROW_GREEN.offset.x-0.02
    ARROW_RED.offset.x = ARROW_RED.offset.x-0.02
  }
};

const alarmCruise = (control) => {
  control.target = new Three.Vector3(0, 0, 0);  
  control.autoRotate = true
};


const addWaterLeakAlarm = (scene) => {
  const waterLeakGroup = genWaterLeakAlarm(POSITION_ARR);
  waterLeakGroup.name="water-leak-group";
  scene.add(waterLeakGroup);
}




const EnginRoom = () => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const statsRef = useRef(null);
  const sceneRef = useRef(null);
  const raycasterRef = useRef(new Three.Raycaster());
  raycasterRef.current.layers.enable( 1 );
  const cameraRef = useRef(null);
  const controlRef = useRef(null);
  const outlineRef = useRef(null);
  const outlineArrowRef = useRef(null);
  const smokeRef = useRef(null);
  const fireRef = useRef(null);
  const [type, setType] = useState('cabinet-group');
  const [showPunchCard, setShowPunchCard] = useState(false);
  const [showAlarm, setShowAlarm] = useState(false);
  const typeFun = useRef({
    'cabinet-group': {fun:addCabinetList}, 
    'cabinet-usage-group': {fun:addCabinetUsage}, 
    'heat-group': {fun: addHeatPlane, base:'cabinet-group'},
    'cable-group': {fun: addCable,base:'cabinet-group'},
    'cabinet-usable-area-group': {fun: addCabinetUsageArea},
    'smoke': {fun: addSmoke, base:'cabinet-group'},
    'air-wind-group': {fun: addAirWind, base:'cabinet-group'},
    "auto-cruise": {fun: alarmCruise, base:'cabinet-group'},
    "water-leak-group": {fun: addWaterLeakAlarm}
  });

  const dbClickCanvas= (event) => {
    const mouse = {
      x: ( event.clientX / window.innerWidth ) * 2 - 1,
      y: - ( event.clientY / window.innerHeight ) * 2 + 1
    }
    // 通过摄像机和鼠标位置更新射线
	  raycasterRef.current.setFromCamera(mouse, cameraRef.current );

    // 计算物体和射线的焦点
	  const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
    if (intersects[0]) {
      const currentObj = intersects[0].object;
      // console.log(currentObj)
      if (!currentObj.name) {
        return;
      }

      if (currentObj.parent.name==='server') { //服务器

        if (currentObj.name === 'server-button') {  //点击按钮不做服务器抽出效果
          return;
        }
        const parent = currentObj.parent;
        const z = parent.position.z > 0.25 ? 0.25 : 2.25
        new TWEEN.Tween({value:parent.position.z})
        .to({value: z}, 500)
        .onUpdate(function (val) {
          parent.position.z=val.value;
        })
        .start();
        return;
      }

      if (currentObj.name === 'cabinet-door') {
        const server = currentObj.parent.parent.children.find((item)=>{
          let flag = false;
          if (item.name==='server'&&item.position.z>0.25) {  //有服务器抽出
            flag = true;
          }
          return flag;
        })

        if (server) {
          return;
        }

      }

      const angle = currentObj.name === 'left-door' ? -Math.PI/2 : Math.PI/2;
      const rotaionAngle = currentObj.parent.rotation.y !== 0 ? 0 : angle;
      new TWEEN.Tween(currentObj.parent.rotation)
        .to({x:0,y:rotaionAngle,z:0}, 1000)
        .onUpdate(function (val) {
          currentObj.parent.rotation.set(val.x || 0, val.y || 0, val.z || 0);
        })
        .start();
      
      if (!rotaionAngle) {  //关闭试不需要镜头切换
        return;
      }

      if (currentObj.name === 'cabinet-door') {
        const cabinet = currentObj.parent.parent

        new TWEEN.Tween(cameraRef.current.position)
          .to({ x: cabinet.position.x, y: cabinet.position.y+10, z: cabinet.position.z+23 }, 2000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          // .delay(1000)
          .start();


        controlRef.current.target=new Three.Vector3(
          cabinet.position.x,
          cabinet.position.y+8,
          cabinet.position.z+5
        );
  
        // cameraRef.current.position.set(
        //   cabinet.position.x,
        //   cabinet.position.y+10,
        //   cabinet.position.z+23
        // );
        
      } else {  //机房门
        controlRef.current.target = new Three.Vector3(-70, 14, -6);
        // cameraRef.current.position.set(-125, 19, -6);
        new TWEEN.Tween(cameraRef.current.position)
          .to({ x: -125, y: 19, z: -6 }, 2000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          // .delay(1000)
          .start();
      }
    }
  };

  const moveCanvas = (event) => {
    if (!cameraRef.current) {
      return;
    }
    const mouse = {
      x: ( event.clientX / window.innerWidth ) * 2 - 1,
      y: - ( event.clientY / window.innerHeight ) * 2 + 1
    }
    // 通过摄像机和鼠标位置更新射线
	  raycasterRef.current.setFromCamera(mouse, cameraRef.current );
    // 计算物体和射线的焦点
    const group = sceneRef.current.children.find((item)=>item.name==='cabinet-group');
    if (!group){
      return;
    }
	  const intersects = raycasterRef.current.intersectObjects(group.children, true);
    if (intersects[0]) {
      const cabinet = getTopParent(intersects[0].object, 'cabinet-group')
      if (cabinet.name) {
        const labelName = `${cabinet.name}-label`
        const labelObj = cabinet.children.find((item)=>item.name===labelName)
        if (labelObj) {
          return;
        }
        //清空其他机柜的label
        clearLabel(group);
        //创建该机柜label
        const labelDiv = document.createElement( 'div' );
        labelDiv.className = 'cabinet-label';
        labelDiv.textContent = cabinet.name;
        const label = new CSS2DObject( labelDiv );
        label.position.set( 0, 19, 0 );
        label.name = labelName;
        cabinet.add( label );

      }

    } else {
      clearLabel(group);
    }
  
  }

  const clickCanvas = (event) =>{
    if (!cameraRef.current) {
      return;
    }
    const mouse = {
      x: ( event.clientX / window.innerWidth ) * 2 - 1,
      y: - ( event.clientY / window.innerHeight ) * 2 + 1
    }
    // 通过摄像机和鼠标位置更新射线
	  raycasterRef.current.setFromCamera(mouse, cameraRef.current );
    // 计算物体和射线的焦点
	  // const group = sceneRef.current.children.find((item)=>item.name==='cabinet-group');
	  const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
 
    if (intersects[0]) {
      const selectObj = intersects[0].object;

      if (selectObj.name === 'server-button') {
        selectObj.userData.open = !selectObj.userData.open;
        const texture = selectObj.userData.open ? BUTTON_OPEN_TEXTURE : BUTTON_TEXTURE;
        selectObj.material.forEach((item)=>{
          if (item.map) {
            item.map.dispose();
            item.map = texture;
          }
        })
        
        //给开机按钮添加outline光效
        if (selectObj.userData.open) {
          outlineRef.current.selectedObjects = [...outlineRef.current.selectedObjects, intersects[0].object];
        } else {
          const outlineBtn = outlineRef.current.selectedObjects.filter((item)=>item.uuid !== selectObj.uuid) || [];
          outlineRef.current.selectedObjects = outlineBtn;
        }
       
      }

      if (selectObj.name==='punch-card') {
        setShowPunchCard(true)
      }
     
    }

  }

  const handleChangeType = (selectType) => {
    if (selectType===type) {
      return;
    }

    const currentGroup = type==='auto-cruise' ? [typeFun.current[type].base] : [type, typeFun.current[type].base];
    const featureGroup = [selectType, typeFun.current[selectType].base];
    const disposeGroup = [];
    const newGroup = [];
    currentGroup.forEach((name)=>{
      if (name && featureGroup.indexOf(name) < 0) {
        disposeGroup.push(name)
      }
    });
    featureGroup.forEach((name)=>{
      if (name && currentGroup.indexOf(name) < 0) {
        newGroup.push(name)
      }
    })

    if (disposeGroup.length) {
      disposeGroup.forEach((name)=>{
        if (name === 'cabinet-group') {
          cameraRef.current.layers.disable(1)
          return;
        }
        const group = sceneRef.current.children.find((item)=>item.name===name);
        dispose(sceneRef.current, group);
        if (name==='heat-group') {
          disposeHeatMap();
        }
        if (name==='smoke') {
          smokeRef.current = null;
          fireRef.current = null;
          outlineArrowRef.current.selectedObjects=[];
        }
      })
    } 

    if (newGroup.length) {
      newGroup.forEach((name)=>{
        if (name==='smoke') {
          const result =  typeFun.current[name].fun(sceneRef.current, cameraRef.current);
          smokeRef.current = result.particleGroup
          fireRef.current = result.particleFireMesh
          outlineArrowRef.current.selectedObjects = result.arrowArr;
        } else if (name==='cabinet-group') {
          cameraRef.current.layers.enable(1)
        } else if (name==="auto-cruise"){
          typeFun.current[name].fun(controlRef.current)
        } else {
          typeFun.current[name].fun(sceneRef.current)
        }
      })
    }
    setType(selectType);
    // console.log(rendererRef.current.info);
  }

  const closePunchCard = useCallback(()=>{
    setShowPunchCard(false)
  },[])

  useEffect(()=>{
    const {renderer, camera, scene, orbitControls, stats, labelRenderer, composer, effectFXAA, outlinePass, outlinePassArrow} = init(canvasRef.current, statsRef.current);
    sceneRef.current=scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlRef.current = orbitControls;
    outlineRef.current = outlinePass;
    outlineArrowRef.current = outlinePassArrow;
    const resizeHandle = () => {
      //根据窗口大小变化，重新修改渲染器的视椎
      if (renderer === null) {
        return;
      }
      const canvas = renderer.domElement
      camera.aspect = canvas.clientWidth / canvas.clientHeight
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
      //css2d render
      labelRenderer.setSize( window.innerWidth, window.innerHeight );

      //outline
      composer.setSize( window.innerWidth, window.innerHeight );
			effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );

      if(fireRef.current){
        fireRef.current.material.setPerspective( camera.fov, window.innerHeight );
      }
      
    };
   
    resizeHandle();

    initRoom(scene)
    addCabinetList(scene,camera); 

    const clock = new Three.Clock();

    const update = () => {
      // renderer.render(scene,camera);
      composer.render();
      //css2d render
      labelRenderer.render(scene,camera)

      TWEEN.update();
      orbitControls.update();
      stats.update();
      lineAnimation();
      cabinetAnimation(scene)
      airWindAnimation(scene)


      const dt = clock.getDelta();

      // engine.update(dt*0.5)
      if (smokeRef.current) {
        smokeRef.current.tick(dt)
        fireArrowAnimation(scene);
      }

      if (fireRef.current) {
        fireRef.current.material.update( dt );
      }

      // console.log(orbitControls)
      // console.log(camera)

      if (orbitControls.autoRotate) {
        if (orbitControls.getAzimuthalAngle()<=-1.6) {
          orbitControls.autoRotate = false;
          autoCruise({camera,scene,SERVER_DATA_ARR,orbitControls,setShowAlarm});
        }
      }

      window.requestAnimationFrame(update);
    }
   
    update()

    window.addEventListener('resize', resizeHandle);
    return () => {
      window.removeEventListener('resize',resizeHandle)
    }
  },[])

  return (
    <>
      <div ref={statsRef}></div>
      <div className="btns">
        <div className="item" onClick={()=>handleChangeType('cabinet-group')}>服务器</div>
        <div className="item" onClick={()=>handleChangeType('heat-group')}>温度云图</div>
        <div className="item" onClick={()=>handleChangeType('cable-group')}>传输线缆</div>
        <div className="item" onClick={()=>handleChangeType('cabinet-usage-group')}>机架使用率</div>
        <div className="item" onClick={()=>handleChangeType('cabinet-usable-area-group')}>机架可用空间</div>
        <div className="item" onClick={()=>handleChangeType('smoke')}>烟雾检测</div>
        <div className="item" onClick={()=>handleChangeType('air-wind-group')}>空调风向</div>
        <div className="item" onClick={()=>handleChangeType('auto-cruise')}>告警巡航</div>
        <div className="item" onClick={()=>handleChangeType('water-leak-group')}>漏水监控</div>
      </div>
      <div id="heat-map"></div>
      { showPunchCard && <PunchCard close={closePunchCard} />}
      { showAlarm && <Alarm close={()=>setShowAlarm(false)} />}
      
      <canvas ref={canvasRef} onDoubleClick={dbClickCanvas} onClick={clickCanvas} onMouseMove={moveCanvas}></canvas>
    </>
  )
}

export default EnginRoom;