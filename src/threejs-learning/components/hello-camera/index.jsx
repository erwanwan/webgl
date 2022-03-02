import { useEffect, useRef } from "react";
import * as Three from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper'
// import { CameraHelper } from "three";
import "./index.less";
import { render } from "@testing-library/react";

// const lightTypes = ['AmbientLight', 'AmbientLightProbe', 'DirectionalLight','HemisphereLight', 'HemisphereLightProbe', 'PointLight','RectAreaLight', 'SpotLight']

const HelloCamera = () => {
  const canvasRef = useRef(null);
  const leftViewRef = useRef(null);
  const rightViewRef = useRef(null);
  const rendererRef = useRef(null);
  const leftCameraRef = useRef(null);
  const rightCameraRef = useRef(null);
  const sceneRef = useRef(null);
  const textureRef = useRef(null);
  const cameraHelperRef = useRef(null);
  // const [lightType, setLightType] = useState(lightTypes[0])
  const init = ()=>{
    if (!canvasRef.current) {
      return;
    }
    //创建一个渲染器
    rendererRef.current = new Three.WebGLRenderer({canvas: canvasRef.current});

    //创建镜头
    const leftCamera = new Three.PerspectiveCamera(45,2,5,100);
    leftCamera.position.set(0, 10, 20);
    leftCameraRef.current = leftCamera;
    const cameraHelper = new Three.CameraHelper(leftCamera);
    cameraHelperRef.current = cameraHelper;
    // OrbitControls 一个是要控制的相机对象，第二个是检测事件的 DOM 元素
    const leftOrbitControls = new OrbitControls(leftCamera, leftViewRef.current);
    //设置OrbitControls观察点的位置
    leftOrbitControls.target.set(0, 5, 0);
    //设置完需要调用一下 controls.update，这样才真正更新观察点位置
    leftOrbitControls.update();

    const rightCamera = new Three.PerspectiveCamera(50,2,0.1,500);
    rightCamera.position.set(40,10,30);
    rightCameraRef.current = rightCamera
    //没有添加OrbitControls的话，设置camera.lookAt()是有效的。添加了控件则相机的lookAt()失效，所以如果想让相机的聚焦点改变的话，就需要改变OrbitControls的target属性
    const rightOrbitControls = new OrbitControls(rightCamera, rightViewRef.current);
    rightOrbitControls.target.set(0,5,0);
    rightOrbitControls.update();

    //创建场景
    const scene = new Three.Scene();
    scene.background = new Three.Color(0x111111);
    scene.add(cameraHelper);
    sceneRef.current = scene;
  };
  const loaderTexture = async()=>{
    //创建纹理加载器
    const loader = new Three.TextureLoader();
    return new Promise((resolve)=>{
      loader.load(require('../../../images/floor-textture.png').default, resolve);
    })
  };
  const createPlane = async (type)=>{
    const planeSize = 60
    const plane = new Three.PlaneBufferGeometry(planeSize,planeSize);
    if (!textureRef.current) {
      const texture = await loaderTexture();
      texture.wrapS = Three.RepeatWrapping;
      texture.wrapT = Three.RepeatWrapping;
      texture.magFilter = Three.NearestFilter;
      texture.repeat.set(planeSize/2, planeSize/2);
      textureRef.current = texture;
    }
    
    const material = type === 'RectAreaLight' ? new Three.MeshStandardMaterial({
      map: textureRef.current,
      side: Three.DoubleSide
    }) : new Three.MeshPhongMaterial({
      map: textureRef.current,
      side: Three.DoubleSide
    });
    const mesh = new Three.Mesh(plane, material);
    mesh.rotation.x = Math.PI/2;
    sceneRef.current.add(mesh);
  };
  const resizeHandle = () => {
    //根据窗口大小变化，重新修改渲染器的视椎
    if (rendererRef.current === null) {
      return;
    }
    const canvas = rendererRef.current.domElement
    // cameraRef.current.aspect = canvas.clientWidth / canvas.clientHeight
    // cameraRef.current.updateProjectionMatrix()
    rendererRef.current.setSize(canvas.clientWidth, canvas.clientHeight, false)
  };
  const addLight = (type)=>{
    const color = 0xFFFFFF;
    const intensity = 1;
    if (type === 'DirectionalLight') {
      const light = new Three.DirectionalLight(color, intensity);
      light.position.set(0, 10, 0);
      light.target.position.set(-5,0,0);
      sceneRef.current.add(light);
      sceneRef.current.add(light.target);

      // const helper = new Three.DirectionalLightHelper(light);
      // sceneRef.current.add(helper);
      return;
    }
    if (type === 'HemisphereLight' || type === 'HemisphereLightProbe') {
      const skyColor = 0xB1E1FF;  // light blue
      const groundColor = 0xB97A20;  // brownish orange
      const intensity = 1;
      //颜色是从天空到地面两个颜色之间的渐变
      const light = new Three[type](skyColor, groundColor, intensity);
      sceneRef.current.add(light);
      if (type === 'HemisphereLight') {
        const helper = new Three.HemisphereLightHelper(light, 5) //light:被模拟的半球形光源 sphereSize: 用于模拟光源的网格尺寸, color:(可选的) 如果没有赋值辅助对象将使用光源的颜色
        sceneRef.current.add(helper);
      } 
      return;
    }

    if (type === 'PointLight') {
      //PointLight还有distance属性。 如果 distance 设为 0，则光线可以照射到无限远处。如果大于 0，则只可以照射到指定的范围，光照强度在这个过程中逐渐衰减
      const light = new Three.PointLight(color, intensity);
      light.position.set(0,10,0);
      sceneRef.current.add(light);

      const helper = new Three.PointLightHelper(light) //light:要模拟的光源, sphereSize: (可选的) 球形辅助对象的尺寸. 默认为 1, color:(可选的) 如果没有赋值辅助对象将使用光源的颜色
      sceneRef.current.add(helper);
      return;
    }

    if (type === 'SpotLight') {
      //SpotLight类似方向光（DirectionalLight）一样需要一个目标点，光源的位置是圆锥的顶点，目标点处于圆锥的中轴线上。
      const light = new Three.SpotLight(color,intensity);
      light.position.set(0,10,0);
      light.target.position.set(-5,0,0);
      sceneRef.current.add(light);
      sceneRef.current.add(light.target);

      const helper = new Three.SpotLightHelper(light);  //light:要模拟的光源,color:(可选的) 如果没有赋值辅助对象将使用光源的颜色
      sceneRef.current.add(helper);
      return;
    }

    if (type === 'RectAreaLight') {  //RectAreaLight 只能影响 MeshStandardMaterial 和 MeshPhysicalMaterial
      RectAreaLightUniformsLib.init();
      const light = new Three.RectAreaLight(color,intensity, 12,4); //color, intensity, width, height
      light.position.set(0, 10, 0);
      //矩形光不是使用目标点（target），而是使用自身的旋转角度来确定光照方向
      light.rotation.x = Three.MathUtils.degToRad(-90);
      sceneRef.current.add(light);

      const helper = new RectAreaLightHelper(light); //light -- 被模拟的光源.  color -- (可选) 如果没有赋值辅助对象将使用光源的颜色.
      sceneRef.current.add(helper);
      return;
    }
  
    const light = new Three[type](color, intensity)
    sceneRef.current.add(light);
  };
  const drawObject = (type)=>{
    const cube = new Three.BoxBufferGeometry(4,4,4);
    const cubeMaterial = type === 'RectAreaLight' ? new Three.MeshStandardMaterial({color: '#8AC'}) : new Three.MeshPhongMaterial({color: '#8AC'});
    const cubeMesh = new Three.Mesh(cube, cubeMaterial);
    cubeMesh.position.set(5, 2, 0)
    sceneRef.current.add(cubeMesh);

    const sphere = new Three.SphereBufferGeometry(3,32,16);
    const sphereMaterial = type === 'RectAreaLight' ? new Three.MeshStandardMaterial({color: '#8AC'}) : new Three.MeshPhongMaterial({ color: '#8AC' });
    const sphereMesh = new Three.Mesh(sphere, sphereMaterial);
    sphereMesh.position.set(-4,5,0)
    sceneRef.current.add(sphereMesh);
  };
  const setScissorForElement = (ele) => {
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const eleRect = ele.getBoundingClientRect();

    //计算绘制区域距离canvas左边和上边的距离
    const left = Math.max(0,eleRect.left - canvasRect.left);
    const right = Math.min(eleRect.right, canvasRect.right) - canvasRect.left;
    const top = Math.max(0, eleRect.top-canvasRect.top);
    const bottom = Math.min(eleRect.bottom, canvasRect.bottom) - canvasRect.top
   
    const width = Math.min(canvasRect.width, right - left);
    const height = Math.min(canvasRect.height, bottom - top);

    const positiveYUpBottom = canvasRect.height - bottom;

    rendererRef.current.setScissor(left, positiveYUpBottom, width, height);  //将剪裁区域设为(x, y)到(x + width, y + height)  第二个参数可能表达式我认为是绘制去底部距离canvas的底部的距离
    rendererRef.current.setViewport(left, positiveYUpBottom, width, height);

    return width/height;

  };

  const renderFun = (time)=>{
    // 启用或禁用剪裁检测. 若启用，则只有在所定义的裁剪区域内的像素才会受之后的渲染器影响
    rendererRef.current.setScissorTest(true);

    //绘制左侧内容
    const leftAspect = setScissorForElement(leftViewRef.current);
    leftCameraRef.current.aspect = leftAspect;
    leftCameraRef.current.updateProjectionMatrix();
    cameraHelperRef.current.update();
    cameraHelperRef.current.visible = false;
    sceneRef.current.background.set(0x000000);
    rendererRef.current.render(sceneRef.current, leftCameraRef.current);

    //绘制右侧区域
    const rightAspect = setScissorForElement(rightViewRef.current);
    rightCameraRef.current.aspect = rightAspect;
    rightCameraRef.current.updateProjectionMatrix();
    cameraHelperRef.current.visible = true;
    sceneRef.current.background.set(0x000040);
    rendererRef.current.render(sceneRef.current, rightCameraRef.current);


    // rendererRef.current.render(sceneRef.current, leftCameraRef.current);
    window.requestAnimationFrame(renderFun);
  };

  useEffect(()=>{
    init();
    resizeHandle();
    createPlane('DirectionalLight');
    addLight('DirectionalLight');
    drawObject('DirectionalLight');
    window.requestAnimationFrame(renderFun);
    window.addEventListener('resize', resizeHandle)
    return ()=>{
      window.removeEventListener('resize', resizeHandle)
    }
  }, []);
  // useEffect(()=>{
  //   const light = sceneRef.current.children.find((node)=>lightTypes.indexOf(node.type)>-1 || node.type==='Light');
  //   if (!light) {
  //     addLight(lightType);
  //     return;
  //   }
  //   if ( light && light.type === lightType) {
  //     return;
  //   }
  //   sceneRef.current.remove(light); //light没有dispose方法，所以直接remove就好
  //   //有的灯光添加了helper也需要清除掉
  //   const helperArr = sceneRef.current.children.filter((node)=> node.type==="Object3D" || node.type==='PointLightHelper' || node.type==='RectAreaLightHelper');
  //   if (helperArr.length) {
  //     helperArr.forEach((item)=>{
  //       item.material && item.material.dispose();
  //       item.dispose&&item.dispose();
  //       sceneRef.current.remove(item);
  //     })
  //   }
    

  //   addLight(lightType);
  //   if (lightType === 'RectAreaLight') {
  //     const objectArr = sceneRef.current.children.filter((node)=> node.type==='Mesh');
  //     objectArr.forEach((item)=>{
  //       // item.material.map && item.material.map.dispose();  //销毁texture
  //       item.material.dispose();
  //       item.geometry.dispose();
  //       sceneRef.current.remove(item);
  //     });
  //     createPlane(lightType);
  //     drawObject(lightType);
  //   }

  //   //不要再traverse中调用remove方法, 不要用forEach遍历父级的children去remove和dispose，这种类似于forEach时候去splice，在你remove中父级的孩子就会跟着remove导致children变化
  //   // sceneRef.current.traverse((node)=>{
  //   //   if (lightTypes.indexOf(node.type)>-1 && node.type!==lightType) {
  //   //     light = node
  //   //   }
  //   // })
  //   // console.log(sceneRef.current);
    
  // },[lightType]);
  // const setType = (label) => {
  //   setLightType(label);
  // }

  return(
    <>
      <div className='split'>
        <div ref={leftViewRef}></div>
        <div ref={rightViewRef}></div>
      </div>
      <canvas ref={canvasRef}></canvas>
    </>
  )
}

export default HelloCamera;