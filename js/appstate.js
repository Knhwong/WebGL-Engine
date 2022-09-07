'use strict'
import input from "./input.js"
import { deg2rad, hex2rgb, rgb2hex } from "./utils.js"
import { unproject, rayIntersectsTriangle } from "./raycaster.js"
import { viewMatrix } from "./matrix.js"

class AppState {

    constructor(app) {

        this.app = app
        this.is_selecting = false
        this.selected = null;

        this.translating = true;
        this.rotating = false;
        this.scaling = false;

        this.fps = false;
        this.lightIndex = 0;

        // get list of ui indicators
        this.ui_categories = {

            "camera_mode": {

                "fps": document.getElementById("fpsCamMode"),
                "stationary": document.getElementById("statCamMode")

            },
            "projection_mode": {

                "perspective": document.getElementById("perspProjMode"),
                "orthographic": document.getElementById("orthoProjMode")

            },
            "selection": {

                "raycasting": document.getElementById("selectionRaycasting"),
                "target": document.getElementById("selectionTarget")

            },
            "shading": {

                "phong": document.getElementById("phong"),
                "gourad": document.getElementById("gourad"),
                "flat": document.getElementById("flat"),
            }

        }

        this.matSliders = {
            "name": document.getElementById("matName"),
            "ka": document.getElementById("ka"),
            "kd": document.getElementById("kd"),
            "ks": document.getElementById("ks"),
            "ss": document.getElementById("ss"),
            "kVal": document.getElementById("ssVal")
        }

        this.lightSliders = {
            "name": document.getElementById("lightName"),
            "id": document.getElementById("id"),
            "is": document.getElementById("is"),
            "k": document.getElementById("k"),
            "kView": document.getElementById("sliderK"),
            "kVal": document.getElementById("kVal")
        }


        // update ui with default values
        this.updateUI("camera_mode", "stationary")
        this.updateUI("shading", "flat")
        this.updateUI("projection_mode", "perspective")
        this.updateUI("selection", "target")


        this.color = document.getElementById("color");
        this.color.value = rgb2hex(vec3.scale(vec3.create(), this.app.scene["ambient"], 255));
        if (this.app.lights != []) {
            this.lightSliders.name.innerText = this.app.lights[this.lightIndex].name;
        }
        this.lightSliders.id.value = rgb2hex(vec3.scale(vec3.create(), this.app.lights[this.lightIndex].id, 255));
        this.lightSliders.is.value = rgb2hex(vec3.scale(vec3.create(), this.app.lights[this.lightIndex].is, 255));
        this.lightSliders.k.value = this.app.lights[this.lightIndex].k * 100;
    }

    /**
     * Updates the app state by checking the input module for changes in user input
     */
    update() {

        // TODO check user input using the input module and create appropriate handlers to manipulate the canvas

        // TODO don't forget to update the ui as seen in the constructor to tell the ui what mode you're in
        this.scale(this.app.scene.camera, input.getScrollDy());

        if (input.isMouseDown("2")) {
            this.cameraRotate();
        }

        if (input.isMouseDown("0")) {
            if (this.is_selecting) {
                this.is_selecting = false;
                this.selected = this.getObject();
                if (this.selected != null) {
                    this.updateUI("selection", "target", this.selected.name);
                    this.matSliders["name"].innerText = this.selected.name;
                    this.matSliders["ka"].value = rgb2hex(vec3.scale(vec3.create(), this.selected.ka, 255));
                    this.matSliders["kd"].value = rgb2hex(vec3.scale(vec3.create(), this.selected.kd, 255));
                    this.matSliders["ks"].value = rgb2hex(vec3.scale(vec3.create(), this.selected.ks, 255));
                    this.matSliders["ss"].value = this.selected.specularStrength;
                }
            }

            if (this.selected != null) {

                let dx = input.getMouseDx();
                let dy = input.getMouseDy();

                if ((!isNaN(dx)) && (!isNaN(dy))) {
                    if (this.rotating) {
                        this.rotate(this.selected, dy, dx);
                    } else if (this.translating) {
                        this.translate(this.selected, dy, dx, 0);
                    } else if (this.scaling) {
                        this.scale(this.selected, -dx);
                    }
                }
            }
        }

        // Material Management
        if (this.selected != null) {
            this.selected.ka = hex2rgb(this.matSliders["ka"].value);
            this.selected.kd = hex2rgb(this.matSliders["kd"].value);
            this.selected.ks = hex2rgb(this.matSliders["ks"].value);
            this.selected.specularStrength = this.matSliders["ss"].value;
            this.matSliders["kVal"].innerText = this.matSliders["ss"].value;
        }



        if (input.isKeyPressed("n") && this.selected != null) {
            console.log("switch")


            if (this.selected.linear) {
                this.selected.linear = false;
                this.selected.setTextures(this.app.gl, false)
            } else {

                this.selected.linear = true;
                this.selected.setTextures(this.app.gl, true)
            }
        }



        //Light Management!

        this.app.scene["ambient"] = hex2rgb(this.color.value);

        this.app.lights[this.lightIndex].id = hex2rgb(this.lightSliders["id"].value);
        this.app.lights[this.lightIndex].is = hex2rgb(this.lightSliders["is"].value);

        if (input.isKeyPressed("l")) {
            this.lightIndex += 1;
            if (this.lightIndex >= this.app.lights.length) {
                this.lightIndex = 0;
            }
            console.log(this.app.lights[this.lightIndex].type);
            this.lightSliders["name"].innerText = this.app.lights[this.lightIndex].name;
            this.lightSliders["k"].value = this.app.lights[this.lightIndex].k * 100;
            this.lightSliders["kVal"].innerText = this.app.lights[this.lightIndex].k;
            this.lightSliders.id.value = rgb2hex(vec3.scale(vec3.create(), this.app.lights[this.lightIndex].id, 255));
            this.lightSliders.is.value = rgb2hex(vec3.scale(vec3.create(), this.app.lights[this.lightIndex].is, 255));
            this.lightSliders.k.value = this.app.lights[this.lightIndex].k * 100;
        }

        if (this.app.lights[this.lightIndex].type == "light_point") {

            this.lightSliders["kView"].style.display = "block";
            this.app.lights[this.lightIndex].k = this.lightSliders.k.value / 100;
            this.lightSliders["kVal"].innerText = this.app.lights[this.lightIndex].k
        } else {
            this.lightSliders["kView"].style.display = "none";
        }

        if (input.isKeyPressed("b")) {
            let vMatrix = this.app.scene.camera.getNewPosition();

            console.log(vMatrix);
        }
        if (input.isKeyPressed("1")) {
            this.app.shader = this.app.shaderPhong;
            this.updateUI("shading", "phong")
        }

        if (input.isKeyPressed("2")) {
            this.app.shader = this.app.shaderGourad;
            this.updateUI("shading", "gourad")
        }

        if (input.isKeyPressed("3")) {
            this.app.shader = this.app.shaderFlat;
            this.updateUI("shading", "flat")
        }

        if (input.isKeyPressed("r")) {
            this.is_selecting = true;
            this.selected = null;
            this.updateUI("selection", "target", "no target selected");
            this.updateUI("selection", "raycasting")
        }
        //Movement
        if (input.isKeyPressed("z")) {
            this.translating = true;
            this.scaling = false;
            this.rotating = false;
            console.log(this.translating, this.scaling, this.rotating)
        }
        //Rotation
        if (input.isKeyPressed("x")) {
            this.rotating = true;
            this.translating = false;
            this.scaling = false;
            console.log(this.translating, this.scaling, this.rotating)
        }
        //Scaling
        if (input.isKeyPressed("c")) {
            this.rotating = false;
            this.translating = false;
            this.scaling = true;
            console.log(this.translating, this.scaling, this.rotating)
        }
        if (input.isKeyPressed("p")) {
            this.app.scene["camera"].setPerspective();
            this.updateUI("projection_mode", "perspective");
        }
        if (input.isKeyPressed("o")) {
            this.app.scene["camera"].setOrthographic();
            this.updateUI("projection_mode", "orthographic");
        }
        if (input.isKeyPressed("w")) {
            this.translate(this.app.lights[this.lightIndex], -20, 0, 0);
        }
        if (input.isKeyPressed("s")) {
            this.translate(this.app.lights[this.lightIndex], 20, 0, 0);
        }
        if (input.isKeyPressed("a")) {
            this.translate(this.app.lights[this.lightIndex], 0, -20, 0);
        }
        if (input.isKeyPressed("d")) {
            this.translate(this.app.lights[this.lightIndex], 0, 20, 0);
        }
        if (input.isKeyPressed("z")) {
            this.translate(this.app.lights[this.lightIndex], 0, 0, 20);
        }
        if (input.isKeyPressed("x")) {
            this.translate(this.app.lights[this.lightIndex], 0, 0, -20);
        }
        if (input.isKeyPressed("q")) {
            this.rotate(this.app.lights[this.lightIndex], 10, 0);
        }
        if (input.isKeyPressed("e")) {
            this.rotate(this.app.lights[this.lightIndex], 0, 10);
        }


    }

    /**
     * Updates the ui to represent the current interaction
     * @param { String } category The ui category to use; see this.ui_categories for reference
     * @param { String } name The name of the item within the category
     * @param { String | null } value The value to use if the ui element is not a toggle; sets the element to given string 
     */
    updateUI(category, name, value = null) {

        for (let key in this.ui_categories[category]) {

            this.updateUIElement(this.ui_categories[category][key], key == name, value)

        }

    }

    /**
     * Updates a single ui element with given state and value
     * @param { Element } el The dom element to update
     * @param { Boolean } state The state (active / inactive) to update it to
     * @param { String | null } value The value to use if the ui element is not a toggle; sets the element to given string 
     */
    updateUIElement(el, state, value) {

        el.classList.remove(state ? "inactive" : "active")
        el.classList.add(state ? "active" : "inactive")

        if (state && value != null)
            el.innerHTML = value

    }

    scale(node, s) {
        if (s < 0) {
            let tMatrix = mat4.create();
            mat4.fromScaling(tMatrix, [1.1, 1.1, 1.1]);
            node.update(tMatrix);
        }
        if (s > 0) {
            let tMatrix = mat4.create();
            mat4.fromScaling(tMatrix, [1 / 1.1, 1 / 1.1, 1 / 1.1]);
            node.update(tMatrix);
        }
    }

    translate(curr, dy, dx, dz) {
        let matrix = mat4.create();
        mat4.fromTranslation(matrix, [-dx / 100, dz / 100, -dy / 100]);
        curr.update(matrix, true);
    }

    rotate(curr, dy, dx) {
        let xRotate = mat4.create();
        let yRotate = mat4.create();
        mat4.fromRotation(xRotate, deg2rad(dx), [0, 1, 0]);
        mat4.fromRotation(yRotate, deg2rad(dy), [1, 0, 0])
        curr.update(xRotate, false);
        curr.update(yRotate, false);
    }

    // Due to difference from loc & global
    cameraRotate() {
        let dx = input.getMouseDx()
        let dy = input.getMouseDy()
        if ((!isNaN(dx)) && (!isNaN(dy))) {
            this.app.scene["camera"].rotate(dy, dx);
        }
    }

    getObject() {
        this.is_selecting = false;
        this.updateUI("selection", "target")
            // Get neccesary data
        let point = [input.mousex * this.app.scale, input.mousey * this.app.scale];


        let pMatrix = this.app.scene["camera"].getPMatrix(this.app.canvas.width, this.app.canvas.height, 0.1, 1000);
        mat4.invert(pMatrix, pMatrix);

        let vMatrix = this.app.scene["camera"].getVMatrix();
        mat4.invert(vMatrix, vMatrix);
        let viewport = [0, 0, this.app.canvas.width, this.app.canvas.height];
        let ray = unproject(point, viewport, pMatrix, vMatrix);

        console.log(ray)
        let origin;
        if (this.app.scene.camera.pType) {
            origin = [vMatrix[12], vMatrix[13], vMatrix[14]];
        } else {
            origin = [ray[0], ray[1], -10]

        }

        // Raycasting Selection
        let explore = [this.app.scene["scene"]]
        let intersect = vec3.create()

        let out = null;
        let max = +Infinity;

        while (explore.length != 0) {
            let curr = explore.pop();
            explore.push(...curr["children"]);
            if (curr.type == "object") {
                let v = this.getVertices(curr.vbo_data, curr.getTransform());
                for (let i = 0; i < v.length; i += 9) {
                    let trig = [
                        vec3.fromValues(v[i], v[i + 1], v[i + 2]),
                        vec3.fromValues(v[i + 3], v[i + 4], v[i + 5]),
                        vec3.fromValues(v[i + 6], v[i + 7], v[i + 8])
                    ]
                    if (rayIntersectsTriangle(origin, ray, trig, intersect)) {
                        let mag = vec3.length(vec3.subtract(vec3.create(), origin, intersect))
                        console.log(mag, max, curr.name);
                        if (mag < max) {
                            out = curr;
                            max = mag;
                        }
                        break;
                    }
                }
            }
        }
        return out;
    }

    getVertices(vbo_data, mMatrix) {
        let v = []
        for (let i = 0; i < vbo_data.length; i += 9) {
            let vert = [vbo_data[i], vbo_data[i + 1], vbo_data[i + 2], 1];

            vec4.transformMat4(vert, vert, mMatrix);
            v.push(vert[0]);
            v.push(vert[1]);
            v.push(vert[2]);
        }
        return v;
    }
}

export default AppState