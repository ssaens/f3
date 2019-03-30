#version 300 es
layout(location = 0) in float id;

out vec3 pos;
flat out float _id;

uniform uint num_particles;
uniform mediump float radius;
uniform sampler2D pos_buf;

void main() {
  vec2 in_pos = texture(pos_buf, vec2(id / float(num_particles), 0)).xy;
  vec3 p = vec3(in_pos, 0.f);
  gl_Position = vec4(p, 1.f);

  gl_PointSize = radius;

  pos = p;
  _id = id;
}
