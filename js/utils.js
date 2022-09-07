'use strict'
import SceneNode from "./scenenode.js"
import ObjectNode from "./object.js"
import { PointLightNode, DirectLightNode } from "./light.js"
import { Camera } from "./camera.js"



/**
 * Clamps a number between two numbers
 * @param { Number } number The number to clamp
 * @param { Number } min The minimum used for clamping
 * @param { Number } max The maximum used for clamping
 * @returns { Number } The clamped number
 */
function clamp(number, min, max) {

    return Math.max(min, Math.min(number, max))

}

/**
 * Converts degrees to radians
 * @param { Number } deg The number in degrees
 * @returns { Number }The angle in radians
 */
function deg2rad(deg) {

    return (deg * Math.PI) / 180

}

/**
 * Converts a hex color string to a normalized rgba array
 * @param { String } hex The hex color as a string
 * @returns { Array<number> } The color as normalized values
 */
function hex2rgb(hex) {

    let rgb = hex.match(/\w\w/g)
        .map(x => parseInt(x, 16) / 255)
    return vec3.fromValues(rgb[0], rgb[1], rgb[2])

}
//http://www.javascripter.net/faq/rgbtohex.htm
function rgb2hex(rgb) { return "#" + toHex(rgb[0]) + toHex(rgb[1]) + toHex(rgb[2]) }

function toHex(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) return "00";
    n = Math.max(0, Math.min(n, 255));
    return "0123456789ABCDEF".charAt((n - n % 16) / 16) +
        "0123456789ABCDEF".charAt(n % 16);
}
/**
 * Returns the mouse coordinates relative to a clicking target, in our case the canvas
 * @param event The mouse click event
 * @returns { { x: number, y: number } } The x and y coordinates relative to the canvas
 */
function getRelativeMousePosition(event) {

    let target = event.target

    // if the mouse is not over the canvas, return invalid values
    if (target.id != 'canvas') {

        return {

            x: NaN,
            y: NaN,

        }

    }

    target = target || event.target;
    let rect = target.getBoundingClientRect();

    return {

        x: event.clientX - rect.left,
        y: event.clientY - rect.top,

    }

}

/**
 * Loads a given URL; this is used to load the shaders from file
 * @param { String } url The relative url to the file to be loaded
 * @returns { String | null } The external file as text
 */
function loadExternalFile(url) {

    let req = new XMLHttpRequest()
    req.open("GET", url, false)
    req.send(null)
    return (req.status == 200) ? req.responseText : null

}


function loadMTLFile(entry, root, mtls) {
    const elements = entry.split(' ');
    let url = elements[1];
    let mtl = loadExternalFile(getRoot(root) + url);
    for (let line of mtl.split('\n')) {

        switch (line.split(' ')[0]) {

            case 'Ka':
                parseMTL(line, mtls, 0);
                break
            case 'Kd':
                parseMTL(line, mtls, 3);
                break
            case 'Ks':
                parseMTL(line, mtls, 6);
                break
            case 'Ns':
                parseNs(line, mtls);
                break
        }
    }
}

// Raw & Messy
function loadInnerFile(entry, root, name) {
    const elements = entry.split(' ');
    let url = elements[1];
    let mtl = loadExternalFile(getRoot(root) + url);
    for (let line of mtl.split('\n')) {

        switch (line.split(' ')[0]) {
            case name:
                return parseTexture(line, root)
                break
        }
    }
    return null
}

function parseTexture(entry, root) {
    const elements = entry.split(' ');
    let image = new Image()
    image.src = getRoot(root) + elements[1]
    return image;
}

function parseMTL(entry, mtls, offset) {

    const elements = entry.split(' ')
    if (elements.length < 4)
        alert("Unknown vertex entry " + entry)

    mtls[offset] = parseFloat(elements[1]);
    mtls[offset + 1] = parseFloat(elements[2]);
    mtls[offset + 2] = parseFloat(elements[3]);
}

function parseNs(entry, mtls) {
    const elements = entry.split(' ')
    if (elements.length < 2)
        alert("Unknown vertex entry " + entry)
    mtls[9] = parseFloat(elements[1]);
}

function loadMTL(url) {
    let raw = loadExternalFile(url);
    // ka, kd, ks, na
    let mtls = [
        1, 1, 1,
        1, 1, 1,
        1, 1, 1,
        32
    ]
    let img;
    let nmap;
    for (let line of raw.split('\n')) {
        switch (line.split(' ')[0]) {
            case 'mtllib':
                loadMTLFile(line, url, mtls)
                img = loadInnerFile(line, url, "map_Kd")
                nmap = loadInnerFile(line, url, "map_Bump")
                break
        }
    }
    return [mtls, img, nmap];
}

function getRoot(root) {
    let r = root.length;
    for (let i = root.length; i >= 0; i--) {
        if (root[i] == "/") {
            r = i + 1;
            break;
        }
    }
    return root.slice(0, r)
}


/**
 * Loads a given .obj file and builds an object from it with vertices, colors and normals
 * @param { String } url The url to the file
 * @param { Array.<Number> } fallback_color A default color to use if the OBJ does not define vertex colors
 * @returns { Array.<Number> } The complete, interleaved vertex buffer object containing vertices, colors and normals
 */
function loadObjFile(url, fallback_color) {

    let raw = loadExternalFile(url)

    let vertices = []
    let colors = []
    let normals = []
    let texcoords = [];

    let vertex_ids = [];
    let normal_ids = [];
    let color_ids = [];
    let vnmap = {
        addPush: function(key, val) {
            if (key in this) {
                this[key].push(val);
            } else {
                this[key] = [val];
            }
        }
    }
    for (let line of raw.split('\n')) {

        switch (line.split(' ')[0]) {

            case 'v':
                parseObjVertex(line, vertices)
                parseObjColor(line, colors, fallback_color)
                break
            case 'vn':
                parseObjNormal(line, normals)
                break
            case 'vt':
                parseTexCoords(line, texcoords)
                break
            case 'f':
                parseObjIds(line, vertex_ids, normal_ids, color_ids, vnmap)
                break
        }
    }
    let data = []
    let v = []
    let uvs = []
    for (let i = 0; i < vertex_ids.length; i++) {

        const vid = (vertex_ids[i] * 3);
        const tid = (color_ids[i] * 2);
        const nids = vnmap[vertex_ids[i]];

        let normal = [0, 0, 0];
        for (let j = 0; j < nids.length; j++) {
            let n = nids[j] * 3;
            normal[0] = normals[n];
            normal[1] = normals[n + 1];
            normal[2] = normals[n + 2];
        }

        data.push(vertices[vid], vertices[vid + 1], vertices[vid + 2]);
        data.push(colors[vid], colors[vid + 1], colors[vid + 2]);
        data.push(normal[0], normal[1], normal[2]);


        v.push(vertices[vid], vertices[vid + 1], vertices[vid + 2]);
        if (texcoords.length != 0) {
            uvs.push(texcoords[tid], texcoords[tid + 1]);
        }

    }
    let t = calculateTangentSpace(v, uvs)
    return [data, t[0], t[1], uvs];

}


function parseTexCoords(entry, list) {
    const elements = entry.split(' ')
    if (elements.length < 3)
        alert("Unknown textcoor entry " + entry)
    list.push(parseFloat(elements[1]), parseFloat(elements[2]))
}

/**
 * Parses a given object vertex entry line
 * @param { String } entry A line of an object vertex entry
 * @param { Array.<Number> } list The list to write the parsed vertex coordinates to
 */
function parseObjVertex(entry, list) {

    const elements = entry.split(' ')
    if (elements.length < 4)
        alert("Unknown vertex entry " + entry)

    list.push(parseFloat(elements[1]), parseFloat(elements[2]), parseFloat(elements[3]))

}

/**
 * Parses a given object color entry line
 * @param { String } entry A line of an object color entry
 * @param { Array.<Number> } list The list to write the parsed vertex colors to
 * @param { Array.<Number> } fallback_color A fallback color in case the OBJ does not define vertex colors
 */
function parseObjColor(entry, list, fallback_color) {

    const elements = entry.split(' ')
    if (elements.length < 7) {

        list.push(fallback_color[0], fallback_color[1], fallback_color[2])
        return

    }

    list.push(parseFloat(elements[4]), parseFloat(elements[5]), parseFloat(elements[6]))

}

/**
 * Parses a given object normal entry line
 * @param { String } entry A line of an object normal entry
 * @param { Array.<Number> } list The list to write the parsed vertex normals to
 */
function parseObjNormal(entry, list) {

    const elements = entry.split(' ')
    if (elements.length != 4)
        alert("Unknown normals entry " + entry)

    list.push(parseFloat(elements[1]), parseFloat(elements[2]), parseFloat(elements[3]))

}

/**
 * Parses a given object ids entry line
 * @param { String } entry A line of an object ids entry
 * @param { Array.<Number> } vertex_ids The list of vertex ids to write to
 * @param { Array.<Number> } normal_ids The list normal ids to write to
 */
function parseObjIds(entry, vertex_ids, normal_ids, color_ids, vnmap) {
    const elements = entry.split(' ')
    if (elements.length != 4)
        alert("Unknown face entry " + entry)
    for (let element of elements) {
        if (element == 'f')
            continue

        const subelements = element.split('/')
        vertex_ids.push(parseInt(subelements[0]) - 1);
        color_ids.push(parseInt(subelements[1]) - 1);
        normal_ids.push(parseInt(subelements[2]) - 1);

        vnmap.addPush(subelements[0] - 1, subelements[2] - 1);

    }
}

/**
 * Loads a scene file and triggers the appropriate parsing functions
 * @param { String } url The url to the scene file
 * @returns An object containing information about the camera, the light and the scene
 */
function loadSceneFile(url) {

    let raw = loadExternalFile(url)

    let scene_description = JSON.parse(raw)
    console.log(scene_description["root"])
    return {
        "ambient": scene_description["ambient"],
        "camera": parseCamera(scene_description["camera"]),
        "scene": parseSceneNode(scene_description["root"], null),
    }
}

/**
 * Parses a given camera entry
 * @param { TODO } entry An entry containing information on a single camera
 * @returns A camera instance with the camera read from the scene file
 */
function parseCamera(entry) {

    let camera = null
    let position = vec3.fromValues(entry.position[0], entry.position[1], entry.position[2])
    let lookat = vec3.fromValues(entry.lookat[0], entry.lookat[1], entry.lookat[2])
    let up = vec3.fromValues(entry.up[0], entry.up[1], entry.up[2])
    let fov = entry.fov

    if (entry.type == "perspective") {

        // TODO create a perspective camera here
        camera = new Camera(position, lookat, up, fov);

    } else if (entry.type == "orthographic") {

        // TODO create an orthographic camera here
        camera = new Camera(position, lookat, up, fov, false);
    }

    return camera

}


/**
 *  Recursively parses a SceneNode and its children
 * @param { Object } entry An entry from the JSON config representing a SceneNode
 * @param { Object | null } parent The parent node of the current SceneNode
 * @returns { SceneNode } The parsed SceneNode object
 */
function parseSceneNode(entry, parent) {

    let node = null

    let name = entry.name

    // Adjust for Light
    let translation = [0, 0, 0];
    let rotation = [0, 0, 0];
    let scale = [1, 1, 1];

    if (entry.type != "light") {
        translation = vec3.fromValues(entry.translation[0], entry.translation[1], entry.translation[2])
        rotation = vec3.fromValues(entry.rotation[0], entry.rotation[1], entry.rotation[2])
        scale = vec3.fromValues(entry.scale[0], entry.scale[1], entry.scale[2])
    }
    //Adjust for Light

    if (entry.type == 'node') {
        node = new SceneNode(name, parent, translation, rotation, scale)

    } else if (entry.type == 'object') {

        const fallback_color = hex2rgb(entry.color)
        const obj_content = loadObjFile(entry.obj, fallback_color)
        const mtl = loadMTL(entry.obj);
        const materials = mtl[0];
        const ambient = materials.slice(0, 3);
        const diffuse = materials.slice(3, 6);
        const specular = materials.slice(6, 9);
        const specularStrength = materials[9];

        node = new ObjectNode(
            obj_content[0], name, parent, translation, rotation, scale,
            ambient, diffuse, specular, specularStrength, mtl[1], mtl[2],
            obj_content[1], obj_content[2], obj_content[3]
        );

    } else if (entry.type == 'light') {
        let id = vec3.fromValues(entry.id[0], entry.id[1], entry.id[2]);
        let is = vec3.fromValues(entry.is[0], entry.is[1], entry.is[2]);
        if (entry.light_type == "point") {
            let k = entry.k;
            translation = vec3.fromValues(entry.position[0], entry.position[1], entry.position[2]);
            node = new PointLightNode(name, parent, translation, rotation, scale, id, is, k)
        } else if (entry.light_type == "directional") {
            let direction = vec4.fromValues(entry.direction[0], entry.direction[1], entry.direction[2], 1);
            node = new DirectLightNode(name, parent, translation, rotation, scale, id, is, direction);
        }
    }
    for (let child of entry.children)
        node.children.push(parseSceneNode(child, node))

    return node

}

function calculateTangentSpace(vertices, uvs) {

    let tangents = []
    let bitangents = []

    for (let i = 0; i < vertices.length / 3; i += 3) {
        let idxv = i * 3
        let idxuv = i * 2

        let v0 = vec3.fromValues(vertices[idxv], vertices[idxv + 1], vertices[idxv + 2])
        let v1 = vec3.fromValues(vertices[idxv + 3], vertices[idxv + 4], vertices[idxv + 5])
        let v2 = vec3.fromValues(vertices[idxv + 6], vertices[idxv + 7], vertices[idxv + 8])
            //console.log("V", v0, v1, v2)

        let uv0 = vec2.fromValues(uvs[idxuv], uvs[idxuv + 1])
        let uv1 = vec2.fromValues(uvs[idxuv + 2], uvs[idxuv + 3])
        let uv2 = vec2.fromValues(uvs[idxuv + 4], uvs[idxuv + 5])
            //console.log("UV", uv0, uv1, uv2)

        let dv1 = vec3.sub(vec3.create(), v1, v0);
        let dv2 = vec3.sub(vec3.create(), v2, v0);
        //console.log("DV", dv1, dv2)

        let duv1 = vec2.sub(vec3.create(), uv1, uv0);
        let duv2 = vec2.sub(vec3.create(), uv2, uv0);
        //console.log("DUV", duv1, duv2)

        let r = 1.0 / (duv1[0] * duv2[1] - duv1[1] * duv2[0])
            //console.log("R", r)
        let tangent = vec3.scale(vec3.create(),
                vec3.sub(vec3.create(),
                    vec3.scale(vec3.create(), dv1, duv2[1]),
                    vec3.scale(vec3.create(), dv2, duv1[1]),
                ), r)
            //console.log("TAN", tangent)

        let bitangent = vec3.scale(vec3.create(),
            vec3.sub(vec3.create(),
                vec3.scale(vec3.create(), dv2, duv1[0]),
                vec3.scale(vec3.create(), dv1, duv2[0]),
            ), r)

        //console.log("BITAN", bitangent)

        for (let j = 0; j < 3; j++) {
            tangents.push(tangent[0])
            tangents.push(tangent[1])
            tangents.push(tangent[2])
            bitangents.push(bitangent[0])
            bitangents.push(bitangent[1])
            bitangents.push(bitangent[2])
        }
    }

    return [tangents, bitangents]
}

export {

    clamp,
    deg2rad,
    hex2rgb,
    rgb2hex,
    getRelativeMousePosition,
    loadExternalFile,
    loadObjFile,
    loadSceneFile

}