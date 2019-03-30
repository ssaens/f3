#version 300 es
layout(location = 0) in vec2 aVertexPosition;

out vec3 pos;
out vec4 color;
flat out int ind;

uniform mediump float radius;
uniform lowp float t;
uniform lowp vec2 mouse;

uniform sampler2D positionBuffer;

void main() {
  gl_PointSize = radius;
  vec3 p = vec3(aVertexPosition, 0.f);
  gl_Position = vec4(p, 1.f);

  pos = p;
  ind = gl_VertexID;
  color = texture(positionBuffer, vec2(float(ind) / 4., 0));
}
