#version 300 es
precision mediump float;

in float _u_target;

uniform sampler2D u_pos_buf;
uniform sampler2D u_vel_buf;

layout(location = 0) out vec2 f_color;

void main() {
  vec2 pos = texture(u_pos_buf, vec2(_u_target, 0)).xy;
  vec2 vel = texture(u_vel_buf, vec2(_u_target, 0)).xy;
  vel += vec2(0, -9.8f) * 0.01667f;
  f_color = pos + vel * 0.01667f;
}