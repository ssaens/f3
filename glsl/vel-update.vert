#version 300 es
layout(location = 0) in float a_id;

uniform uint num_particles;

void main() {
  gl_PointSize = 1.f;

  float ind = a_id / float(num_particles);
  gl_Position = vec4(2.f * (ind - 0.5f), 0, 0, 1.f);

  v_id = a_id;
  v_ind = ind;
}