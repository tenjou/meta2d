precision highp float;

varying highp vec2 var_uv;

uniform sampler2D albedo;
uniform vec4 color;

void main() {
	gl_FragColor = texture2D(albedo, var_uv) * color;
}