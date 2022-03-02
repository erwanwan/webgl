import React, { useEffect } from "react";

function getContext(canvas) {
	let contextNames = ["webgl", "experminal-webgl"];
	for (let i=0; i<contextNames.length; i++) {
			let contextName = contextNames[i];
			let gl = canvas.getContext(contextName);
			if (gl) {
					return gl
			}
	}
};
// 创建着色器方法，输入参数：渲染上下文，着色器类型，数据源
function createShader(gl, type, source) {
  var shader = gl.createShader(type); // 创建着色器对象
  gl.shaderSource(shader, source); // 提供数据源
  gl.compileShader(shader); // 编译 -> 生成着色器
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
 
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

//在着色器中需要使用 attribute, uniform, varying 这三种存储限定符创建全局变量来接受 JavaScript 传入的数据。基本格式为 <存储限定符> <变量类型> <变量名称>
//attribute 限定符表示变量只能出现在顶点着色器中。比如我们声明一个顶点位置的 attribute 变量。
//uniform 限定符表示变量可以出现在顶点着色器和片元着色器中，一般是两个着色器共同用到的变量
//varying 限定符变量是为了从顶点着色器向片元着色器传输数据。需要在两个着色器中声明同名的变量

// 顶点着色器中将顶点的位置设在原点处，即坐标为 (0, 0, 0)，然后将顶点的大小设为 10，方便观察
const vertexShaderSource = `
  attribute vec4 a_Position;
	void main() {
		gl_Position = a_Position;
		gl_PointSize = 10.0;
	}
`

// 片元着色器中将像素的颜色设为红色
const fragmentShaderSource = `
	void main() {
		gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
	}
`
function createProgram(gl, vertexShader, fragmentShader) {
	// 创建程序对象
  var program = gl.createProgram();
	// 为程序对象分配着色器
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
	// 连接程序对象
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

const WebglLearning = () => {
  useEffect(() => {
		//获取 canvas 和 WebGL 上下文
    const canvas = document.querySelector("#canvas");
		const gl = getContext(canvas);
		//创建 shader
		const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
		//将这两个着色器 link（链接）到一个 program（着色程序）
		let program = createProgram(gl, vertexShader, fragmentShader);
    //从创建的GLSL着色程序中找到这个a_Position所在的位置   寻找属性值位置（和全局属性位置）应该在初始化的时候完成，而不是在渲染循环中
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    //属性值从缓冲中获取数据，所以我们创建一个缓冲  缓冲区对象： 缓冲区对象是 webgl 系统中的一块存储区，我们可以在缓冲区对象中保存想要绘制的所有顶点的数据，并且可以使用也可以不使用

    //使用缓冲区对象向顶点着色器传入数据，需要遵守以上五个步骤
    //1. 创建缓冲区对象
    const positionBuffer = gl.createBuffer();
    // 2. 绑定缓冲区对象到目标
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // 3. 将数据写入到缓冲区对象

    // 三个二维点坐标
    var positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    //这里完成了一系列事情，第一件事是我们有了一个JavaScript序列positions 。 然而WebGL需要强类型数据，所以new Float32Array(positions)创建了32位浮点型数据序列， 并从positions中复制数据到序列中，然后gl.bufferData复制这些数据到GPU的positionBuffer对象上。 它最终传递到positionBuffer上是因为在前一步中我们我们将它绑定到了ARRAY_BUFFER（也就是绑定点）上。
    //最后一个参数gl.STATIC_DRAW是提示WebGL我们将怎么使用这些数据。WebGL会根据提示做出一些优化。 gl.STATIC_DRAW提示WebGL我们不会经常改变这些数据

    // webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    //告诉WebGL裁剪空间的 -1 -> +1 分别对应到x轴的 0 -> gl.canvas.width 和y轴的 0 -> gl.canvas.height
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // 清空画布
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

		// 使用程序对象
		gl.useProgram(program);

    //接下来我们需要告诉WebGL怎么从我们之前准备的缓冲中获取数据给着色器中的属性。 首先我们需要启用对应属性,然后指定从缓冲中读取数据的方式

    //启用对应属性
    gl.enableVertexAttribArray(positionAttributeLocation);

    //指定从缓冲中读取数据的方式

    // 将绑定点绑定到缓冲数据（positionBuffer）
    // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 告诉属性怎么从positionBuffer中读取数据 (ARRAY_BUFFER)
    const size = 2;          // 每次迭代运行提取两个单位数据
    const type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
    const normalize = false; // 不需要归一化数据
    const stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存（sizeof(type)）
                          // 每次迭代运行运动多少内存到下一个数据开始点
    const offset = 0;        // 从缓冲起始位置开始读取
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)




  });
  return (
    <canvas id="canvas"></canvas>
  )
};

export default WebglLearning;