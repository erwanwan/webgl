import * as Three from "three";

export const genAirWind = (ARROW_RED, ARROW_GREEN) => {
  const points = [
    new Three.Vector2(8,64),
    new Three.Vector2(8,0),
  ];
  const geometryBottom = new Three.LatheGeometry(points,30, 0, Math.PI/18*5);

  const material=new Three.MeshPhongMaterial({
      map: ARROW_GREEN,
      side:Three.DoubleSide,//两面可见
      transparent: true
  });//材质对象

  const windBottom=new Three.Mesh(geometryBottom,material);//旋转网格模型对象
  windBottom.rotateZ(Math.PI/2)
  windBottom.rotateY(Math.PI/6)

  windBottom.position.z = 1.5
  windBottom.position.y = -4
  windBottom.position.x = 32


  const points1 = [
    new Three.Vector2(15,64),
    new Three.Vector2(15,0),
  ];
  const geometryTop = new Three.LatheGeometry(points1,30, 0, Math.PI/3);


  const material1=new Three.MeshPhongMaterial({
    map: ARROW_RED,
    side:Three.DoubleSide,//两面可见
    transparent: true
  });//材质对象
 
  const windTop=new Three.Mesh(geometryTop,material1);//旋转网格模型对象
  windTop.rotateZ(Math.PI/2);
  windTop.rotateY(Math.PI /18*21);

  windTop.position.y = 25
  windTop.position.z = -2
  windTop.position.x = 32

  return { windTop, windBottom }

}