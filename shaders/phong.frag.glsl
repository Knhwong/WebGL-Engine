#version 300 es
precision mediump float;

// With help from https://learnopengl.com/Lighting/Basic-Lighting and Lecture


// Can represent both Point & Directional Light
struct pointLight {
    vec3 position;
    vec3 id;
    vec3 is;
    float k;
};

struct directLight {
    vec3 direction;
    vec3 id;
    vec3 is;
};

in vec3 vPosition;
in mat3 vTBN;
in vec4 vColor;
in vec3 vNormal;
in vec3 viewPos;
in vec2 vTextureCoord;
uniform sampler2D uTextureMap;
uniform sampler2D uNormalMap;

uniform pointLight pointLights[10];
uniform int pointSize;
uniform directLight dirLights[10];
uniform int dirSize;

uniform vec3 ambient;

uniform vec3 mtlAmbient;
uniform vec3 mtlDiffuse;
uniform vec3 mtlSpecular;
uniform float shiny;

uniform int nMapped;
uniform int texEnable;


out vec4 outColor;

vec3 pointLightCalc(pointLight light, vec3 normal, vec3 view_direction) {
    vec3 light_direction = normalize(light.position - vPosition);
    float dist = length(light.position - vPosition);
    float diff = max(dot(normal, light_direction), 0.0);

    float attenuation = min(1.0, 1.0/ (1.0 + (light.k * dist)));

    vec3 diffuse = mtlDiffuse * light.id * diff *  attenuation;


    vec3 reflect_direction = reflect(-light_direction, normal);
    float spec = pow(max(dot(reflect_direction, view_direction), 0.0), shiny);
    vec3 specular =  mtlSpecular * light.is * spec;

    return diffuse + specular;  
}

vec3 directLightCalc(directLight light, vec3 normal, vec3 view_direction) {


    vec3 light_direction = normalize(-light.direction);
    float dist = length(light.direction);
    float diff = max(dot(normal, light_direction), 0.0);
    vec3 diffuse = mtlDiffuse * light.id * diff;


    vec3 reflect_direction = reflect(-light_direction, normal);
    float spec = pow(max(dot(view_direction, reflect_direction), 0.0), shiny);
    vec3 specular = mtlSpecular * light.is * spec;

    return diffuse + specular;  
}

void main() {
    
    vec3 amb = ambient * mtlAmbient;
    
    vec3 Mnormal = texture(uNormalMap, vTextureCoord).rgb;
    Mnormal = Mnormal * 2.0 - 1.0;
    
    vec3 normal;
    if (nMapped == 1) {
        normal = normalize(vTBN * Mnormal);
    } else{
        normal = normalize(vNormal);
    }



    vec3 viewDir = normalize(viewPos - vPosition);
    vec3 sum = vec3(0.0);
    for (int i = 0; i < pointSize; i++) {
        sum += pointLightCalc(pointLights[i], normal, viewDir);
    }
    for (int i = 0; i < dirSize; i++) {
        sum += directLightCalc(dirLights[i], normal, viewDir);
    }

    vec3 tex;
    if (texEnable == 1) {
        tex = texture(uTextureMap, vTextureCoord).rgb;
    } else {
        tex = vColor.rgb;
    }

    
    outColor =  vec4(tex.rgb * (amb + sum), 1.0);

}

