#version 300 es
precision mediump float;

#define PI 3.14159265358979323846264338327950288f
#define EPS_F 1e-23f

in float _u_target;

uniform uint u_num_particles;
uniform float u_kernel_r;
uniform float u_rest_density;
uniform float u_bin_size;
uniform uint u_y_bins;
uniform uint u_num_bins;
uniform sampler2D u_pred_pos;
uniform sampler2D u_lambda;
uniform mediump usampler2D u_bins;
uniform mediump usampler2D u_bin_count;
uniform mediump usampler2D u_bin_start;

layout(location = 0) out vec2 _d_pos;

vec2 grad_spiky(vec2 ri) {
  float r = length(ri);
  if (r >= u_kernel_r || r < EPS_F)
    return vec2(0.f);
  return (-45.f / (PI * pow(u_kernel_r, 6.f))) * pow(u_kernel_r - r, 2.f) * normalize(ri);
}

ivec2 bin_index(vec2 pos) {
  uint x_c = uint(pos.x / u_bin_size);
  uint y_c = uint(pos.y / u_bin_size);
  return ivec2(x_c, y_c);
}

uint bin(ivec2 bin_index) {
  return uint(bin_index.y) * u_y_bins + uint(bin_index.x);
}

void main() {
  float lambda_i = texture(u_lambda, vec2(_u_target, 0)).x;
  vec2 p_i = texture(u_pred_pos, vec2(_u_target, 0)).xy;
  ivec2 bin_index = bin_index(p_i);

  uint b;
  vec2 target_j_id;
  uint id_j;
  vec2 target_j;  

  float lambda_j;
  vec2 p_j;
  vec2 sum = vec2(0.f);

  for (int i = -1; i <= 1; ++i) {
    for (int j = -1; j <= 1; ++j) {
      b = bin(bin_index + ivec2(i, j));
      vec2 bin_uv = vec2(float(b) / float(u_num_bins), 0.f);
      uint count = texture(u_bin_count, bin_uv).x;
      uint start = texture(u_bin_start, bin_uv).x;

      for (uint k = start; k < start + count; ++k) {
        target_j_id = vec2(float(k) / float(u_num_particles), 0);
        id_j = texture(u_bins, target_j_id).x;
        target_j = vec2(float(id_j) / float(u_num_particles), 0);

        lambda_j = texture(u_lambda, target_j).x;
        p_j = texture(u_pred_pos, target_j).xy;

        sum += (lambda_i + lambda_j) * grad_spiky(p_i - p_j);
      }
    }
  }

  _d_pos = sum / u_rest_density;
}