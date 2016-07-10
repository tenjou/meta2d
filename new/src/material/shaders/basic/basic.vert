attribute vec3 vertexPos;

uniform mat4 projMatrix;
uniform mat4 viewMatrix;

void main() {
	gl_Position = projMatrix * viewMatrix * mat4(vertexPos, 1.0);
}