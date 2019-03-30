#version 300 es
layout(location = 0) in vec2 in_pos;

out vec3 pos;
out vec4 color;
flat out int ind;

uniform mediump float radius;
uniform lowp float t;
uniform lowp vec2 mouse;

uniform sampler2D position_buffer;

void main() {
  gl_PointSize = radius;
  vec3 p = vec3(in_pos, 0.f);
  gl_Position = vec4(p, 1.f);

  pos = p;
  ind = gl_VertexID;
  color = texture(position_buffer, vec2(float(ind) / 4., 0));
}
