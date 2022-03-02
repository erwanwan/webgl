import {useEffect, useRef, useState} from 'react';
import * as Three from "three";
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBB } from 'three/examples/jsm/math/OBB.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import "./index.less";

const init = (canvas, statsDom) => {
  if (!canvas) {
    return;
  }
  //创建一个渲染器
  const renderer = new Three.WebGLRenderer({canvas,antialias: true}); //后面一个参数是抗锯齿
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = Three.sRGBEncoding;
  renderer.toneMapping = Three.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  //创建镜头
  const camera = new Three.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 10000);
  // camera.position.set(10,10,10);
  // camera.position.set(12,3,12)
  // camera.position.set(59,8,50);
  // camera.position.set(-30,11,58);
  camera.position.set(-2.5, 8.3,0.23)
  camera.userData.type="car"


  const camera2 = new Three.OrthographicCamera(-400, 400, 400, -400, 1, 1000);
  camera2.position.set(0, 1000, 0);
  camera2.lookAt(0,0,0);
  

  //创建灯光
  const light = new Three.AmbientLight(0xffffff, 0.9);
  const color = 0xFFFFFF;
  const intensity = 0.3;
  const directionLight = new Three.DirectionalLight(color, intensity);
  directionLight.position.set(100, 100, 0);
  directionLight.target.position.set(0, 0, 0);
  


  //创建场景
  const scene = new Three.Scene();
  scene.background = new Three.Color(0x8FBCD4);
  scene.fog = new Three.Fog(0x8FBCD4, 3000, 4000);

  scene.add(light);
  scene.add(directionLight);

  const scene2 = new Three.Scene();
  scene2.background = new Three.Color(0xffffff);
  scene2.add(light.clone());


  // const orbitControls = new OrbitControls(camera, canvas);
  // orbitControls.enabled = false

  // const orbitControls = new OrbitControls( camera, labelRenderer.domElement );
  //设置OrbitControls观察点的位置
  // orbitControls.target.set(0,0,0);
  // orbitControls.target.set(-2.12, 7.32,-7.9);
  //设置完需要调用一下 controls.update，这样才真正更新观察点位置
  // orbitControls.update();


  let stats;
  if (statsDom) {
    stats = new Stats();
    statsDom.appendChild(stats.dom);
  }

  const axesHelper = new Three.AxesHelper( 5 );
  scene.add( axesHelper );

  

  return {renderer, camera, scene, stats,camera2,scene2}
};

const initGround = (scene) => {
  const ground_geom = new Three.PlaneBufferGeometry(8000, 8000);
  const ground_mate = new Three.MeshLambertMaterial({color: 0xBCD48F, side: Three.DoubleSide});
  const ground_mesh = new Three.Mesh(ground_geom, ground_mate);
  ground_mesh.rotation.x = - Math.PI / 2;
  scene.add(ground_mesh);
};
const initBuild = (scene,scene2) => {
  let build = new Three.Group();
  const buildObbArray = [];
  for(let i=0; i<1000; i++) {
      let w = Math.random() * 50 + 50;
      let h = Math.random() * 100 + 100;
      let d = Math.random() * 50 + 50;
      let x = Math.random() * 8000 - 4000;
      let z = Math.random() * 8000 - 4000;
      if((x * x + z * z) < Math.pow(140, 2)) {
          //40为车半长的估计值
          x = Math.pow(140, 2) / x;
          z = Math.pow(140, 2) / z;
      }
      let geometry = new Three.BoxBufferGeometry(w, h, d);
      let material = new Three.MeshStandardMaterial({color: new Three.Color().setHSL(Math.random(), 1.0, 0.6)});
      let mesh = new Three.Mesh(geometry, material);
      mesh.position.set(x, h / 2, z);
      build.add(mesh);
      let obb = new OBB();
      buildObbArray.push(obb.set(new Three.Vector3(x, h / 2, z), new Three.Vector3(w/2, h/2, d/2), new Three.Matrix3()));
  }
  scene.add(build);
  scene2.add(build.clone());

  return buildObbArray;
};

const loadCar = (scene,scene2) => {
  const loader = new GLTFLoader();
  //加载压缩过的文件需要这个
  const dracoLoader = new DRACOLoader();
  //指定包含 WASM/JS 解码库的文件夹的路径。
  // dracoLoader.setDecoderPath( 'https://threejs.org/examples/js/libs/draco/gltf/' );
  dracoLoader.setDecoderPath( '/draco/gltf/' );
  loader.setDRACOLoader( dracoLoader );
  loader.load( require("./model/super_car.glb").default , (gltf)=>{
    const model = gltf.scene.children[0];
    // console.log(model)
    // model.rotation.y = Math.PI / 4;
    
  // const steering_wheel = model.getObjectByName('steering_wheel');

  const glass = model.getObjectByName("glass");
  // console.log(glass)
  glass.material.transparent = true;
  glass.material.opacity = 0

    const shadow = new Three.Mesh(
      new Three.PlaneBufferGeometry( 0.655 * 4, 1.3 * 4 ),
      new Three.MeshBasicMaterial( {
        map: new Three.TextureLoader().load(require("./images/super_car_ao.png").default), 
        blending: Three.MultiplyBlending, 
        toneMapped: false, 
        transparent: true
      } )
    );
    shadow.position.y = 0.1;
    shadow.rotation.x = - Math.PI / 2;
    model.add(shadow);
    
    const size = new Three.Box3().setFromObject(model).getSize();
    const carHeight = 10
    model.scale.set(carHeight/size.y,carHeight/size.y,carHeight/size.y);
   
    
    const directionLight = new Three.DirectionalLight('#b0b0b0', 1);
    // const directionLight = new Three.DirectionalLight('#fff', 1);
    directionLight.position.set(20, 20, 20);
    directionLight.target.position.set(0, 10, 0);
    // const helper = new Three.DirectionalLightHelper(directionLight);

    const car = new Three.Group();
    car.name="car-group";
    scene.add(car)

    car.add(model);
    car.add(directionLight);
    const carHalfSize = new Three.Box3().setFromObject(model).getSize().multiplyScalar(0.5);
    car.userData.carHalfSize = carHalfSize;
    // car.add(helper);
   

    const orthoCar = new Three.Mesh(new Three.SphereBufferGeometry(20, 20), new Three.MeshBasicMaterial({color: 0xff0000, side: Three.DoubleSide}));
    // orthoCar.rotation.x = - Math.PI / 2;
    orthoCar.name="orthoCar"
    scene2.add(orthoCar);
   
  }, function ( xhr ) {
    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
  },  (err)=>{
    console.log(err);
  })
}

let rotateTyre = 0; //车轮相对于车的角度
let rotateCorrection = 0.002;  //角度系数
let speed = 0;  //车速
let rotateVector = new Three.Vector3(0,0,-1)  //车前进方向向量
let speedCorrection = 0.04;  //速度系数
let rotateRun = 0  //车相对于场景的旋转角度


const run = (scene,camera,camera2,scene2,clock,buildObbArray) => {
  const wheelObj = ['wheel_fl','wheel_fr','wheel_rl','wheel_rr'].map((name)=>{
    return scene.getObjectByName(name)
  });
  if (!wheelObj[0]) {
    return;
  }
  let delta = - clock.getDelta();
  wheelObj.forEach((wheel)=>{
    // wheel.rotation.copy(new Three.Euler(0.2 + wheel.rotation.x, wheel.rotation.y, wheel.rotation.z, 'ZYX'))
    // wheel.rotation.set(delta*speed + wheel.rotation.x, wheel.rotation.y, wheel.rotation.z);
    wheel.rotation.copy(new Three.Euler(delta*speed + wheel.rotation.x, wheel.rotation.y, wheel.rotation.z, 'ZYX')) 
  })

  //rotateOffset 旋转偏移量  rotateTyre轮胎偏转  rotateCorrection偏转系数  speed车速
  const rotateOffset = Math.sin(rotateTyre) * rotateCorrection * speed;

  //rotateVector 车前进方向向量（不断乘offset得到）
  // rotateVector.applyAxisAngle(new Three.Vector3(0,1,0), Math.asin( speed ? rotateOffset/speed : 0));   //将轴和角度所指定的旋转应用到该向量上。
  rotateVector.applyAxisAngle(new Three.Vector3(0,1,0), rotateOffset);   //将轴和角度所指定的旋转应用到该向量上。

  //车x和z方向增加量 ∝车速
  const car = scene.getObjectByName('car-group');
  car.position.x += speed * speedCorrection * rotateVector.x;
  car.position.z += speed * speedCorrection * rotateVector.z;


  //车身旋转 使用 旋转偏移总量rotateRun
  // rotateRun = rotateRun + Math.asin( speed ? rotateOffset/speed : 0);
  rotateRun = rotateRun + rotateOffset;
  car.rotation.y = rotateRun;

  camera2.position.set(car.position.x, 1000, car.position.z);
  camera2.lookAt(car.position.x, 10, car.position.z);

  const orthoCar = scene2.getObjectByName('orthoCar');
  orthoCar.position.set(car.position.x,car.position.y,car.position.z);

  //切换视角
  if(camera.userData.type === 'car') {
    camera.position.set(car.position.x - 3 * Math.cos(rotateRun), 8, car.position.z + 3 * Math.sin(rotateRun));
    camera.lookAt(camera.position.x - Math.sin(rotateRun), 8, camera.position.z - Math.cos(rotateRun));
  } else {
    camera.position.set(car.position.x - 50 * Math.sin(rotateRun + Math.PI * 0.9), 20, car.position.z - 50 * Math.cos(rotateRun + Math.PI * 0.9));
    camera.lookAt(camera.position.x - Math.sin(rotateRun), 19.9, camera.position.z - Math.cos(rotateRun) );
  }
  
  // console.log(car.matrixWorld)

 
  // console.log(wheelObj);
  const obbCar = new OBB(car.position, car.userData.carHalfSize, car.matrixWorld);   //matrixWorld物体的世界变换
  let isFail = false;
  buildObbArray.forEach((buildObb)=>{
    if (obbCar.intersectsOBB(buildObb)) {
      speed=0
      isFail=true
    }
    
  })
 
  return isFail;
}

const turn = (direction,scene) => {
  const rotateMax = Math.PI / 6;
  let step = 0;

  if (Math.abs(rotateTyre)<0.5*rotateMax) {
    step=0.02
  } else if (Math.abs(rotateTyre)<0.8*rotateMax) {
    step=0.04
  } else if (Math.abs(rotateTyre)<rotateMax) {
    step=0.06
  } else if (rotateTyre>rotateMax && direction==='right' || rotateTyre<-rotateMax && direction==='left') {
    step=0.06
  }

  if (direction==="left") { //a键
    rotateTyre = rotateTyre+step
  } else {
    rotateTyre = rotateTyre-step
  }

  const wheelObj = ['wheel_fl','wheel_fr'].map((name)=>{
    return scene.getObjectByName(name)
  });
  wheelObj.forEach((item)=>{
    item.rotation.y= rotateTyre
  })
  const steeringWheel = scene.getObjectByName('steering_wheel');   //方向盘
  steeringWheel.rotation.y=-rotateTyre
};

const speedFun = (direction) => {
  if (direction==='front' && speed<40) {
    speed = speed+0.5
  } else if (direction==='back' && speed > 0){
    speed = speed-2
  } else if (direction==='back' && speed > -10 ) {
    speed = speed - 0.5;
  }
  return speed;
}

const Car = () => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const statsRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const [carSpeed,setCarSpeed] = useState(0);
  const [fail,setFail] = useState(false);


  useEffect(()=>{
    const {renderer, camera, camera2, scene, scene2, stats} = init(canvasRef.current, statsRef.current);

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
    };

    resizeHandle();
    
    initGround(scene);
    const buildObbArray =  initBuild(scene,scene2);
    loadCar(scene,scene2);

    const clock = new Three.Clock();
    

    const update = () => {
      renderer.setScissor( 0, 0, window.innerWidth, window.innerWidth );  //将剪裁区域设为(x, y)到(x + width, y + height) 
      renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );  //将视口大小设置为(x, y)到 (x + width, y + height)
      renderer.setScissorTest(true);  //启用或禁用剪裁检测. 若启用，则只有在所定义的裁剪区域内的像素才会受之后的渲染器影响
      renderer.render(scene,camera);

      renderer.setScissor( 0, 0, window.innerHeight/4, window.innerHeight/4 );
      renderer.setViewport( 0, 0, window.innerHeight/4, window.innerHeight/4);
      renderer.setScissorTest(true);
      renderer.render( scene2, camera2 );
      
      stats.update();
      // orbitControls.update();
      const isFail = run(scene,camera,camera2,scene2,clock,buildObbArray)
      setFail(isFail);
      
      // console.log(camera.position);
      // console.log(orbitControls)
      window.requestAnimationFrame(update);
    }
   
    update();

    const handleKeyPress = (e) =>{
      if (e.key==='q') {
        camera.userData.type = camera.userData.type==='car' ? 'all' :'car';
      } 

      if (e.key==='a') {
        turn('left',scene)
      }

      if (e.key==='d'){
        turn('right',scene)
      }

      if (e.key==="w") {
        const sd = speedFun('front')
        setCarSpeed(sd)
      }

      if (e.key==='s') {
        const sd = speedFun('back')
        setCarSpeed(sd)
      }
    };

    document.addEventListener('keypress',handleKeyPress)

    return ()=>{
      document.removeEventListener("keypress", handleKeyPress)
    }
  },[])

  return (
    <>
      <div ref={statsRef}></div>
      <canvas ref={canvasRef}></canvas>
      <div className="control-info">
        q -- 切换视角<br />
        a,d -- 转弯<br />
        w,s -- 加减速<br />
        当前速度：{carSpeed}<br />
        
      </div>
      
      {fail && <div className="fail">你撞车啦，哈哈哈哈</div>}
      
     
    </>
  )
}

export default Car;


//AABB 包围盒(box3): AABB 包围盒是与坐标轴对齐的包围盒, 简单性好, 紧密性较差(尤其对斜对角方向放置的瘦长形对象, 採用AABB, 将留下非常大的边角空隙, 
// 导致大量不是必需的包围盒相交測试)。当物体旋转之后需对AABB 进行相同的旋转并更新; 当物体变形之后仅仅需对变形了的基本几何元素相应的包围盒又一次计算; 
// 然后能够自下向上由子结点的AABB 合成父结点的AABB, 最后进行包围盒树的更新。

// OBB 包围盒: OBB 碰撞检測方法紧密性是较好的, 可以大大降低參与相交測试的包围盒的数目, 因此整体性能要优于AABB 和包围球, 而且实时性程度较高。当物体发生旋转运动后, 
// 仅仅需对OBB 进行相同的旋转就可以。因此, 对于刚体间的碰撞检測, OBB 不失为一种较好的选择。迄今为止, 还没一种有效的方法可以较好地解决对象变形后OBB 树的更新问题, 
// 而又一次计算每一个结点的OBB 的代价又太大。所以OBB 不适用于包括软体对象的复杂环境中。

// 包围球: 包围球碰撞检測方法是用球体包围整个几何体, 不管是几何体还是相交測试都非常easy; 可是它的紧密性太差。由于除了在3 个坐标轴上分布得比較均匀的几何体外, 差点儿都会留下较大的空隙,
//  须要花费大量的预处理时间, 以构造一个好的层次结构逼近对象。当物体变形之后,包围球树须要又一次计算。因此,它是使用得比較少的一种包围盒。当对象发生旋转运动时, 包围球不需作不论什么更新, 
//  这是包围球的较优秀特性; 当几何对象进行频繁的旋转运动时, 採用包围球可能得到较好结果。

// OBB比包围球和AABB更加逼近物体，能显著减少包围体的个数
