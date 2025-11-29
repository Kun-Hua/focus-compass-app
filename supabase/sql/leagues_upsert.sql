-- Upsert L1..L10 league names (Chinese/English)
insert into public.leagues (league_id, league_name, league_name_en)
values
  (1, '原點啟航', 'Initial Point'),
  (2, '學徒見習', 'Apprentice'),
  (3, '航向定位', 'Compass Setter'),
  (4, '執行銳士', 'Execution Blade'),
  (5, '效率精兵', 'Efficiency Elite'),
  (6, '邏輯築基', 'Logic Architect'),
  (7, '複利領航', 'Compound Pilot'),
  (8, '領域菁英', 'Domain Expert'),
  (9, '時間主宰', 'Time Dominator'),
  (10,'願景覺醒', 'Vision Awakened')
on conflict (league_id) do update
set league_name = excluded.league_name,
    league_name_en = excluded.league_name_en;
