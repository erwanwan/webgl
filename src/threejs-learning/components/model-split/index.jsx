import {useEffect, useRef, useState} from 'react';
import * as Three from "three";
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

import TWEEN from "@tweenjs/tween.js";

import "./index.less";


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
  // camera.lookAt(0,5,0);
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

  //创建outline
  const composer = new EffectComposer( renderer );
  const renderPass = new RenderPass( scene, camera );
  composer.addPass( renderPass );

  let outlinePass = new OutlinePass( new Three.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
  const params = {
    edgeStrength: 4, //强度 默认3
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

  const effectFXAA = new ShaderPass( FXAAShader );
  effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
  composer.addPass( effectFXAA );

  const axesHelper = new Three.AxesHelper( 20 );
  scene.add( axesHelper );

  return {renderer, camera, scene, stats,orbitControls, composer, effectFXAA, outlinePass}
};

const loadModel = (scene) => {
  const loader = new GLTFLoader();
  loader.load(require("./model/a-dismantling.glb").default,(gltf)=>{
    console.log(gltf)
    gltf.scene.scale.set(2,2,2)
    gltf.scene.name='model'
    scene.add(gltf.scene)
  })
};

const move = (obj,position) => {
  new TWEEN.Tween(obj.position)
        .to({...obj.position,...position}, 500)
        .onUpdate(function (val) {
          obj.position.set(val.x || 0,val.y || 0,val.z || 0);
        })
        .start();
}


const ModelSplit = () => {
  const canvasRef = useRef(null);
  const statsRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const outlineRef = useRef(null);
  const raycasterRef = useRef(new Three.Raycaster());
  const labelDom = useRef(null)
  const [name,setName] = useState("")

  useEffect(()=>{
    const {renderer, camera, scene, stats,orbitControls, composer, effectFXAA, outlinePass} = init(canvasRef.current, statsRef.current);

    cameraRef.current=camera;
    sceneRef.current=scene;
    outlineRef.current = outlinePass;

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

       //outline
       composer.setSize( window.innerWidth, window.innerHeight );
       effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
    };
  
    resizeHandle();

    loadModel(scene)
  
    const update = () => {
      
      
      stats.update();
      orbitControls.update();
      TWEEN.update();

      // renderer.render(scene,camera);
      composer.render();
      
      window.requestAnimationFrame(update);
    }
   
    update();

    window.addEventListener('resize', resizeHandle);
    return () => {
      window.removeEventListener('resize',resizeHandle)
    }
  },[]);

  const handleMove = (event) => {
    if(!sceneRef.current) {
      return;
    }
    const mouse = {
      x: ( event.clientX / window.innerWidth ) * 2 - 1,
      y: - ( event.clientY / window.innerHeight ) * 2 + 1
    }
    // 通过摄像机和鼠标位置更新射线
	  raycasterRef.current.setFromCamera(mouse, cameraRef.current );

    // 计算物体和射线的焦点
	  const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

    if (intersects[0]) {
      // console.log(intersects[0])
      outlineRef.current.selectedObjects=[intersects[0].object]
      labelDom.current.style.left = `${event.clientX+30}px`
      labelDom.current.style.top = `${event.clientY}px`
      labelDom.current.style.display='block'
      setName(intersects[0].object.name)
    } else {
      labelDom.current.style.display='none'
    }
  }

  const handleSplit = () => {
    move(sceneRef.current.getObjectByName("Object_7"),{x:-5});
    move(sceneRef.current.getObjectByName("Object_18"),{x:-5});

    move(sceneRef.current.getObjectByName("Object_10"),{x:5});
    move(sceneRef.current.getObjectByName("Object_11"),{x:5});
    move(sceneRef.current.getObjectByName("Object_17"),{x:5});

    move(sceneRef.current.getObjectByName("Object_27"),{z:5});
    move(sceneRef.current.getObjectByName("Object_29"),{z:5});

    move(sceneRef.current.getObjectByName("Object_14"),{z:-5});
    move(sceneRef.current.getObjectByName("Object_16"),{z:-5});

    move(sceneRef.current.getObjectByName("Object_28"),{y:2});
  }

  const handleCombile = () => {
    move(sceneRef.current.getObjectByName("Object_7"),{x:0});
    move(sceneRef.current.getObjectByName("Object_18"),{x:0});
  
    move(sceneRef.current.getObjectByName("Object_10"),{x:0});
    move(sceneRef.current.getObjectByName("Object_11"),{x:0});
    move(sceneRef.current.getObjectByName("Object_17"),{x:0});
  
    move(sceneRef.current.getObjectByName("Object_27"),{z:0});
    move(sceneRef.current.getObjectByName("Object_29"),{z:0});
  
    move(sceneRef.current.getObjectByName("Object_14"),{z:0});
    move(sceneRef.current.getObjectByName("Object_16"),{z:0});
  
    move(sceneRef.current.getObjectByName("Object_28"),{y:0});
  }

  
  
 
  return(
    <>
      <div ref={statsRef}></div>
      <canvas ref={canvasRef} onMouseMove={handleMove}></canvas>
      <div className="label" ref={labelDom}>{name}</div>
      <div className="split-btn" onClick={handleSplit} >拆解</div>
      <div className="split-btn1" onClick={handleCombile} >合并</div>
    </>
  ) 
}

export default ModelSplit;