1. Predict Positions
in: pos, vel -> out: pred_pos

2. Build Neighbors Grid
in: pred_pos, meta
  - meta[id] -> ind, cell
  - sort:
    - neighbor_buf = [ind, ind, ind], sorted_cells = [cell, cell, cell]
  - prefix count:
    - grid[cell] -> (index, count)

3. Compute Iterations
  - iterate neighbors:
    meta[id] -> ind, cell
    for each local cell:
      grid[cell] -> (index, count)
      for i in [0, count):
        neighbor_buf[i] -> neighbor_ind
        pos[neighbor_ind] -> n_pos
        if dist(n_pos, self_pos) < delta:
          compute

4. Update
  update vel
  apply vort
  update pos