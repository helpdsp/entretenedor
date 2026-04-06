-- Migration: Track Details and Enhanced Progress (Sprint 4)
-- Description: Implements T-007, T-002, T-005.

-- 1. Update mark_atom_complete to return status (T-002)
create or replace function public.mark_atom_complete(p_atom_id uuid)
returns jsonb as $$
declare
  v_already_completed boolean;
  v_streak_info jsonb;
begin
  -- Check if already completed
  select exists(
    select 1 from public.user_progress 
    where user_id = auth.uid() and atom_id = p_atom_id
  ) into v_already_completed;

  -- Insert if not completed
  if not v_already_completed then
    insert into public.user_progress (user_id, atom_id)
    values (auth.uid(), p_atom_id)
    on conflict (user_id, atom_id) do nothing;
    
    -- Streak and activity are updated by trigger on_progress_created in user_progress
  end if;

  -- Get updated stats
  select get_dashboard_stats() into v_streak_info;

  return jsonb_build_object(
    'already_completed', v_already_completed,
    'current_streak', coalesce((v_streak_info->>'current_streak')::int, 0),
    'atoms_completed', coalesce((v_streak_info->>'atoms_completed')::int, 0),
    'atom_id', p_atom_id,
    'completed_at', now()
  );
end;
$$ language plpgsql security definer;

-- 2. Implement get_track_detail (T-007)
create or replace function public.get_track_detail(p_track_id uuid)
returns jsonb as $$
declare
  v_track_data jsonb;
  v_nodes jsonb;
  v_edges jsonb;
begin
  -- Get track metadata
  select jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'description', t.description,
    'thumbnail_url', t.thumbnail_url,
    'status', t.status,
    'created_at', t.created_at
  ) into v_track_data
  from public.tracks t
  where t.id = p_track_id;

  if v_track_data is null then
    return null;
  end if;

  -- Build nodes (Cells and Atoms)
  with track_cells_list as (
    select 
      c.id as cell_id,
      c.title as cell_title,
      tc.position as cell_position
    from public.track_cells tc
    join public.cells c on tc.cell_id = c.id
    where tc.track_id = p_track_id
    order by tc.position
  ),
  cell_atoms_list as (
    select 
      tcl.cell_id,
      a.id as atom_id,
      a.title as atom_title,
      a.type as atom_type,
      ca.position as atom_position,
      exists(select 1 from public.user_progress up where up.user_id = auth.uid() and up.atom_id = a.id) as completed
    from track_cells_list tcl
    join public.cell_atoms ca on tcl.cell_id = ca.cell_id
    join public.atoms a on ca.atom_id = a.id
    order by tcl.cell_position, ca.position
  )
  select 
    jsonb_agg(node) into v_nodes
  from (
    -- Cell nodes
    select jsonb_build_object(
      'id', 'cell-' || cell_id,
      'type', 'cellNode',
      'data', jsonb_build_object('title', cell_title, 'id', cell_id),
      'position', jsonb_build_object('x', cell_position * 350, 'y', 0)
    ) as node
    from track_cells_list
    union all
    -- Atom nodes
    select jsonb_build_object(
      'id', 'atom-' || atom_id,
      'type', 'atomNode',
      'parentNode', 'cell-' || cell_id,
      'extent', 'parent',
      'data', jsonb_build_object(
        'title', atom_title, 
        'type', atom_type, 
        'completed', completed, 
        'id', atom_id
      ),
      'position', jsonb_build_object('x', 25, 'y', 60 + (atom_position * 80))
    ) as node
    from cell_atoms_list
  ) nodes_query;

  -- Build edges (Cell to Cell)
  with track_cells_ordered as (
    select cell_id, position
    from public.track_cells
    where track_id = p_track_id
    order by position
  )
  select jsonb_agg(edge) into v_edges
  from (
    select jsonb_build_object(
      'id', 'e-' || t1.cell_id || '-' || t2.cell_id,
      'source', 'cell-' || t1.cell_id,
      'target', 'cell-' || t2.cell_id,
      'type', 'smoothstep'
    ) as edge
    from track_cells_ordered t1
    join track_cells_ordered t2 on t1.position = t2.position - 1
  ) edges_query;

  return jsonb_build_object(
    'track', v_track_data,
    'nodes', coalesce(v_nodes, '[]'::jsonb),
    'edges', coalesce(v_edges, '[]'::jsonb)
  );
end;
$$ language plpgsql security definer;

-- 3. Create helper view for cross-track verification (T-005)
create or replace view public.v_user_atom_progress as
select 
  up.user_id,
  up.atom_id,
  up.completed_at,
  a.title as atom_title,
  c.id as cell_id,
  c.title as cell_title,
  t.id as track_id,
  t.title as track_title
from public.user_progress up
join public.atoms a on up.atom_id = a.id
join public.cell_atoms ca on a.id = ca.atom_id
join public.cells c on ca.cell_id = c.id
join public.track_cells tc on c.id = tc.cell_id
join public.tracks t on tc.track_id = t.id;

-- Grant access to the view
grant select on public.v_user_atom_progress to authenticated;
