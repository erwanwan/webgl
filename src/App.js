import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
// import WebglLearning from "./webgl-learning";
import ThreeLearning from "./threejs-learning";
import HelloPrimitives from "./threejs-learning/components/hello-primitives";
import HelloScene from "./threejs-learning/components/hello-scene";
import HelloTexture from "./threejs-learning/components/hello-texture";
import HelloLight from "./threejs-learning/components/hello-light";
import HelloCamera from "./threejs-learning/components/hello-camera";
import Building from "./threejs-learning/components/3d-building";
import HelloLayer from "./threejs-learning/components/hello-layer";
import EnginRoom from "./threejs-learning/components/engin-room";
import Car from "./threejs-learning/components/car";
import CannonBase from "./threejs-learning/components/three-cannon/cannon-base";
import CannonConstraint from "./threejs-learning/components/three-cannon/cannon-constraint";
import CannonGear from "./threejs-learning/components/three-cannon/cannon-gear";
import ModelSplit from "./threejs-learning/components/model-split";
import Chart from "./threejs-learning/components/three-chart"

import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
            <Route exact path="/">
              {/* <WebglLearning /> */}
            </Route>
            <Route exact path="/three">
              <ThreeLearning />
            </Route>
            <Route exact path="/three/primitives">
              <HelloPrimitives />
            </Route>
            <Route exact path="/three/scene">
              <HelloScene />
            </Route>
            <Route exact path="/three/texture">
              <HelloTexture />
            </Route>
            <Route exact path="/three/light">
              <HelloLight />
            </Route>
            <Route exact path="/three/camera">
              <HelloCamera />
            </Route>
            <Route exact path="/three/building">
              <Building />
            </Route>
            <Route exact path="/three/layer">
              <HelloLayer />
            </Route>
            <Route exact path="/three/enginRoom">
              <EnginRoom />
            </Route>
            <Route exact path="/three/car">
              <Car />
            </Route>
            <Route exact path="/three/cannonBase">
              <CannonBase />
            </Route>
            <Route exact path="/three/cannonConstraint">
              <CannonConstraint />
            </Route>
            <Route exact path="/three/cannonGear">
              <CannonGear />
            </Route>
            <Route exact path="/three/modelSplit">
              <ModelSplit />
            </Route>
            <Route exact path="/three/chart">
              <Chart />
            </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
