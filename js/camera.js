'use strict'
import { orthographicProjectionMatrix, perspectiveProjectionMatrix, viewMatrix } from "./matrix.js"
import SceneNode from "./scenenode.js";
import { deg2rad } from "./utils.js";

class Camera extends SceneNode {

    // TODO implement a camera base class
    constructor(position, lookAt, up, fov, pType = true) {
        super("camera");
        this.position = [position[0], position[1], position[2], 1];
        this.lookAt = lookAt;
        this.up = up;
        this.fov = fov;
        this.vMatrix = viewMatrix(position, lookAt, up)
        this.pType = true;
        this.orthoView = 100;
        this.pitch = 0;
        this.yaw = 0;
    }

    getPosition() {
        return [this.position[0], this.position[1], this.position[2]];
    }

    setOrthographic() {
        this.pType = false;
    }
    setPerspective() {
        this.pType = true;
    }

    update(tMatrix, loc) {
        // TODO Make any updates to your node here (e.g., change transformation)
        vec4.transformMat4(this.position, this.position, tMatrix)
        if (loc) {
            this.mMatrix = mat4.multiply(this.mMatrix, tMatrix, this.mMatrix);

        } else {
            this.mMatrix = mat4.multiply(this.mMatrix, this.mMatrix, tMatrix)
        }
    }

    getVMatrix() {
        let vMatrix = mat4.create();
        let qX = quat.fromEuler(quat.create(), this.pitch, 0, 0);
        let rotX = mat4.fromQuat(mat4.create(), qX);

        let qY = quat.fromEuler(quat.create(), 0, this.yaw, 0);
        let rotY = mat4.fromQuat(mat4.create(), qY);

        mat4.copy(vMatrix, this.vMatrix);
        mat4.multiply(vMatrix, vMatrix, rotX);
        mat4.multiply(vMatrix, vMatrix, rotY);
        return vMatrix;
    }

    getPosition() {
        let vMatrix = this.getVMatrix();
        let invert = mat4.invert(mat4.create(), vMatrix);
        return [invert[12], invert[13], invert[14]];
    }


    getPMatrix(width, height, near, far) {
        let pMatrix = mat4.create();
        if (this.pType) {
            pMatrix = perspectiveProjectionMatrix(deg2rad(this.fov), width / height, near, far)
        } else {
            pMatrix = orthographicProjectionMatrix(-10, -10, 10, 10, -this.orthoView, this.orthoView);
        }
        return pMatrix;
    }

    update(tMatrix, loc) {
        if (loc) {
            mat4.multiply(this.vMatrix, tMatrix, this.vMatrix);
        } else {
            mat4.multiply(this.vMatrix, this.vMatrix, tMatrix);
        }
    }

    rotate(pitch, yaw) {
        this.pitch += pitch;
        this.yaw += yaw;
    }

}

class FpsCamera extends Camera {

    // TODO implement an fps camera
    // THIS MODE IS OPTIONAL

}

export {
    Camera,
    FpsCamera

}