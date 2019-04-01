#version 300 es
precision mediump float;

in float _u_target;

uniform sampler2D u_pos_buf;
uniform sampler2D u_vel_buf;

layout(location = 0) out vec2 _pred_pos;

vec2 clamp_vec2(vec2 v, float x_min, float x_max, float y_min, float y_max) {
  return vec2(clamp(v.x, x_min, x_max), clamp(v.y, y_min, y_max));
}

void main() {
  vec2 pos = texture(u_pos_buf, vec2(_u_target, 0)).xy;
  vec2 vel = texture(u_vel_buf, vec2(_u_target, 0)).xy;
  vel += vec2(0, -9.8f) * 0.01667f;
  vec2 pred_pos = pos + vel * 0.01667f;
  _pred_pos = clamp_vec2(pred_pos, -1.f, 1.f, -1.f, 1.f);
}