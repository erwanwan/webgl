import { useEffect } from 'react';
import * as THREE from 'three';
// import { GUI } from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'

const HelloLayers = () => {
  useEffect(()=>{
    const el =  document.getElementById('box')
    function initThree(elid,options) {
      let  scene,camera ,renderer,viewer
      viewer={}
     
      const  width = el.offsetWidth, height = el.offsetHeight,asp =  width / height
      renderer = new THREE.WebGLRenderer({canvas: el,antialias: true});
      renderer.setSize(width, height);
      // el.appendChild(renderer.domElement);
      renderer.setClearColor('#000')

      scene = new THREE.Scene()
      // scene.background = new THREE.Color(0x222222);
      const loader = new THREE.CubeTextureLoader();
      const texture = loader.load([
        // require("./assets/sky-px.bmp").default,
        // require("./assets/sky-nx.bmp").default,
        // require("./assets/sky-py.png").default,
        // require("./assets/sky-ny.png").default,
        // require("./assets/sky-pz.bmp").default,
        // require("./assets/sky-nz.bmp").default,
        'https://threejs.org/examples/textures/cube/SwedishRoyalCastle/px.jpg',
        'https://threejs.org/examples/textures/cube/SwedishRoyalCastle/nx.jpg',
        'https://threejs.org/examples/textures/cube/SwedishRoyalCastle/py.jpg',
        'https://threejs.org/examples/textures/cube/SwedishRoyalCastle/ny.jpg',
        'https://threejs.org/examples/textures/cube/SwedishRoyalCastle/pz.jpg',
        'https://threejs.org/examples/textures/cube/SwedishRoyalCastle/nz.jpg'
      ]);
      texture.mapping = THREE.CubeRefractionMapping;
      scene.background = texture;


      // camera = new THREE.PerspectiveCamera(45, asp, 1, 10000)
      // camera.position.set(10,10,10)
      // camera.lookAt(0,0,0)
      // scene.add(camera)

      camera = new THREE.PerspectiveCamera(25, 2, 1, 1000);
      camera.position.set(40,10,0);

      viewer.scene=scene
      viewer.camera=camera
      viewer.renderer=renderer
      const controls = new OrbitControls( camera, renderer.domElement );
      // 如果使用animate方法时，将此函数删除
      controls.addEventListener( 'change', ()=>{
          renderer.render( scene, camera );
      });
      viewer.controls=controls
      // renderer.render( scene, camera );
  
      return viewer
  }

  let app=new initThree('box')
let scene=app.scene
let renderer=app.renderer
let camera=app.camera
let controls=app.controls
// const clock = new THREE.Clock()


const group1 = new THREE.Group()
group1.layers.set(1)
const group2 =  new THREE.Group()

scene.add(group1,group2)

//add light
const directionalLight = new THREE.DirectionalLight( '#fff' )
directionalLight.position.set( 30, 30, 30 ).normalize()
scene.add( directionalLight )
const ambientLight = new THREE.AmbientLight('#fff',0.3) // obj 唯一 id
scene.add(ambientLight)


// add status
/*  **** **** ****   ****/
// renderer.toneMapping = THREE.ReinhardToneMapping;

const box = new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'red'}))
group1.add(box)
//如果是如果 需要 深度遍历 设置layers
group1.traverse(e => {
e.layers.set(1)
})
const  geometry = new THREE.IcosahedronBufferGeometry( 1, 4 );
for ( let i = 0; i < 10; i ++ ) {
const  color = new THREE.Color();
color.setHSL( Math.random(), 0.7, Math.random() * 0.2 + 0.05 );

const material = new THREE.MeshBasicMaterial( { color: color } );
const sphere = new THREE.Mesh( geometry, material );
sphere.position.x = Math.random() * 10 - 5;
sphere.position.y = Math.random() * 10 - 5;
sphere.position.z = Math.random() * 10 - 5;
// sphere.position.normalize().multiplyScalar( Math.random() * 4.0 + 2.0 );
// sphere.scale.setScalar( Math.random() * Math.random() + 0.5 );
group2.add( sphere );

// if ( Math.random() < 0.25 ) sphere.layers.enable( 2 ); // set layer

}

//创建 RenderPass
const renderScene = new RenderPass( scene, camera )

//创建 bloomPass
const  bloomPass = new UnrealBloomPass( new THREE.Vector2( el.offsetWidth, el.offsetHeight  ), 1.5, 0.4, 0.85 );
// bloomPass.renderToScreen = true;
bloomPass.renderToScreen = true;
bloomPass.threshold = 0;
bloomPass.strength = 5;
bloomPass.radius = 0;

//创建 EffectComposer
const  bloomComposer = new EffectComposer( renderer )
bloomComposer.setSize( el.offsetWidth,  el.offsetHeight );
bloomComposer.addPass( renderScene );
// 眩光通道bloomPass插入到composer
bloomComposer.addPass( bloomPass )

// bloomComposer.render()

//set controls
// controls.addEventListener( 'change', function () {
//     bloomComposer.render()
// } )
// controls.autoRotate = false

//when window resize
renderer.autoClear = false //这个一定要加上 !!!!!!!
function render() {
//render layer0 boom
renderer.clear()
camera.layers.set(0)
bloomComposer.render()

//render layer1 normal
renderer.clearDepth()
camera.layers.set(1)
renderer.render(scene,camera)

// controls.update(clock.getDelta())
requestAnimationFrame(render)

}
render();



})




  return (<canvas id="box" style={{idth: '100%', height: '100vh'}}></canvas>)
}

export default HelloLayers;