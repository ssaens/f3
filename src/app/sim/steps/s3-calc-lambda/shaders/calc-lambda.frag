#version 300 es
precision mediump float;

#define PI 3.14159265358979323846264338327950288f
#define EPS_F 1e-23f

in float _u_target;

uniform float u_kernel_r;
uniform float u_rest_density;
uniform float u_relaxation;

layout(location = 0) out float _den;

float poly6(vec3 ri) {
  float r = length(ri);
  if (r >= u_kernel_r)
    return 0.f;
  return (315.f / (64.f * PI * pow(u_kernel_r, 9.f))) * pow(u_kernel_r * u_kernel_r - r * r, 3.f);
}

vec3 grad_spiky(vec3 ri) {
  float r = length(ri);
  if (r >= u_kernel_r || r < EPS_F)
    return vec3(0.f);
  return (-45.f / (PI * pow(u_kernel_r, 6.f))) * pow(u_kernel_r - r, 2.f) * normalize(ri);
}

float density() {
  float d = 0.f;
  // for (int j : _neighbors[i]) {
  //     d += poly6(_pred_pos[i] - _pred_pos[j], u_kernel_r);
  // }
  return d;
}

void main() {
  float num = density() / u_rest_density - 1.f;
  float denom = 0.f;
  vec3 grad_ci_pk;
  vec3 grad_ci_pi;
  // for (int k : _neighbors[i]) {
  //   grad_ci_pk = kernel::grad_spiky(_pred_pos[i] - _pred_pos[k], config::fluid.kernel_h);
  //   if (i != k)
  //     denom += glm::dot(grad_ci_pk, grad_ci_pk);
  //   grad_ci_pi += grad_ci_pk;
  // }
  denom += dot(grad_ci_pi, grad_ci_pi);
  _den = -num / (denom / pow(u_rest_density, 2.f) + u_relaxation);
}