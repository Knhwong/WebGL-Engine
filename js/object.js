'use strict'

import SceneNode from "./scenenode.js";

class ObjectNode extends SceneNode {

    constructor(vbo_data, name, parent, translation = vec3.create(), rotation = vec3.create(), scale = vec3.fromValues(1, 1, 1),
        ambient = vec3.create(1, 1, 1),
        diffuse = vec3.create(1, 1, 1),
        specular = vec3.create(1, 1, 1),
        specularStrength = 32,
        img = null,
        nMap = null,
        tangent,
        bitangent,
        uvs
    ) {

        super(name, parent, translation, rotation, scale)
        this.type = "object";
        this.vbo_data = new Float32Array(vbo_data)
        this.vbo = null
        this.ka = ambient;
        this.kd = diffuse;
        this.ks = specular;
        this.specularStrength = specularStrength;

        this.img = img;
        this.texture = null;
        this.linear = true;


        this.nMap = nMap;
        this.normalMap = null;


        let me = this;
        this.imgLoaded = false;
        this.texLoaded = false;
        if (this.img) {
            this.img.onload = function() {
                me.imgLoaded = true;
            }
        }

        this.nMapLoaded = false;
        this.nTextureLoaded = false;
        if (this.nMap) {
            this.nMap.onload = function() {
                me.nMapLoaded = true;
            }
        }


        this.tangents = tangent;
        this.bitangents = bitangent;
        this.tangentBuffer = null;
        this.BiTangentBuffer = null;

        this.uv_data = uvs;
        this.uv = null;

    }

    createBuffers(gl) {
        // TODO Create your VBO buffer here and upload data to the GPU
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vbo_data), gl.STATIC_DRAW)
        this.vbo.numItems = this.vbo_data.length / 9;
        this.vbo.itemSize = 3;


        this.tangentBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tangents), gl.STATIC_DRAW);
        this.tangentBuffer.itemSize = 3;
        this.tangentBuffer.numItems = this.vbo_data.length / 9;

        this.BiTangentBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.BiTangentBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.bitangents), gl.STATIC_DRAW);
        this.BiTangentBuffer.itemSize = 3;
        this.BiTangentBuffer.numItems = this.vbo_data.length / 9;

        this.uv = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uv)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uv_data), gl.STATIC_DRAW);
        this.uv.itemSize = 2;
        this.uv.numItems = this.vbo_data.length / 9;


    }

    setTextures(gl, linear) {
        if (this.img != null) {
            this.texture = this.loadMap(gl, this.img, linear);
        }
        if (this.nMap != null) {
            this.normalMap = this.loadMap(gl, this.nMap, linear);
        }
    }

    loadMap(gl, image, linear = true) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            width, height, border, srcFormat, srcType,
            pixel);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            srcFormat, srcType, image);

        /*
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            if (linear) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            }
        }*/
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (linear) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
        return texture;
    }



    render(gl, shader, pMatrix, vMatrix) {

        if (this.vbo == null) {
            this.createBuffers(gl);
        }
        if (this.texLoaded == false && this.imgLoaded == true) {
            this.setTextures(gl, true);
            this.texLoaded = true;
        }
        if (this.nTextureLoaded == false && this.nMapLoaded == true) {
            this.setTextures(gl, true)
            this.nTextureLoaded = true;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        shader.setArrayBuffer("a_position", this.vbo, this.vbo.itemSize, 3 * 3 * 4, 0);
        shader.setArrayBuffer("aTextureCoord", this.uv, this.uv.itemSize, 0, 0);

        shader.setArrayBuffer("normal", this.vbo, this.vbo.itemSize, 3 * 3 * 4, 3 * 4 * 2);
        shader.setUniform4x4f("m_matrix", this.getTransform());
        shader.setUniform4x4f("v_matrix", vMatrix);
        shader.setUniform4x4f("p_matrix", pMatrix);
        shader.setUniform3f("mtlAmbient", new Float32Array(this.ka));
        shader.setUniform3f("mtlDiffuse", new Float32Array(this.kd));
        shader.setUniform3f("mtlSpecular", new Float32Array(this.ks));
        shader.setUniform1f("shiny", this.specularStrength);


        if (this.texture != null) {
            // use the texture unit 0
            gl.activeTexture(gl.TEXTURE0);
            // bind the texture to the texture unit
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            // update the sampler location to use the texture at texture unit 0
            shader.setUniform1i("uTextureMap", 0)
            shader.setUniform1i("texEnable", 1);
        } else {
            shader.setUniform1i("texEnable", 0);
            shader.setArrayBuffer("color", this.vbo, this.vbo.itemSize, 3 * 3 * 4, 3 * 4);
        }
        if (this.normalMap != null && this.nMap != null) {
            shader.setArrayBuffer("aVertexTangent", this.tangentBuffer, this.tangentBuffer.itemSize, 0, 0);
            shader.setArrayBuffer("aVertexBiTangent", this.BiTangentBuffer, this.BiTangentBuffer.itemSize, 0, 0);
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, this.normalMap);
            shader.setUniform1i("uNormalMap", 1)

            shader.setUniform1i("nMapped", 1);
        } else {
            shader.setUniform1i("nMapped", 0);
        }


        gl.drawArrays(gl.TRIANGLES, 0, this.vbo.numItems);
    }
}

//https://stackoverflow.com/questions/600293/how-to-check-if-a-number-is-a-power-of-2
function isPowerOf2(x) {
    return (x != 0) && ((x & (x - 1)) == 0);
}

export default ObjectNode