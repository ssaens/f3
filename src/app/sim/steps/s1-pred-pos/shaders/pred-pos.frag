#version 300 es
precision mediump float;

in float _u_target;

uniform float u_dt;
uniform sampler2D u_pos_buf;
uniform sampler2D u_vel_buf;

layout(location = 0) out vec2 _pred_pos;

vec2 clamp_vec2(vec2 v, float x_min, float x_max, float y_min, float y_max) {
  return vec2(clamp(v.x, x_min, x_max), clamp(v.y, y_min, y_max));
}

void main() {
  vec2 pos = texture(u_pos_buf, vec2(_u_target, 0)).xy;
  vec2 vel = texture(u_vel_buf, vec2(_u_target, 0)).xy;

  vec2 dp = (vel + vec2(0, -9.8f) * u_dt) * u_dt;

  vec2 pred_pos = pos + dp;
  _pred_pos = clamp_vec2(pred_pos, 0.f, 4.f, 0.f, 2.f);
}