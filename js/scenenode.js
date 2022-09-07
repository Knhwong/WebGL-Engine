'use strict'

class SceneNode {

    constructor(name, parent, translation = vec3.create(), rotation = vec3.create(), scale = vec3.fromValues(1, 1, 1)) {

        this.type = "node"
        this.name = name
        this.translation = translation
        this.rotation = rotation
        this.angle = 0
        this.scale = scale
        this.parent = parent
        this.children = []

        // TODO Create the transformation matrix for this node based on the translation, rotation, and scale you got
        // Need to make view matrix;
        this.createTransformationMatrix()
    }

    /**
     * Performs any updates if necessary
     */

    createTransformationMatrix() {
        let mMatrix = mat4.create();


        mat4.translate(mMatrix, mMatrix, this.translation);
        mat4.rotate(mMatrix, mMatrix, this.angle, this.rotation);
        mat4.scale(mMatrix, mMatrix, this.scale);

        this.mMatrix = mMatrix;
    }

    update(tMatrix, loc) {
        // TODO Make any updates to your node here (e.g., change transformation)

        if (loc) {
            this.mMatrix = mat4.multiply(this.mMatrix, tMatrix, this.mMatrix);
        } else {
            this.mMatrix = mat4.multiply(this.mMatrix, this.mMatrix, tMatrix)
        }
    }

    /**
     * Gives the transform of this node
     * @returns The transformation of this node
     */
    getTransform() {
        if (this.parent == null) {
            return this.mMatrix;
        }
        // TODO Return the transformation describing the object -> world transformation for this node
        let wMatrix = mat4.create();
        mat4.multiply(wMatrix, this.parent.getTransform(), this.mMatrix);
        return wMatrix;

    }

    /**
     * Renders this node; Note that by default scene note does not render as it has no context
     * @param { WebGL2RenderingContext } gl The WebGL2 rendering context for this app
     * @param { Shader } shader The shader to use for rendering
     */
    render(gl, shader) {

        return

    }

}

export default SceneNode