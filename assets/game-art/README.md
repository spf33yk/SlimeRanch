# Game scene art

The art pack is sized around the packaged 1920×1080 game viewport.

- `field/`: 512×512 tile textures for empty ground, monster, mana, and treasure.
- `world-tree/`: ten 1920×1080 growth stages, from a nearly dead sapling to the fully restored World Tree.
- `ranch/`: 1920×1080 barn background with a clear center floor for the active monster.
- `battle/`: eight 1920×660 panoramic battle backgrounds. `normal-*` are regular stages; `boss-*` are boss arenas.

At 1920×1080, the shared header and all current tabs fit in one viewport. The field and ranch use the expanded desktop canvas; battle scene backdrops select normal or boss variants by stage. Narrower screens keep a fluid layout and may scroll vertically, without horizontal overflow.
