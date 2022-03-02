import React, { useRef, useCallback, useEffect } from "react";
import * as Three from 'three';
import "./index.less";
import { createText, myBox, myCircle, myCone, myCylinder, myDodecahedron, myExtrude, myIcosahedron, myLathe, myOctahedron, myParametric, myPlane, myPolyhedron, myRing, myShape, mySphere, myTetrahedron, myTorus, myTorusKnot, myTube, myEdges, myWireframe } from "./geometry";


const HelloPrimitives = () => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);



  const createInit = useCallback(async()=>{
    if (!canvasRef.current) {
      return;
    }
    //初始化场景
    const scene = new Three.Scene()
    scene.background = new Three.Color(0xAAAAAA);

    //初始化镜头
    const fov = 40;
    const aspect = 2;  // canvas 默认
    const near = 0.1;
    const far = 1000;
    const camera = new Three.PerspectiveCamera(fov, aspect, near, far);  
    camera.position.z = 120
    cameraRef.current = camera;

    //初始化渲染器
    const renderer = new Three.WebGLRenderer({canvas: canvasRef.current});
    rendererRef.current = renderer;

    //创建灯光
    const color = 0xFFFFFF;
    const intensity = 1;
    const light1 = new Three.DirectionalLight(color, intensity);
    light1.position.set(-1, 2, 4);
    scene.add(light1);

    const light2 = new Three.DirectionalLight(0xFFFFFF, 1)
    light2.position.set(1, -2, -4)
    scene.add(light2);

    //将各个 solid 类型的图元实例转化为网格，并添加到 meshArr 中
    const meshArr = [];

    const solidPrimitivesArr = [myBox, myCircle, myCone, myCylinder, myDodecahedron, myExtrude, myIcosahedron, myLathe, myOctahedron, myParametric, myPlane, myPolyhedron, myRing, myShape, mySphere, myTetrahedron, myTorus, myTorusKnot, myTube];
    solidPrimitivesArr.forEach((item, index)=>{
      const material = new Three.MeshPhongMaterial({side: Three.DoubleSide,});   
      const hue = Math.random();
      const saturation = 1;
      const luminance = .5;
      material.color.setHSL(hue, saturation, luminance);
      const mesh = new Three.Mesh(item, material);
      meshArr.push(mesh);
    });
    meshArr.push(await createText());
    console.log(222)

    //将各个 line 类型的图元实例转化为网格
    const linePrimitivesArr = [ myEdges, myWireframe];
    linePrimitivesArr.forEach((item)=>{
      const material = new Three.LineBasicMaterial({ color: 0x000000 })
      const mesh = new Three.LineSegments(item, material);
      meshArr.push(mesh);
    })

    //为每个图元添加位置并添加到场景中

    //定义物体在画面中显示的网格布局
    const eachRow = 5 //每一行显示 5 个
    const spread = 15 //行高 和 列宽
    
    meshArr.forEach((item,index)=>{
      const row = Math.floor(index / eachRow); //计算出所在行
      const column = index % eachRow; //计算出所在列
      item.position.x = (column - 2) * spread; //我们希望将每一行物体摆放的单元格，依次是：-2、-1、0、1、2，这样可以使每一整行物体处于居中显示 所以要-2
      item.position.y = (2-row) * spread;
      scene.add(item);
    });

    //添加自动旋转渲染动画
    const render = (time) => {
      time = time * 0.001
      meshArr.forEach(item => {
        item.rotation.x = time
        item.rotation.y = time
      })
      rendererRef.current.render(scene, camera)
      window.requestAnimationFrame(render)
    };

    window.requestAnimationFrame(render);


  }, [canvasRef]);

  const resizeHandle = () => {
    //根据窗口大小变化，重新修改渲染器的视椎
    if (rendererRef.current === null || cameraRef.current === null) {
        return
    }

    const canvas = rendererRef.current.domElement
    cameraRef.current.aspect = canvas.clientWidth / canvas.clientHeight
    cameraRef.current.updateProjectionMatrix()
    rendererRef.current.setSize(canvas.clientWidth, canvas.clientHeight, false)
  }

  useEffect(()=>{
    createInit();
    resizeHandle();
    window.addEventListener('resize', resizeHandle);
    return ()=>{
      window.removeEventListener('resize', resizeHandle)
    }
  },[createInit]);



  return (
    <canvas ref={canvasRef}></canvas>
  )
};

export default HelloPrimitives;