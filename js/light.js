'use strict'

import SceneNode from "./scenenode.js";

class PointLightNode extends SceneNode {

    constructor(name, parent, translation, rotation, scale, id, is, k) {
        super(name, parent, translation, rotation, scale)
        this.type = "light_point";
        this.id = id;
        this.is = is;
        this.k = k;
        this.pos = [0, 0, 0, 1];

        //Constant Upscaler because 255~1 is too small.
        //Too tired to work out the math for the hex2rgb and then refactor so this is much faster.
        this.idStrength = 2.0;
        this.isStrength = 2.0;
    }
    getPosition() {
        let m_matrix = this.getTransform();
        let out = vec4.create()
        vec4.transformMat4(out, this.pos, m_matrix);
        return [out[0], out[1], out[2]];
    }
}

class DirectLightNode extends SceneNode {

    constructor(name, parent, translation, rotation, scale, id, is, direction) {
        super(name, parent, translation, rotation, scale)
        this.type = "light_direct";
        this.id = id;
        this.is = is;
        this.idStrength = 2.0;
        this.isStrength = 2.0;
        this.direction = direction;
        this.pitch = 0;
        this.yaw = 0;
    }
    getDirection() {
        let m_matrix = this.getTransform();
        let out = vec4.create()
        vec4.transformMat4(out, this.direction, m_matrix);
        return [out[0], out[1], out[2]];
    }
}



export { PointLightNode, DirectLightNode }