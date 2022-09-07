#version 300 es
precision mediump float;

// With help from https://learnopengl.com/Lighting/Basic-Lighting and Lecture


in vec2 vTextureCoord;
in vec4 vColor;


uniform sampler2D uTextureMap;
uniform int texEnable;

out vec4 outColor;

void main() {

    vec3 tex;
    if (texEnable == 1) {
        tex = texture(uTextureMap, vTextureCoord).rgb;
    } else {
        tex = vColor.rgb;
    }

    outColor = vec4(tex.rgb, 1.0);
}

