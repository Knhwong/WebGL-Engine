'use strict'

// TODO implement these and other potentially missing matrix functions here
// The below functions are just two examples you'll definitely need to implement
// A complete example function is given above

/**
 * Gives the perspective camera projection matrix
 * @returns { Array.<Number> } The perspective camera projection matrix as a list
 */

//With help from https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html
// https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html

function perspectiveProjectionMatrix(fov, ratio, near, far) {
    let f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    let scaleDown = 1.0 / (near - far);
    let out = mat4.create();
    mat4.perspective(out, fov, ratio, near, far);
    return out;

    return [
        f / ratio, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * scaleDown, -1,
        0, 0, near * far * scaleDown * 2, 0
    ]

}

/**
 * Gives the orthographic camera projection matrix
 * @returns { Array.<Number> } The orthographic camera projection matrix as a list
 */
function orthographicProjectionMatrix(xMin, yMin, xMax, yMax, zMin, zMax) {

    let out = mat4.create();
    mat4.ortho(out, yMin, yMax, xMin, xMax, zMin, zMax);
    return out;

    return [
        2 / (xMax - xMin), 0, 0, -(xMax + xMin) / (xMax - xMin),
        0, 2 / (yMax - yMin), 0, -(yMax + yMin) / (yMax - yMin),
        0, 0, -2 / (zMax - zMin), -(zMax + zMin) / (zMax - zMin),
        0, 0, 0, 1
    ]

}

function viewMatrix(position, target, up) {
    let vMatrix = mat4.create();
    mat4.lookAt(vMatrix, position, target, up);
    return vMatrix

}

export {
    perspectiveProjectionMatrix,
    orthographicProjectionMatrix,
    viewMatrix
}