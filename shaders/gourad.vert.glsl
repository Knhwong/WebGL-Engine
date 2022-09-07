#version 300 es

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

in vec3 a_position;
in vec3 color;
in vec3 normal;
in vec3 aVertexTangent;
in vec3 aVertexBiTangent;
in vec2 aTextureCoord;


uniform mat4 v_matrix;
uniform mat4 p_matrix;
uniform mat4 m_matrix;
uniform vec3 cameraPos;

uniform pointLight pointLights[10];
uniform int pointSize;
uniform directLight dirLights[10];
uniform int dirSize;

uniform vec3 ambient;

uniform vec3 mtlAmbient;
uniform vec3 mtlDiffuse;
uniform vec3 mtlSpecular;
uniform float shiny;

out vec4 vColor;
out vec3 shading;
out vec2 vTextureCoord;


uniform sampler2D uNormalMap;
uniform int nMapped;


vec3 pointLightCalc(pointLight light, vec3 normal, vec3 view_direction, vec3 vPosition) {
    vec3 light_direction = normalize(light.position - vPosition);
    float dist = length(light.position - vPosition);
    float diff = max(dot(normal, light_direction), 0.0);

    float attenuation = min(1.0, 1.0/ (1.0 + (light.k * dist)));

    vec3 diffuse = mtlDiffuse * light.id * diff * attenuation;;


    vec3 reflect_direction = reflect(-light_direction, normal);
    float spec = pow(max(dot(reflect_direction, view_direction), 0.0), shiny);
    vec3 specular =  mtlSpecular * light.is * spec;

    return diffuse + specular;  
}

vec3 directLightCalc(directLight light, vec3 normal, vec3 view_direction, vec3 vPosition) {


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
    
    gl_Position = p_matrix * v_matrix * m_matrix * vec4(a_position,  1.0);
    //vColor = vec4(color, 1.0);
    vec3 vPosition = vec3(m_matrix * vec4(a_position,  1.0));

    vec3 amb = ambient * mtlAmbient * color.rgb;
    
    vec3 T = normalize(vec3(m_matrix * vec4(aVertexTangent,   0.0)));
    vec3 B = normalize(vec3(m_matrix * vec4(aVertexBiTangent, 0.0)));
    vec3 N = normalize(vec3(m_matrix * vec4(normal, 0.0)));
    mat3 vTBN = mat3(T,B,N);
    vec3 Mnormal = texture(uNormalMap, aTextureCoord).rgb;
    Mnormal = Mnormal * 2.0 - 1.0;  
    Mnormal = normalize(vTBN * Mnormal);


    vec3 NNormal;
    if (nMapped == 1) {
        NNormal = Mnormal;
    } else{
        NNormal  = normalize(normal);
    }


    vec3 viewDir = normalize(cameraPos - vPosition);
    vec3 sum = vec3(0.0);
    for (int i = 0; i < pointSize; i++) {
        sum += pointLightCalc(pointLights[i], NNormal, viewDir, vPosition);
    }
    for (int i = 0; i < dirSize; i++) {
        sum += directLightCalc(dirLights[i], NNormal, viewDir, vPosition);
    }
    shading = amb + sum;
    vColor = vec4(color.rgb, 1.0);
    vTextureCoord = aTextureCoord;
}