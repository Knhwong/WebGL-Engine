'use strict'

import Input from "./input.js"
import AppState from "./appstate.js"
import Shader from "./shader.js"

class App {

    constructor(scene) {

        console.log("Initializing App")

        // canvas & gl
        this.canvas = document.getElementById("canvas")
        this.canvas.addEventListener("contextmenu", event => event.preventDefault());
        this.gl = this.initGl()

        // save the scene
        this.scene = scene

        // shaders
        // TODO create and load shaders here
        this.shaderFlat = new Shader(this.gl, "../shaders/flat.vert.glsl", "../shaders/flat.frag.glsl");
        this.shaderPhong = new Shader(this.gl, "../shaders/phong.vert.glsl", "../shaders/phong.frag.glsl");
        this.shaderGourad = new Shader(this.gl, "../shaders/gourad.vert.glsl", "../shaders/gourad.frag.glsl");

        this.shader = this.shaderPhong;


        //Parse in Lights
        this.lightPoints = [];
        this.lightDirect = [];
        let explore = [this.scene["scene"]]
        while (explore.length != 0) {
            let curr = explore.pop();
            explore.push(...curr["children"]);
            if (curr.type == "light_point") {
                this.lightPoints.push(curr);
            } else if (curr.type == "light_direct") {
                this.lightDirect.push(curr);
            } else if (curr.type == "object") {
                curr.setTextures(this.gl, true);
            }
        }
        this.lights = this.lightPoints.concat(this.lightDirect);







        // resize handling
        this.resizeToDisplay()
        window.onresize = this.resizeToDisplay.bind(this)

        // app state
        this.app_state = new AppState(this)

    }

    /** 
     * Resizes camera and canvas to pixel-size-corrected display size
     */
    resizeToDisplay() {
        this.scale = window.devicePixelRatio;
        // TODO handle window resizes
        let width = this.canvas.clientWidth * this.scale;

        let height = this.canvas.clientHeight * this.scale;

        this.canvas.width = width
        this.canvas.height = height
    }

    /**
     * Initializes webgl2 with settings
     * @returns { WebGL2RenderingContext | null }
     */
    initGl() {

        // TODO implement

        let gl

        gl = canvas.getContext("webgl2");
        gl.enable(gl.DEPTH_TEST)
        if (!gl) {
            throw "Could not get WebGL context!";
        }
        return gl

    }

    /**
     * Starts render loop
     */
    start() {

        requestAnimationFrame(() => {

            this.update()
        })
    }

    /**
     * Called every frame, triggers input and app state update and renders a frame
     */
    update() {

        this.app_state.update()

        // TODO If you choose to use movement.js to implement your movement interaction, update your movement instance here

        Input.update()
        this.render()
        requestAnimationFrame(() => {

            this.update()

        })

    }

    /**
     * Main render loop
     */

    setPointLights() {
        for (let i = 0; i < this.lightPoints.length; i++) {

            this.shader.setUniform3f(`pointLights[${i}].position`, new Float32Array(this.lightPoints[i].getPosition()));
            this.shader.setUniform3f(`pointLights[${i}].id`, new Float32Array(vec3.scale(vec3.create(), this.lightPoints[i].id, this.lightPoints[i].idStrength)));
            this.shader.setUniform3f(`pointLights[${i}].is`, new Float32Array(vec3.scale(vec3.create(), this.lightPoints[i].is, this.lightPoints[i].isStrength)));
            this.shader.setUniform1f(`pointLights[${i}].k`, this.lightPoints[i].k);
        }
        this.shader.setUniform1i("pointSize", this.lightPoints.length);
    }

    setDirectLights() {
        for (let i = 0; i < this.lightDirect.length; i++) {

            this.shader.setUniform3f(`dirLights[${i}].direction`, new Float32Array(this.lightDirect[i].getDirection()));
            this.shader.setUniform3f(`dirLights[${i}].id`, new Float32Array(vec3.scale(vec3.create(), this.lightDirect[i].id, this.lightDirect[i].idStrength)));
            this.shader.setUniform3f(`dirLights[${i}].is`, new Float32Array(vec3.scale(vec3.create(), this.lightDirect[i].is, this.lightDirect[i].isStrength)));
        }
        this.shader.setUniform1i("dirSize", this.lightDirect.length);
    }

    render() {

        // clear the screen
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)

        // TODO render your scene here - remember that SceneNodes build a hierarchy
        this.shader.use();

        let pMatrix = this.scene["camera"].getPMatrix(this.canvas.width, this.canvas.height, 0.1, 1000);
        let vMatrix = this.scene["camera"].getVMatrix();

        this.setPointLights();
        this.setDirectLights();

        this.shader.setUniform3f("cameraPos", new Float32Array(this.scene["camera"].getPosition()));
        this.shader.setUniform3f("ambient", this.scene["ambient"])


        let explore = [this.scene["scene"]]
        while (explore.length != 0) {
            let curr = explore.pop();
            explore.push(...curr["children"]);
            curr.render(this.gl, this.shader, pMatrix, vMatrix);

        }

    }
}



export default App