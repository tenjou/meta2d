precision highp float;

varying highp vec2 var_uv;
uniform vec4 color;

uniform sampler2D albedo;

void main() {
	gl_FragColor = texture2D(albedo, var_uv) * color;
}