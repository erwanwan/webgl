import {useEffect, useRef, useState} from 'react';
import * as Three from "three";
import Stats from 'three/examples/jsm/libs/stats.module';
import { MapControls, OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import TWEEN from "@tweenjs/tween.js";
import CANNON from "cannon";
import {extrudePolygon,extrudePolyline} from 'geometry-extrude';

import "./index.less";
import { convertSpeed } from 'geolib';
import { PlaneGeometry } from 'three';

const ARROW_GREEN = new Three.TextureLoader().load(require("./images/arrow-green-removebg-preview.png").default);
ARROW_GREEN.wrapS = Three.RepeatWrapping;
ARROW_GREEN.wrapT = Three.RepeatWrapping;
ARROW_GREEN.repeat.set(0.5,0.5)

const ARROW_RED = new Three.TextureLoader().load(require("./images/arrow-red-removebg-preview.png").default);
ARROW_RED.wrapS = Three.RepeatWrapping;
ARROW_RED.wrapT = Three.RepeatWrapping;
ARROW_RED.repeat.set(0.5,0.5)

const ARROW_BLUE = new Three.TextureLoader().load(require("./images/arrow-blue-removebg-preview.png").default);
ARROW_BLUE.wrapS = Three.RepeatWrapping;
ARROW_BLUE.wrapT = Three.RepeatWrapping;
ARROW_BLUE.repeat.set(0.5,0.5)

const ARROW_YELLOW = new Three.TextureLoader().load(require("./images/arrow-yellow-removebg-preview.png").default);
ARROW_YELLOW.wrapS = Three.RepeatWrapping;
ARROW_YELLOW.wrapT = Three.RepeatWrapping;
ARROW_YELLOW.repeat.set(0.5,0.5)

const ARROW_LEFT = new Three.TextureLoader().load(require("./images/arrow1.png").default);
ARROW_LEFT.wrapS = Three.RepeatWrapping;
ARROW_LEFT.wrapT = Three.RepeatWrapping;
ARROW_LEFT.repeat.set(10,0.5)
const ARROW_RIGHT = new Three.TextureLoader().load(require("./images/arrow12.png").default);
ARROW_RIGHT.wrapS = Three.RepeatWrapping;
ARROW_RIGHT.wrapT = Three.RepeatWrapping;
ARROW_RIGHT.repeat.set(10,0.5)


const relationShaderBar = {
    uniforms: {
      planeColor: {value: new Three.Color('#000')},
      pi: {value: Math.PI},
      //扫描光
      lightPosition: {value: new Three.Vector2(0,0)},
      radius: {value: 1.0},
      lightColor1:{value: new Three.Color('red')},
      opacity: {value: 1.0}
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
        uniform vec2 lightPosition;
        uniform float radius;    
        uniform vec3 lightColor1;     
        uniform vec3 planeColor;     
        uniform float pi;     
        uniform float opacity;     
        varying vec3 vPosition; 
        varying vec2 vUv;

        float getLeng(float x, float y, float x1, float y1){
          return  sqrt((x-x1)*(x-x1)+(y-y1)*(y-y1));
        }

        void main(){
          float len = getLeng(vPosition.x,vPosition.z, lightPosition.x, lightPosition.y);
          float angle1 = asin(-((vPosition.z- lightPosition.y) / len));
          float angle2=angle1;
          if (len<=radius) {
            float a = len/radius - 0.2 < 0.0 ? 0.0 :  len/radius - 0.2;
            gl_FragColor= vec4(lightColor1.r, lightColor1.g, lightColor1.b, a*opacity);
            
          } else {
            gl_FragColor= vec4(planeColor.r, planeColor.g, planeColor.b, 0);
          }          
        }
    `
};

const relationCenterShaderBar = {
  uniforms: {
    planeColor: {value: new Three.Color('#000')},
    pi: {value: Math.PI},
    //扫描光
    lightPosition: {value: new Three.Vector2(0,0)},
    radius: {value: 2.0},
    // lightColor1:{value: new Three.Color('red')},
    lightColorArr: {value: [new Three.Color('#00ffff'),new Three.Color('#00ff00'),new Three.Color('#ff0101'),new Three.Color('#ffdd00'),new Three.Color('#00ffff'),new Three.Color('#00ff00')]},
    opacity: {value: 1.0}
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
      uniform vec2 lightPosition;
      uniform float radius;    
      uniform vec3  lightColorArr[6];     
      uniform vec3 planeColor;     
      uniform float pi;     
      uniform float opacity;     
      varying vec3 vPosition; 
      varying vec2 vUv;

      float getLeng(float x, float y, float x1, float y1){
        return  sqrt((x-x1)*(x-x1)+(y-y1)*(y-y1));
      }

      void main(){
        float len = getLeng(vPosition.x,vPosition.z, lightPosition.x, lightPosition.y);
        float angle1 = asin(-((vPosition.z- lightPosition.y) / len));
        float angle2=angle1;
        if (len<=radius && len>=1.0 ) {
          float length = float(lightColorArr.length());
          int j = int(ceil( (len-1.0)/(radius-1.0)*length ) - 1.0);
          vec3 color = lightColorArr[j];
          gl_FragColor= vec4(color.r, color.g, color.b, opacity);


          // for(int i=0;i<lightColorArr.length();++i)
          // {
          //   float j = float(i);
          //   if ( (radius - 1.0) * j/6.0<=len-1.0 &&  len-1.0<=(radius - 1.0) * (j+1.0)/6.0 ) {
          //     vec3 color = lightColorArr[i];
          //     gl_FragColor= vec4(color.r, color.g, color.b, opacity);
          //   }

          // }
        } else {
          gl_FragColor= vec4(planeColor.r, planeColor.g, planeColor.b, 0);
        }          
      }
  `
};

const areaShaderBar = {
  uniforms: {
    time: { value: 1 },
    arrowTextureLeft: {value: ARROW_LEFT},
    arrowTextureRight: {value: ARROW_RIGHT},  
    topColor: {value: new Three.Color("red")}
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
    uniform vec3 topColor;
    varying vec2 vUv;
    uniform sampler2D arrowTextureLeft;  
    uniform sampler2D arrowTextureRight;
    varying vec3 fNormal;
    varying vec3 vPosition;
    void main( void ) {
        vec3 tempNomal= normalize(fNormal);  
        
        if (abs(tempNomal.y)==1.0) {
          gl_FragColor = vec4(topColor.r,topColor.g,topColor.b,0.2);
        } else {
          if (vPosition.x<=5.0 || vPosition.z==10.0) {
            vec4 colora = texture2D(arrowTextureLeft,vec2(vUv.x+time,vUv.y)); 
            gl_FragColor = colora;
          } else {
            vec4 colorb = texture2D(arrowTextureRight,vec2(vUv.x-time,vUv.y)); 
            gl_FragColor =colorb;
          }
        }
        
    }
  `

};

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

const genRelationChart = (scene) => {
  const group = new Three.Group();
  group.name = 'relation-chart'
  scene.add(group);

  const curve = new Three.CubicBezierCurve3(
    new Three.Vector3( 1, 8, 0 ),
    new Three.Vector3( 5, 15, 0 ),
    new Three.Vector3( 20, 15, 0 ),
    new Three.Vector3( 35, 0, 0 )
  );

  const shape = new Three.Shape();

  shape.moveTo( -0.5, 0.01 );
  shape.lineTo( -0.5,-0.01);
  shape.lineTo( 0.5,-0.01);
  shape.lineTo( 0.5,0.01);
 
  const geometry = new Three.ExtrudeGeometry(shape, {
    steps : 30,
    bevelEnabled : false,
    extrudePath : curve
  });
  const planGeometry = new Three.PlaneBufferGeometry(10,10);
  planGeometry.rotateX(Math.PI/2);

  const materialArr = [ARROW_BLUE,ARROW_GREEN,ARROW_RED,ARROW_YELLOW,ARROW_BLUE,ARROW_GREEN];
  const colorArr = ['#00ffff','#00ff00',"#ff0101","#ffdd00","#00ffff","#00ff00"];
  for(let i=0;i<6;i++) {
    const m = new Three.MeshBasicMaterial({
      map: materialArr[i],
      side:Three.DoubleSide,//两面可见
      transparent: true
    })
    const mesh = new Three.Mesh(geometry,m);

    const material = new Three.ShaderMaterial({
      uniforms: {...relationShaderBar.uniforms, lightColor1:{value: new Three.Color(colorArr[i])},},
      vertexShader: relationShaderBar.vertexShader ,
      fragmentShader: relationShaderBar.fragmentShader,
      transparent: true,
      side: Three.DoubleSide
    });

    const planeMesh = new Three.Mesh(planGeometry,material);
    planeMesh.position.set(35,0,0);

    const flyGroup = new Three.Group();
    flyGroup.name="fly-group"
    flyGroup.add(planeMesh)
    flyGroup.add(mesh)

    flyGroup.rotateY(Math.PI/3*i)
    group.add(flyGroup)


  }

  const centerPlaneGeometry = new Three.PlaneBufferGeometry(20,20);
  centerPlaneGeometry.rotateX(Math.PI/2);

  const centerM = new Three.ShaderMaterial({
    uniforms: relationCenterShaderBar.uniforms,
    vertexShader: relationCenterShaderBar.vertexShader ,
    fragmentShader: relationCenterShaderBar.fragmentShader,
    transparent: true,
    side: Three.DoubleSide,
  });
  const centerPlane = new Three.Mesh(centerPlaneGeometry, centerM);
  centerPlane.position.set(0,8,0)
  group.add(centerPlane);


  group.position.set(-80,0,0)
}

const updatePlane = (scene) => {
  const uniforms = relationShaderBar.uniforms;
  if (uniforms && uniforms.radius) {
    if (uniforms.radius.value > 4 ) {
      if (uniforms.opacity.value <= 0 ) {
        uniforms.radius.value = 1;
        uniforms.opacity.value = 1
      } else {
        uniforms.opacity.value = uniforms.opacity.value  - 0.01;
        uniforms.radius.value = uniforms.radius.value + 0.01
      }
      
    } else {
      uniforms.radius.value = uniforms.radius.value + 0.01
    }  
  }

  const centerUniforms = relationCenterShaderBar.uniforms;

  if (centerUniforms && centerUniforms.radius) {
    if (centerUniforms.radius.value > 9 ) {
      if (centerUniforms.opacity.value <= 0 ) {
        centerUniforms.radius.value = 1;
        centerUniforms.opacity.value = 1
      } else {
        centerUniforms.opacity.value = centerUniforms.opacity.value  - 0.02;
        centerUniforms.radius.value = centerUniforms.radius.value + 0.02
      }
      
    } else {
      centerUniforms.radius.value = centerUniforms.radius.value + 0.03
    }  
  }

}

const genPathChart = (scene) => {  //路径图
  // const pathArr = [
  //   new Three.Vector3(0, 1, 0),
  //   new Three.Vector3(0.01, 1, 0),
  //   // new Three.Vector3(0.005, 1, -0.005),
  //   new Three.Vector3(5, 1, -5),
  //   new Three.Vector3(10, 1, 0),
  //   new Three.Vector3(15,1, -5),
  //   new Three.Vector3(20,1, 0)
  // ];


  

  // const path = new Three.CurvePath();
  // for (let i = 0; i < pathArr.length - 1; i++) {
  //   const lineCurve = new Three.LineCurve3(pathArr[i], pathArr[i + 1]); // 每两个点之间形成一条三维直线
  //   path.curves.push(lineCurve); // curvePath有一个curves属性，里面存放组成该三维路径的各个子路径
  // }

  // const geometry = new Three.TubeGeometry( path, 1000, 0.5,2);
  // // const lenArr = path.getCurveLengths();
  // // const len = lenArr[lenArr.length - 1];
  // // const texture = index > 0 ? textureObj.in : textureObj.out;
  // // texture.repeat.set(len/2,1);
  // const m1 = new Three.MeshBasicMaterial({
  //   map: LINE_TEXTURE_IN,
  //   // side:Three.DoubleSide,//两面可见
  //   transparent: true
  // })
  // const mesh = new Three.Mesh(geometry, m1);
  // scene.add(mesh);


  const curve = new Three.CubicBezierCurve3(
    new Three.Vector3( -10, 1,0 ),
    new Three.Vector3( -5, 1,15 ),
    new Three.Vector3( 20, 1,15 ),
    new Three.Vector3( 30,1, 0 )
  );

  const shape = new Three.Shape();

  shape.moveTo( -0.5, 0.5 );
  shape.lineTo( -0.5,-0.5);
  shape.lineTo( 0.5,-0.5);
  shape.lineTo( 0.5,0.5);
 
  const geometry = new Three.ExtrudeGeometry(shape, {
    steps : 30,
    bevelEnabled : false,
    extrudePath : curve
  });
  
  const mm1 = new Three.MeshBasicMaterial({
    map:ARROW_LEFT,
    side:Three.DoubleSide,//两面可见
    transparent: true
  })
  const mesh = new Three.Mesh(geometry,mm1);

 scene.add(mesh);




  // const curve = new Three.CubicBezierCurve3(
  //   new Three.Vector3( -10, 1,0 ),
  //   new Three.Vector3( -5, 1,15 ),
  //   new Three.Vector3( 20, 1,15 ),
  //   new Three.Vector3( 30,1, 0 )
  // );

  // const points = curve.getPoints(50);
  // console.log(points)
  // const points1=[];
  // const points2=[];

  // points.forEach((point)=> {
  //   points1.push(new Three.Vector3(point.x,point.y,point.z-0.5));
  //   points2.push(new Three.Vector3(point.x,point.y,point.z+0.5))
  // })

  // const shape = new Three.Shape();

  // points2.reverse();

  // const pointArr=[...points1,...points2];

  // shape.moveTo( -0.5, 0.01 );
  // shape.lineTo( -0.5,-0.01);

  // pointArr.forEach((point,index)=>{
  //   if (index===0) {
  //     shape.moveTo(point.x,point.z)
  //   } else {
  //     shape.lineTo(point.x,point.z);
  //   }
  // });

  // const geometry = new Three.ShapeGeometry( shape );
  // const m = new Three.MeshBasicMaterial({
  //   map: ARROW_BLUE,
  //   side:Three.DoubleSide,//两面可见
  //   // transparent: true
  // })
  // const mesh = new Three.Mesh(geometry,m);
  // mesh.rotateX(Math.PI/2)
  // scene.add(mesh)
}

const genAreaChart = (scene) => {
  const pointArr = [
    new Three.Vector2( 5, 1),
    new Three.Vector2( 10, 1),
    new Three.Vector2( 12, 2),
    new Three.Vector2( 12, 10),
    new Three.Vector2( 0, 10),
    new Three.Vector2( 0, 8),
    new Three.Vector2( 3, 6),
    new Three.Vector2( 3, 2),
    new Three.Vector2( 5, 1),
  ];

  const shape = new Three.Shape();
  pointArr.forEach((point,index)=>{
    if (index===0) {
      shape.moveTo(point.x,point.y)
    } else {
      shape.lineTo(point.x,point.y);
    }
  });

  // const geometry = new Three.ShapeGeometry( shape );
  const curve = new Three.LineCurve3(new Three.Vector3(0,0,0),new Three.Vector3(0,2,0))
  const geometry = new Three.ExtrudeGeometry(shape, {
    steps : 2,
    bevelEnabled : false,
    // extrudePath : curve
    depth:2
  });

  geometry.rotateX(Math.PI/2)

  console.log(geometry)

  // const m = new Three.MeshBasicMaterial({
  //   map: LINE_TEXTURE_IN,
  //   side:Three.DoubleSide,//两面可见
  //   transparent: true
  // })

  const m = new Three.ShaderMaterial({
    uniforms: areaShaderBar.uniforms,
    vertexShader: areaShaderBar.vertexShader ,
    fragmentShader: areaShaderBar.fragmentShader,
    transparent: true,
    side: Three.DoubleSide,
    // depthTest: true,
    // blending: Three.AdditiveBlending,
    // blendSrcAlpha: Three.OneFactor,
  });
  
  const mesh = new Three.Mesh(geometry,m);


  scene.add(mesh)



};

const loadModel = (scene) => {
  const loader = new GLTFLoader();
  loader.load(require("./model/hospital.glb").default,(gltf)=>{
    
    gltf.scene.scale.set(2,2,2)
    gltf.scene.name='model'
    gltf.scene.children.forEach((child)=>{
      if (child.name==='medical-tech-building') {
        const group = new Three.Group();
        group.name='medical-tech-building001';
        group.add(child.children.find((item)=>item.name==="medical-tech-building-mesh001_1"))
        group.add(child.children.find((item)=>item.name==="medical-tech-building-mesh001"))
        // group.position.set(0,1,0)
        // child.children[0].position.set(0,-1,0)
        child.add(group)
        // child.position.set(0,10,0)
        // child.children = [group,...child.children]
      } else if (child.name==='clinic-building') {
        const group = new Three.Group();
        group.name='clinic-building002';
        group.add(child.children.find((item)=>item.name==="clinic-building-mesh002"));
        group.add(child.children.find((item)=>item.name==="clinic-building-mesh002_1"));
        child.add(group)
      } else if (child.name==="inpatient-building") {
        const group = new Three.Group();
        group.name="inpatient-building001";
        group.add(child.children.find((item)=>item.name==="inpatient-building-mesh001"));
        group.add(child.children.find((item)=>item.name==="inpatient-building-mesh001_1"));
        child.add(group)
      }
    })
    console.log(gltf)
    scene.add(gltf.scene)
  })
};



const Chart = () => {
  const canvasRef = useRef(null);
  const statsRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const raycasterRef = useRef(new Three.Raycaster());

  useEffect(()=>{
    const {renderer, camera, scene, stats,orbitControls} = init(canvasRef.current, statsRef.current);

    cameraRef.current=camera;
    sceneRef.current=scene;

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

    genRelationChart(scene);
    // genPathChart(scene)
    genAreaChart(scene)
    // loadModel(scene)

  
    const update = () => {
      ARROW_GREEN.offset.x = ARROW_GREEN.offset.x-0.03
      ARROW_BLUE.offset.x = ARROW_BLUE.offset.x-0.03
      ARROW_RED.offset.x = ARROW_RED.offset.x-0.03
      ARROW_YELLOW.offset.x = ARROW_YELLOW.offset.x-0.03
      areaShaderBar.uniforms.time.value =  areaShaderBar.uniforms.time.value+0.01
      // LINE_TEXTURE_IN.offset.x = LINE_TEXTURE_IN.offset.x -0.01
      
      stats.update();
      orbitControls.update();
      updatePlane(scene);

      renderer.render(scene,camera);
      
      window.requestAnimationFrame(update);
    }
   
    update();

    window.addEventListener('resize', resizeHandle);
    return () => {
      window.removeEventListener('resize',resizeHandle)
    }
  },[]); 

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
      console.log(intersects[0].object)
     
    }

  }
  
 
  return(
    <>
      <div ref={statsRef}></div>
      <canvas onClick={clickCanvas} ref={canvasRef}></canvas>
    </>
  ) 
}

export default Chart;