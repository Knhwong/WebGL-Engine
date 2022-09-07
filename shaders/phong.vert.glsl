#version 300 es

in vec3 a_position;
in vec2 aTextureCoord;
in vec3 color;
in vec3 normal;
in vec3 aVertexTangent;
in vec3 aVertexBiTangent;

uniform mat4 v_matrix;
uniform mat4 p_matrix;
uniform mat4 m_matrix;

uniform vec3 cameraPos;

out vec3 vPosition;
out mat3 vTBN;
out highp vec2 vTextureCoord;
out vec4 vColor;
out vec3 vNormal;
out vec3 viewPos;

void main() {
    
    gl_Position = p_matrix * v_matrix * m_matrix * vec4(a_position,  1.0);
    vColor = vec4(color, 1.0);
    vPosition = vec3(m_matrix * vec4(a_position,  1.0));
    vNormal = normal;
    viewPos = cameraPos;
    vTextureCoord = aTextureCoord;
    vec3 T = normalize(vec3(m_matrix * vec4(aVertexTangent,   0.0)));
    vec3 B = normalize(vec3(m_matrix * vec4(aVertexBiTangent, 0.0)));
    vec3 N = normalize(vec3(m_matrix * vec4(normal, 0.0)));
    vTBN = mat3(T,B,N);
}