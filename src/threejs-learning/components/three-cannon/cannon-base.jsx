import {useEffect, useRef, useState} from 'react';
import * as Three from "three";
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import CANNON from "cannon";

const init = (canvas, statsDom) => {
  const renderer = new Three.WebGLRenderer({canvas, antialias: true});
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0xbfd1e5);

  const scene = new Three.Scene();//step 1 创建场景
  
  const camera = new Three.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.y = 30;
  camera.position.z = 20;
  scene.add( camera ); //step 2 场景中添加相机

  scene.add(new Three.AmbientLight(0x888888));
  const light = new Three.DirectionalLight(0xbbbbbb, 1);
  light.position.set(6, 30, 6);

  scene.add(light); //step 3 场景中添加另种光源

  let stats;
  if (statsDom) {
    stats = new Stats();
    statsDom.appendChild(stats.dom);
  }

  const orbitControls = new OrbitControls(camera, canvas);
  orbitControls.target.set(0,0,0);
  orbitControls.update();

  return {renderer, camera, scene, stats,orbitControls}
};

const initGround = (scene) => {

  const groundGeom = new Three.BoxBufferGeometry(40, 0.2, 40);
  let groundMate = new Three.MeshPhongMaterial({color: 0xdddddd})
  const ground = new Three.Mesh(groundGeom, groundMate);
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground); //step 5 添加地面网格
  return ground
}

const initCannon = (ground) => {
  const world = new CANNON.World();  ////该方法初始化物理世界，里面包含着物理世界的相关数据（如刚体数据，世界中所受外力等等）
  world.gravity.set(0,-9.8,0)  //设置物理世界的重力为沿y轴向上-9.8米每二次方秒
  world.broadphase = new CANNON.NaiveBroadphase();//NaiveBroadphase是默认的碰撞检测方式，该碰撞检测速度比较高
  world.solver.iterations = 5;//解算器的迭代次数，更高的迭代次数意味着更加精确同时性能将会降低

  ////创建一个刚体（物理世界的刚体数据）  这个是地板的刚体数据
  const groundBody = new CANNON.Body({
    position: new CANNON.Vec3(0,-0.1,0),
    mass: 0,   //刚体的质量，这里单位为kg
    shape: new CANNON.Box(new CANNON.Vec3(20,0.1,20)), //刚体的形状（这里是立方体，立方体的参数是一个包含半长、半宽、半高的三维向量
    material:{ //材质数据，里面规定了摩擦系数和弹性系数
      friction: 0.05,  //摩擦系数
      restitution: 0.1,  //弹性系数
    }
  })

  ground.userData.bodyData = groundBody;

  world.addBody(groundBody);

  return world;
}
const createRandomMaterial = () => {
  const material = new Three.MeshPhongMaterial();  //HSL(0.4,0.8,0.5) ~ HSL(0,0.8,0.5)就是从绿色到红色
  material.color.setHSL(0.4 - 0.4 * Math.random(), 0.8, 0.5);
  return material
};

const createBox = (scene,world) => {
  const geometry = new Three.BoxBufferGeometry(2,2,2);
  setInterval(()=>{
    const x = Math.random() * 10 - 5;
    const z = Math.random() * 10 - 5;
    const box = new Three.Mesh( geometry, createRandomMaterial() ); //createRandomMaterial创建随机颜色的材质
    box.position.set(x, 20, z);
    scene.add( box ); //创建box，并添加到场景

    //创建box的刚体数据
    const bodyBox = new CANNON.Body({
      position: new CANNON.Vec3(x,20,z),
      mass:1,  //刚体的质量，这里单位为kg
      shape: new CANNON.Box(new CANNON.Vec3(1,1,1)), //刚体的形状
      material: { //材质数据，里面规定了摩擦系数和弹性系数
        friction:0.1,  //摩擦系数
        restitution: 0.1,  //弹性系数
      }
    });

    box.userData.bodyData = bodyBox;
    world.addBody(bodyBox);

    setTimeout(() => { //10秒钟之后在场景中移除box，并在物理世界中移除该刚体
      scene.remove(box);
      box.material.dispose();
      box.geometry.dispose();
      world.removeBody(bodyBox);
    }, 10000)


  },200)
}

//逐帧根据物理引擎的数据渲染three场景
const updatePhysics = (world,scene) => {
  world.step(1/60); //第一个参数是以固定步长更新物理世界参数
  scene.children.forEach(d => {//遍历场景中的子对象，如果对象的isMesh属性为true，我们就将更新改对象的position和quaternion属性（他们对应的刚体数据存在对应的userData中）。
    if(d.isMesh) {
        d.position.copy(d.userData.bodyData.position);
        d.quaternion.copy(d.userData.bodyData.quaternion);
    }
  })
}


const CannonBase = () => {
  const canvasRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(()=>{
    const {renderer, camera, scene, stats,orbitControls} = init(canvasRef.current, statsRef.current);

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

    const ground = initGround(scene);
    const world = initCannon(ground);
    createBox(scene,world)
  
    const update = () => {
      
      
      stats.update();
      orbitControls.update();
      updatePhysics(world,scene)

      renderer.render(scene,camera);
      
      window.requestAnimationFrame(update);
    }
   
    update();

    window.addEventListener('resize', resizeHandle);
    return () => {
      window.removeEventListener('resize',resizeHandle)
    }
  },[])
  
 
  return(
    <>
      <div ref={statsRef}></div>
      <canvas ref={canvasRef}></canvas>
    </>
  ) 
}

export default CannonBase;