#version 300 es
layout(location = 0) in float a_id;

uniform uint u_num_particles;
uniform mediump float u_radius;
uniform sampler2D u_pos_buf;

out vec3 pos;
flat out float _id;

void main() {
  gl_PointSize = u_radius;

  vec2 in_pos = texture(u_pos_buf, vec2(a_id / float(u_num_particles), 0)).xy;
  pos = vec3(in_pos, 0.f);
  gl_Position = vec4(pos, 1.f);
  
  _id = a_id;
}
