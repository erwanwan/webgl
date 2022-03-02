import React, {useCallback, useEffect, useRef} from "react";
import * as Three from "three";
import { sunMesh, earthMesh,moonMesh,  pointLight, solarSystem, earthOrbit } from "./create-something";
import '../../index.less';

const HelloScene = () => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);

  const init = useCallback(()=>{
    if (!canvasRef.current) {
      return;
    }
    //创建渲染器
    rendererRef.current = new Three.WebGLRenderer({canvas: canvasRef.current});
    //创建镜头
    const fov = 40;
    const aspect = 2;  // canvas 默认
    const near = 0.1;
    const far = 1000;
    const camera = new Three.PerspectiveCamera(fov,aspect,near,far);
    camera.position.set(0,50,0);
    camera.up.set(0,0,1);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    //创建场景
    const scene = new Three.Scene()
    scene.background = new Three.Color(0x111111)
    sceneRef.current = scene;
  },[canvasRef]);
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
  const add = useCallback(()=>{
    [solarSystem,earthOrbit, moonMesh].forEach((node)=>{
      const axes = new Three.AxesHelper();
      axes.material.depthTest = false;
      axes.renderOrder = 1;
      node.add(axes);
    })
    sceneRef.current.add(solarSystem);
  }, [sceneRef]);
  const renderFun = useCallback((time) => {
    [earthMesh,sunMesh,solarSystem,moonMesh,earthOrbit].forEach((node)=>{
      node.rotation.y = time/1000;    
    })
    rendererRef.current.render(sceneRef.current,cameraRef.current);
    window.requestAnimationFrame(renderFun);
  },[sceneRef]);
  useEffect(()=>{
    init();
    resizeHandle();
    add();
    sceneRef.current.add(pointLight)
    window.requestAnimationFrame(renderFun);
    

    window.addEventListener('resize', resizeHandle);
    return ()=>{
      window.removeEventListener('resize', resizeHandle)
    }
  },[init,resizeHandle])
  return (
    <canvas ref={canvasRef}></canvas>
  )
}

export default HelloScene;