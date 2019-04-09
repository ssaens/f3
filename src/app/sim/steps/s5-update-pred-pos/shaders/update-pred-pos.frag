#version 300 es
precision mediump float;

in float _u_target;

uniform sampler2D u_pred_pos;
uniform sampler2D u_d_pos;

layout(location = 0) out vec2 _pred_pos;

void main() {
  vec2 t = vec2(_u_target, 0);
  vec2 pred_pos = texture(u_pred_pos, t).xy;
  vec2 dp = texture(u_d_pos, t).xy;
  _pred_pos = pred_pos + dp;
}