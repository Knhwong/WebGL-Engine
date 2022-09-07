#version 300 es

in vec3 a_position;
in vec3 color;
in vec3 normal;
in vec2 aTextureCoord;

uniform mat4 v_matrix;
uniform mat4 p_matrix;
uniform mat4 m_matrix;

uniform vec3 cameraPos;

out vec3 vPosition;
out vec4 vColor;
out vec3 vNormal;
out vec3 viewPos;
out highp vec2 vTextureCoord;

void main() {
    
    gl_Position = p_matrix * v_matrix * m_matrix * vec4(a_position,  1.0);
    vColor = vec4(color, 1.0);
    vPosition = vec3(m_matrix * vec4(a_position,  1.0));
    vNormal = mat3(transpose(inverse(m_matrix))) * normal;
    viewPos = cameraPos;
    vTextureCoord = aTextureCoord;
}