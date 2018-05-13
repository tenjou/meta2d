attribute vec2 position;
attribute vec2 uv;

uniform mat3 matrixProjection;
uniform mat3 matrixView;
uniform mat3 matrixModel;

varying highp vec2 var_uv;

void main() {
	gl_Position = vec4((matrixProjection * matrixView * matrixModel * vec3(position, 1.0)).xy, 0.0, 1.0);
	var_uv = uv;
}