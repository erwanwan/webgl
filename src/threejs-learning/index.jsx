import React, { useEffect, useRef } from "react";
import * as Three from 'three/build/three.module';
import "./index.less";

const ThreeLearning = () => {
  const canvasRef = useRef(null);
  useEffect(()=>{
    //先获取canvas然后传给Three.js
   
    // const canvas = document.querySelector('#canvas');
    const renderer = new Three.WebGLRenderer({canvas: canvasRef.current});

    const fov = 75;  //视野范围(field of view)的缩写。指垂直方向为75度 Three.js中大多数的角用弧度表示，但是因为某些原因透视摄像机使用角度表示
    const aspect = 2;  // 相机默认值   画布的宽高比  画布是300x150像素，所以宽高比为300/150或者说2
    const near = 0.1;    //近平面  默认值为 0.1，  近平面，限制摄像机可绘制最近的距离，若小于该距离则不会绘制(相当于被裁切掉)
    const far = 5;  //远平面  限制摄像机可绘制最远的距离，若超出该距离则不会绘制(相当于被裁切掉)
    const camera = new Three.PerspectiveCamera(fov, aspect, near, far);  
    //摄像机默认指向Z轴负方向
    camera.position.z = 2;
    //创建一个场景
    const scene = new Three.Scene();

    //创建光源

    //先创建一盏平行光。
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new Three.DirectionalLight(color, intensity);
    //平行光有一个位置和目标点。默认值都为(0, 0, 0)。我们这里 将灯光的位置设为(-1, 2, 4)，让它位于摄像机前面稍微左上方一点的地方。目标点还是(0, 0, 0)，让它朝向坐标原点方向
    light.position.set(-1, 2, 4);
    scene.add(light);

    //创建一个包含盒子信息的立方几何体(BoxGeometry)
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new Three.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // 创建一个基本的材质并设置它的颜色. 颜色的值可以用css方式和十六进制来表示
    //MeshBasicMaterial材质不会受到灯光的影响。我们将他改成会受灯光影响的MeshPhongMaterial材质
    // const material = new Three.MeshBasicMaterial({color: 0x44aa88});
    // const material = new Three.MeshPhongMaterial({color: 0x44aa88});  // 绿蓝色

    //再创建一个网格(Mesh)对象，它包含了：
    //几何体(Geometry)(物体的形状)
    //材质(Material)(如何绘制物体，光滑还是平整，什么颜色，什么贴图等等)
    // const cube = new Three.Mesh(geometry, material);

    //网格：一种特定的 几何体和材质 绘制出的一个特定的几何体系。
    //网格包含的内容为：几何体、几何体的材质、几何体的自身网格坐标体系
    //在 Three.js 中，要牢记以下几个概念：

    //一个几何体或材质，可以同时被多个网格使用(引用)
    //一个场景内，可以添加多个网格
    // 所以在创建多个立方体的时候， 我们创建一个根据指定的颜色生成新材质的函数。它会根据指定的几何体生成对应网格，然后将网格添加进场景并设置其X轴的位置
    const makeInstance = (geometry, color, x) => {
      const material = new Three.MeshPhongMaterial({color});   
      const cube = new Three.Mesh(geometry, material);
      scene.add(cube);
     
      cube.position.x = x;
     
      return cube;
    }

    const cubes = [
      makeInstance(geometry, 0x44aa88,  0),
      makeInstance(geometry, 0x8844aa, -2),
      makeInstance(geometry, 0xaa8844,  2),
    ];



    //将网格添加到场景中
    // scene.add(cube);

    //将场景和摄像机传递给渲染器来渲染出整个场景
    // renderer.render(scene, camera);


    //canvas元素有两个尺寸。一个是canvas在页面上的显示尺寸， 是我们用CSS来设置的。另一个尺寸是canvas本身像素的数量
    //通常被叫做绘图缓冲区(drawingbuffer)尺寸。 在three.js中我们可以通过调用renderer.setSize来设置canvas的绘图缓冲区
    //写一个函数来检查渲染器的canvas尺寸是不是和canvas的显示尺寸不一样 如果不一样就设置它
     const resizeRendererToDisplaySize = () => {
      const canvas = renderer.domElement;
      const {height,width,clientWidth,clientHeight} = canvas;  //width,height是canvas的分辨率，clientWidth、clientHeight是canvas的css的样式
      const needResize = height !== clientHeight || width !==clientWidth
      //调整画布大小是canvas规范的一个有趣部分，如果它已经是我们想要的大小，最好不要设置相同的大小
      if(needResize){
        renderer.setSize(clientWidth, clientHeight, false);  //render.setSize默认会设置canvas的CSS尺寸但这并不是我们想要的，所以需要最后一个参数设置为false
        const canvas = renderer.domElement;  //获取canvas
        camera.aspect = canvas.clientWidth / canvas.clientHeight;   //为了解决图像的变形的问题。为此我们要将相机的宽高比设置为canvas的宽高比设置镜头宽高比
        camera.updateProjectionMatrix() //通知镜头更新视椎(视野)
      }
      return needResize;
     }
    //添加自动旋转渲染动画
    function render(time) {
      time *= 0.001;  // 将时间单位变为秒

      // if (resizeRendererToDisplaySize(renderer)) {  //只有canvas的显示尺寸变化时宽高比才变化所以 只在resizeRendererToDisplaySize函数返回true时才设置摄像机的宽高比
      //   const canvas = renderer.domElement;  //获取canvas
      //   camera.aspect = canvas.clientWidth / canvas.clientHeight;   //为了解决图像的变形的问题。为此我们要将相机的宽高比设置为canvas的宽高比设置镜头宽高比
      //   camera.updateProjectionMatrix() //通知镜头更新视椎(视野)
      // }
      

      cubes.forEach((cube, index)=>{
        const speed = 1 + index * .1;
        const rot = time * speed;
        cube.rotation.x = rot;
        cube.rotation.y = rot;
      })
      renderer.render(scene, camera);
     
      requestAnimationFrame(render);
    }
    resizeRendererToDisplaySize();
    requestAnimationFrame(render);
    window.addEventListener('resize', resizeRendererToDisplaySize);

    return () => {
      if (resizeRendererToDisplaySize) {
          window.removeEventListener('resize', resizeRendererToDisplaySize)
      }
    }

  },[canvasRef]);

  return (
    <canvas ref={canvasRef} className="canvas"></canvas>
  )
}

export default ThreeLearning;