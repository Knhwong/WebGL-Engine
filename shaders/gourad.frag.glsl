#version 300 es
precision mediump float;

// With help from https://learnopengl.com/Lighting/Basic-Lighting and Lecture

in vec4 vColor;
out vec4 outColor;

in vec2 vTextureCoord;
in vec3 shading;
uniform sampler2D uTextureMap;
uniform int texEnable;

void main() {

    vec3 color;
    if (texEnable == 1) {
        color = texture(uTextureMap, vTextureCoord).rgb;
    } else {
        color = vColor.rgb;
    }

    outColor =  vec4( color.rgb * shading, 1.0);
}

