#version 300 es
precision mediump float;

in vec3 pos;
in vec4 color;
flat in int ind;

out vec4 f_color;

uniform mediump float radius;
uniform lowp float t;
uniform lowp vec2 mouse;

uniform sampler2D position_buffer;

const vec3 lpos = vec3(0.f, 0.f, 1.f);
const vec3 ambient = vec3(0.05f, 0.2f, 0.3f);

void main() {
  vec3 n;
  n.xy = 2.f * gl_PointCoord.st - vec2(1.f);
  n.y = -n.y;
  float r2 = length(n.xy);
  if (r2 > 1.f)
    discard;

  n.z = sqrt(1.f - r2);

  vec2 n_mouse = 2.f * vec2(mouse.x, -mouse.y) - vec2(1.f, -1.f);

  vec3 lpos_curr = vec3(n_mouse, 1.f);
  float diffuse = clamp(dot(n, lpos_curr - pos), 0.f, 1.f);

  f_color = vec4(ambient + diffuse * color.xyz, 1.f);
}