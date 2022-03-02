import React, { useRef, useCallback, useEffect } from "react";
import * as dat from 'dat.gui';
import * as Three from "three";

class StringToNumberHelper {
  constructor(obj, prop) {
    this.obj = obj;
    this.prop = prop;
  }
  get value() {
    return this.obj[this.prop];
  }
  set value(v) {
    this.obj[this.prop] = parseFloat(v);
  }
};
const wrapModes = {
  'ClampToEdgeWrapping': Three.ClampToEdgeWrapping,
  'RepeatWrapping': Three.RepeatWrapping,
  'MirroredRepeatWrapping': Three.MirroredRepeatWrapping,
};

const HelloTexture = () => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const textureRef = useRef(null);
  const init = useCallback(()=>{
    if (!canvasRef.current) {
      return;
    }
    //创建渲染器
    rendererRef.current = new Three.WebGLRenderer({canvas: canvasRef.current});
    //创建镜头
    const fov = 75;
    const aspect = 2;  // canvas 默认
    const near = 0.1;
    const far = 100;
    const camera = new Three.PerspectiveCamera(fov,aspect,near,far);
    camera.position.set(0,0,3);
    cameraRef.current = camera;
    //创建场景
    const scene = new Three.Scene()
    scene.background = new Three.Color(0x111111)
    sceneRef.current = scene;
  },[canvasRef]);
  //纹理加载时异步的 如果没有所动画 首次渲染时看不见纹理的  需要在纹理加载成功之后再渲染
  const loaderTexture = useCallback(async()=>{
    //创建纹理加载器
    const loader = new Three.TextureLoader();
    return new Promise((resolve)=>{
      loader.load('https://threejsfundamentals.org/threejs/resources/images/wall.jpg', resolve);
    })
  }, []);
  const loadMoreTexture = useCallback(()=>{
    // 要等到所有纹理都加载完毕，可以使用 LoadingManager 。创建一个并将其传递给 TextureLoader，然后将其onLoad属性设置为回调
    const loadManager = new Three.LoadingManager();
    const loader = new Three.TextureLoader(loadManager);
    const textureArr = [1,2,3,4,5,6].map((item)=>{
      return loader.load(`https://threejsfundamentals.org/threejs/resources/images/flower-${item}.jpg`)
    })
    return new Promise((resolve)=>{
      loadManager.onLoad = resolve(textureArr);
    })
  }, []);
  const creatAdd = useCallback(async ()=>{
    const cube = new Three.BoxBufferGeometry(1,1,1)
    //创建纹理加载器
    // const loader = new Three.TextureLoader();
    // const material = new Three.MeshBasicMaterial({map: loader.load('https://threejsfundamentals.org/threejs/resources/images/wall.jpg')})
    textureRef.current = await loaderTexture()
    const material = new Three.MeshBasicMaterial({map: textureRef.current});
    const mesh = new Three.Mesh(cube, material);
    mesh.position.x = -1;
    sceneRef.current.add(mesh);
    const textureArr = await loadMoreTexture();
    const materialArr = textureArr.map((texture)=>new Three.MeshBasicMaterial({map: texture}));
    const meshNew = new Three.Mesh(cube, materialArr);
    meshNew.position.x = 1;
    sceneRef.current.add(meshNew);
   
    // rendererRef.current.render(sceneRef.current, cameraRef.current);
  },[]);
  const updateTexture = useCallback(()=>{
    textureRef.current.needsUpdate = true;
  },[]);
  const addDatGui = useCallback(()=>{
    const gui = new dat.GUI();
    //改变了纹理上的 wrapS 或 wrapT，必须设置 texture.needsUpdate
    gui.add(new StringToNumberHelper(textureRef.current, 'wrapS'), 'value', wrapModes)
    .name('texture.wrapS')
    .onChange(updateTexture);
    gui.add(new StringToNumberHelper(textureRef.current, 'wrapT'), 'value', wrapModes)
    .name('texture.wrapT')
    .onChange(updateTexture);
    gui.add(textureRef.current.repeat, 'x', 0, 5, .01).name('texture.repeat.x');
    gui.add(textureRef.current.repeat, 'y', 0, 5, .01).name('texture.repeat.y');
    gui.add(textureRef.current.offset, 'x', -2, 2, .01).name('texture.offset.x');
    gui.add(textureRef.current.offset, 'y', -2, 2, .01).name('texture.offset.y');
    gui.add(textureRef.current.center, 'x', -.5, 1.5, .01).name('texture.center.x');
    gui.add(textureRef.current.center, 'y', -.5, 1.5, .01).name('texture.center.y');

  },[]);
  const resizeHandle = useCallback(() => {
    //根据窗口大小变化，重新修改渲染器的视椎
    if (rendererRef.current === null || cameraRef.current === null) {
      return;
    }
    const canvas = rendererRef.current.domElement
    cameraRef.current.aspect = canvas.clientWidth / canvas.clientHeight
    cameraRef.current.updateProjectionMatrix()
    rendererRef.current.setSize(canvas.clientWidth, canvas.clientHeight, false)
  }, [rendererRef,cameraRef]);
  const renderFun = useCallback((time)=>{
    time = time * 0.001
    sceneRef.current.children.forEach((node)=>{
      node.rotation.x = time
      node.rotation.y = time
    })
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    window.requestAnimationFrame(renderFun);
  }, [])
  useEffect(async ()=>{
    //不要轻易增删纹理
    init();
    resizeHandle();
    await creatAdd();
    addDatGui();
    window.requestAnimationFrame(renderFun);
    

    window.addEventListener('resize', resizeHandle);
    return ()=>{
      window.removeEventListener('resize', resizeHandle)
    }
  },[])
  return(
    <canvas ref={canvasRef}></canvas>
  )
}

export default HelloTexture;